---
type: Decision
title: Tartalomhash-es médiafájlnevek
description: A médiafájl neve a tartalma hash-ét hordozza, így egy név alatt sosem változik — a gyorsítótár-verzió bélyege megszűnt, és egy faj cseréje csak annak a fajnak a fájljait tölti le újra.
tags: [decision, caching, service-worker, media]
status: stable
generated: { by: claude-opus-5.5/claude-code, at: 2026-09-24T17:00:00Z }
---

# Tartalomhash-es médiafájlnevek

*`tengelic-1.jpg` helyett `tengelic-1.3fa9c2d1.jpg`: az SHA-256 első nyolc
hexa jegye. Egy név, egy tartalom — örökre.*

## Kontextus

A médiafájlok neve a fajból és egy sorszámból állt, a tartalmuk viszont a
begyűjtés eredményétől függött. Ebből három egymás utáni hiba lett
([[2026-09-22-a-gyorsitotar-ket-csendes-hibaja]]): a cache-first worker a régi
tartalmat adta, a kézi verzióemelés elmaradt, majd a médiabélyeg mellett a
böngésző HTTP-gyorsítótára adta vissza a régi fájlt. Mindegyik javítás egy újabb
réteget rakott a tünetre.

A bélyeges megoldásnak ára is volt (codex review, 2026-09-24): egyetlen faj
részleges begyűjtése is új bélyeget kapott, így **minden kliens mind a 108 fájlt**
(~19 MB) újratöltötte.

## Döntés

- A `fetch-birds.mjs` a fájlt a tartalma alapján nevezi el (`finalize()`).
- A service worker két gyorsítótárat tart: a verziózott `madarak-v6` az app
  kódjának, ikonjainak és betűinek, a verziózatlan `madarak-media` a médiának.
  Ez utóbbi a `birds.json`-t követi — telepítéskor és minden sikeresen
  letöltött `birds.json` után (`adoptList()`): a hiányzót letölti, a
  feleslegeset törli.
- Az nginx a hash-es médiát `max-age=31536000, immutable` fejléccel adja.
- A `MEDIA_STAMP` és a `sw.js`-t átíró lépés megszűnt.

## Következmények

- A régi tartalom visszatérése szerkezetileg kizárt: új tartalom = új név.
- Egy faj cseréje csak az ő 2–4 fájlját tölti le; a worker cseréje sem kell
  hozzá, mert a friss `birds.json` elindítja a szinkront.
- A `test/media.test.mjs` őrzi a szerződést: minden hivatkozott fájl neve a
  tartalma hash-ét hordozza, és nincs gazdátlan fájl a `public/media` alatt.
- Egyszeri ár: az átálláskor minden telepített kliens egyszer újratölti a
  médiát (a nevek megváltoztak).

## Elvetett alternatívák

- **Bélyeg a gyorsítótár nevében** (ami volt): működik, de minden változás
  mindent érvénytelenít, és a HTTP-gyorsítótárral külön kell bánni.
- **`?v=hash` lekérdezés-paraméter**: a worker `ignoreSearch`-csel keres, és a
  fájl a lemezen ugyanazon a néven maradna — a hiba visszacsúszhatna.

Kapcsolódó: [[offline-gyorsitotar]], [[media-begyujto]].
