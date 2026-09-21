---
type: Runbook
title: Telepítés iPhone-ra
description: Safari → Megosztás → Főképernyőhöz adás; HTTPS kell hozzá, a helyi hálózati cím nem elég, és a frissítés az ikonból indítva is megjön.
tags: [runbook, ios, pwa]
status: stable
generated: { by: claude-opus-5/claude-code, at: 2026-09-21T09:00:00Z }
---

# Telepítés iPhone-ra

## Lépések

1. Nyisd meg **Safariban** az éles címet (más böngésző nem tud főképernyőre tenni).
2. **Megosztás → Főképernyőhöz adás.**
3. Az ikon a `apple-touch-icon.png`-ből lesz, a név a `apple-mobile-web-app-title`
   metából: „Madarak".

Az így indított app teljes képernyős (`display: standalone`), a státuszsáv átlátszó
(`black-translucent`), és a `viewport-fit=cover` + `env(safe-area-inset-*)` miatt a
tartalom nem kerül a kivágás alá.

## Amit tudni kell

- **HTTPS kell.** A `npm start` LAN-címén (`http://192.168.x.x:5173`) az ikon
  kirakható, de service worker nem regisztrálódik, tehát nincs offline mód.
- **Az offline mód a telepítés után él**: az első megnyitáskor a worker letölti a
  médiát (~5,5 MB), utána repülőgép-módban is megy.
- **Frissítés**: az app kódja network-first, tehát online indításkor magától
  frissül; a régi média a gyorsítótárból marad ([[offline-gyorsitotar]]).
- A hang az első koppintásra indul — iOS csak felhasználói gesztusból engedi
  ([[2026-09-18-nema-lejatszas-felfuggesztett-audiocontext]]).
