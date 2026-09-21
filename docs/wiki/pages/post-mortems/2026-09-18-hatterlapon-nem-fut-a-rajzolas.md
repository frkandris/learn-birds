---
type: Post-mortem
title: Háttérlapon nem fut a szonogram rajzolása
description: A hibásnak hitt rajzoló hurok valójában jó volt — a böngésző a nem látható lapon felfüggeszti a requestAnimationFrame hívásokat, ami tesztelési, nem alkalmazásbeli hiba.
tags: [canvas, testing, post-mortem, browser]
status: stable
generated: { by: claude-opus-5/claude-code, at: 2026-09-21T09:00:00Z }
resource: public/audio.js
---

# Háttérlapon nem fut a szonogram rajzolása

*2026-09-18. Egy órát vitt el egy hiba, ami nem létezett.*

## Tünet

A szonogram vászna üres maradt, egyetlen oszlopot leszámítva az írótoll helyén. A
küszöb, a színskála és a görgetés átírása után is ugyanaz — a rajz mindig csak egy
képkockányi nyomot mutatott.

## Gyökérok

Az automatizált böngészőben a vizsgált lap **nem volt látható**
(`document.visibilityState === "hidden"`). A böngésző ilyenkor nem hívja a
`requestAnimationFrame` visszahívásait, tehát a rajzoló hurok nem futott. A
képernyőkép készítésekor a lap egy pillanatra előtérbe került, egy-két képkocka
lefutott — ez volt az egyetlen látható oszlop.

A bizonyíték: `player.raf === 1`, azaz a rAF-azonosító a legelső hívásnál maradt, és
a hurokba tett számláló `undefined` maradt.

## Javítás

Az alkalmazáson semmi. A vizuális ellenőrzéshez a rajzoló logikát `setInterval`-lal
hajtottam végig a konzolból, ugyanazokkal a paraméterekkel — így derült ki, hogy a
kép tartalma jó, csak a zajküszöb szorul hangolásra
([[frekvenciafuggo-szonogram-kuszob]]).

## Tanulság

- **Az automatizált böngésző lapja rendszerint nem látható.** Minden, ami
  `requestAnimationFrame`-re, `IntersectionObserver`-re vagy az oldal
  láthatóságára épül, ott másképp viselkedik, mint a felhasználónál.
- Mielőtt a kódot hibáztatod, mérd meg, hogy a kód **egyáltalán fut-e**: egy
  számláló a hurokban gyorsabb válasz, mint a harmadik átírás.
- A `document.hidden` két másodperc alatt lekérdezhető, és ez a session
  leghasznosabb két másodperce volt.
