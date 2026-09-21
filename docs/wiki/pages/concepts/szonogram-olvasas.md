---
type: Concept
title: Mit mutat a szonogram
description: A hang-mód futó szonogramja a ritmust és a hangmagasságot mutatja, a fajt viszont a fülnek kell eldöntenie — ezért van a rajz a válasz előtt is.
tags: [audio, spectrogram, learning]
status: stable
generated: { by: claude-opus-5/claude-code, at: 2026-09-21T09:00:00Z }
resource: public/audio.js
---

# Mit mutat a szonogram

*A madarászok szonogramról olvassák a hangot; a kártyán ugyanaz fut, amíg szól a
felvétel.*

## A rajz olvasata

- **Vízszintes tengely: idő.** Az írótoll balról jobbra halad a felvétel hosszához
  igazítva; a halvány függőleges vonal a pillanatnyi hely.
- **Függőleges tengely: hangmagasság**, logaritmikusan 550 Hz-től 9 kHz-ig. Ebbe a
  sávba esik a magyar énekesmadarak hangjának java; a gerle búgása az alsó szélen ül.
- **Szín: erősség.** Halvány kék a gyenge, cinegesárga az erős, csontfehér a csúcs.

## Miért nem árulja el a fajt

Kérdés volt, hogy a szonogram nem teszi-e triviálissá a hang-módot. A gyakorlatban
nem: a rajzból a *ritmus* és a hangterjedelem olvasható ki (hány szótag, emelkedik
vagy ereszkedik), a fajra jellemző hangszín nem. Aki nem ismeri fel füllel, annak a
rajz sem mondja meg — viszont segít fókuszálni arra, mit érdemes hallgatni.

A felfedés után a rajz eltűnik, és a fotó veszi át a helyét: a megerősítés a
hang és a madár képének összekapcsolása.

## Ami mögötte van

A rajz élő Web Audio elemzésből készül, nem előre renderelt kép. Ennek két
következménye van: a hangkörnyezetet fel kell oldani a lejátszás előtt
([[2026-09-18-nema-lejatszas-felfuggesztett-audiocontext]]), és a zajszűrés
frekvenciafüggő küszöbbel történik ([[frekvenciafuggo-szonogram-kuszob]]).

Kapcsolódó: [[hanglejatszas-es-szonogram]].
