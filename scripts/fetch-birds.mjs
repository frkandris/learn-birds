#!/usr/bin/env node
// Letölti a madarak képeit és hangjait a Wikimedia Commonsról,
// átméretezi / átkódolja őket, és kiírja a public/data/birds.json-t.
//
//   npm run fetch
//
// A média a public/media/ alá kerül, a licencinformációval együtt
// (minden Commons-fájl szabad licencű, de a szerzőt fel kell tüntetni).

import { mkdir, writeFile, readFile, readdir, rm, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BIRDS } from './birds.js';

const run = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MEDIA_DIR = join(ROOT, 'public', 'media');
const UA = 'learn-birds/1.0 (személyes tanulóalkalmazás; https://github.com/frkandris/learn-birds)';

const MAX_IMAGES = 2;
const MAX_AUDIO = 2;
const IMAGE_WIDTH = 900;
const AUDIO_SECONDS = 22;
// Mono AAC 64 kbit/s: a madárhang java 9 kHz alatt van, ott nem hallani
// különbséget a 96k-hoz képest, a készlet viszont ~4 MB-tal kisebb.
const AUDIO_BITRATE = '64k';

// A faj kategóriájában sok olyan kép van, ami tanuláshoz félrevezető
// (tojás, fészek, fióka, elterjedési térkép, preparátum, rajz). A fájlnév
// nem mindig árulkodó, ezért a Commons-kategóriákat is ugyanezzel szűrjük.
const IMAGE_BLOCKLIST =
  /(egg|nest|chick|juvenil|fledgl|\bmap\b|distribution|range|skull|skelet|museum|specimen|mounted|illustrat|drawing|painting|\bplate\b|stamp|coin|logo|icon|diagram|sonogram|spectrogram|feather|footprint|taxidermy|dead|roadkill|MHNT|\bHdB\b|collection)/i;
// A Commons közösségi minősítései: ezek a fotók a fajt jól mutatják, nem csak
// tartalmazzák. Ahol van ilyen, azt választjuk előbb.
const QUALITY_CATEGORY = /(Quality images|Featured pictures|Valued images)/i;

// A kiejtés-felvételek nem madárhangok, hanem beszélt szavak: a Lingua Libre
// fájljai (`LL-…`) és a Wikiszótár nyelvkód-előtagos felvételei (`De-…`,
// `Jer-…`), amiket a kategóriájuk is elárul.
const AUDIO_BLOCKLIST = /^File:LL-|^File:[A-Za-z]{2,3}-[A-Za-zÀ-ÿ]|pronunciation|spoken|Lingua Libre/i;

// A fájlnevekben a tudományos név hol szóközzel, hol anélkül szerepel
// (`Poecile palustris.ogg` vs `PoecilePalustrisCall.ogg`), ezért a
// összevetés előtt mindkét oldalt egyszerű betűsorrá alakítjuk.
const plainName = (text) => text.toLowerCase().replace(/[^a-z]/g, '');

