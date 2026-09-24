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
a betűkkel együtt 131 bejegyzés: 10 alapfájl, 3 ikon, 10 betűfájl, 108 média —
a 2026-09-22-i éles `v5` mérés 133-at adott, azóta kikerült a nem használt
Alegreya Sans 500 két fájlja).*

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

A verziózott gyorsítótárba szánt letöltés `cache: 'reload'` módú kérés
(`fresh()`), azaz megkerüli a böngésző HTTP-gyorsítótárát: az ikonok és a betűk
egy napig frissnek jelöltek, így új telepítés a régi változatot kaphatná vissza
([[2026-09-22-a-gyorsitotar-ket-csendes-hibaja]], 3. pont). A hash-es médiánál
erre nincs szükség — ott a HTTP-gyorsítótár tartalma is biztosan jó.

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

## Két gyorsítótár

```js
const CACHE = `${CACHE_PREFIX}v6`;     // app, ikonok, betűk — kézzel verziózva
const MEDIA = `${CACHE_PREFIX}media`;  // hash-es médianevek — nem verziózott
```

- A **kódverziót** (`v6`) kézzel emeljük, ha a worker logikája változik. Az
  aktiválás a többi `madarak-` prefixű gyorsítótárat törli, a `MEDIA`-t nem.
- A **média** neve a tartalma hash-ét hordozza
  ([[2026-09-24-tartalomhash-es-mediafajlnevek]]), ezért egy név alatt sosem
  változik, és a `MEDIA` gyorsítótár a `birds.json`-t követi. Minden sikeresen
  letöltött `birds.json` után az `adoptList()` **tranzakcióként** veszi át az új
  listát: előbb minden hiányzó fájl lejön (`fetchMissing()`), csak ha mind
  sikerült, akkor tárolódik a lista, és csak utána törlődik a már nem kellő
  média (`pruneMedia()`). Ha közben elmegy a kapcsolat, a régi lista és a teljes
  régi média marad — offline a kettő mindig összeillik. Így egy új begyűjtés a
  worker cseréje nélkül is a készülékre kerül, és csak a változott fájlok jönnek
  le.
- Telepítéskor ugyanez fut, de nem tranzakcióként: első telepítéskor nincs mit
  megőrizni, ami kimarad, a következő online indításkor pótlódik.

Korábban a gyorsítótár nevében médiabélyeg állt, amit a begyűjtés írt a
`sw.js`-be; ez minden változáskor mind a 108 fájlt újratöltette
([[2026-09-22-a-gyorsitotar-ket-csendes-hibaja]]).

Mérve (2026-09-24, a konténerben, kézzel regisztrált workerrel): telepítés után
`madarak-v6` 23 bejegyzés, `madarak-media` 108; egy kézzel törölt médiafájl a
következő `birds.json`-letöltéskor visszakerült, egy odacsempészett felesleges
bejegyzés törlődött, a régi `madarak-v5-…` gyorsítótár az aktiváláskor eltűnt.

## Fejlesztés

Localhoston az `app.js` **nem** regisztrálja a workert — enélkül a fejlesztés
óráig tartó félrevezetésbe futhat ([[2026-09-18-regi-kod-a-gyorsitotarbol]]).
Éles címen a regisztráció automatikus.
