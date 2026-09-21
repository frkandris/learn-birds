---
type: Runbook
title: Deploy és visszaállítás
description: A main-re érkező push automatikusan deployol; kézi indítás, állapotellenőrzés és visszaállítás a Coolify API-ból, token a parancssor megkerülésével.
tags: [runbook, deployment, coolify]
status: stable
generated: { by: claude-opus-5/claude-code, at: 2026-09-21T09:00:00Z }
---

# Deploy és visszaállítás

Éles cím: <https://9fpuemtkvx4d8hlawl9hkhzz.157.180.21.144.sslip.io>

## Automatikus deploy

A `main`-re érkező push GitHub-webhookon indít deployt, ~15 másodperc alatt lefut
([[github-actions-es-webhook]]). Nincs kapuőr: **a bukó teszt nem állítja meg.**

## Kézi indítás és ellenőrzés

```sh
# deploy indítása
~/.config/strt/coolify-birds.sh "/api/v1/deploy?uuid=9fpuemtkvx4d8hlawl9hkhzz" -X POST

# utolsó deployok (állapot + commit)
~/.config/strt/coolify-birds.sh "/api/v1/deployments/applications/9fpuemtkvx4d8hlawl9hkhzz?take=5"

# él-e, és a helyes MIME-típusokkal
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' <url>/manifest.webmanifest
curl -s -o /dev/null -H 'Range: bytes=0-99' -w '%{http_code}\n' <url>/media/hollo-1.m4a   # 206
```

A helper a tokent a `~/.config/strt/coolify-birds.env`-ből olvassa, és nem teszi
parancssorba ([[coolify]]).

## Offline mód ellenőrzése éles címen

A telepítés után a böngésző konzoljából:

```js
(await navigator.serviceWorker.getRegistrations()).length      // 1
(await caches.open((await caches.keys())[0])).keys().then(k => k.length)   // ~53
```

## Visszaállítás

Nincs külön rollback gomb; a visszaállítás egy `git revert` + push (ami deployol).
Gyors út egy hibás éles állapotból:

```sh
git revert --no-edit <sha> && git push
```

A Coolify a régi image-eket megtartja, de az API-ból való visszaléptetés nincs
felderítve — ha egyszer kell, ez a lap a helye.
