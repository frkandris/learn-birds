---
type: Subsystem
title: Gyakorlókör (round.js)
description: A Round osztály tartja a pakli sorrendjét, a visszadobott kártyákat és a kör eredményét; DOM és tároló nélkül, ezért tesztelhető.
tags: [module, round, testing]
status: stable
generated: { by: claude-opus-5/claude-code, at: 2026-09-21T09:00:00Z }
resource: public/round.js
sources:
  - { id: commit-round, resource: "git:0d8fba8", title: "A gyakorlókör szabályai külön modulba, tesztekkel" }
---

# Gyakorlókör (round.js)

*2026-09-21-ig ez a logika az `app.js` DOM-kezelése közé volt szőve, és csak
kattintgatással lehetett ellenőrizni; azóta önálló, tesztelt modul.*

## Felület

```js
const round = new Round({ mode, birds, pick });   // pick: média-választó, alapból véletlen
round.current      // { bird, image, audio, failed } | null
round.finished     // igaz, ha minden kártya sikerült
round.progress()   // [{ id, state: 'done'|'miss'|'now'|'' }] a haladásjelzőhöz
round.files()      // a körben előkerülő médiafájlok, előtöltéshez (a hang csak ahol szól)
round.grade(ok)    // { birdId, clean } ha lezárult, null ha visszament a végére
round.summary()    // { total, clean, missed, minutes }
```

## Szerződés

- A `grade()` **nem** ütemez és nem ment: visszaadja, mit kell ütemezni, és az
  `app.js` hívja a `schedule()`-t. Így a kör szabályai függetlenek a tárolástól.
- A `miss` jelölés ragadós: ha egy faj egyszer elbukott, a kör végén is `miss`
  marad, és `clean: false`-szal zárul.
- A média fajonként egyszer dől el (a konstruktorban), nem kártyamegjelenítésenként
  — a visszadobott kártya ugyanazt a fotót és hangot hozza.
- A `pick` injektálható; a tesztek determinisztikus választót adnak.

## Határok

Az utolsó kártya elrontva azonnal újra jön (nincs mögötte más a sorban). Ezt a
teszt rögzíti is: kellemetlen, de az egyetlen alternatíva a kör lezárása
sikertelenül, ami a „addig menj, amíg megvan" szabályt mondaná fel.

Szabály: [[2026-09-18-hibas-kartya-a-pakli-vegere]]. Hívó: [[felulet-vezerlo]].
