---
type: Decision
title: Két gomb az értékelésre, nem négy
description: „Erre gondoltam" és „Nem erre gondoltam" — az önértékelés bináris, mert a felhasználó kérése is az volt, és a finomabb skála nem javítana az ütemezésen.
tags: [decision, ux, spaced-repetition]
status: stable
generated: { by: claude-opus-5/claude-code, at: 2026-09-21T09:00:00Z }
---

# Két gomb az értékelésre, nem négy

*Az Anki négyfokozatú skálája (Again / Hard / Good / Easy) helyett kétértékű válasz.*

## Kontextus

A kérés szó szerint: „ha kattintok megjelenik a helyes válasz, és meg kell mondanom,
hogy erre gondoltam-e". Ez bináris kérdés.

## Mérlegelt lehetőségek

| Lehetőség | Mérlegelés |
|---|---|
| Négy fokozat (SM-2) | Pontosabb ütemezés, de minden kártyánál egy „mennyire volt nehéz?" döntés, ami lassítja a kört; ráadásul a skála önértékelése köztudottan zajos. |
| Három fokozat (nem / bizonytalan / tudtam) | A középső fokozat használata egyéni és ingadozó; az ütemezésben nehéz értelmesen kezelni. |
| **Kettő** | Gyors, egyértelmű, és pontosan a feltett kérdésre válaszol. |

## Döntés

Két gomb, és a különbséget nem a fokozat, hanem a **körön belüli ismétlés** hordozza:
aki másodszorra találja el, az `clean: false`-szal zárul, tehát holnap visszajön
([[ismetlesi-modell]]).

## Következmények

- Az ütemezéshez nem kell könnyűség-faktor, így a modell hat lépcsőre egyszerűsödik.
- Nincs „könnyű" gomb, ami átugorhatna egy szintet — egy jól tudott faj is végigjárja
  a lépcsőket. Hat-tizenöt fajnál ez nem érezhető teher; nagyobb paklinál lehetne az.
- Billentyűzeten `1` = nem, `2` = igen, ami gyors gyakorlást enged asztali gépen.
