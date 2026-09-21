---
type: Integration
title: Coolify (157.180.21.144)
description: Az app a meetapedia Coolify-példányán fut saját tokennel; a céges coolify.strt.hu tokenje ide nem érvényes.
tags: [integration, coolify, deployment, hetzner]
status: stable
generated: { by: claude-opus-5/claude-code, at: 2026-09-21T09:00:00Z }
---

# Coolify (157.180.21.144)

*Két külön Coolify-példány van a képben, és ez már okozott zavart.*

| | Példány | Mi fut rajta |
|---|---|---|
| Személyes | `http://157.180.21.144:8000` | meetapedia / közösségek.com, marci, szimpatikus2, **learn-birds** |
| Céges | `https://coolify.strt.hu` | gyakorlat.strt.hu, petya.strt.hu, finance, mcp… |

A két példány tokenje **nem cserélhető**: a céges tokennel a személyes példány
`{"message":"Unauthenticated."}`-t ad.

## Hozzáférés

```sh
~/.config/strt/coolify-birds.sh /api/v1/applications      # személyes példány
~/.config/strt/coolify.sh       /api/v1/applications      # céges példány
```

Mindkét helper a tokent fájlból (illetve a keychainből) olvassa, és a
`curl --config -` trükkel adja át, hogy ne kerüljön a parancssorba, a
folyamatlistába vagy a shell-előzménybe.

## Az alkalmazás adatai

| Mező | Érték |
|---|---|
| Projekt | `learn-birds` (`kufgezr6lwrpychoewddxuau`) |
| Alkalmazás | `9fpuemtkvx4d8hlawl9hkhzz` |
| Szerver | `localhost` (`ult9s5h008z6qsmhnqo5c7zl`) |
| Build pack | `dockerfile`, port 80 |
| Domain | `https://9fpuemtkvx4d8hlawl9hkhzz.157.180.21.144.sslip.io`, Let's Encrypt |

## API-furcsaságok

- A `GET /api/v1/deploy` már nem működik: **POST** kell
  (`{"message":"This endpoint has changed to a POST request."}`).
- A `GET /api/v1/deployments` csak a *futó* deployokat listázza; az előzményhez
  `/api/v1/deployments/applications/<uuid>?take=5` kell.
- Az alkalmazás létrehozásakor a domain `http://`-val jön; HTTPS-hez `PATCH`-elni
  kell a `domains` mezőt, utána a Coolify kér tanúsítványt.

Runbook: [[deploy-es-visszaallitas]]. Döntés:
[[2026-09-19-coolify-a-meetapedia-peldanyan]].
