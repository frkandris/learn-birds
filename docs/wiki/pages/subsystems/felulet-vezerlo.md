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
| Ma | `renderToday()`, `renderDose()` — a három mód indítógombja, napi adag, sorozat |
| Fajok | `renderBirds()`, `skillRow()` — fajonként három pöttysor, esedékességgel. A sor `<details>`: koppintásra megnyílnak a faj fotói és felvételei (`fillDetail()`), forrással. Alul az offline jelzés, a forrásmegjelölés és a haladás törlése |
| Gyakorlás | `startSession()`, `showCard()`, `reveal()`, `grade()`, `finishSession()` |
| `wire()` | gombok, fülek, billentyűk (`szóköz` felfed, `1`/`2` értékel, `Esc` kilép) |

## Modulszintű állapot

`birds` (a betöltött adat), `state` (tanulási állapot), `round` (az aktuális kör
vagy `null`), `revealed` (látszik-e már a válasz), `freePractice` (nem esedékes
kártyákat forgatunk-e), `autoPlay` (a hang időzítője, kártyaváltáskor törlendő). Ennyi — nincs keretrendszer és
nincs reaktív állapotkezelés, a renderelés függvényhívásokból áll
([[2026-09-18-keretrendszer-nelkul]]).

## Amire figyelni kell

- **A lejátszás feloldása a gombnyomás gesztusában történik** (`player.unlock()` a
  `startSession()` elején). Ha ez kikerül, a hang némán elakad
  ([[2026-09-18-nema-lejatszas-felfuggesztett-audiocontext]]).
- **A service worker localhoston nem regisztrálódik**, hogy a fejlesztés alatt ne a
  gyorsítótárból jöjjön a kód ([[2026-09-18-regi-kod-a-gyorsitotarbol]]).
- **A `data/birds.json` betöltése hibatűrő**: HTTP-státuszt és sémát is ellenőriz, és
  hiba esetén a Ma nézet ezt írja ki, nem néma hibával áll meg.
- **A színek és a méretek mérve vannak, nem szemre hangolva**: a szövegszintek és a
  tapintható célpontok szabálya a [[2026-09-22-akadalymentessegi-alapszint]] oldalon.
- **A faj-részletek lustán épülnek**: a panel tartalmát a `toggle` esemény hozza
  létre, egyszer. 27 fajra előre legyártva fölösleges DOM és kérés lenne; a natív
  `<audio controls preload="none">` pedig csak lejátszáskor tölt.
- **A Ma nézet szándékosan szűkszavú**: cím, a három indítógomb, a napi adag, és a
  sorozat is csak akkor, ha már van. Dátum, összegző mondat és külön Források fül
  nem volt hasznos, ezért 2026-09-22-én kikerült.
- Új modulnak be kell kerülnie a service worker `CORE` listájába, különben offline
  hiányzik ([[offline-gyorsitotar]]).
