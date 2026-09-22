---
type: Post-mortem
title: Két faj hang nélkül maradt az Ogg MIME-típus miatt
description: A Commons az application/ogg típust adja a régi felvételekre, amit az audio/ előtagra szűrő feltétel csendben eldobott — a hiányt csak a begyűjtés összesítője mutatta.
tags: [wikimedia, audio, data-quality, post-mortem]
status: stable
generated: { by: claude-opus-5/claude-code, at: 2026-09-22T09:00:00Z }
resource: scripts/fetch-birds.mjs
---

# Két faj hang nélkül maradt az Ogg MIME-típus miatt

*2026-09-22, a 27 fajra bővítéskor: a barátcinegének és a molnárfecskének nem lett
hangja, pedig a Commonson mindkettőé megvan.*

## Tünet

A begyűjtés végén két figyelmeztetés:

```
⚠︎ nincs hang: barátcinege
⚠︎ nincs hang: molnárfecske
```

A Commonson viszont ott van a `File:Poecile palustris.ogg` és a
`File:Delichon urbicum contact call.ogg`, és a keresés meg is találta őket — a
fájlnév-szűrőn is átmentek.

## Gyökérok

A kiválasztás a MIME-típusra szűrt:

```js
if (!file?.mime?.startsWith('audio/')) continue;   // csendben
```

A Commons a régebbi Ogg-felvételeket **`application/ogg`** típussal adja vissza, nem
`audio/ogg`-gal. A feltétel ezért kidobta őket — és mivel a `continue` nem naplózott
semmit, a hiány csak a futás végi összesítőben látszott, ok nélkül.

## Javítás

1. A fájl fajtáját a MediaWiki `mediatype` mezője dönti el (`AUDIO`, `BITMAP`,
   `DRAWING`), nem a MIME-típus. Az `iiprop` mostantól ezt is kéri.
2. A csendes kihagyás hangos lett: minden eldobott jelölt naplózza az okát
   (`hang – nem hangfájl (VIDEO): …`).

## Tanulság

- **A csendes `continue` a legrosszabb hibakezelés.** A javítás értékének fele nem a
  `mediatype` használata, hanem az, hogy a következő ilyen eset azonnal látszik majd
  a kimeneten.
- A MIME-típus a Commonson nem megbízható fajtajelzés; a `mediatype` az, amit a
  MediaWiki maga is a besoroláshoz használ.
- A faj szintű összesítő (`⚠︎ nincs hang: …`) nélkül a hiány csak a telefonon, a
  gyakorlás közben derült volna ki — érdemes minden begyűjtésnek ilyen záró listát
  adnia.
