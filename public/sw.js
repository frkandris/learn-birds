// Offline gyorsítótár: telepítéskor bekerül az app; a média használatkor
// kerül a készülékre, így ami egyszer előkerült, térerő nélkül is megy — a
// teljes (~15 MB-os) készletet viszont senki nem tölti le kérés nélkül.

// Két gyorsítótár van. Az app kódja, az ikonok és a betűk a verziózott
// `CACHE`-be kerülnek; a verziót kézzel emeljük, ha a worker logikája változik.
// A média a `MEDIA`-ba: a fájlnév a tartalom hash-ét hordozza, tehát egy név
// alatt sosem változik — ezt a gyorsítótárat nem kell verziózni, csak a
// birds.json szerint ritkítani.
const CACHE_PREFIX = 'madarak-';
const CACHE = `${CACHE_PREFIX}v6`;
const MEDIA = `${CACHE_PREFIX}media`;

const CORE = [
  './',
  'index.html',
  'styles.css',
  'fonts.css',
  'app.js',
  'srs.js',
  'round.js',
  'audio.js',
  'manifest.webmanifest',
  'data/birds.json',
];

const ICONS = ['icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

// A verziózott gyorsítótárba szánt letöltés megkerüli a böngésző
// HTTP-gyorsítótárát: az ikonok és a betűk egy napig frissnek jelöltek, így új
// telepítés a régi változatot kaphatná vissza.
const fresh = (url) => new Request(url, { cache: 'reload' });

async function fontFiles(cache) {
  try {
    const css = await (await cache.match('fonts.css')).text();
    return [...css.matchAll(/url\('([^']+)'\)/g)].map((m) => m[1]);
  } catch {
    return [];
  }
}

// A médiagyorsítótár a birds.json-t követi: ami a friss listában már nincs
// benne (lecserélt vagy kivett faj), az törlődik. Csak a lista sikeres
// tárolása után — különben offline a régi lista a törölt fájljaira mutatna.
async function adoptList(request, response) {
  let wanted;
  try {
    const data = await response.clone().json();
    wanted = new Set(
      data.birds.flatMap((bird) => [...bird.images, ...bird.audio])
        .map((item) => new URL(item.file, self.registration.scope).href),
    );
  } catch {
    return; // sérült lista alapján nem törlünk semmit
  }
  await (await caches.open(CACHE)).put(request, response);
  const media = await caches.open(MEDIA);
  const stale = (await media.keys()).filter((stored) => !wanted.has(stored.url));
  await Promise.all(stale.map((stored) => media.delete(stored)));
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Az app futásához kellő fájlok nélkül nincs értelme a telepítésnek, az
    // ikonok és a betűk hiánya viszont nem buktathatja meg.
    await cache.addAll(CORE.map(fresh));
    const extras = [...ICONS, ...(await fontFiles(cache))];
    await Promise.all(extras.map((url) => cache.add(fresh(url)).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE && key !== MEDIA)
        .map((key) => caches.delete(key)),
    );
    await self.clients.claim();
  })());
});

// A média, az ikonok és a betűk: cache-first, és az első letöltéskor
// eltesszük őket. Az app kódja viszont frissülhet, ezért ott a hálózat az
// első, a gyorsítótár a tartalék.
const STATIC = /\.(jpg|png|m4a|woff2|svg)$/i;
const IS_MEDIA = /\/media\//;

// A médialejátszók bájttartományt kérnek, és a gyorsítótár teljes válaszát
// Safari nem fogadja el: offline így néma maradna a hang. A 206-os választ
// ezért magunk állítjuk elő a tárolt fájlból.
async function partial(cached, range) {
  const match = range && /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (!match) return cached;

  const body = await cached.clone().arrayBuffer();
  const total = body.byteLength;
  let start;
  let end;

  if (match[1] === '') {
    const suffix = Number(match[2] || 0);
    start = Math.max(0, total - suffix);
    end = total - 1;
  } else {
    start = Number(match[1]);
    end = match[2] === '' ? total - 1 : Math.min(Number(match[2]), total - 1);
  }

  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= total) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${total}` } });
  }

  const slice = body.slice(start, end + 1);
  return new Response(slice, {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': cached.headers.get('Content-Type') ?? 'application/octet-stream',
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Content-Length': String(slice.byteLength),
      'Accept-Ranges': 'bytes',
    },
  });
}

// A válasz után folytatódó munka: a worker ne álljon le közben. Ha a böngésző
// már nem enged meghosszabbítást, a munka akkor is fut, csak nem védett.
function keepAlive(event, promise) {
  try {
    event.waitUntil(promise);
  } catch {
    /* nincs teendő */
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    if (STATIC.test(url.pathname)) {
      const cached = await caches.match(request, { ignoreSearch: true });
      if (cached) return partial(cached, request.headers.get('range'));
      const response = await fetch(request);
      const cache = await caches.open(IS_MEDIA.test(url.pathname) ? MEDIA : CACHE);
      // A lejátszó bájttartományt kér, a 206-os választ viszont a Cache API
      // nem tárolja (TypeError). Ilyenkor a teljes fájlt külön töltjük le.
      // Az írás a válasz után is folyik: a worker ne álljon le közben (mobil
      // Safari leállítja, amint a válasz elment), különben a média offline
      // hiányozna, pedig egyszer már lejött.
      if (response.status === 200) {
        keepAlive(event, cache.put(request, response.clone()).catch(() => {}));
      } else if (response.status === 206) {
        keepAlive(event, cache.add(url.href).catch(() => {}));
      }
      return response;
    }

    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(request);
      if (response.ok && url.pathname.endsWith('/data/birds.json')) {
        keepAlive(event, adoptList(request, response.clone()).catch(() => {}));
      } else if (response.ok) {
        keepAlive(event, cache.put(request, response.clone()).catch(() => {}));
      }
      return response;
    } catch {
      const cached = await cache.match(request, { ignoreSearch: true });
      if (cached) return cached;
      if (request.mode === 'navigate') return cache.match('index.html');
      throw new Error('offline');
    }
  })());
});
