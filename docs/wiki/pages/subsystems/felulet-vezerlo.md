---
type: Subsystem
title: Felületvezérlő (app.js)
description: A három nézet renderelése, az eseménykezelés és a kör vezérlése — minden DOM-érintés itt van, modulszintű állapottal.
tags: [module, ui, dom]
status: stable
generated: { by: claude-opus-5/claude-code, at: 2026-09-21T09:00:00Z }
resource: public/app.js
---

# Felületvezérlő (app.js)

*Az egyetlen modul, ami a DOM-hoz nyúl; a szabályok máshol élnek.*

## Felépítés

| Szakasz | Mit csinál |
|---|---|
| `boot()` | betölti a `data/birds.json`-t, rendereli a nézeteket, regisztrálja a service workert |
| Ma | `renderToday()`, `renderDose()` — számlálók, napi adag, sorozat |
| Fajok | `renderBirds()`, `skillRow()` — fajonként két pöttysor, esedékességgel |
| Források | `renderSources()` — szerzők és licencek fajonként, linkkel a Commonsra |
| Gyakorlás | `startSession()`, `showCard()`, `reveal()`, `grade()`, `finishSession()` |
| `wire()` | gombok, fülek, billentyűk (`szóköz` felfed, `1`/`2` értékel, `Esc` kilép) |

## Modulszintű állapot

`birds` (a betöltött adat), `state` (tanulási állapot), `round` (az aktuális kör
vagy `null`), `revealed` (látszik-e már a válasz). Ennyi — nincs keretrendszer és
nincs reaktív állapotkezelés, a renderelés függvényhívásokból áll
([[2026-09-18-keretrendszer-nelkul]]).

## Amire figyelni kell

- **A lejátszás feloldása a gombnyomás gesztusában történik** (`player.unlock()` a
  `startSession()` elején). Ha ez kikerül, a hang némán elakad
  ([[2026-09-18-nema-lejatszas-felfuggesztett-audiocontext]]).
- **A service worker localhoston nem regisztrálódik**, hogy a fejlesztés alatt ne a
  gyorsítótárból jöjjön a kód ([[2026-09-18-regi-kod-a-gyorsitotarbol]]).
- **A `data/birds.json` betöltése hibatűrő**: ha nincs webszerver (pl. `file://`),
  a Ma nézet ezt írja ki, nem néma hibával áll meg.
- Új modulnak be kell kerülnie a service worker `CORE` listájába, különben offline
  hiányzik ([[offline-gyorsitotar]]).
