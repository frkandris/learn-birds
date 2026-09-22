---
type: Post-mortem
title: A gyorsítótár két csendes hibája
description: Külső review derítette ki, hogy a cserélt média a telepített appban régi maradt volna, és hogy a service worker a bájttartomány-kérésre teljes fájlt adott — Safariban ez néma offline lejátszást jelent.
tags: [service-worker, caching, audio, post-mortem, review]
status: stable
generated: { by: claude-opus-5/claude-code, at: 2026-09-22T12:00:00Z }
resource: public/sw.js
---

# A gyorsítótár két csendes hibája

*2026-09-22, a 27 fajra bővítés után: egyik hiba sem látszott a saját
ellenőrzéseimen, mert mindkettő csak a **már telepített** appban jelentkezik.*

## 1. A cserélt média régi maradt volna

A médiafájlok neve a fajból és egy sorszámból áll (`tengelic-1.jpg`), a tartalmuk
viszont a begyűjtés eredményétől függ. A bővítéskor sok fájl **azonos néven, más
tartalommal** került a helyére.

A service worker a médiát cache-first szolgálja ki, a `CACHE` neve
(`madarak-v2`) viszont változatlan maradt. A már telepített appban ezért a régi
kép maradt volna — miközben a `birds.json` network-first frissül, tehát az **új
szerző és licenc jelent volna meg a régi kép alatt**. Rossz attribúció és rossz
tanulóanyag egyszerre.

**Javítás (első nekifutás):** `madarak-v3`, plusz a szabály kimondva a kódban: *a
verziót emelni kell, ha egy meglévő útvonal tartalma változik.*

**A szabály kimondása nem volt elég.** Néhány órával később, a hangkeresés
javításakor és a képek kettőre csökkentésekor ugyanez megismétlődött: a média
cserélődött, a verzió maradt. A következő review ezt újra megtalálta. Azóta a
gyorsítótár neve két részből áll, és a médiabélyeget a begyűjtés írja a
`sw.js`-be — kézzel nem lehet elfelejteni ([[offline-gyorsitotar]]).

> Tanulság a tanulságról: egy dokumentált szabály, amit ugyanaz a kéz sért meg,
> aki leírta, nem szabály, hanem emlékeztető. Ha a helyes lépés kiszámítható,
> automatizálni kell.

## 2. A bájttartomány-kérésre teljes fájl jött

Mérés az éles címen, aktív service workerrel:

```js
const r = await fetch('media/hollo-1.m4a', { headers: { Range: 'bytes=0-99' } });
r.status        // 200  ← 206 kellene
(await r.arrayBuffer()).byteLength  // 269664  ← 100 kellene
```

A `cache.match()` a teljes választ adja vissza, a Range fejlécet figyelmen kívül
hagyva. Az nginx oldalán rendben volt a 206 ([[faststart-aac]]) — de a service
worker **elé** kerül, tehát telepítés után már ő válaszol. Safari pedig kizárólag
206-ra indítja el a médiát: az offline hang iPhone-on néma maradt volna.

**Javítás:** a worker a tárolt fájlból maga állítja elő a 206-os választ
(`partial()`), kezelve a nyitott (`bytes=100-`) és a suffix (`bytes=-500`) alakot
is, érvénytelen tartományra pedig 416-ot ad.

## 3. Folytatás: a névváltás sem volt elég

A harmadik review (2026-09-22 este, más modellel) ugyanennek a hibának egy
harmadik útját találta meg. A worker telepítéskor `cache.add(url)`-lal töltötte
le a médiát, ami a böngésző **HTTP-gyorsítótárán** át megy. Az nginx a médiát
egy napig frissnek jelöli (élesben mérve: `cache-control: max-age=86400`), és
az előző telepítés letöltései oda is bekerültek. Egy napon belüli újabb
begyűjtés után tehát az új nevű gyorsítótár a **régi** fájlt kapta volna —
pontosan az 1. pont tünete, csak most a `MEDIA_STAMP` ellenére.

Ugyanitt a futás közbeni pótlás is hibás volt: hangfájlra a lejátszó
bájttartományt kér, a hálózat 206-tal felel, a `cache.put` pedig 206-ra
`TypeError`-t dob — a telepítéskor kimaradt hang így sosem került a készülékre.

**Javítás:** minden gyorsítótárba szánt letöltés `cache: 'reload'` módú
(`fresh()` a `sw.js`-ben), a 206-os válasz helyett pedig a teljes fájl kerül a
gyorsítótárba; kódverzió `v5`.

> A gyorsítótárnak rétegei vannak: a Cache Storage alatt ott a HTTP-gyorsítótár
> is, a saját `max-age` fejlécünkkel. Egy réteg ürítése nem üríti a másikat.

## Tanulság

- **A service worker elrejti a szerver helyes viselkedését.** Amit az nginx jól
  csinál, azt telepítés után már nem a felhasználó látja. A médiaszerződést
  (MIME, `Accept-Ranges`, 206) a workerben is teljesíteni kell.
- **A „nem látszik a fejlesztés közben" hibák a legveszélyesebbek**: localhoston
  nincs worker ([[2026-09-18-regi-kod-a-gyorsitotarbol]]), tehát minden
  gyorsítótár-hiba csak éles telepítésen jelentkezik. Az éles ellenőrzés
  (`caches.keys()`, egy Range-fetch a konzolból) nem kihagyható lépés.
- Mindkét hibát **külső review** találta meg, nem a tesztek — a gyorsítótár
  viselkedése ugyanis nincs (és nehezen lenne) lefedve unit teszttel
  ([[teszteles-es-ci]]).
