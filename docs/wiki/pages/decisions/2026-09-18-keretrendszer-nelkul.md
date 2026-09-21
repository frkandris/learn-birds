---
type: Decision
title: Keretrendszer és build lépés nélkül
description: Natív ES-modulok, nulla függőség és nulla build — a projekt mérete nem indokol bundlert, cserébe a telepítés és a hosszú távú karbantartás triviális.
tags: [decision, architecture, tooling]
status: stable
generated: { by: claude-opus-5/claude-code, at: 2026-09-21T09:00:00Z }
---

# Keretrendszer és build lépés nélkül

*Se React, se Vite, se csomagfüggőség: a böngésző natív ES-modulokat tölt, az npm
csak scripteket futtat.*

## Kontextus

Az app három nézetből és egy kártya-overlayből áll, ~1000 sor JS. A tanulási állapot
egyetlen `localStorage` kulcs.

## Döntés

Vanilla JS ES-modulokkal, `public/` mint dokumentumgyökér, `package.json`
`dependencies` nélkül.

## Miért

- **A méret nem indokolja.** Egy reaktív állapotkezelő itt több fogalmat hozna, mint
  amennyit megspórol: a renderelés négy függvény, és mindegyik teljes nézetet rajzol.
- **A build lépés hosszú távú adósság.** Egy hobbiprojektet fél év múlva a
  legnagyobb eséllyel az avult toolchain akaszt meg, nem a kód. Így viszont a
  `public/` mappa bármikor kiszolgálható bármivel.
- **A tesztelhetőséget nem a keretrendszer adja**, hanem a rétegezés: a szabályok
  DOM-mentes modulokban vannak ([[gyakorlokor-modul]], [[tanulasi-allapot]]), és
  Node beépített tesztfutójával tesztelhetők, függőség nélkül.

## Következmények

- A CSS kézzel írt, és van benne néhány specificitási csapda; a `styles.css`
  szakaszokra van bontva, hogy ez kordában maradjon.
- Nincs típusellenőrzés. A kockázatos logikát tesztek fedik, a DOM-kezelést nem.
- Új modult a service worker `CORE` listájába kézzel kell felvenni
  ([[offline-gyorsitotar]]).
- A nyelvi eszköztár szűkebb (nincs JSX, nincs import alias), de a böngészőben futó
  kód pontosan az, ami a repóban van — a hibakeresés ezzel egyszerűbb.
