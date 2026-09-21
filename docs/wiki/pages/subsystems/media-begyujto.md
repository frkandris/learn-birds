---
type: Subsystem
title: Médiabegyűjtő (scripts/fetch-birds.mjs)
description: Wikidata + Commons lekérdezés, minőségi szűrés, kép- és hangátalakítás, és a birds.json kiírása licencadatokkal.
tags: [script, wikimedia, ffmpeg, build]
status: stable
generated: { by: claude-opus-5/claude-code, at: 2026-09-21T09:00:00Z }
resource: scripts/fetch-birds.mjs
---

# Médiabegyűjtő (scripts/fetch-birds.mjs)

*Egyetlen parancs (`npm run fetch`) újraépíti a teljes médiakészletet a
`scripts/birds.js` fajlistájából.*

## Lépések fajonként

1. `wikidataMedia()` — SPARQL: `P225` taxonnév → `P18` kép, `P51` hang, angol címke.
2. `categoryImages()` — `Category:<taxon>` fájljai, `width >= 1200`, szélesség
   szerint csökkenően.
3. `searchImages()` / `searchAudio()` — Commons keresés tartalékként; a találat
   fájlnevének tartalmaznia kell a tudományos nevet.
4. `fileInfo()` — `imageinfo` + `categories` + `extmetadata` egy kéréssel; innen jön
   a szerző, a licenc és a fájl oldalának URL-je.
5. Szűrés: `IMAGE_BLOCKLIST` a **fájlnévre és a Commons-kategóriákra**;
   `AUDIO_BLOCKLIST` a Lingua Libre kiejtés-felvételekre.
6. Letöltés és átalakítás: kép 1000 px szélességben a Commonstól; hang `ffmpeg`-gel
   22 s, mono, AAC 96k, `loudnorm`, fade, `+movflags faststart` ([[faststart-aac]]).

Korlátok: `MAX_IMAGES = 3`, `MAX_AUDIO = 2` fajonként.

## Amire figyelni kell

- **A szűrés reguláris kifejezés, és a szóhatár számít.** A `plate` minta korábban
  a `template` szóra is illeszkedett, és jó képeket dobott ki; ezért `\bplate\b`.
- **A script mindent újraszed** (`rm -rf public/media`), nincs inkrementális mód. Egy
  teljes futás hat fajra percek alatt lefut.
- **User-Agent kötelező** a Wikimedia API-khoz; a `UA` konstans azonosítja a projektet.
- A kimenet determinisztikus sorrendű, de a Commons tartalma változhat: új futás
  hozhat más fotót. Ezért a média a repóban van verziózva.

Szerződés: [[wikimedia-commons]]. Használat: [[uj-madar-felvetele]].