async function api(host, params) {
  const url = new URL(`https://${host}/w/api.php`);
  url.search = new URLSearchParams({ format: 'json', formatversion: '2', ...params });
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${host} API ${res.status}`);
  return res.json();
}

async function sparql(query) {
  const url = new URL('https://query.wikidata.org/sparql');
  url.search = new URLSearchParams({ query, format: 'json' });
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json' } });
  if (!res.ok) throw new Error(`Wikidata SPARQL ${res.status}`);
  return (await res.json()).results.bindings;
}

// A Special:FilePath URL-ekből visszafejti a "File:..." címet.
function fileTitleFromUrl(url) {
  const m = decodeURIComponent(url).match(/Special:FilePath\/(.+)$/);
  return m ? `File:${m[1].replace(/_/g, ' ')}` : null;
}

async function wikidataMedia(birds) {
  const values = birds.map((b) => `"${b.taxon}"`).join(' ');
  const rows = await sparql(`
    SELECT ?taxon ?item ?image ?audio ?synonym ?enLabel WHERE {
      VALUES ?taxon { ${values} }
      ?item wdt:P225 ?taxon .
      OPTIONAL { ?item wdt:P18 ?image }
      OPTIONAL { ?item wdt:P51 ?audio }
      OPTIONAL { ?item wdt:P1420 ?synonym }
      OPTIONAL { ?item rdfs:label ?enLabel FILTER(lang(?enLabel) = "en") }
    }`);

  const byTaxon = new Map();
  for (const row of rows) {
    const taxon = row.taxon.value;
    if (!byTaxon.has(taxon)) byTaxon.set(taxon, { qid: null, en: null, images: [], audio: [], synonyms: [] });
    const entry = byTaxon.get(taxon);
    entry.qid ??= row.item.value.split('/').pop();
    entry.en ??= row.enLabel?.value ?? null;
    // A régi tudományos nevek (pl. Parus palustris, Delichon urbica) sok
    // Commons-fájl nevében ott vannak — nélkülük felvételek maradnának ki.
    const synonym = row.synonym?.value;
    if (synonym && !entry.synonyms.includes(synonym)) entry.synonyms.push(synonym);
    for (const [key, field] of [['images', 'image'], ['audio', 'audio']]) {
      const title = row[field] && fileTitleFromUrl(row[field].value);
      if (title && !entry[key].includes(title)) entry[key].push(title);
    }
  }
  return byTaxon;
}

// A faj Commons-kategóriájában közvetlenül szereplő fényképek.
async function categoryImages(taxon) {
  const data = await api('commons.wikimedia.org', {
    action: 'query',
    generator: 'categorymembers',
    gcmtitle: `Category:${taxon}`,
    gcmtype: 'file',
    gcmlimit: '100',
    prop: 'imageinfo',
    iiprop: 'url|mime|size',
  });
  return (data.query?.pages ?? [])
    .filter((p) => {
      const info = p.imageinfo?.[0];
      return info?.mime?.startsWith('image/') && info.width >= 1200 && !IMAGE_BLOCKLIST.test(p.title);
    })
    .sort((a, b) => b.imageinfo[0].width - a.imageinfo[0].width)
    .map((p) => p.title);
}

// A faj Commons-kategóriájában lévő hangfelvételek. A kategória kurátorált,
// ezért itt a fájlnévnek nem kell tartalmaznia a fajnevet.
async function categoryAudio(taxon) {
  const data = await api('commons.wikimedia.org', {
    action: 'query',
    generator: 'categorymembers',
    gcmtitle: `Category:${taxon}`,
    gcmtype: 'file',
    gcmlimit: '100',
    prop: 'imageinfo',
    iiprop: 'mediatype',
  });
  return (data.query?.pages ?? [])
    .filter((page) => page.imageinfo?.[0]?.mediatype === 'AUDIO' && !AUDIO_BLOCKLIST.test(page.title))
    .map((page) => page.title);
}

// Tartalék képforrás, ha a kategóriában kevés a használható fotó.
async function searchImages(taxon) {
  const data = await api('commons.wikimedia.org', {
    action: 'query',
    list: 'search',
    srsearch: `${taxon} filetype:bitmap`,
    srnamespace: '6',
    srlimit: '30',
  });
  return (data.query?.search ?? [])
    .map((r) => r.title)
    .filter((t) => t.toLowerCase().includes(taxon.toLowerCase()) && !IMAGE_BLOCKLIST.test(t));
}

// Madárhangok keresése névre: a xeno-canto felvételek fájlneve tartalmazza a
// faj nevét — tudományosan, régi néven vagy angolul.
async function searchAudio(name) {
  const data = await api('commons.wikimedia.org', {
    action: 'query',
    list: 'search',
    srsearch: `${name} filetype:audio`,
    srnamespace: '6',
    srlimit: '20',
  });
  const needle = plainName(name);
  return (data.query?.search ?? [])
    .map((r) => r.title)
    .filter((title) => plainName(title).includes(needle) && !AUDIO_BLOCKLIST.test(title));
}

function plain(html) {
  return (html ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// A szerző a Commons `Artist` mezőjéből jön. Intézményi feltöltéseknél (pl. a
// British Library hangarchívuma) ez üres, a `Credit` mondata viszont megnevezi
// a szolgáltatót („provided by the … from"). Más `Credit`-szöveg (gyakran „Own
// work") nem szerzőnév, azt nem használjuk.
export function authorOf(meta) {
  const artist = plain(meta.Artist?.value);
  if (artist) return artist;
  const provider = /provided by (?:the )?(.+?) from /i.exec(plain(meta.Credit?.value))?.[1];
  return provider || 'ismeretlen szerző';
}

export async function fileInfo(titles) {
  if (!titles.length) return new Map();
  const data = await api('commons.wikimedia.org', {
    action: 'query',
    titles: titles.join('|'),
    prop: 'imageinfo|categories',
    cllimit: 'max',
    iiprop: 'url|mime|mediatype|extmetadata|size',
    iiurlwidth: String(IMAGE_WIDTH),
    iiextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl|Credit',
  });
  const out = new Map();
  for (const page of data.query?.pages ?? []) {
    const info = page.imageinfo?.[0];
    if (!info || page.missing) continue;
    const meta = info.extmetadata ?? {};
    out.set(page.title, {
      title: page.title,
      categories: (page.categories ?? []).map((c) => c.title),
      mime: info.mime,
      // A Commons a régi Ogg-felvételeket application/ogg néven adja, ezért a
      // fájl fajtáját a mediatype dönti el, nem a MIME-típus.
      mediatype: info.mediatype,
      src: info.thumburl ?? info.url,
      original: info.url,
      page: info.descriptionurl,
      author: authorOf(meta),
      license: plain(meta.LicenseShortName?.value) || 'lásd a fájl oldalát',
      licenseUrl: meta.LicenseUrl?.value ?? null,
    });
  }
  return out;
}

export async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`letöltés sikertelen (${res.status}): ${url}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

// iOS Safari nem játszik le Ogg Vorbist, ezért mindent AAC-re kódolunk,
// és a hosszú felvételeket egy kártyányi hosszra vágjuk.
export async function transcodeAudio(input, output) {
  await run('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-i', input,
    '-t', String(AUDIO_SECONDS),
    '-af', `afade=t=out:st=${AUDIO_SECONDS - 1.5}:d=1.5,loudnorm=I=-16:TP=-1.5:LRA=11`,
    '-ac', '1', '-ar', '44100', '-c:a', 'aac', '-b:a', AUDIO_BITRATE,
    // A fejléc a fájl elejére kerül, különben a böngésző csak a teljes
    // letöltés után tudná elkezdeni a lejátszást (iOS-en sehogy).
    '-movflags', '+faststart',
    output,
  ]);
}

