---
type: Decision
title: Harmadik mód és huszonhét faj
description: A csak kép mód külön kártyatípusként került be (nem a kettős mód szűkítéseként), és a pakli 27 fajra nőtt — ezért lett a napi adag alapértéke 3.
tags: [decision, modes, content, ux]
status: stable
generated: { by: claude-opus-5/claude-code, at: 2026-09-22T09:00:00Z }
---

# Harmadik mód és huszonhét faj

*2026-09-22: a kért három gyakorlómód és a 27 fajos pakli együtt érkezett, és a
kettő összefügg.*

## Kontextus

Az induló verzióban két mód volt (kép+hang, csak hang) és hat faj. A kérés: három
mód — csak kép, csak hang, kép és hang — és 27 gyakori magyar faj.

## Döntés 1: a harmadik mód önálló kártyatípus

`image`, `sound` és `both` három külön kártya fajonként, három külön ütemtervvel
([[harom-mod-harom-pakli]]).

**Miért nem a kettős mód szűkítése:** kézenfekvő lett volna a `both` kártyát
használni, és csak a megjelenítést változtatni. De akkor a „csak kép" gyakorlás
ugyanazt az ütemtervet léptetné, amit a könnyebb kettős mód — a nehezebb készség
eredménye elveszne a könnyebbében. Három kártya mellett mindegyik készség a saját
tempójában halad.

**Ára:** fajonként három kártya, 27 fajnál 81 — a Fajok nézet ezért három kompakt
pöttysort mutat fajonként, nem kettőt.

## Döntés 2: a napi adag alapértéke 3

A hatfajos paklinál az 5-ös adag egy kör alatt a fajok többségét érintette. 27 fajnál
és három módnál a napi 3 azt jelenti, hogy egy teljes nap legfeljebb 9 kártya — ez
néhány perc, és a lépcsők (1/3/7/16/35/90 nap) így is végigviszik a paklit.

Az adag továbbra is állítható (3/5/8/12), és csak az új telepítéseket érinti: a
mentett állapot megtartja a korábban választott értéket.

## Döntés 3: fajonként két kép, minősítettek előnyben

A hatfajos készletnél három kép volt fajonként. Huszonhét fajon átnézve kiderült,
hogy a **harmadik kép rendre gyenge**: távoli madár, üres ág, fészek — egyszerűen
elfogynak a jó jelöltek. A `MAX_IMAGES` ezért 2, és a jelöltek közül előre kerülnek
azok, amiket a Commons közössége minősített (`Quality images`, `Featured pictures`,
`Valued images`).

Ahol ez sem elég, ott kézi kizárás van (`skipFiles` a `scripts/birds.js`-ben): a
molnárfecske kategóriájában sarlósfecske-fotók ülnek, a csilpcsalpfüzikénél pedig
két olyan kép, amin a madár aprón látszik az ágak között.

## Következmények

- A média 6 fajról 27-re nőtt; a képek szélessége 1000 → 900 px, a darabszám 3 → 2,
  hogy az offline gyorsítótár mérete kezelhető maradjon ([[offline-gyorsitotar]]).
- A `usableIn()` vált a médiaigény egyetlen forrásává; a `pickSession()` és a
  `counts()` is ezt hívja ([[tanulasi-allapot]]).
- A korábbi `<faj>|both` kártyák érintetlenül megmaradtak — a döntés nem igényelt
  adatmigrációt.
- A begyűjtés kapott részleges futást (`node scripts/fetch-birds.mjs <id>…`), mert
  27 fajnál egy rossz kép miatt nem érdemes az egészet újraszedni
  ([[media-begyujto]]).
