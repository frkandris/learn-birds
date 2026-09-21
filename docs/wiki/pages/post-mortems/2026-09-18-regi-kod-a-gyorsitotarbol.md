---
type: Post-mortem
title: A service worker régi kódot szolgált ki fejlesztés közben
description: A cache-first service worker a módosított modulok helyett a telepítéskori változatot adta vissza, így a javítások látszólag hatástalanok maradtak.
tags: [service-worker, caching, post-mortem, developer-experience]
status: stable
generated: { by: claude-opus-5/claude-code, at: 2026-09-21T09:00:00Z }
resource: public/sw.js
---

# A service worker régi kódot szolgált ki fejlesztés közben

*2026-09-18. Két javítás is „hatástalannak" tűnt, mert a böngésző nem is a javított
kódot futtatta.*

## Tünet

A `audio.js` átírása után a szonogram ugyanúgy viselkedett, mint előtte —
beleértve egy olyan kódágat, amit épp töröltem. Az oldal újratöltése nem segített.

## Gyökérok

Az első service worker minden azonos eredetű kérésre **cache-first** volt:

```js
const cached = await caches.match(request, { ignoreSearch: true });
if (cached) return cached;
```

A `localhost` biztonságos eredetnek számít, tehát a worker fejlesztés közben is
regisztrálódott, és a telepítéskor gyorsítótárazott `app.js` / `audio.js`
változatot adta vissza. A `sw.js` maga is a gyorsítótárból jött, így a javított
stratégia sem lépett életbe.

## Javítás

Két lépés:

1. **Stratégia szétválasztása** ([[offline-gyorsitotar]]): a média és a betűk
   maradnak cache-first, az app kódja network-first lett, cache tartalékkal.
2. **Localhoston nincs regisztráció** (`app.js`): a fejlesztői kiszolgálás mindig a
   lemezről jön.

A már beragadt worker eltávolítása:

```js
for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
for (const k of await caches.keys()) await caches.delete(k);
```

## Tanulság

- **A cache-first stratégia a saját kódodra visszaüt.** A statikus médiára való, az
  alkalmazáslogikára nem.
- Ha egy javítás nyomtalanul tűnik el, az első kérdés ne az legyen, hogy „jó-e a
  javítás", hanem hogy **a futó kód azonos-e a lemezen lévővel**. A `fetch()`-csel
  visszaolvasott forrás (`src.includes('...')`) pár másodperc alatt eldönti.
- A service worker hibakeresésnél a `sw.js` maga is gyorsítótárazott erőforrás.
