# Wiki Maintenance Schema

Ez a fájl mondja meg bármely LLM-munkamenetnek, **mikor** kell tudást rögzíteni ebbe a
wikibe és **hogyan**. Az oldalformátumot (OKF frontmatter, lint, kategóriák) a
[SCHEMA.md](SCHEMA.md) írja le — indulás előtt mindkettőt olvasd el.

## Rétegek

- **Források (csak olvasható igazság)**: a kódbázis, `git log` / `git show`, a GitHub
  (`gh`), a Coolify API (deployok, állapot), a Wikimedia Commons és a `sources/`
  mappa nyers anyagai. Forrást sosem írunk át azért, hogy a wikihez igazodjon.
- **A wiki (írható)**: minden a `docs/wiki/` alatt — lefordított, kereszthivatkozott
  műtermék. Ha a wiki és a forrás ellentmond, a forrás nyer: javítsd a wikit, és
  naplózd.
- **A séma**: ez a fájl + [SCHEMA.md](SCHEMA.md).

## Mikor frissítsd (triggerek)

| Esemény | Hova kerül |
|---|---|
| Új modul vagy futásidejű felület | `pages/subsystems/` |
| Tervezési döntés, aminek volt alternatívája | `pages/decisions/` — a **miért** a lényeg |
| Nem nyilvánvaló trükk, ami nélkül valami nem megy | `pages/hacks/` |
| Meglepő gyökerű hiba vagy incidens | `pages/post-mortems/` (Tünet / Gyökérok / Javítás / Tanulság) |
| Külső szolgáltatás szerződése vagy furcsasága | `pages/integrations/` |
| „Mit tegyek, ha X" tudás | `pages/operations/` (runbook: pontos parancsok) |
| A tanulási modell fogalma tisztult | `pages/concepts/` |
| Rendszerkép vagy adatfolyam változott | `pages/architecture/` |
| Új szakkifejezés | `glossary.md` |
| Kétszer feltett kérdés | `faq.md` |
| **Mindig** | egy sor a `log.md`-be (legújabb dátumszakasz elöl) |

## Mikor NE frissítsd

- Triviális változás: átnevezés, formázás, lint, függőségfrissítés.
- Amit a gyökér `CLAUDE.md` már kimond — linkelj rá, ne másold.
- Ami egyetlen függvény elolvasásából triviálisan következik.
- Terv, ami még nincs meg — a wiki azt írja le, **ami van**.

## Fegyelem

- A wiki-frissítés **ugyanabba a commitba** kerül, mint a kiváltó kódváltozás, így a
  `git log` összeköti őket.
- Minden nem nyilvánvaló állítás provenienciát visel: `fájl.js:sor`, commit SHA vagy
  abszolút dátum (`2026-09-18`), soha nem „nemrég".
- Az ellentmondást jelöld az oldalon, ne írd felül némán.
- A kisebb igaz wiki jobb, mint a felfújt.
- Commit előtt: `npm test` (a wiki-lint a tesztcsomag része).
- A `log.md` `union` merge drivert használ (`.gitattributes`), hogy a párhuzamos
  munkamenetek mindketten hozzáfűzhessenek — ezért minden naplóbejegyzés önmagában
  értelmes, egysoros.
