// Offline gyorsítótár: telepítéskor bekerül az app és minden média,
// hogy a gyakorlás térerő nélkül is menjen.

const CACHE = 'madarak-v2';

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
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
];

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
    await cache.addAll(CORE);
    const extras = [...(await mediaFiles()), ...(await fontFiles())];
    await Promise.all(extras.map((url) => cache.add(url).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

// A média és a betűk sosem változnak: azokat a gyorsítótár adja.
// Az app kódja viszont frissülhet, ezért ott a hálózat az első, a
// gyorsítótár a tartalék — így offline is minden megvan.
const STATIC = /\.(jpg|png|m4a|woff2|svg)$/i;

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);

    if (STATIC.test(new URL(request.url).pathname)) {
      const cached = await cache.match(request, { ignoreSearch: true });
      if (cached) return cached;
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
