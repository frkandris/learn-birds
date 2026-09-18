#!/usr/bin/env node
// Letölti a madarak képeit és hangjait a Wikimedia Commonsról,
// átméretezi / átkódolja őket, és kiírja a public/data/birds.json-t.
//
//   npm run fetch
//
// A média a public/media/ alá kerül, a licencinformációval együtt
// (minden Commons-fájl szabad licencű, de a szerzőt fel kell tüntetni).

import { mkdir, writeFile, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BIRDS } from './birds.js';

const run = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MEDIA_DIR = join(ROOT, 'public', 'media');
const UA = 'learn-birds/1.0 (személyes tanulóalkalmazás; https://github.com/frkandris/learn-birds)';

const MAX_IMAGES = 3;
const MAX_AUDIO = 2;
const IMAGE_WIDTH = 1000;
const AUDIO_SECONDS = 22;

// A faj kategóriájában sok olyan kép van, ami tanuláshoz félrevezető
// (tojás, fészek, fióka, elterjedési térkép, preparátum, rajz). A fájlnév
// nem mindig árulkodó, ezért a Commons-kategóriákat is ugyanezzel szűrjük.
const IMAGE_BLOCKLIST =
  /(egg|nest|chick|juvenil|fledgl|\bmap\b|distribution|range|skull|skelet|museum|specimen|mounted|illustrat|drawing|painting|\bplate\b|stamp|coin|logo|icon|diagram|sonogram|spectrogram|feather|footprint|taxidermy|dead|roadkill|MHNT|\bHdB\b|collection)/i;
// A kiejtés-felvételek (Lingua Libre) nem madárhangok, hanem beszélt szavak.
const AUDIO_BLOCKLIST = /^File:LL-|pronunciation/i;

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
    SELECT ?taxon ?item ?image ?audio ?enLabel WHERE {
      VALUES ?taxon { ${values} }
      ?item wdt:P225 ?taxon .
      OPTIONAL { ?item wdt:P18 ?image }
      OPTIONAL { ?item wdt:P51 ?audio }
      OPTIONAL { ?item rdfs:label ?enLabel FILTER(lang(?enLabel) = "en") }
    }`);

  const byTaxon = new Map();
  for (const row of rows) {
    const taxon = row.taxon.value;
    if (!byTaxon.has(taxon)) byTaxon.set(taxon, { qid: null, en: null, images: [], audio: [] });
    const entry = byTaxon.get(taxon);
    entry.qid ??= row.item.value.split('/').pop();
    entry.en ??= row.enLabel?.value ?? null;
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

// Madárhangok keresése: a xeno-canto felvételek fájlneve tartalmazza a fajnevet.
async function searchAudio(taxon) {
  const data = await api('commons.wikimedia.org', {
    action: 'query',
    list: 'search',
    srsearch: `${taxon} filetype:audio`,
    srnamespace: '6',
    srlimit: '20',
  });
  return (data.query?.search ?? [])
    .map((r) => r.title)
    .filter((t) => t.toLowerCase().includes(taxon.toLowerCase()) && !AUDIO_BLOCKLIST.test(t));
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

async function fileInfo(titles) {
  if (!titles.length) return new Map();
  const data = await api('commons.wikimedia.org', {
    action: 'query',
    titles: titles.join('|'),
    prop: 'imageinfo|categories',
    cllimit: 'max',
    iiprop: 'url|mime|extmetadata|size',
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
      src: info.thumburl ?? info.url,
      original: info.url,
      page: info.descriptionurl,
      author: plain(meta.Artist?.value) || 'ismeretlen szerző',
      license: plain(meta.LicenseShortName?.value) || 'lásd a fájl oldalát',
      licenseUrl: meta.LicenseUrl?.value ?? null,
    });
  }
  return out;
}

async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`letöltés sikertelen (${res.status}): ${url}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

