---
type: Runbook
title: Tesztelés és CI
description: A kockázatos logikát Node beépített tesztfutója fedi (kör, ütemezés, wiki-lint); a GitHub Actions ugyanezt futtatja, plusz a Docker-image épülését.
tags: [runbook, testing, ci, quality]
status: stable
generated: { by: claude-opus-5/claude-code, at: 2026-09-21T09:00:00Z }
sources:
  - { id: test-pyramid, resource: "https://martinfowler.com/articles/practical-test-pyramid.html", title: "The Practical Test Pyramid (Ham Vocke)" }
---

# Tesztelés és CI

*A piramis alja széles: a szabályokat unit tesztek fedik, a felületet kézi
füstteszt — automatizált böngészős teszt tudatosan nincs.*

## Mit fed a tesztcsomag

```sh
npm test      # node --test
```

A futó **argumentum nélkül** hívja a tesztfutót: az maga keresi meg a
`**/*.test.mjs` fájlokat. A `node --test test/` alak Node 26-on még működik, Node
22-n viszont a könyvtárat modulként próbálja betölteni és elszáll
(`Cannot find module …/test`) — a CI 2026-09-21-én pont ezt fogta meg az első
futásán.

| Fájl | Mit rögzít |
|---|---|
| `test/round.test.mjs` | a kör szabályai: sorrend, visszadobás, ragadós `miss`, összegzés ([[gyakorlokor-modul]]) |
| `test/srs.test.mjs` | ütemezés: lépcsők, visszaesés, napi pakli, számlálók, sorozat ([[tanulasi-allapot]]) |
| `test/wiki.test.mjs` | a wiki szerkezete: frontmatter, H1, wikilinkek, index-tükrözés, naplósorrend |

A tesztek a viselkedést rögzítik, nem a belső szerkezetet: a `Round` publikus
felületén keresztül dolgoznak, és a média-választót injektálják, hogy
determinisztikusak legyenek.

## Amit nem fed, és miért

- **A DOM-kezelés** (`app.js`): egy jsdom-os teszt itt főként a saját mockjait
  tesztelné; a felületet kézi füsttesztel ellenőrizzük
  ([[fejlesztoi-futtatas]]).
- **A médiabegyűjtő** (`fetch-birds.mjs`): hálózatfüggő, és a Commons tartalma
  változik. A kimenetét vizuális ellenőrzés fedi ([[uj-madar-felvetele]]).
- **A hanglejátszás**: valódi böngésző és hangkimenet kellene hozzá.

## CI

`.github/workflows/ci.yml` minden pushra és PR-re:

1. `npm test` — logika + wiki-lint,
2. `docker build` — az éles image épülése (a `nginx.conf` és a `mime.types`
   módosítás is így van fedve).

**A CI nem kapuőr a deploy előtt**: a Coolify-webhook a pushra indul, a CI-től
függetlenül ([[github-actions-es-webhook]]). Aki éles hibát akar elkerülni,
`npm test`-et futtat push előtt.
