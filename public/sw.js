// Offline gyorsítótár: telepítéskor bekerül az app és minden média,
// hogy a gyakorlás térerő nélkül is menjen.

// A gyorsítótár neve két részből áll. A kódverziót kézzel emeljük, ha a worker
// logikája változik; a médiabélyeget a `npm run fetch` írja ide, mert a média
// cache-first — azonos néven cserélt fájl különben örökre a telepített appban
// maradna. A név változása telepít új workert, az pedig friss gyorsítótárat.
const CACHE_PREFIX = 'madarak-';
const MEDIA_STAMP = '20260922-0839';  // a fetch-birds.mjs írja, ne szerkeszd kézzel
const CACHE = `${CACHE_PREFIX}v4-${MEDIA_STAMP}`;

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

async function mediaFiles() {
  try {
    const data = await (await fetch('data/birds.json')).json();
    return data.birds.flatMap((bird) => [...bird.images, ...bird.audio].map((item) => item.file));
  } catch {
    return [];
  }
}

async function fontFiles() {
  try {
    const css = await (await fetch('fonts.css')).text();
    return [...css.matchAll(/url\('([^']+)'\)/g)].map((m) => m[1]);
  } catch {
    return [];
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Az app futásához kellő fájlok nélkül nincs értelme a telepítésnek, a
    // többi (ikon, média, betű) hiánya viszont nem buktathatja meg.
    await cache.addAll(CORE);
    const extras = [...ICONS, ...(await mediaFiles()), ...(await fontFiles())];
    await Promise.all(extras.map((url) => cache.add(url).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE).map((key) => caches.delete(key)),
    );
    await self.clients.claim();
  })());
});

// A média és a betűk sosem változnak: azokat a gyorsítótár adja.
// Az app kódja viszont frissülhet, ezért ott a hálózat az első, a
// gyorsítótár a tartalék — így offline is minden megvan.
const STATIC = /\.(jpg|png|m4a|woff2|svg)$/i;

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

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);

    if (STATIC.test(new URL(request.url).pathname)) {
      const cached = await cache.match(request, { ignoreSearch: true });
      if (cached) return partial(cached, request.headers.get('range'));
      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone());
      return response;
    }

    try {
      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone());
      return response;
    } catch {
      const cached = await cache.match(request, { ignoreSearch: true });
      if (cached) return cached;
      if (request.mode === 'navigate') return cache.match('index.html');
      throw new Error('offline');
    }
  })());
});
