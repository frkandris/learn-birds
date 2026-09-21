---
type: Post-mortem
title: Néma lejátszás felfüggesztett AudioContext miatt
description: A hang „elindult", de a readyState 0 maradt: a Web Audio elemző felfüggesztett állapotban megállítja a rá kötött <audio> elem lejátszását.
tags: [audio, web-audio, ios, post-mortem]
status: stable
generated: { by: claude-opus-5/claude-code, at: 2026-09-21T09:00:00Z }
resource: public/audio.js
---

# Néma lejátszás felfüggesztett AudioContext miatt

*2026-09-18. A leghosszabb hibakeresés a projektben: a tünet egy másik hibára
mutatott, mint az ok.*

## Tünet

A kártya betöltődött, a gomb „lejátszás" állapotba váltott (tehát a `play` esemény
lefutott), de nem szólt semmi, és a szonogram üres maradt:

```
{ paused: false, currentTime: 0, duration: null, readyState: 0 }
```

A `paused: false` azt mondja, a lejátszás elindult; a `readyState: 0` azt, hogy a
böngésző még egy bájt médiaadatot sem dolgozott fel.

## Zsákutca

Az első gyanú a fájlformátum volt, és részben jogosan: a `readyState: 0` tipikusan
nem streamelhető MP4-et jelent. Ez a szál valódi hibát talált
([[faststart-aac]]) — de a javítás után a tünet megmaradt, miközben egy frissen
létrehozott `new Audio(...)` ugyanarra a fájlra hibátlanul betöltött
(`loadedmetadata`, `duration: 22`).

Ez volt a döntő különbség: a friss elem működött, az appé nem. Tehát nem a fájllal
volt baj, hanem azzal, ami az app `<audio>` elemére volt kötve.

## Gyökérok

A `Player` egy `MediaElementAudioSourceNode`-on keresztül vezeti a hangot, hogy a
szonogramot rajzolhassa. A csomópontot a `toggle()` hozta létre, ami az
automatikus lejátszás miatt `setTimeout`-ból futott — **tehát nem felhasználói
gesztusból**. Az így létrejött `AudioContext` `suspended` állapotban marad, a
`resume()` ígérete pedig gesztus nélkül nem teljesül.

Amíg a hangkörnyezet alszik, a rá kötött elem nem húz adatot: a lejátszás
formálisan elindul, de nem halad.

## Javítás

`player.unlock()`: a hangkörnyezet létrehozása és felébresztése a **gombnyomás
kezelőjében** történik, még a `startSession()` elején. A `toggle()` nem vár a
`resume()` ígéretére, csak elindítja.

```js
unlock() {
  this.#connect();
  if (this.audioCtx?.state === 'suspended') this.audioCtx.resume().catch(() => {});
}
```

## Tanulság

- **A `paused: false` nem jelent lejátszást.** A médiaelem állapota (`readyState`,
  `currentTime` haladása) mond igazat, nem az esemény.
- Ha egy elem Web Audio gráfra van kötve, **a hangkörnyezet állapota része a
  lejátszási láncnak**. Gesztus-kötött API-t gesztusban kell inicializálni, még
  akkor is, ha a tényleges lejátszás később indul.
- A „friss objektum vs. a mi objektumunk" összehasonlítás a leggyorsabb módja
  szétválasztani az adat- és az állapothibát.
