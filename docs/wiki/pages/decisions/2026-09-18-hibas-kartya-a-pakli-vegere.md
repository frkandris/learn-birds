---
type: Decision
title: A hibás kártya a pakli végére kerül
description: A kör addig tart, amíg minden madár egyszer sikerül; a visszadobott kártya a sor végére megy, és `miss` marad az ütemezés szempontjából.
tags: [decision, round, spaced-repetition]
status: stable
generated: { by: claude-opus-5/claude-code, at: 2026-09-21T09:00:00Z }
resource: public/round.js
---

# A hibás kártya a pakli végére kerül

*„addig dobálja vissza őket a pakli végéről, amíg azt nem mondtam, hogy sikerült" —
ez a kérés egyik szó szerinti pontja.*

## Döntés

`round.grade(false)` esetén a kártya a sor **végére** kerül (`queue.push`), nem egy
fix távolságra előre. A kör akkor ér véget, ha a sor kiürül.

## Miért a vége, és nem „két kártyával később"

Az első változat `Math.max(2, ...)` pozícióba szúrta vissza a kártyát, hogy ne
közvetlenül a válasz után jöjjön. Ez felesleges bonyolítás volt: a sor vége amúgy is
legalább annyi kártya, és a szabály így egy sorban elmondható. Az egyetlen eset,
ahol a kettő különbözik, az utolsó kártya — ott mindkét megoldás azonnal
visszahozza ugyanazt.

## Következmények

- **Az utolsó kártya elrontva rögtön újra jön.** Ezt a `round.test.mjs` külön
  rögzíti, hogy szándékos maradjon.
- **A `miss` jelölés ragadós.** Ha egy faj egyszer elbukott, a kör végén is hibásnak
  számít, és az ütemezés a másnapi ismétléssel bünteti. Enélkül a körön belüli
  ismétlés „kijavítaná" a hibát, és a kártya hetekre eltűnne.
- A haladásjelző szegmensei ezért pirosra váltanak és úgy is maradnak — a kör végén
  látszik, hol volt bizonytalanság.

Megvalósítás: [[gyakorlokor-modul]].
