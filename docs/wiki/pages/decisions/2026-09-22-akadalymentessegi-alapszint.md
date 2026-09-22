---
type: Decision
title: Akadálymentességi alapszint a sötét témán
description: Mért kontraszt és tapintható méret: a három szövegszint a leghalványabb felületen is 4.5:1 fölött marad, minden vezérlő legalább 44×44 px.
tags: [decision, accessibility, design-system, contrast]
status: stable
generated: { by: claude-opus-5/claude-code, at: 2026-09-22T14:00:00Z }
resource: public/styles.css
sources:
  - { id: wcag-contrast, resource: "https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum", title: "WCAG 2.2 — Contrast (Minimum)" }
  - { id: hig-targets, resource: "https://developer.apple.com/design/human-interface-guidelines/accessibility", title: "Apple HIG — tapintható célpontok" }
---

# Akadálymentességi alapszint a sötét témán

*A sötét téma halvány szövegei jól néztek ki, de mérve megbuktak: a javítás előtt
minden harmadlagos szöveg 3,44:1 volt a 4,5:1 helyett.*

## Amit a mérés mutatott

A felületen végigmérve (számított színek, alfa-kompozit a tényleges háttérre)
kilenc elem bukott el, mind ugyanazzal az értékkel — a `--bone-faint` token 0,4-es
átlátszósága miatt: a tudományos nevek, a készségsorok címkéi és esedékessége, az
inaktív fül, a kör fejléce, a „Vissza", a szerzők sora és a sorozat.

Tapintható méretben kettő: a napi adag gombjai (42×42) és a „Vissza" (36×35).

## Döntés

Három szövegszint, úgy hangolva, hogy a leghalványabb is átmenjen a **legvilágosabb**
felületen (`--moss`), ne csak a háttéren:

| Token | Alfa | Kontraszt a `--shade`-en | Szerep |
|---|---|---|---|
| `--bone` | 1,0 | 14,9:1 | elsődleges szöveg |
| `--bone-soft` | 0,78 | 9,5:1 | másodlagos szöveg |
| `--bone-faint` | 0,60 | 6,1:1 (moss-on 5,0:1) | harmadlagos, még olvasható |
| `--pip-line` | 0,45 | — | dekoratív körvonal (nem szöveg) |

A pöttyök körvonala külön tokent kapott: az nem szöveg, ott a 3:1 az elvárás, és a
halványabb vonal tartja a vizuális hierarchiát.

Minden vezérlő legalább 44×44 px. A „Vissza" a találati területét negatív margóval
kapta meg, így a felirat a rács szélén maradt.

## Miért nem elég a szemre hangolás

A 3,44:1 „jól nézett ki" a sötét háttéren — a hiba csak méréssel derült ki. Ezért a
gyakorlat: a színskálát a legvilágosabb felületre kell méretezni, és a kontrasztot a
tényleges számított színekből számolni, nem a tokenek nyers értékéből.

## Ami ugyanekkor még bekerült

- `touch-action: manipulation` — a koppintás ne várjon dupla-koppintásos nagyításra.
- Lenyomási visszajelzés minden fő vezérlőn (a hover mobilon nem létezik).
- `dvh` a kártya fotójának magasságára: a mobil böngésző címsora miatt a `vh`
  túlbecsüli a látható területet.

Kapcsolódó: [[felulet-vezerlo]].
