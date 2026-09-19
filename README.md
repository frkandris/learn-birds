# Madárhatározó tanulókártyák

Tanulókártyás webalkalmazás magyar madárfajok felismeréséhez. Két mód:

- **Kép és hang** — fotó és hangfelvétel, ki kell találni a fajt.
- **Csak hang** — semmi kép, futó szonogram, ahogy a terepen hallani.

A kártya megfordítása után te döntöd el, hogy erre gondoltál-e. Ami nem
sikerült, visszakerül a pakli végére, és a kör addig tart, amíg minden
madár meg nem volt. A hosszú távú ismétlés növekvő lépcsőkön halad
(1 → 3 → 7 → 16 → 35 → 90 nap); egy hiba visszaállítja a másnapi ismétlésre.
A kép- és a hangfelismerés külön készségként, külön ütemezéssel halad.

A haladás a böngésző tárolójában marad, a készüléken; nincs se szerver, se fiók.

## Futtatás

```sh
npm start          # http://localhost:5173
```

A parancs a helyi hálózati címet is kiírja, így ugyanarról a wifiről a
telefon böngészőjéből is megnyitható. iPhone-on a **Megosztás → Főképernyőhöz
adás** kirakja ikonként; teljes képernyőn, saját ikonnal indul.

Az offline működés (service worker) csak HTTPS-en vagy localhoston él, a
helyi hálózati IP-címen nem.

## Éles verzió

<https://9fpuemtkvx4d8hlawl9hkhzz.157.180.21.144.sslip.io>

Coolify (`learn-birds` projekt, `9fpuemtkvx4d8hlawl9hkhzz`) a meetapedia
szerverén, Dockerfile build packkel: az `nginx` a `public/` mappát szolgálja
ki, a beállításai a `deploy/nginx.conf`-ban vannak.

A `main`-re érkező push webhookon automatikusan deployol (~1 perc). Kézzel is
indítható:

```sh
~/.config/strt/coolify-birds.sh "/api/v1/deploy?uuid=9fpuemtkvx4d8hlawl9hkhzz" -X POST
```

(A helper a Coolify-tokent a `~/.config/strt/coolify-birds.env`-ből olvassa,
hogy ne kerüljön parancssorba.)

## Madarak hozzáadása

A fajlista a `scripts/birds.js`-ben van. Vegyél fel egy sort a magyar
névvel és a tudományos névvel, majd:

```sh
npm run fetch      # képek, hangok és licencadatok a Wikimedia Commonsról
```

A script a Wikidatából és a Commons kategóriákból választ fajonként legfeljebb
három fotót és két hangfelvételt, kiszűri a tojás-, fészek- és
múzeumi képeket, a fotókat 1000 px szélesre kéri, a hangokat 22 másodperces,
bejátszásra kész AAC-fájlokká kódolja (`ffmpeg` kell hozzá), és kiírja a
`public/data/birds.json`-t a szerzőkkel és a licencekkel együtt.

Az alkalmazás ikonjai a `scripts/icon.svg`-ből készülnek:

```sh
npm run icons      # macOS `sips`-szel
```

## Felépítés

| Útvonal | Mi van benne |
| --- | --- |
| `public/index.html` | az app váza: Ma, Fajok, Források nézet és a gyakorlás |
| `public/app.js` | képernyők, gyakorlókör, felfedés és értékelés |
| `public/srs.js` | ismétléses ütemezés és a tanulási állapot |
| `public/audio.js` | lejátszás és a futó szonogram |
| `public/sw.js` | offline gyorsítótár |
| `scripts/fetch-birds.mjs` | a média begyűjtése a Wikimedia Commonsról |

## Forrás és licenc

Minden fotó és hangfelvétel a Wikimedia Commonsról származik, szabad
licenccel; a szerzőket és a licenceket az app **Források** nézete sorolja fel
fajonként, a fájl oldalára mutató hivatkozással. A hangfelvételek java a
xeno-canto gyűjteményéből került a Commonsra. A betűtípusok (Alegreya,
Alegreya Sans) SIL Open Font License alatt állnak.
