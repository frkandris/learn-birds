---
type: Concept
title: Ismétlési modell
description: Hat lépcsős, szint alapú ütemezés (1/3/7/16/35/90 nap) kétértékű válasszal; a hiba nullázza a szintet, a kör pedig addig tart, amíg minden madár sikerül.
tags: [spaced-repetition, learning, scheduling]
status: stable
generated: { by: claude-opus-5/claude-code, at: 2026-09-21T09:00:00Z }
resource: public/srs.js
---

# Ismétlési modell

*Nem SM-2: szint alapú lépcsősor, mert a kétgombos értékeléshez nincs szükség
könnyűség-faktorra.*

## A lépcsők

| Szint | Következő ismétlés |
|---|---|
| 0 | 1 nap |
| 1 | 3 nap |
| 2 | 7 nap |
| 3 | 16 nap |
| 4 | 35 nap |
| 5–6 | 90 nap |

Elsőre eltalált kártya: szint +1 (legfeljebb `MAX_LEVEL` = 6). Bármilyen hiba:
szint 0, és holnap újra. A `lapses` számláló gyűjti a visszaeséseket, jelenleg csak
diagnosztikai célra.

## Két időskála

A modellnek két, egymástól független ritmusa van, és ezt könnyű összekeverni:

1. **A körön belül** minden madár addig jár vissza, amíg egyszer sikerül — ez
   ugyanannak a napnak a munkája ([[2026-09-18-hibas-kartya-a-pakli-vegere]]).
2. **A napok között** a fenti lépcsősor dönt. A körön belüli ismétlés *nem* javítja
   a szintet: aki másodszorra találta el, az `clean: false` jelzéssel zárul, tehát
   holnap visszajön.

## A napi pakli

`pickSession()` sorrendje: esedékes ismétlések a legrégebben esedékessel kezdve →
tanulatlan fajok → a napi adag (3/5/8/12, alapból 3) felső határáig. A pakli
módonként külön áll össze, és csak azokat a fajokat veszi, amikhez a mód médiája
megvan (`usableIn()`). Ha mára minden faj pihen,
a soron következő esedékességek jönnek elő, előrehozva — a szabadgyakorlás nem
tiltott, de a szintet ilyenkor is lépteti.

## Tárolás

`localStorage`, `learn-birds/v1` kulcs:

```json
{ "version": 1, "dose": 3,
  "cards": { "kek-cinege|image": { "level": 1, "due": "2026-09-24", "seen": 1, "lapses": 0 } },
  "days":  { "2026-09-21": { "cards": 5, "clean": 3 } } }
```

A `days` a sorozatszámításhoz és a napi statisztikához kell. A dátumok helyi
naptári napok (`YYYY-MM-DD`), nem időbélyegek — így az esedékesség éjfélkor vált,
nem 24 órával az előző válasz után.

Kapcsolódó: [[harom-mod-harom-pakli]], [[tanulasi-allapot]].
