---
type: Subsystem
title: Hanglejátszás és szonogram (audio.js)
description: A Player osztály egy <audio> elemet és egy Web Audio elemzőt köt össze, és képkockánként rajzolja a futó szonogramot.
tags: [module, audio, canvas, web-audio]
status: stable
generated: { by: claude-opus-5/claude-code, at: 2026-09-21T09:00:00Z }
resource: public/audio.js
---

# Hanglejátszás és szonogram (audio.js)

*A projekt legtöbb finomhangolást igénylő része — három hibából tanulta meg a
jelenlegi alakját.*

## Felület

```js
const player = new Player(audioElement, canvas);
player.onChange(fn);   // 'play' | 'pause' | 'ended'
player.unlock();       // felhasználói gesztusból: AudioContext indítása
player.load(url);      // új felvétel, rajz törlése
player.toggle();       // lejátszás/szünet
player.stop(); player.clear();
```

## A rajzolás

- `AnalyserNode`, `fftSize: 2048`, `smoothingTimeConstant: 0.55`.
- Képsoronként egy frekvenciasáv, logaritmikusan 550 Hz → 9 kHz; a sáv-index
  előre kiszámolt (`binForY`), hogy a képkockánkénti hurok olcsó maradjon.
- A küszöb frekvenciafüggő: lefelé haladva egyre többet vág le az alapzajból
  ([[frekvenciafuggo-szonogram-kuszob]]).
- Az írótoll a `currentTime`-ból számolt x-en halad. **Csak előre**: a lejátszási
  idő képkockánként vissza is léphet, ezért csak 20 pixelnél nagyobb visszalépés
  számít visszatekerésnek és törli a vásznat.

## Amire figyelni kell

- `createMediaElementSource()` egy elemre **egyszer** hívható; a `#connect()` ezért
  őrzi az `analyser`-t, és kivétel esetén szonogram nélküli, sima lejátszásra esik
  vissza.
- `prefers-reduced-motion` esetén nincs elemző és nincs rajz — a hang megy.
- A `requestAnimationFrame` háttérlapon nem fut; ez nem hiba, csak a tesztelést
  nehezíti ([[2026-09-18-hatterlapon-nem-fut-a-rajzolas]]).

Olvasat: [[szonogram-olvasas]].
