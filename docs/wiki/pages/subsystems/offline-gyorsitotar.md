---
type: Subsystem
title: Offline gyorsítótár (sw.js)
description: Telepítéskor bekerül az app, a média és a betűk; a média cache-first, az app kódja network-first, hogy a frissítés azonnal látsszon.
tags: [module, service-worker, offline, pwa]
status: stable
generated: { by: claude-opus-5/claude-code, at: 2026-09-21T09:00:00Z }
resource: public/sw.js
---

# Offline gyorsítótár (sw.js)

*A gyakorlás térerő nélkül is megy: telepítéskor az app, a betűk és a teljes
médiakészlet a gyorsítótárba kerül (27 fajnál 108 fotó és felvétel, az apppal és
a betűkkel együtt 131 bejegyzés — 2026-09-22-i mérés az éles telepítésen).*

## Stratégia

| Kérés | Stratégia | Miért |
|---|---|---|
| `.jpg .png .m4a .woff2 .svg` | cache-first | sosem változnak, nagyok, offline kellenek |
| minden más (html, js, json, webmanifest) | network-first, cache tartalékkal | a frissítés azonnal látsszon |

Offline navigációnál az `index.html` a tartalék.

## Telepítés

A `CORE` lista az app futásához **elengedhetetlen** fájlokat sorolja (`cache.addAll`,
tehát egyetlen hiányzó is megbuktatja a telepítést — ez itt szándékos). Az ikonok, a
média és a betűk ezzel szemben egyenként, hibatűrően kerülnek be: egy nem elérhető
fájl miatt ne maradjon telepítetlen a worker. Tehát **új madár vagy új betű
nem igényel sw.js-módosítást, új JS-modul viszont igen** — azt a `CORE` listába
kézzel kell felvenni.

Minden gyorsítótárba szánt letöltés `cache: 'reload'` módú kérés (`fresh()`),
azaz megkerüli a böngésző HTTP-gyorsítótárát. Az nginx a médiát egy napig
frissnek jelöli (`max-age=86400`), így enélkül egy napon belüli új telepítés a
cserélt fájl helyett a régit kapná vissza, és a névváltás hiába épít új
gyorsítótárat ([[2026-09-22-a-gyorsitotar-ket-csendes-hibaja]], 3. pont).

Ha egy médiafájl a telepítésből kimaradt, futás közben pótlódik: képnél a 200-as
válasz kerül be, hangnál viszont a lejátszó 206-os részválaszt kap, amit a Cache
API nem tárol (`cache.put` → `TypeError`) — ilyenkor a worker a teljes fájlt
külön letölti.

## Bájttartomány-kérések

A médialejátszók részletekben kérik a fájlt, és Safari **csak 206-os választ**
fogad el. A `cache.match()` viszont a teljes választ adja, a Range fejlécet
figyelmen kívül hagyva — ezért a worker a tárolt fájlból maga állítja elő a
206-ot (`partial()`), a nyitott és a suffix alakot is kezelve, érvénytelen
tartományra 416-tal. Enélkül a telepített app offline néma marad
([[2026-09-22-a-gyorsitotar-ket-csendes-hibaja]]).

## Verziózás

A `CACHE` név két részből áll:

```js
const MEDIA_STAMP = '20260922-0839';  // a fetch-birds.mjs írja
const CACHE = `${CACHE_PREFIX}v5-${MEDIA_STAMP}`;
```

- A **kódverziót** (`v5`) kézzel emeljük, ha a worker logikája változik.
- A **médiabélyeget** a begyűjtés írja ide minden futás végén.

Ez azért automatizált, mert kétszer is elmaradt kézzel: a fájlnevek nem
verziózottak (`tengelic-1.jpg`), tehát azonos néven cserélt fájl esetén a
telepített appban a régi tartalom maradt volna, miközben a `birds.json` már az
új szerzőt és licencet mutatja ([[2026-09-22-a-gyorsitotar-ket-csendes-hibaja]]).
A név változása új workert telepít, az pedig friss gyorsítótárat épít.

Az aktiválás csak a saját `madarak-` prefixű gyorsítótárakat törli. A `skipWaiting()` +
`clients.claim()` miatt az új worker azonnal átveszi az irányítást.

## Fejlesztés

Localhoston az `app.js` **nem** regisztrálja a workert — enélkül a fejlesztés
óráig tartó félrevezetésbe futhat ([[2026-09-18-regi-kod-a-gyorsitotarbol]]).
Éles címen a regisztráció automatikus.
