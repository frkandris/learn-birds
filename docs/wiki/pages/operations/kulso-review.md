---
type: Runbook
title: Külső review: codex és UI-audit
description: Hogyan nézessük át a munkát másik modellel és mérhető UI-ellenőrzőlistával — a két parancs, mit talált eddig, és mit nem érdemes tőlük várni.
tags: [runbook, review, quality, accessibility]
status: stable
generated: { by: claude-opus-5/claude-code, at: 2026-09-22T15:00:00Z }
---

# Külső review: codex és UI-audit

*Két kör alatt tizenkét valódi hibát talált, egyet sem a tesztek — mert mind
olyan helyen volt, amit teszt nem fed: a gyorsítótár, a böngészőszerződések és a
felület.*

## Mikor érdemes

Nagyobb változás után, a következő nagyobb változás előtt. A deploy nem vár rá (a
push webhookon megy), tehát a review nem kapuőr, hanem visszacsatolás.

## A két parancs

```sh
# A commit vagy a tartomány változásaira (ez a fő eszköz)
codex review --commit HEAD
codex review --base <sha>          # minden változás az adott pont óta

# Szabadon fogalmazott, célzott átnézés (a --commit nem fogad prompt-ot)
codex exec --sandbox read-only "Nézd át a … hibák szempontjából. Ne írj át kódot."
```

A `--base` ágat és commitot is elfogad. A `--commit` **nem** kombinálható saját
prompttal — ilyenkor a `codex exec` a járható út.

## UI-ellenőrzőlista méréssel

A `ui-ux-pro-max` skill ad ellenőrzőlistát (kontraszt 4,5:1, tapintható méret
44×44, fókusz, mozgás), de a döntő lépés a **mérés a böngészőben**, nem a lista
elolvasása: a számított színeket alfa-kompozittal a tényleges háttérre vetítve, és
a vezérlők befoglaló méretét `getBoundingClientRect()`-tel. A sötét téma halvány
szövegei jól néztek ki, és 3,44:1-en álltak
([[2026-09-22-akadalymentessegi-alapszint]]).

## Mit talált eddig

| Kör | Találat | Miért nem látszott |
|---|---|---|
| 1. | A cserélt média régi maradt a telepített appban | Csak telepített appban jelentkezik, localhoston nincs service worker |
| 1. | A worker teljes fájlt adott bájttartomány-kérésre | Az nginx jól csinálta — a worker elé kerül |
| 1. | A szabadgyakorlás léptette az ütemezést, a felület ennek ellenkezőjét ígérte | A kód és a szöveg külön élt |
| 2. | Ugyanaz a gyorsítótár-hiba, másodszor | A szabály ki volt mondva, mégis elmaradt |
| 2. | A szóköz elnyelte a lejátszógomb saját billentyűjét | Egérrel nem érzékelhető |
| 2. | A modális réteg nem volt modális (fókusz, képernyőolvasó) | Látszatra rendben volt |
| 3. (Opus 5.5) | A worker a HTTP-gyorsítótárból is kaphatott régi médiát | Egy réteggel lejjebb, mint amit a bélyeg kezelt |
| 3. (codex) | A begyűjtés előbb törölt, csak utána töltött le | Csak hálózati hibánál jelentkezik |
| 3. (codex) | Egy faj cseréje minden kliensen mind a 108 fájlt újratöltötte | Helyesen működött, csak drágán |
| 3. (codex) | A médiaszinkron a friss lista tárolása előtt törölt | Csak tele tárhelynél jelentkezne |

A teljes lista a [[2026-09-22-a-gyorsitotar-ket-csendes-hibaja]] és a napló
bejegyzéseiben.

## Mit ne várjunk tőle

- **Nem helyettesíti a mérést.** A kontraszt- és méretproblémákat a UI-review
  általánosságban említi; a konkrét bukó elemeket a böngészős mérés adja.
- **Nem mindig van igaza.** A második körben jelzett „fotó-betöltési
  versenyhelyzet" a gyakorlatban nem állt fenn úgy, ahogy leírta (az `onload`
  property felülírása eldobja a korábbi kezelőt) — a védekezés így is olcsó volt,
  ezért bekerült, de a találatokat érdemes egyenként ellenőrizni.
- **A helyi Docker-próba nem kihagyható.** A 3. körben az nginx-regex kapcsos
  zárójele idézőjel nélkül leállította volna a szervert; a review nem jelezte,
  a CI csak a push *után* futott volna, a push pedig deploy.
- **A saját javítás is hibás lehet.** A második kör egyik javítása (fókusz a
  felfedés után) elsőre nem működött, mert a feltétel a gomb elrejtése *után*
  futott. Mérés nélkül így maradt volna.

Kapcsolódó: [[teszteles-es-ci]].
