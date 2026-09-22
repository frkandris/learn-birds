---
type: Decision
title: Wikimedia Commons a xeno-canto API helyett
description: A xeno-canto API v2 megszűnt, a v3 kulcsot kér — a hangok a Commonsra átemelt xeno-canto felvételekből jönnek, kulcs nélkül.
tags: [decision, audio, wikimedia, xeno-canto]
status: stable
generated: { by: claude-opus-5/claude-code, at: 2026-09-21T09:00:00Z }
sources:
  - { id: xc-v2, resource: "https://xeno-canto.org/api/2/recordings", title: "API v2 hibaüzenet: no longer available" }
  - { id: xc-v3, resource: "https://xeno-canto.org/explore/api", title: "API v3 dokumentáció (kulcsot igényel)" }
---

# Wikimedia Commons a xeno-canto API helyett

*2026-09-18: a madárhangok kézenfekvő forrása a xeno-canto lett volna, de az API
2026-ra kulcshoz kötött.*

## Kontextus

Az első lépés a hangforrás kiválasztása volt. A xeno-canto a legnagyobb madárhang-
gyűjtemény, korábban nyílt API-val.

## Mérés

```
GET https://xeno-canto.org/api/2/recordings?query=...
→ {"error":"server_error","message":"Xeno-canto API v2 is no longer available..."}
GET https://xeno-canto.org/api/3/recordings?query=...
→ HTTP 401
```

## Mérlegelt lehetőségek

| Lehetőség | Miért nem / miért igen |
|---|---|
| xeno-canto API v3 kulccsal | Regisztráció és titok kezelése egy hobbiprojektben; a kulcs a kliensbe nem tehető, tehát build-idejű script kellene — cserébe pontosabb keresés. |
| Macaulay Library / eBird | Szigorúbb licenc, nem szabad újrafelhasználás. |
| **Wikimedia Commons + Wikidata** | Kulcs nélkül elérhető, szabad licenc, és a xeno-canto felvételek jelentős része amúgy is itt van (a fájlnévben `XC<azonosító>`). |

## Döntés

A Commons a forrás, a Wikidata pedig a belépési pont (`P225` taxonnév → `P18`/`P51`).

## Miért

A projektnek nincs futásidejű hálózati függősége: a média build-időben leszedve
kerül a repóba, tehát a forrás API-jának sebessége és kvótája nem üzemeltetési
kockázat. Egy kulcs viszont az lenne — titkot kellene tárolni és forgatni egy olyan
projektben, aminek egyébként egyetlen titka sincs.

## Következmények

- A hangkeresés fájlnév-illesztésre épül (a tudományos névnek szerepelnie kell), ami
  nyersebb, mint egy rendes API-szűrő; cserébe a találatok javát a xeno-canto adja.
- A licencek vegyesek (CC BY, CC BY-SA, CC0), ezért a szerző a felfedett kártyán
  látszik, a licenc pedig a `birds.json`-ban van fajonként.
- A Commons kategóriái zajosak — külön szűrés kellett
  ([[2026-09-18-tojasfoto-a-wikidatabol]]).

Kapcsolódó: [[wikimedia-commons]], [[media-begyujto]].
