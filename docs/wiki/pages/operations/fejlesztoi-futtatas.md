---
type: Runbook
title: Fejlesztői futtatás és ellenőrzés
description: npm start a helyi kiszolgálóhoz, npm test a logikához, és a böngészős füstteszt lépései a felülethez.
tags: [runbook, development, testing]
status: stable
generated: { by: claude-opus-5/claude-code, at: 2026-09-21T09:00:00Z }
---

# Fejlesztői futtatás és ellenőrzés

## Indítás

```sh
npm start        # http://localhost:5173, és kiírja a LAN-címet is
npm test         # logikai tesztek + wiki-lint
```

A kiszolgáló a `public/` mappát adja, kezeli a `Range` kéréseket, és `no-cache`
fejlécet küld. Nincs figyelő/újratöltő mechanizmus: mentés után elég frissíteni.

**Localhoston a service worker nem regisztrálódik**, tehát a kód mindig a lemezről
jön ([[2026-09-18-regi-kod-a-gyorsitotarbol]]). Ha korábban mégis beragadt egy
worker:

```js
for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
for (const k of await caches.keys()) await caches.delete(k);
```

## Füstteszt a böngészőben

A kör működését a konzolból végig lehet kattintani, ha a felületen is ellenőrizni
kell egy változást:

```js
localStorage.removeItem('learn-birds/v1'); location.reload();
// majd:
document.getElementById('start-both').click();
while (document.getElementById('done').hidden) {
  document.getElementById('reveal').click();
  document.getElementById('grade-good').click();   // vagy grade-again
  await new Promise(r => setTimeout(r, 120));
}
JSON.parse(localStorage.getItem('learn-birds/v1')).cards
```

Amit érdemes nézni: a lépések sorrendje, az összegzés számai, és hogy a `cards`
szintjei/esedékességei a várt lépcsőt követik-e ([[ismetlesi-modell]]).

## Ami a böngészőben nem mérhető megbízhatóan

- **A szonogram rajzolása**, ha a lap nem látható
  ([[2026-09-18-hatterlapon-nem-fut-a-rajzolas]]).
- **Az offline mód**, mert localhoston nincs worker — ezt az éles címen kell
  ellenőrizni ([[deploy-es-visszaallitas]]).
