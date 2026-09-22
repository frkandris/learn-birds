# Wiki Log

Dátum szerint csoportosított napló, legújabb elöl. Formátum: [SCHEMA.md](SCHEMA.md).

## 2026-09-22
- **Update**: Három gyakorlómód lett (csak kép, csak hang, kép és hang), fajonként három külön kártyával és ütemtervvel — a [[harom-mod-harom-pakli]] oldal váltja a korábbi „két készség" oldalt, az indok a [[2026-09-22-harmadik-mod-es-huszonhet-faj]] döntésben van.
- **Update**: A pakli 27 fajra nőtt, a napi adag alapértéke 3 lett, a képek száma fajonként 3 → 2, a szélességük 1000 → 900 px — így az offline készlet ~20 MB maradt.
- **Creation**: [[2026-09-22-nema-fajok-az-ogg-mime-tipus-miatt]] — a barátcinege és a molnárfecske hang nélkül maradt, mert a Commons `application/ogg` típust ad a régi felvételekre, és a szűrés csendben eldobta őket; a fájl fajtáját mostantól a `mediatype` dönti el, a kihagyás pedig naplózza az okát.
- **Update**: A begyűjtés kapott minőségi rangsort (Commons Quality/Featured/Valued images előre), kézi kizárólistát (`skipFiles`) és részleges futást — a 27 fajos készletet így nem kell egyetlen rossz kép miatt újraszedni.

## 2026-09-21
- **Update**: A CI első futása elbukott, mert a `node --test test/` alak Node 22-n modulként próbálja betölteni a könyvtárat (`Cannot find module …/test`), a fejlesztői gépen futó Node 26-on viszont működik — a futó azóta argumentum nélkül hívja a tesztfutót, és a [[teszteles-es-ci]] oldal rögzíti a verziókülönbséget.
- **Initialization**: Felállt a wiki a Karpathy-minta és az OKF v0.2 szerint (`SCHEMA.md`, `CLAUDE.md`, `index.md`, `log.md`, `glossary.md`, `faq.md`, nyolc kategória a `pages/` alatt), és a `scripts/lint-wiki.mjs` a tesztcsomag része lett — a lint innentől bukik, ha egy oldal hiányos, egy `[[wikilink]]` sehova nem mutat, vagy az index nem tükrözi a `description`-öket.
- **Creation**: A 2026-09-18-i építés és a 09-19-i deploy teljes technikai tudása oldalakra bontva — négy post-mortem (néma lejátszás, gyorsítótárból kiszolgált régi kód, tojásfotó a Wikidatából, háttérlapon nem futó rajzolás), három hack, öt döntés, hat modul-oldal, négy runbook, három integráció.
- **Update**: A gyakorlókör szabályai kikerültek a DOM-kezelésből a `public/round.js` `Round` osztályába, és 22 teszt fedi a kört meg az ütemezést (commit `0d8fba8`) — a [[gyakorlokor-modul]] és a [[teszteles-es-ci]] oldal ezt írja le.
