---
type: Subsystem
title: Tanulási állapot (srs.js)
description: Az ütemezés és a localStorage-ban tárolt állapot tiszta függvényei — a modul nem ismeri a DOM-ot, ezért Node-ból tesztelhető.
tags: [module, srs, storage]
status: stable
generated: { by: claude-opus-5/claude-code, at: 2026-09-21T09:00:00Z }
resource: public/srs.js
---

# Tanulási állapot (srs.js)

*Minden, ami eldönti, mikor lát viszont a felhasználó egy madarat.*

## Felület

| Függvény | Mit ad |
|---|---|
| `loadState()` / `saveState()` / `clearState()` | a `learn-birds/v1` kulcs kezelése, kivételtűrően |
| `pickSession(state, birds, mode, dose)` | a mai pakli fajai, sorrendben |
| `schedule(state, birdId, mode, clean, opts)` | lezár egy kártyát; `opts.reschedule: false` esetén (szabadgyakorlás) a szint és az esedékesség marad |
| `counts(state, birds, mode)` | `{due, fresh, learned, ready}` a Ma nézethez |
| `cardStatus(state, birdId, mode)` | `new` / `due` / `resting` + szint, a Fajok nézethez |
| `usableIn(bird, mode)` | van-e a fajnak a módhoz kellő médiája (kép, hang, vagy mindkettő) |
| `streak(state)` | hány napja gyakorol egyhuzamban |
| `today()`, `daysUntil(day)` | helyi naptári nap, nem időbélyeg |

## Amire figyelni kell

- **A tárolás hibatűrő.** Privát ablakban a `localStorage` dobhat; a `try/catch`
  ilyenkor üres állapottal indít, és a gyakorlás működik, csak nem marad meg.
- **Naptári napok, nem 24 óra.** `addDays()` a helyi `Date` konstruktorral számol,
  ami a nyári időszámítás váltását is normalizálja. Ne cseréld ms-alapú
  aritmetikára.
- **A `days` tömböt a `schedule()` írja**, nem a kör vége — így a félbehagyott kör
  kártyái is beleszámítanak a napi statisztikába és a sorozatba.
- **A séma verziózott** (`version: 1`), és a betöltés normalizál: sérült JSON, rossz
  típusú `cards`/`days` vagy értelmetlen `dose` esetén üres alapértékkel indul, nem
  száll el. Ha a kártya alakja változik, a migráció is ide kerül.

Modell: [[ismetlesi-modell]], [[harom-mod-harom-pakli]]. Tesztek:
[[teszteles-es-ci]].
