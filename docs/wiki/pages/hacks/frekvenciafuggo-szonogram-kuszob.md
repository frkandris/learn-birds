---
type: Hack
title: Frekvenciafüggő zajküszöb a szonogramon
description: A terepi felvételek alapzaja a mély tartományban a legerősebb, ezért a rajz küszöbe lefelé haladva nő — így a madár kiemelkedik, a zaj eltűnik.
tags: [audio, canvas, signal-processing]
status: stable
generated: { by: claude-opus-5/claude-code, at: 2026-09-21T09:00:00Z }
resource: public/audio.js
---

# Frekvenciafüggő zajküszöb a szonogramon

*Három nekifutás kellett, hogy a rajzon a madár látsszon, ne a szél.*

## A probléma

Terepi felvételeken az alapzaj (szél, forgalom, lomb) széles sávú, és a mély
tartományban a legerősebb. Fix küszöbbel két rossz végállapot van: vagy az alsó
harmad egybefüggő sárga folt, vagy a madár halkabb szótagjai is eltűnnek.

## Ami nem vált be

| Próba | Miért nem |
|---|---|
| Fix küszöb + gamma | A zajszint frekvenciafüggő, egyetlen szám nem fedi le. |
| Képkockánkénti adaptív küszöb (a pillanatnyi csúcshoz mérve) | Csendes szakaszokban a zaj lett a „csúcs", és teljes erővel kirajzolódott — az eredmény zajosabb lett, mint előtte. |

## Ami bevált

Előre kiszámolt, képsoronkénti küszöb, ami lefelé haladva nő:

```js
cutForY[y] = 0.3 + 0.34 * (y / height);   // felül 0.30, alul 0.64
const v = Math.pow(Math.max(0, (bins[binForY[y]] / 255 - cut) / (1 - cut)), 1.2);
if (v < 0.04) continue;
```

A `binForY` és a `cutForY` tömb a hurkon kívül készül, így képkockánként csak egy
szorzás és egy hatványozás marad soronként.

A szín is a jelerősséghez kötött: halvány kék → cinegesárga → csontfehér, az
átlátszóság `0.2 + 0.8 * v` — a gyenge jel beleolvad a háttérbe ahelyett, hogy
kirajzolódna.

## Egy másik csapda ugyanitt

Az írótoll x-pozíciója a `currentTime`-ból jön, ami képkockánként **vissza is
léphet** (a lejátszási idő a hangkártya pozíciójából becsült). Az első változat
minden visszalépést visszatekerésnek vett, és törölte a vásznat — ezért mindig csak
egyetlen oszlop látszott. Javítás: csak 20 pixelnél nagyobb visszalépés töröl, és az
írótoll egyébként csak előre halad.
