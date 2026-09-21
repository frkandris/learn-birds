---
type: Concept
title: Két készség, két pakli
description: A kép- és a hangfelismerés külön kártya külön ütemezéssel, ezért ugyanaz a faj a két módban külön szinten állhat.
tags: [learning, modes, scheduling]
status: stable
generated: { by: claude-opus-5/claude-code, at: 2026-09-21T09:00:00Z }
resource: public/srs.js
---

# Két készség, két pakli

*Egy fajhoz két kártya tartozik — `<faj>|both` és `<faj>|sound` —, mert a szemmel és
a füllel való felismerés külön készség.*

## Miért külön

A terepen a madarak többségét előbb hallani, mint látni. Aki a fotóról azonnal
felismeri a széncinegét, attól még nem ismeri fel a hangját, és fordítva. Ha egy
kártya fedné mindkettőt, a könnyebbik készség húzná fel a szintet, és a nehezebbik
soha nem kapna elég ismétlést.

## Hogyan jelenik meg

- **Ma nézet**: a két mód külön számlálóval indul, és a napi adag módonként érvényes.
- **Fajok nézet**: fajonként két pöttysor — a sárga a képre, a kék a hangra —, mellette
  hogy mikor esedékes (`ma`, `holnap`, `5 nap`).
- **Csak hang mód**: a felfedésig nincs kép; a válasznál viszont megjelenik a fotó is,
  így a hang és a látvány összekapcsolódik.

## Ami ebből következik

- Hang nélküli faj nem kerül be a „csak hang" paklijába (`pickSession` szűri), és a
  Fajok nézetben `nincs hang` felirattal látszik. Ilyen faj jelenleg nincs, de a
  Commonson nem minden fajhoz van használható felvétel ([[wikimedia-commons]]).
- A statisztika („4 faj van a képes pakliban a 6-ból") mindig egy adott módra vonatkozik.

Kapcsolódó: [[ismetlesi-modell]], [[szonogram-olvasas]].