// iOS Safari nem játszik le Ogg Vorbist, ezért mindent AAC-re kódolunk,
// és a hosszú felvételeket egy kártyányi hosszra vágjuk.
async function transcodeAudio(input, output) {
  await run('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-i', input,
    '-t', String(AUDIO_SECONDS),
    '-af', `afade=t=out:st=${AUDIO_SECONDS - 1.5}:d=1.5,loudnorm=I=-16:TP=-1.5:LRA=11`,
    '-ac', '1', '-ar', '44100', '-c:a', 'aac', '-b:a', '96k',
    // A fejléc a fájl elejére kerül, különben a böngésző csak a teljes
    // letöltés után tudná elkezdeni a lejátszást (iOS-en sehogy).
    '-movflags', '+faststart',
    output,
  ]);
}

async function main() {
  await rm(MEDIA_DIR, { recursive: true, force: true });
  await mkdir(MEDIA_DIR, { recursive: true });

  console.log('Wikidata lekérdezés…');
  const wikidata = await wikidataMedia(BIRDS);
  const tmp = join(ROOT, 'node_modules', '.cache');
  await mkdir(tmp, { recursive: true });

  const result = [];
  for (const bird of BIRDS) {
    const wd = wikidata.get(bird.taxon) ?? { qid: null, en: null, images: [], audio: [] };
    console.log(`\n${bird.hu} (${bird.taxon})`);

    const imageTitles = [
      ...new Set([...wd.images, ...(await categoryImages(bird.taxon)), ...(await searchImages(bird.taxon))]),
    ]
      .filter((t) => !IMAGE_BLOCKLIST.test(t))
      .slice(0, MAX_IMAGES * 3);
    const audioTitles = [...new Set([...wd.audio, ...(await searchAudio(bird.taxon))])].slice(0, MAX_AUDIO * 3);
    const info = await fileInfo([...imageTitles, ...audioTitles]);

    const images = [];
    for (const title of imageTitles) {
      if (images.length >= MAX_IMAGES) break;
      const file = info.get(title);
      if (!file?.mime?.startsWith('image/')) continue;
      const badCategory = file.categories.find((c) => IMAGE_BLOCKLIST.test(c));
      if (badCategory) {
        console.log(`  kép  – kihagyva (${badCategory}): ${title}`);
        continue;
      }
      const name = `${bird.id}-${images.length + 1}.jpg`;
      try {
        await download(file.src, join(MEDIA_DIR, name));
      } catch (err) {
        console.warn(`  kép kihagyva (${title}): ${err.message}`);
        continue;
      }
      images.push({ file: `media/${name}`, author: file.author, license: file.license, licenseUrl: file.licenseUrl, source: file.page });
      console.log(`  kép  ✓ ${title}`);
    }

    const audio = [];
    for (const title of audioTitles) {
      if (audio.length >= MAX_AUDIO) break;
      const file = info.get(title);
      if (!file?.mime?.startsWith('audio/')) continue;
      const name = `${bird.id}-${audio.length + 1}.m4a`;
      const raw = join(tmp, `raw-${Date.now()}`);
      try {
        await download(file.original, raw);
        await transcodeAudio(raw, join(MEDIA_DIR, name));
      } catch (err) {
        console.warn(`  hang kihagyva (${title}): ${err.message}`);
        continue;
      } finally {
        await rm(raw, { force: true });
      }
      audio.push({ file: `media/${name}`, author: file.author, license: file.license, licenseUrl: file.licenseUrl, source: file.page });
      console.log(`  hang ✓ ${title}`);
    }

    if (!images.length) console.warn(`  ⚠︎ nincs kép: ${bird.hu}`);
    if (!audio.length) console.warn(`  ⚠︎ nincs hang: ${bird.hu}`);

    result.push({ id: bird.id, name: bird.hu, taxon: bird.taxon, en: wd.en, qid: wd.qid, images, audio });
  }

  const outFile = join(ROOT, 'public', 'data', 'birds.json');
  await writeFile(outFile, JSON.stringify({ generated: new Date().toISOString(), birds: result }, null, 2) + '\n');
  console.log(`\nKész: ${result.length} faj → ${outFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
