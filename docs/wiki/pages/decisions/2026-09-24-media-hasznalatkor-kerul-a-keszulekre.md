---
type: Decision
title: A média használatkor kerül a készülékre
description: A worker telepítéskor már nem tölti le a teljes, ~15 MB-os médiakészletet — a gyakorlás a kör fájljait tölti elő, és ami egyszer előkerült, az offline is megvan.
tags: [decision, offline, service-worker, cost]
status: stable
generated: { by: claude-opus-5.5/claude-code, at: 2026-09-24T18:00:00Z }
---

# A média használatkor kerül a készülékre

*Nem minden a telepítéskor, hanem ami kell, akkor, amikor kell.*

## Kontextus

2026-09-18 óta a service worker telepítéskor letöltötte mind a 108 fotót és
felvételt, hogy a gyakorlás az első naptól térerő nélkül menjen. A codex review
(2026-09-24) ezt pazarlásnak jelölte: az első megnyitás mobilneten ~19 MB volt
(a 64 kbit/s-os hangokkal ~15 MB), akkor is, ha a felhasználó csak ránéz az
appra, vagy naponta csak három kártyát forgat.

## Döntés

A felhasználó döntése (2026-09-24): **ne töltse le**.

- Telepítéskor csak az app, az ikonok és a betűk kerülnek be (23 fájl).
- Gyakorlás indításakor az app előtölti a kör fájljait (`Round.files()`), a
  worker elteszi őket; minden más médiakérés is bekerül első letöltéskor.
- A Fajok nézet alja megmondja, hány fájl van már a készüléken.

## Következmények

- A napi rutin offline is megy: az esedékes ismétlések olyan fajok, amelyek már
  bekerültek egy körbe, tehát a fájljaik a készüléken vannak.
- **Egy vadonatúj faj első köre offline nem megy** (törött kép, néma hang) — az
  első találkozáshoz térerő kell. Az előtöltés miatt elég, ha a kör *indításakor*
  van térerő.
- Egy körön belül a fajhoz véletlenszerűen választott fotó és hang kerül elő;
  a faj másik fotója csak akkor jön le, ha előkerül.

## Elvetett alternatívák

- **Minden a telepítéskor** (ami volt): egyszerű, de mindenkinek ~15 MB.
- **„Letöltés offline használatra" gomb**: a teljes készletet kérésre hozná le.
  Nem kellett; ha egyszer igény lesz rá, a worker `MEDIA` gyorsítótára és a
  hash-es nevek mellett néhány sor ([[offline-gyorsitotar]]).

Kapcsolódó: [[2026-09-24-tartalomhash-es-mediafajlnevek]].
