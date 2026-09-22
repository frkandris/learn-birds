# Wiki Log

Dátum szerint csoportosított napló, legújabb elöl. Formátum: [SCHEMA.md](SCHEMA.md).

## 2026-09-22
- **Update**: A barátcinegének és a molnárfecskének is meglett a második hangfelvétele: a keresés mostantól a régi tudományos neveken (Wikidata `P1420`) és az angol néven is fut, a faj kategóriájának hangfájljait is számba veszi, az illesztés pedig betűsorra normalizál — `PoecilePalustrisCall.ogg` a szóköz hiánya miatt esett ki korábban. A kiejtés-felvételeket (`De-…`, `Jer-…`) a fájlnév és a kategória alapján is szűrjük.
- **Creation**: [[2026-09-22-a-gyorsitotar-ket-csendes-hibaja]] — külső review (`codex review`) találta meg, hogy a cserélt média a telepített appban régi maradt volna (a `CACHE` neve nem emelkedett), és hogy a service worker a bájttartomány-kérésre teljes fájlt adott 200-zal, ami Safariban néma offline lejátszást jelent; mindkettő javítva (`madarak-v3`, `partial()`).
- **Update**: A szabadgyakorlás már tényleg nem nyúl az ütemezéshez (`schedule(..., { reschedule: false })`) — eddig a felület ezt ígérte, a kód viszont léptette a szintet; a kör fejléce és az összegzés is jelzi, ha szabadgyakorlás folyik.
- **Update**: Apróbb robusztusság a review nyomán: az automatikus lejátszás időzítője kártyaváltáskor és kilépéskor törlődik (eddig bezárt képernyőn is megszólalhatott), a lejátszási hiba látható üzenetet kap, a tároló betöltése normalizál, a fejlesztői szerver hibás URL-re 400-at ad 500 helyett, érvénytelen tartományra 416-ot, és a wiki-lint tiltja az azonos nevű oldalakat.
- **Update**: Három gyakorlómód lett (csak kép, csak hang, kép és hang), fajonként három külön kártyával és ütemtervvel — a [[harom-mod-harom-pakli]] oldal váltja a korábbi „két készség" oldalt, az indok a [[2026-09-22-harmadik-mod-es-huszonhet-faj]] döntésben van.
- **Update**: A pakli 27 fajra nőtt, a napi adag alapértéke 3 lett, a képek száma fajonként 3 → 2, a szélességük 1000 → 900 px — így az offline készlet ~20 MB maradt.
- **Creation**: [[2026-09-22-nema-fajok-az-ogg-mime-tipus-miatt]] — a barátcinege és a molnárfecske hang nélkül maradt, mert a Commons `application/ogg` típust ad a régi felvételekre, és a szűrés csendben eldobta őket; a fájl fajtáját mostantól a `mediatype` dönti el, a kihagyás pedig naplózza az okát.
- **Update**: A begyűjtés kapott minőségi rangsort (Commons Quality/Featured/Valued images előre), kézi kizárólistát (`skipFiles`) és részleges futást — a 27 fajos készletet így nem kell egyetlen rossz kép miatt újraszedni.

## 2026-09-21
- **Update**: A CI első futása elbukott, mert a `node --test test/` alak Node 22-n modulként próbálja betölteni a könyvtárat (`Cannot find module …/test`), a fejlesztői gépen futó Node 26-on viszont működik — a futó azóta argumentum nélkül hívja a tesztfutót, és a [[teszteles-es-ci]] oldal rögzíti a verziókülönbséget.
- **Initialization**: Felállt a wiki a Karpathy-minta és az OKF v0.2 szerint (`SCHEMA.md`, `CLAUDE.md`, `index.md`, `log.md`, `glossary.md`, `faq.md`, nyolc kategória a `pages/` alatt), és a `scripts/lint-wiki.mjs` a tesztcsomag része lett — a lint innentől bukik, ha egy oldal hiányos, egy `[[wikilink]]` sehova nem mutat, vagy az index nem tükrözi a `description`-öket.
- **Creation**: A 2026-09-18-i építés és a 09-19-i deploy teljes technikai tudása oldalakra bontva — négy post-mortem (néma lejátszás, gyorsítótárból kiszolgált régi kód, tojásfotó a Wikidatából, háttérlapon nem futó rajzolás), három hack, öt döntés, hat modul-oldal, négy runbook, három integráció.
- **Update**: A gyakorlókör szabályai kikerültek a DOM-kezelésből a `public/round.js` `Round` osztályába, és 22 teszt fedi a kört meg az ütemezést (commit `0d8fba8`) — a [[gyakorlokor-modul]] és a [[teszteles-es-ci]] oldal ezt írja le.
