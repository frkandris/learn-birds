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

A `CORE` lista az app fájljait sorolja; a médiát a `data/birds.json`-ból, a betűket
a `fonts.css` `url()`-jeiből gyűjti be a telepítő. Tehát **új madár vagy új betű
nem igényel sw.js-módosítást, új JS-modul viszont igen** — azt a `CORE` listába
kézzel kell felvenni.

## Verziózás

A `CACHE` név (`madarak-v2`) a verzió. Emeld, ha a gyorsítótár tartalmát biztosan
cserélni kell; az aktiválás a régi neveket törli. A `skipWaiting()` +
`clients.claim()` miatt az új worker azonnal átveszi az irányítást.

## Fejlesztés

Localhoston az `app.js` **nem** regisztrálja a workert — enélkül a fejlesztés
óráig tartó félrevezetésbe futhat ([[2026-09-18-regi-kod-a-gyorsitotarbol]]).
Éles címen a regisztráció automatikus.
