---
type: Architecture
title: Rendszerkép
description: Build-időben begyűjtött média, statikus fájlok nginx mögött, és minden tanulási állapot a böngészőben — nincs szerveroldali logika.
tags: [architecture, pwa, static]
status: stable
generated: { by: claude-opus-5/claude-code, at: 2026-09-21T09:00:00Z }
sources:
  - { id: commit-init, resource: "git:1ecbb61", title: "Madárhatározó tanulókártyák: PWA spaced repetitionnel" }
---

# Rendszerkép

*A projektnek nincs futásidejű backendje: a média begyűjtése build-idejű lépés, a
kiszolgálás statikus, a tanulási állapot a felhasználó böngészőjében marad.*

## Három réteg

| Réteg | Mikor fut | Mi történik |
|---|---|---|
| Begyűjtés | kézzel, `npm run fetch` | Wikidata + Commons → `public/media/` + `public/data/birds.json` ([[media-begyujto]]) |
| Kiszolgálás | minden kérésnél | nginx a `public/` mappán, Docker-image-ből ([[deploy-es-visszaallitas]]) |
| Gyakorlás | a böngészőben | ES-modulok, `localStorage`, service worker ([[offline-gyorsitotar]]) |

A rétegek között a `public/data/birds.json` a szerződés: fajonként név, tudományos
név, és a képek/hangok listája szerzővel és licenccel. Az app ezen kívül semmilyen
hálózati hívást nem tesz.

## Modulok

```
public/
  index.html     — a három nézet (Ma, Fajok, Források) + a gyakorlás overlay váza
  app.js         — nézetek renderelése, események, a kör vezérlése   [[felulet-vezerlo]]
  round.js       — a gyakorlókör szabályai, DOM nélkül               [[gyakorlokor-modul]]
  srs.js         — ütemezés és tanulási állapot                      [[tanulasi-allapot]]
  audio.js       — lejátszás és futó szonogram                       [[hanglejatszas-es-szonogram]]
  sw.js          — offline gyorsítótár                               [[offline-gyorsitotar]]
```

A függőségek egyirányúak: `app.js → {round, srs, audio}`, és a három modul nem tud
egymásról. A `round.js` és az `srs.js` nem érinti a DOM-ot — ezért tesztelhető
Node-ból ([[teszteles-es-ci]]).

## Amit szándékosan nem tartalmaz

- **Backend, fiók, szinkron.** A haladás egy készüléken él (`learn-birds/v1` kulcs a
  `localStorage`-ban). Két készülék két külön tanulási előzmény — tudatos csere az
  üzemeltetés elkerüléséért ([[2026-09-18-keretrendszer-nelkul]]).
- **Build lépés.** Nincs bundler; a böngésző natív ES-modulokat tölt. A `npm` csak
  scripteket futtat, függősége nincs.
- **Futásidejű Commons-hívás.** A média a repóban van, így offline is megy, és a
  Commons nem lesz üzemidő-kockázat ([[wikimedia-commons]]).

Egy kártya teljes útját a [[vegigvezetett-pelda]] írja le.
