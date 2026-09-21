---
type: Integration
title: Wikimedia Commons és Wikidata
description: Kulcs nélküli API-k a képekhez, hangokhoz és licencadatokhoz; a szerződés, a szűrési fogódzók és a User-Agent követelmény.
tags: [integration, wikimedia, wikidata, licensing]
status: stable
generated: { by: claude-opus-5/claude-code, at: 2026-09-21T09:00:00Z }
resource: scripts/fetch-birds.mjs
---

# Wikimedia Commons és Wikidata

*A projekt egyetlen külső adatforrása, és csak build-időben használjuk
([[2026-09-18-commons-a-xeno-canto-helyett]]).*

## Végpontok

| Cél | Hívás |
|---|---|
| Faj azonosítása, alapkép/hang | `query.wikidata.org/sparql`, `?item wdt:P225 "<taxon>"` → `P18`, `P51` |
| Fajkategória fájljai | `commons.wikimedia.org/w/api.php?action=query&generator=categorymembers&gcmtitle=Category:<taxon>&gcmtype=file` |
| Keresés | `action=query&list=search&srsearch=<taxon> filetype:audio|bitmap&srnamespace=6` |
| Metaadat, licenc, méret | `prop=imageinfo|categories&iiprop=url|mime|extmetadata|size&iiurlwidth=1000` |

**User-Agent kötelező** — a Wikimedia blokkolja az azonosítatlan klienseket. A
projekt a `UA` konstansban nevezi meg magát a repó URL-jével.

## Amire számítani kell

- **A `P18` nem garantál fajfotót.** Lehet tojás, preparátum, múzeumi tárgy
  ([[2026-09-18-tojasfoto-a-wikidatabol]]).
- **A kategóriák zajosak**: altkategóriákban tojás, fészek, fióka; a keresés pedig
  hoz találatokat más fajokról is. Fogódzó: a fájlnév tartalmazza a tudományos nevet.
- **A hangoknál a `filetype:audio` keresés hozza a xeno-canto felvételeket** (`XC`
  azonosítóval a névben). A Lingua Libre (`File:LL-…`) fájlok kiejtés-felvételek,
  nem madárhangok — ezeket szűrni kell.
- **Az átméretezést a Commons végzi**: `iiurlwidth=1000` thumbnail URL-t ad, így nincs
  szükség helyi képfeldolgozásra.
- **A licenc fajonként eltér** (CC BY, CC BY-SA, CC0, néha „lásd a fájl oldalát"). Az
  `extmetadata.Artist` HTML-t tartalmaz, amit tisztítani kell.

## Kötelezettség

A szerző és a licenc minden fájlhoz megjelenik a Források nézetben, a fájl Commons-
oldalára mutató hivatkozással. Ez nem opcionális: a CC BY/BY-SA megköveteli.
