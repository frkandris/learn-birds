---
type: Decision
title: Coolify-deploy a meetapedia példányán
description: Statikus nginx-image saját Coolify-alkalmazásként, sslip.io domainen, GitHub-webhookkal — nem GitHub Pages, mert az offline PWA-hoz HTTPS és saját fejlécek kellenek.
tags: [decision, deployment, coolify]
status: stable
generated: { by: claude-opus-5/claude-code, at: 2026-09-21T09:00:00Z }
sources:
  - { id: commit-docker, resource: "git:e2f668b", title: "Docker-image a statikus kiszolgáláshoz" }
---

# Coolify-deploy a meetapedia példányán

*2026-09-19: az app a 157.180.21.144-es Coolify-példányra került, ahol a meetapedia
is fut.*

## Mérlegelt lehetőségek

| Lehetőség | Mérlegelés |
|---|---|
| GitHub Pages | Ingyen, HTTPS-sel, de a fejlécek nem állíthatók (MIME-típus, `Accept-Ranges`, cache), és a repónak publikusnak kell maradnia. |
| Helyi hálózat (`npm start`) | Nincs HTTPS, tehát nincs service worker és nincs offline mód; csak otthon. |
| **Coolify, Dockerfile build pack** | Saját nginx-konfiguráció, HTTPS Let's Encrypttel, ugyanaz az üzemeltetési felület, amit a többi projekt is használ. |

## Döntés

`nginx:1.27-alpine` image, ami a `public/` mappát szolgálja ki
(`deploy/nginx.conf`), a `learn-birds` Coolify-projektben, automatikus sslip.io
domainen.

## Miért számít a saját nginx

- A `.webmanifest` alapból `application/octet-stream` lenne, az `.m4a` pedig
  `audio/x-m4a` — mindkettőt javítja a `mime.types` két soros módosítása.
- `Accept-Ranges: bytes` — enélkül a Safari el sem indítja a hangot
  ([[faststart-aac]]).
- A média egy napig cache-elhető, az app kódja viszont `no-cache` — így a deploy
  azonnal látszik, a nagy fájlok mégsem töltődnek újra.

## Következmények

- A **push egyben deploy** ([[github-actions-es-webhook]]): a `main`-re érkező
  változás ~15 másodperc múlva éles. A CI nem kapuőr — ha a teszt bukik, a deploy
  attól még lefut.
- A domain csúnya (`9fpuemtkvx4d8hlawl9hkhzz.157.180.21.144.sslip.io`), de a
  telefonon úgyis ikonként nyílik ([[iphone-telepites]]).
- A Coolify-példány külön tokent igényel, nem a céges `coolify.strt.hu`-ét
  ([[coolify]]).
