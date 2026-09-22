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
6. Rangsor: a Commons közösségi minősítései (`Quality images`, `Featured pictures`,
   `Valued images`) előre kerülnek — ezeken a fotókon a madár jól látszik, nem csak
   rajta van a képen.
7. Letöltés és átalakítás: kép 900 px szélességben a Commonstól; hang `ffmpeg`-gel
   22 s, mono, AAC 96k, `loudnorm`, fade, `+movflags faststart` ([[faststart-aac]]).

Korlátok: `MAX_IMAGES = 2`, `MAX_AUDIO = 2` fajonként. A harmadik kép rendszeresen
gyenge volt (távoli madár, üres ág), mert fajonként elfogynak a jó jelöltek.

## Részleges futás

```sh
npm run fetch                       # mind a 27 faj, a media/ törlésével
node scripts/fetch-birds.mjs facan  # csak a felsorolt fajok, a többi érintetlen
```

A részleges futás csak az adott faj fájljait törli, és a `birds.json`-ban is csak az
ő bejegyzésüket cseréli — a lista sorrendjét megtartva.

## Kézi kizárás

Ha egy faj rossz képet kap, a `scripts/birds.js` bejegyzése kaphat `skipFiles`
listát: fájlnév-részletek, amiket a begyűjtés kihagy. Jelenleg két faj használja —
a molnárfecske kategóriájában sarlósfecske-fotók vannak, a csilpcsalpfüzikénél
pedig két olyan kép, amin a madár aprón ül az ágak között.

## Amire figyelni kell

- **A szűrés reguláris kifejezés, és a szóhatár számít.** A `plate` minta korábban
  a `template` szóra is illeszkedett, és jó képeket dobott ki; ezért `\bplate\b`.
- **A fájl fajtáját a `mediatype` dönti el, nem a MIME-típus**: a Commons a régi
  Ogg-felvételeket `application/ogg` néven adja, amit egy `audio/` előtagra szűrő
  feltétel csendben eldob ([[2026-09-22-nema-fajok-az-ogg-mime-tipus-miatt]]).
- **A script mindent újraszed** (`rm -rf public/media`), nincs inkrementális mód. A
  27 fajos futás negyedóra nagyságrend, és a Commons API-jától függ.
- **User-Agent kötelező** a Wikimedia API-khoz; a `UA` konstans azonosítja a projektet.
- A kimenet determinisztikus sorrendű, de a Commons tartalma változhat: új futás
  hozhat más fotót. Ezért a média a repóban van verziózva.

Szerződés: [[wikimedia-commons]]. Használat: [[uj-madar-felvetele]].
