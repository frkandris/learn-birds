---
type: Concept
title: Három mód, három pakli
description: Csak kép, csak hang, és a kettő együtt — minden mód külön kártya külön ütemezéssel, ezért ugyanaz a faj a három módban külön szinten állhat.
tags: [learning, modes, scheduling]
status: stable
generated: { by: claude-opus-5/claude-code, at: 2026-09-22T09:00:00Z }
resource: public/srs.js
---

# Három mód, három pakli

*Egy fajhoz három kártya tartozik — `<faj>|image`, `<faj>|sound` és `<faj>|both` —,
mert a szemmel, a füllel és a kettő együttes felismerése külön készség.*

## A három mód

| Mód | Kulcs | Mit mutat a kártya | Mit igényel a fajtól |
|---|---|---|---|
| Csak kép | `image` | fotó, hang nélkül | legalább egy kép |
| Csak hang | `sound` | futó szonogram, kép nélkül | legalább egy hang |
| Kép és hang | `both` | fotó és felvétel együtt | kép **és** hang |

A felfedés után mindhárom módban megjelenik a fotó és a név: a válasz egyben
megerősítés is.

## Miért külön ütemezés

A terepen a madarak többségét előbb hallani, mint látni. Aki a fotóról azonnal
felismeri a széncinegét, attól még nem ismeri fel a hangját. Ha egy kártya fedné
mindkettőt, a könnyebbik készség húzná fel a szintet, és a nehezebbik soha nem kapna
elég ismétlést.

A kettős mód sem redundáns: ott a két jelzés együtt érkezik, ami a valódi terepi
helyzet (látod is, hallod is), és jóval könnyebb — jó bevezetés egy új fajhoz,
mielőtt külön-külön gyakorolnád.

## Ami ebből következik

- **Fajonként három ütemterv.** A Fajok nézetben három pöttysor jelzi, melyik készség
  hol tart (sárga = kép, kék = hang, fehér = kettő).
- **A napi adag módonként érvényes.** Az alapértelmezés 3, tehát egy teljes nap
  mindhárom módban legfeljebb 9 kártya.
- **A média hiánya szűr.** Kép nélküli faj csak a hangos pakliba fér be, hang nélküli
  csak a képesbe, és a kettős mód mindkettőt kéri (`usableIn()`).

Kapcsolódó: [[ismetlesi-modell]], [[szonogram-olvasas]],
[[2026-09-22-harmadik-mod-es-huszonhet-faj]].
