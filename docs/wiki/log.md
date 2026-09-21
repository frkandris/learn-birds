# Wiki Log

Dátum szerint csoportosított napló, legújabb elöl. Formátum: [SCHEMA.md](SCHEMA.md).

## 2026-09-21
- **Initialization**: Felállt a wiki a Karpathy-minta és az OKF v0.2 szerint (`SCHEMA.md`, `CLAUDE.md`, `index.md`, `log.md`, `glossary.md`, `faq.md`, nyolc kategória a `pages/` alatt), és a `scripts/lint-wiki.mjs` a tesztcsomag része lett — a lint innentől bukik, ha egy oldal hiányos, egy `[[wikilink]]` sehova nem mutat, vagy az index nem tükrözi a `description`-öket.
- **Creation**: A 2026-09-18-i építés és a 09-19-i deploy teljes technikai tudása oldalakra bontva — négy post-mortem (néma lejátszás, gyorsítótárból kiszolgált régi kód, tojásfotó a Wikidatából, háttérlapon nem futó rajzolás), három hack, öt döntés, hat modul-oldal, négy runbook, három integráció.
- **Update**: A gyakorlókör szabályai kikerültek a DOM-kezelésből a `public/round.js` `Round` osztályába, és 22 teszt fedi a kört meg az ütemezést (commit `0d8fba8`) — a [[gyakorlokor-modul]] és a [[teszteles-es-ci]] oldal ezt írja le.
