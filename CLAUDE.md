# learn-birds

Tanulókártyás PWA magyar madárfajok kép- és hangfelismeréséhez, ismétléses
ütemezéssel. Vanilla JS, nulla függőség, statikus kiszolgálás.

## Projekt-tudásbázis — `docs/wiki/`

A `docs/wiki/` LLM által karbantartott tudásbázis: mindaz, amit a kód önmagában nem
mutat meg — architektúra, döntések és az indokuk, hibák gyökéroka, trükkök, külső
rendszerek szerződései, runbookok és a fogalomtár.

**Minden nem triviális feladat előtt:**

- Olvasd el a [`docs/wiki/CLAUDE.md`](docs/wiki/CLAUDE.md) sémát — az mondja meg,
  mikor kell a wikit frissíteni; a „Mikor frissítsd" táblázat az aktuális feladat
  ellenőrzőlistája.
- Fusd át a [`docs/wiki/index.md`](docs/wiki/index.md) katalógust, és olvasd el az
  érintett terület oldalait. Ez a leggyorsabb út ahhoz a kontextushoz, amit korábbi
  munkamenetek órákban fizettek meg.

**Munka közben:** ha döntés születik, nem nyilvánvaló hiba derül ki, trükk kerül a
kódba, külső rendszer változik, vagy új fogalom jön elő — írd meg vagy frissítsd az
oldalt a séma szerint, és fűzz egy sort a `docs/wiki/log.md`-hez. **A wiki-frissítés
ugyanabba a commitba kerül, mint a kiváltó kódváltozás.**

## Parancsok

```sh
npm start     # fejlesztői kiszolgáló: http://localhost:5173 (+ LAN-cím)
npm test      # logikai tesztek + wiki-lint — commit előtt fusson le
npm run fetch # média begyűjtése a Wikimedia Commonsról (ffmpeg kell hozzá)
npm run icons # PWA-ikonok generálása (macOS sips)
```

## Munkamódszer

A repó a Google eng-practices és Martin Fowler ajánlásait követi, a projekt
méretéhez szabva:

- **Kis, önálló commitok.** Egy commit egy célt szolgál, és önmagában működőképes
  állapotot hagy. A refaktor külön commit a funkcionális változástól; apró
  tisztítás mehet vele.
- **A commit üzenet megmondja, *mit* és *miért*.** Első sor rövid összefoglaló;
  a törzs a kontextus, az indoklás és a korlátok. „Fix bug" nem üzenet.
- **Self-testing code.** Új vagy módosított logikához teszt tartozik, és a
  `npm test` egy paranccsal fut. Hibajavításnál előbb a hibát mutató teszt.
- **A teszt viselkedést rögzít, nem szerkezetet.** A publikus felületen keresztül,
  arrange-act-assert felosztásban; a piramis alja széles (unit), a csúcs kézi
  füstteszt — böngészős end-to-end teszt tudatosan nincs
  (lásd `docs/wiki/pages/operations/teszteles-es-ci.md`).

## Amit a kódból nem látni

- **A push egyben deploy**: a `main`-re érkező commit ~15 másodperc alatt éles. A CI
  nem kapuőr — `npm test` push előtt.
- **A service worker localhoston nem regisztrálódik**, hogy a fejlesztés ne a
  gyorsítótárból dolgozzon. Új JS-modult viszont fel kell venni a `sw.js` `CORE`
  listájába, különben offline hiányzik.
- **A média a repóban van verziózva**, és az `npm run fetch` mindent újraszed. Új faj
  után nézd meg a képeket, mielőtt commitolsz — a Commons kategóriái zajosak.
- A részletek és az indokok a wikiben vannak; ez a fájl csak a belépési pont.
