---
type: Post-mortem
title: Tojásfotó került a holló kártyájára
description: A Wikidata P18 képe egy múzeumi tojásgyűjtemény fotója volt; a fájlnév-alapú szűrés nem fogta meg, a Commons-kategóriák alapú igen.
tags: [wikimedia, data-quality, post-mortem]
status: stable
generated: { by: claude-opus-5/claude-code, at: 2026-09-21T09:00:00Z }
resource: scripts/fetch-birds.mjs
---

# Tojásfotó került a holló kártyájára

*2026-09-18. A tanulókártyán két madártojás szerepelt „holló" néven.*

## Tünet

Az első begyűjtés után a 18 kép vizuális ellenőrzésekor (kontaktlap `ffmpeg
tile`-lal) a holló első képe két tojás fekete háttéren:
`File:Corvus corax tingitanus MHNT 232 HdB Djebel Messaad Algerie.jpg`.

## Gyökérok

A kép a Wikidata `P18` (kép) tulajdonságából jött, tehát a „hivatalos" fajkép volt.
A szűrés ekkor csak a fájlnevet nézte, a fájlnévben pedig nincs `egg` — a `MHNT`
(Muséum d'histoire naturelle de Toulouse) és a `HdB` rövidítés nem árulkodó annak,
aki nem ismeri a gyűjteményt.

## Javítás

A szűrés a Commons-**kategóriákra** is kiterjedt (`prop=imageinfo|categories`), és a
tiltólista bővült (`museum`, `specimen`, `mounted`, `MHNT`, `HdB`, `collection`). A
tojásfotó a `Category:Eggs of Corvus corax`-on keresztül kiesett.

Egy mellékhatás is előjött: a `plate` minta illeszkedett a `template` szóra, és
karbantartási kategóriák miatt jó fotókat dobott ki. Javítás: `\bplate\b`.

## Tanulság

- **A strukturált forrás sem garancia a tartalomra.** A `P18` azt mondja meg, hogy a
  kép a fajhoz tartozik, nem azt, hogy a fajt *mutatja*.
- A fájlnév gyenge jelzés, a kategóriák erősebbek — és mindkettő olcsó ugyanabban az
  API-hívásban.
- **A vizuális ellenőrzés nem kihagyható lépés.** Egy 3×6-os kontaktlap
  (`ffmpeg ... tile=3x6`) másodpercek alatt megmutat 18 képet; enélkül a hiba a
  telefonon derült volna ki, tanulás közben.