// A végleges név a tartalom hash-ét hordozza (`tengelic-1.3fa9c2d1.jpg`): így a
// fájl sosem változik egy adott néven, a böngésző és a service worker örökre
// tárolhatja, és egy faj cseréje csak annak a fajnak a fájljait érinti.
export async function finalize(dir, id, index, ext) {
  const draft = join(dir, `${id}-${index}.${ext}`);
  const hash = createHash('sha256').update(await readFile(draft)).digest('hex').slice(0, 8);
  const name = `${id}-${index}.${hash}.${ext}`;
  await rename(draft, join(dir, name));
  return `media/${name}`;
}

async function main() {
  // Argumentumként megadott faj-azonosítókra szűkíthető a futás; ilyenkor a
  // többi faj médiája és adata érintetlen marad.
  const only = process.argv.slice(2);
  const targets = only.length ? BIRDS.filter((bird) => only.includes(bird.id)) : BIRDS;
  if (only.length && targets.length !== only.length) {
    const missing = only.filter((id) => !BIRDS.some((bird) => bird.id === id));
    throw new Error(`ismeretlen faj-azonosító: ${missing.join(', ')}`);
  }

  if (only.length) console.log(`Részleges futás: ${targets.map((b) => b.hu).join(', ')}`);

  // Az új média előbb egy előkészítő könyvtárba kerül; a public/media csak a
  // végén cserélődik. Hálózati hiba vagy megszakítás így nem hagy a
  // birds.json-ban hivatkozott, de már törölt fájlokat.
  const tmp = join(ROOT, 'node_modules', '.cache');
  const stage = join(tmp, 'media-stage');
  await rm(stage, { recursive: true, force: true });
  await mkdir(stage, { recursive: true });

  console.log('Wikidata lekérdezés…');
  const wikidata = await wikidataMedia(targets);

  const result = [];
  for (const bird of targets) {
    const wd = wikidata.get(bird.taxon) ?? { qid: null, en: null, images: [], audio: [], synonyms: [] };
    console.log(`\n${bird.hu} (${bird.taxon})`);

    const skip = (title) =>
      IMAGE_BLOCKLIST.test(title) || (bird.skipFiles ?? []).some((part) => title.includes(part));

    const imageTitles = [
      ...new Set([...wd.images, ...(await categoryImages(bird.taxon)), ...(await searchImages(bird.taxon))]),
    ]
      .filter((title) => !skip(title))
      .slice(0, MAX_IMAGES * 3);
    // Hangjelöltek: a Wikidata felvétele, a faj kategóriájának hangfájljai,
    // végül keresés a tudományos néven, a régi neveken és az angol néven.
    const names = [bird.taxon, ...wd.synonyms, wd.en].filter(Boolean);
    const searched = [];
    for (const name of names) searched.push(...(await searchAudio(name)));
    const audioTitles = [...new Set([...wd.audio, ...(await categoryAudio(bird.taxon)), ...searched])]
      .filter((title) => !AUDIO_BLOCKLIST.test(title))
      .slice(0, MAX_AUDIO * 4);
    const info = await fileInfo([...imageTitles, ...audioTitles]);

    // A minősített képek előre; a többi megtartja az eredeti sorrendjét.
    const ranked = [...imageTitles].sort((a, b) => {
      const quality = (title) => (info.get(title)?.categories.some((c) => QUALITY_CATEGORY.test(c)) ? 0 : 1);
      return quality(a) - quality(b);
    });

    const images = [];
    for (const title of ranked) {
      if (images.length >= MAX_IMAGES) break;
      const file = info.get(title);
      if (!file) {
        console.warn(`  kép  – nincs metaadat: ${title}`);
        continue;
      }
      if (!['BITMAP', 'DRAWING'].includes(file.mediatype)) continue;
      const badCategory = file.categories.find((c) => IMAGE_BLOCKLIST.test(c));
      if (badCategory) {
        console.log(`  kép  – kihagyva (${badCategory}): ${title}`);
        continue;
      }
      const index = images.length + 1;
      let path;
      try {
        await download(file.src, join(stage, `${bird.id}-${index}.jpg`));
        path = await finalize(stage, bird.id, index, 'jpg');
      } catch (err) {
        console.warn(`  kép kihagyva (${title}): ${err.message}`);
        continue;
      }
      images.push({ file: path, author: file.author, license: file.license, licenseUrl: file.licenseUrl, source: file.page });
      console.log(`  kép  ✓ ${title}`);
    }

    const audio = [];
    for (const title of audioTitles) {
      if (audio.length >= MAX_AUDIO) break;
      const file = info.get(title);
      if (!file) {
        console.warn(`  hang – nincs metaadat: ${title}`);
        continue;
      }
      if (file.mediatype !== 'AUDIO') {
        console.warn(`  hang – nem hangfájl (${file.mediatype ?? file.mime}): ${title}`);
        continue;
      }
      const spoken = file.categories.find((category) => AUDIO_BLOCKLIST.test(category));
      if (spoken) {
        console.warn(`  hang – kiejtés-felvétel (${spoken}): ${title}`);
        continue;
      }
      const index = audio.length + 1;
      const raw = join(tmp, `raw-${Date.now()}`);
      let path;
      try {
        await download(file.original, raw);
        await transcodeAudio(raw, join(stage, `${bird.id}-${index}.m4a`));
        path = await finalize(stage, bird.id, index, 'm4a');
      } catch (err) {
        console.warn(`  hang kihagyva (${title}): ${err.message}`);
        continue;
      } finally {
        await rm(raw, { force: true });
      }
      audio.push({ file: path, author: file.author, license: file.license, licenseUrl: file.licenseUrl, source: file.page });
      console.log(`  hang ✓ ${title}`);
    }

    if (!images.length) console.warn(`  ⚠︎ nincs kép: ${bird.hu}`);
    if (!audio.length) console.warn(`  ⚠︎ nincs hang: ${bird.hu}`);

    result.push({ id: bird.id, name: bird.hu, taxon: bird.taxon, en: wd.en, qid: wd.qid, images, audio });
  }

  const outFile = join(ROOT, 'public', 'data', 'birds.json');
  let birds = result;
  if (only.length) {
    // A részleges futás csak a frissített fajokat cseréli, a sorrend a listáé.
    const previous = JSON.parse(await readFile(outFile, 'utf8')).birds;
    const updated = new Map(result.map((bird) => [bird.id, bird]));
    birds = BIRDS.map((bird) => updated.get(bird.id) ?? previous.find((p) => p.id === bird.id)).filter(Boolean);
  }

  // Csere: a frissített fajok régi fájljai (teljes futásnál mind) mennek, az
  // előkészített újak a helyükre kerülnek, és csak ezután íródik a birds.json.
  await mkdir(MEDIA_DIR, { recursive: true });
  const prefixes = targets.map((bird) => `${bird.id}-`);
  for (const name of await readdir(MEDIA_DIR)) {
    if (!only.length || prefixes.some((prefix) => name.startsWith(prefix))) await rm(join(MEDIA_DIR, name));
  }
  for (const name of await readdir(stage)) await rename(join(stage, name), join(MEDIA_DIR, name));
  await rm(stage, { recursive: true, force: true });

  await writeFile(outFile, JSON.stringify({ generated: new Date().toISOString(), birds }, null, 2) + '\n');
  console.log(`\nKész: ${result.length} faj frissítve, ${birds.length} a fájlban → ${outFile}`);
}

// Csak közvetlen futtatáskor gyűjt; importálva (tesztből) nincs mellékhatása.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
