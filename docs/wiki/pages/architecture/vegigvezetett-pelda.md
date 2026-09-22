---
type: Architecture
title: Egy kártya útja a Commonstól a képernyőig
description: Végigvezetett példa a kék cinegén: SPARQL-lekérdezéstől az AAC-kódoláson át a felfedett válaszig és a következő esedékességig.
tags: [architecture, walkthrough, example]
status: stable
generated: { by: claude-opus-5/claude-code, at: 2026-09-21T09:00:00Z }
---

# Egy kártya útja a Commonstól a képernyőig

*Ez a minta, amit minden új faj és minden új funkció követ — érdemes innen indulni.*

## 1. Felvétel a listába

`scripts/birds.js`-ben egy sor: magyar név, tudományos név. Ennyi a kézi munka.

```js
{ id: 'kek-cinege', hu: 'kék cinege', taxon: 'Cyanistes caeruleus', wikiHu: 'Kék cinege' }
```

## 2. Begyűjtés (`npm run fetch`)

1. **Wikidata SPARQL**: `?item wdt:P225 "Cyanistes caeruleus"` → `P18` (kép), `P51`
   (hang), angol címke. (`scripts/fetch-birds.mjs:57`)
2. **Commons kategória**: `Category:Cyanistes caeruleus` fájljai, 1200 px-nél
   szélesebb fotók, méret szerint rendezve.
3. **Commons keresés** tartalékként: `Cyanistes caeruleus filetype:bitmap`, illetve
   `filetype:audio` — a hangoknál a fájlnévnek tartalmaznia kell a tudományos nevet,
   így a xeno-canto-ból átemelt felvételek jönnek elő.
4. **Szűrés**: fájlnév *és* Commons-kategória a tiltólistán (tojás, fészek, múzeum,
   preparátum…) — ez fogta meg a [[2026-09-18-tojasfoto-a-wikidatabol]] esetet.
5. **Metaadat**: `imageinfo` + `extmetadata` → `Artist`, `LicenseShortName` — a
   szerző a felfedett kártyára kerül, a licenc a `birds.json`-ba.
6. **Átalakítás**: a kép a Commonstól 1000 px szélességben kérve; a hang
   `ffmpeg`-gel 22 másodperces, mono, 96 kbit/s AAC, `loudnorm`-mal és
   `+movflags faststart`-tal ([[faststart-aac]]).

Eredmény: `public/media/kek-cinege-{1,2}.jpg`, `kek-cinege-{1,2}.m4a`, és egy
bejegyzés a `public/data/birds.json`-ban.

## 3. A kör összeállítása

A „Csak kép" / „Csak hang" / „Kép és hang" gomb → `pickSession(state, birds, mode, dose)`: előbb az esedékes
ismétlések (legrégebben esedékes elöl), aztán a tanulatlan fajok, a napi adagig
([[ismetlesi-modell]]). A kiválasztott fajokból `new Round({mode, birds})`, ami
fajonként rögzít egy képet és egy hangot ([[gyakorlokor-modul]]).

## 4. A kártya

`showCard()` beteszi a fotót, betölti a hangot, és 320 ms múlva megpróbálja
elindítani. A hangkörnyezetet már a gombnyomás feloldotta — enélkül a lejátszás
némán elakadna ([[2026-09-18-nema-lejatszas-felfuggesztett-audiocontext]]).

## 5. Felfedés és értékelés

„Mutasd a nevét" → magyar név, dőlt tudományos név, a szerzők. Két gomb
([[2026-09-18-ket-gomb-az-ertekelesre]]):

- *Erre gondoltam* → `round.grade(true)` → `{birdId, clean}` → `schedule(...)` a
  következő esedékességgel, majd mentés a `localStorage`-ba.
- *Nem erre gondoltam* → a kártya a pakli végére kerül, és `miss` marad akkor is, ha
  később sikerül ([[2026-09-18-hibas-kartya-a-pakli-vegere]]).

## 6. A következő találkozás

Elsőre sikerült kártya: szint +1, a lépcső szerinti nap múlva. Hibás: szint 0,
holnap. A Fajok nézet pöttyei ezt mutatják fajonként, külön a képre és a hangra
([[harom-mod-harom-pakli]]).
