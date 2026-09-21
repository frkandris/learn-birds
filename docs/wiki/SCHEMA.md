# Wiki Schema

Ez a **learn-birds** projekt LLM által karbantartott tudásbázisa. Két konvenciót
ötvöz, ugyanúgy, ahogy a [meetapedia wikije](https://github.com/frkandris) teszi:

- **Karpathy LLM Wiki pattern** — tartós, kereszthivatkozott markdown wiki, amit az
  LLM fokozatosan épít és karbantart; `index.md` (katalógus), `log.md` (napló), és
  ingest / query / lint munkafolyamatok.
  <https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f>
- **Open Knowledge Format (OKF) v0.2** — minden oldal YAML frontmatterrel kezdődik,
  amiben a `type` kötelező; a linkek irányított, típus nélküli gráfélek; a v0.2 a
  provenienciát (`sources`), a bizalmat (`generated`, `verified`) és az életciklust
  (`status`) teszi első osztályú mezővé.
  <https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md>

A bundle `okf_version: "0.2"` (az `index.md`-ben deklarálva). Az OKF megengedő
(a fogyasztó nem utasíthat el hiányos oldalt), ez a repó viszont szigorúbb lintet
futtat, hogy a saját bundle-je belsőleg teljes maradjon.

## Könyvtárszerkezet

```
docs/wiki/
  SCHEMA.md       — ez a fájl: oldalformátum + lint szabályok (nem concept oldal)
  CLAUDE.md       — karbantartási séma: mikor frissítsd, azonos-commit szabály
  index.md        — OKF katalógus, egy sor oldalanként
  log.md          — dátum szerint csoportosított napló, legújabb elöl
  glossary.md     — fogalomtár (nem lintelt)
  faq.md          — visszatérő kérdések (nem lintelt)
  sources/        — nyers, változatlan beadott anyag (jegyzet, kimásolt válasz)
  pages/
    architecture/ — rendszerkép, adatfolyam, végigvezetett példa
    concepts/     — a tanulási modell fogalmai (a probléma, nem a kód)
    subsystems/   — egy oldal modulonként: mit csinál, hol a belépési pont
    decisions/    — miért X és nem Y (ADR-szerű, a *miért* a lényeg)
    hacks/        — nem nyilvánvaló trükkök, amik nélkül valami nem működik
    post-mortems/ — hibák: tünet, gyökérok, javítás, tanulság
    operations/   — runbookok: futtatás, telepítés, madár hozzáadása
    integrations/ — külső rendszerek: szerződés, kvóta, furcsaságok
```

A kategóriák nyitottak: új mappa akkor jön létre, ha egy oldalcsoport indokolja
(és bekerül ebbe a fába + az `index.md`-be + a lint ismeri). Az `index.md` és a
`log.md` OKF-fenntartott fájlnév, nem lehet concept oldal.

## Oldalformátum (OKF concept document)

Minden `pages/` alatti `.md` YAML frontmatterrel kezdődik:

```yaml
---
type: <fajta>                 # KÖTELEZŐ — Decision | Hack | Post-mortem | Concept |
                              #   Architecture | Subsystem | Runbook | Integration
title: <ember által olvasható név>   # KÖTELEZŐ — pontosan egyezik a H1-gyel
description: <egy mondat>            # KÖTELEZŐ — szó szerint ez kerül az index.md-be
tags: [kebab, case, lista]           # KÖTELEZŐ
status: stable                       # KÖTELEZŐ — draft | stable | deprecated
generated: { by: <actor>, at: <ISO 8601 UTC> }   # KÖTELEZŐ — ki írta, mikor
verified: { by: human:<id>, at: <ISO> }          # opcionális — ki hagyta jóvá
resource: public/audio.js            # opcionális — a dokumentált forrásfájl
sources:                             # opcionális — miből származik az állítás
  - { id: <kulcs>, resource: <URL vagy git:SHA>, title: <cím> }
---
```

Az `actor` az OKF §7 konvencióját követi: `<producer>/<version>` ügynöknek
(`claude-opus-5/claude-code`), `human:<id>` embernek, `process:<id>` automatizmusnak.
A bizalmi szint ebből következik: `verified` nélkül *unverified*, gépi `verified`
esetén *machine-confirmed*, `human:` aktorral *human-reviewed*.

A frontmatter után:

1. `# Cím` (H1, egyezik a `title`-lel)
2. Egymondatos összefoglaló *dőlten*
3. Törzs. Szerkezetet előnyben a folyó szöveggel szemben (lista, táblázat, kódblokk).

Konvenciók:

- Egy fogalom = egy fájl, `kebab-case.md` néven.
- Rövid oldalak (< 200 sor); ha nő, bontsd.
- Nincs duplikáció — linkelj ahelyett, hogy ismételnél.
- Minden nem nyilvánvaló állítás provenienciát visel: `fájl.js:sor`, commit SHA
  vagy abszolút dátum.

## Kereszthivatkozás

- **Wikilink (projektkonvenció):** `[[oldal-név]]` — a fájlnév `.md` nélkül. A lint
  megköveteli, hogy a cél létezzen; még nem megírt oldalra ne linkelj, írd ki szövegként.
- **OKF bundle-relatív:** `[címke](/pages/hacks/foo.md)` — ha a pontos útvonal számít.

## Lint

```sh
npm test            # a wiki-lint a tesztcsomag része
node scripts/lint-wiki.mjs
```

Amit ellenőriz: kötelező frontmatter-mezők és megengedett `status`; H1 = `title`;
minden `[[wikilink]]` létező oldalra mutat; az `index.md` pontosan a létező oldalakat
sorolja fel, a `description`-nel szó szerint egyezve; nincs árva oldal (amire semmi
nem hivatkozik); a `log.md` dátumfejlécei csökkenő sorrendben állnak.
