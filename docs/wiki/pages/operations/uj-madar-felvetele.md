---
type: Runbook
title: Új madár felvétele
description: Egy sor a scripts/birds.js-be, npm run fetch, a képek vizuális ellenőrzése kontaktlapon, majd commit — a média a repóban verziózva él.
tags: [runbook, content, wikimedia]
status: stable
generated: { by: claude-opus-5/claude-code, at: 2026-09-21T09:00:00Z }
resource: scripts/birds.js
---

# Új madár felvétele

## 1. A lista bővítése

`scripts/birds.js`:

```js
{ id: 'hazi-vereb', hu: 'házi veréb', taxon: 'Passer domesticus', wikiHu: 'Házi veréb' },
```

Az `id` a médiafájlok neve is lesz, tehát ékezet nélküli kebab-case.

## 2. Begyűjtés

```sh
npm run fetch
```

Fajonként legfeljebb 2 fotó és 2 hang. A kimenet felsorolja, mit választott és mit
hagyott ki (`kép – kihagyva (Category:…)`). A script **mindent újraszed**, a meglévő
`public/media/` törlődik — ez szándékos, hogy a készlet reprodukálható legyen.
Egyetlen fajhoz elég a részleges futás:

```sh
node scripts/fetch-birds.mjs hazi-vereb
```

## 3. Vizuális ellenőrzés (kötelező lépés)

A Commons kategóriái zajosak; volt már tojásfotó fajkép helyett
([[2026-09-18-tojasfoto-a-wikidatabol]]). Kontaktlap az összes képből:

```sh
cd public/media && i=0
for f in *.jpg; do i=$((i+1)); ffmpeg -y -loglevel error -i "$f" \
  -vf "scale=300:225:force_original_aspect_ratio=increase,crop=300:225" "/tmp/thumbs/$(printf %02d $i).png"; done
ffmpeg -y -loglevel error -pattern_type glob -i "/tmp/thumbs/*.png" -filter_complex "tile=2x9:padding=4:color=white" /tmp/contact.png
```

A rács soronként egy fajt mutasson (fajonként két kép), így egyben látszik, hogy a
két fotó ugyanazt a madarat mutatja-e.

Nézd át: valóban a fajt mutatja? Nem fióka, nem tojás, nem preparátum? A hangoknál
elég belehallgatni egybe-kettőbe.

## 4. Commit

A média és a `birds.json` egy commitba kerül. A push egyben deploy
([[github-actions-es-webhook]]), és a service worker a `birds.json`-ból gyűjti be
az új fájlokat — `sw.js`-t nem kell módosítani.

## Ha egy faj rossz képet kapott

Két eszköz van rá, és mindkettő a következő futásban is érvényes marad (kézzel
cserélt fájlt a `npm run fetch` felülírna):

1. Ha a hiba egy **osztály** (tojás, fészek, preparátum), bővítsd az
   `IMAGE_BLOCKLIST`-et a `scripts/fetch-birds.mjs`-ben — szóhatárral, lásd a
   `\bplate\b` esetét.
2. Ha egy **konkrét fájl** rossz, vedd fel a faj `skipFiles` listájába a
   `scripts/birds.js`-ben.
