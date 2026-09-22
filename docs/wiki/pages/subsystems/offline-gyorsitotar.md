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
médiakészlet a gyorsítótárba kerül (27 fajnál ~160 fájl, nagyságrendileg 20 MB).*

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

## Bájttartomány-kérések

A médialejátszók részletekben kérik a fájlt, és Safari **csak 206-os választ**
fogad el. A `cache.match()` viszont a teljes választ adja, a Range fejlécet
figyelmen kívül hagyva — ezért a worker a tárolt fájlból maga állítja elő a
206-ot (`partial()`), a nyitott és a suffix alakot is kezelve, érvénytelen
tartományra 416-tal. Enélkül a telepített app offline néma marad
([[2026-09-22-a-gyorsitotar-ket-csendes-hibaja]]).

## Verziózás

A `CACHE` név (`madarak-v3`) a verzió. **Emelni kell, ha egy meglévő útvonal
tartalma változik** — a média cache-first, tehát a régi fájl különben örökre a
telepített appban maradna. Az aktiválás csak a saját `madarak-` prefixű
gyorsítótárakat törli. A `skipWaiting()` +
`clients.claim()` miatt az új worker azonnal átveszi az irányítást.

## Fejlesztés

Localhoston az `app.js` **nem** regisztrálja a workert — enélkül a fejlesztés
óráig tartó félrevezetésbe futhat ([[2026-09-18-regi-kod-a-gyorsitotarbol]]).
Éles címen a regisztráció automatikus.
