---
type: Subsystem
title: Offline gyorsítótár (sw.js)
description: Telepítéskor csak az app, az ikonok és a betűk kerülnek be; a média használatkor, így ami egyszer előkerült, térerő nélkül is megy — a teljes készletet senki nem tölti le kérés nélkül.
tags: [module, service-worker, offline, pwa]
status: stable
generated: { by: claude-opus-5.5/claude-code, at: 2026-09-24T18:00:00Z }
resource: public/sw.js
---

# Offline gyorsítótár (sw.js)

*Telepítéskor 23 fájl (10 alapfájl, 3 ikon, 10 betűfájl) kerül a készülékre; a
média használatkor. Ami egyszer bekerült egy körbe vagy előkerült a Fajok
nézetben, az onnantól térerő nélkül is megy
([[2026-09-24-media-hasznalatkor-kerul-a-keszulekre]]).*

## Stratégia

| Kérés | Stratégia | Miért |
|---|---|---|
| `.jpg .png .m4a .woff2 .svg` | cache-first, első letöltéskor eltéve | sosem változnak, nagyok, offline kellenek |
| minden más (html, js, json, webmanifest) | network-first, cache tartalékkal | a frissítés azonnal látsszon |

Offline navigációnál az `index.html` a tartalék.

## Telepítés

A `CORE` lista az app futásához **elengedhetetlen** fájlokat sorolja (`cache.addAll`,
tehát egyetlen hiányzó is megbuktatja a telepítést — ez itt szándékos). Az ikonok és
a betűk egyenként, hibatűrően kerülnek be. **Új madár vagy új betű nem igényel
sw.js-módosítást, új JS-modul viszont igen** — azt a `CORE` listába kézzel kell
felvenni.

Ezek a letöltések `cache: 'reload'` módúak (`fresh()`), azaz megkerülik a böngésző
HTTP-gyorsítótárát: az ikonok és a betűk egy napig frissnek jelöltek, így új
telepítés a régi változatot kaphatná vissza
([[2026-09-22-a-gyorsitotar-ket-csendes-hibaja]], 3. pont).

## A média útja

- **Gyakorlás indításakor** az app előre lekéri a kör fájljait
  (`Round.files()`: a fotó minden módban, a hang ahol szól) — a kártyaváltás nem
  vár a hálózatra, és a worker elteszi őket. Ez a kör előtöltése (3–12 fájl), nem
  a teljes készleté.
- **Bármely más médiakérés** (a Fajok nézet fotói és lejátszói) cache-first; a
  hiányzó fájl a hálózatról jön, és bekerül a `MEDIA` gyorsítótárba.
- **Minden gyorsítótár-írás `waitUntil` alatt fut** (`keepAlive()`): az írás a
  válasz elküldése után is tart, és mobil Safari a workert ilyenkor leállíthatja
  — a fájl lejött volna, offline mégis hiányozna (codex review, 2026-09-24).
- **Hang, Range-kéréssel**: a lejátszó 206-os részválaszt kap, amit a Cache API
  nem tárol (`cache.put` → `TypeError`) — ilyenkor a worker a teljes fájlt külön
  letölti. Az előtöltés ezt megelőzi, mert Range nélkül kér.

Mérve (2026-09-24, konténeren, kézzel regisztrált workerrel): telepítés után
`madarak-v6` 23 bejegyzés, `madarak-media` üres; egy „Csak hang" kör után
pontosan a kör 6 fájlja (3 fotó, 3 hang) volt benne, a hang 200-as teljes
válaszként, és a Range-kérésre a gyorsítótárból 206 jött.

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
  változik: a `MEDIA`-t nem kell verziózni, csak ritkítani. Minden sikeresen
  letöltött `birds.json` után az `adoptList()` előbb eltárolja a listát, és csak
  utána törli a benne már nem szereplő fájlokat (lecserélt vagy kivett faj) —
  fordított sorrendben egy sikertelen mentés után offline a régi lista a törölt
  fájljaira mutatna.

## Fejlesztés

Localhoston az `app.js` **nem** regisztrálja a workert — enélkül a fejlesztés
óráig tartó félrevezetésbe futhat ([[2026-09-18-regi-kod-a-gyorsitotarbol]]).
Éles címen a regisztráció automatikus. A konténeren (`docker run -p 8089:80`)
a konzolból kézzel regisztrálható: `navigator.serviceWorker.register('sw.js')`.
