---
type: Hack
title: PWA-ikonok sips-szel, külső eszköz nélkül
description: A macOS beépített `sips` parancsa SVG-t is renderel PNG-be, így az ikonkészlet függőség nélkül generálható a scripts/icon.svg-ből.
tags: [icons, macos, build, pwa]
status: stable
generated: { by: claude-opus-5/claude-code, at: 2026-09-21T09:00:00Z }
resource: scripts/make-icons.mjs
---

# PWA-ikonok sips-szel, külső eszköz nélkül

*A projektnek nincs csomagfüggősége; az ikonokhoz sem lett.*

## A parancs

```sh
sips -s format png -Z 512 scripts/icon.svg --out public/icons/icon-512.png
```

A `-Z` a hosszabbik oldalt skálázza. A `npm run icons` ezt futtatja négy méretben:
192, 512, 180 (`apple-touch-icon`) és egy 512-es maskable változat.

## A maskable változat

Az Android körbevágja az ikont, ezért a motívumnak a belső ~70%-ban kell maradnia. A
`scripts/icon-maskable.svg` ugyanazt a rajzot tartalmazza egy skálázó csoportban:

```xml
<g transform="translate(76,76) scale(0.703)"> … </g>
```

## Korlátok

- **Csak macOS**: a `sips` rendszereszköz. Linuxon `rsvg-convert` vagy `resvg` az
  egyenértékű; a `make-icons.mjs` ezt nem kezeli, mert a projekt egy gépen épül.
- Az `ffmpeg` nem alternatíva: a Homebrew-s build nem tartalmaz SVG-dekódert (és a
  `drawtext` szűrőt sem — ez a kontaktlapok készítésénél derült ki,
  [[2026-09-18-tojasfoto-a-wikidatabol]]).
- Az ikonok a repóban verziózva vannak, tehát a generálás csak az `icon.svg`
  módosításakor szükséges.
