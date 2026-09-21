---
type: Integration
title: GitHub webhook és Actions
description: A main-re érkező push egyszerre indítja a Coolify-deployt (webhookon) és a CI-t (Actions) — a kettő független, a CI nem kapuőr.
tags: [integration, github, ci, deployment]
status: stable
generated: { by: claude-opus-5/claude-code, at: 2026-09-21T09:00:00Z }
---

# GitHub webhook és Actions

## A deploy-webhook

- Repó: `frkandris/learn-birds` (publikus), hook id **681786355**.
- Cél: `http://157.180.21.144:8000/webhooks/source/github/events/manual`,
  `content_type: json`, közös titokkal (a Coolify oldalán
  `manual_webhook_secret_github`).
- Esemény: `push`.

Mérés 2026-09-19-ről: a push után 2 másodperccel érkezett a kézbesítés (HTTP 200),
a deploy 15 másodperc alatt lefutott, és a konténer újra online volt.

A titok sehol nincs fájlban: a beállításkor egy `openssl rand -hex 24` értéket kapott
mindkét oldal, egyetlen parancson belül.

## A CI

`.github/workflows/ci.yml` — `npm test` és `docker build` minden pushra és PR-re.

**A kettő független.** A Coolify a webhookra deployol, akkor is, ha a CI épp bukik.
Ez tudatos kompromisszum egy egyszemélyes projektnél: a kapuőr-szerű beállítás
(Actions → deploy hívás) egy titkot és egy plusz lépést igényelne. Amíg így van,
a `npm test` push előtt a valódi védőháló.

## Ha a deploy nem indul

1. `gh api repos/frkandris/learn-birds/hooks/681786355/deliveries` — mit kézbesített.
2. Ha a kézbesítés hibás (nem 200), a titok vagy az URL romlott el; a hook
   újraállítható ugyanazzal a két paranccsal.
3. Ideiglenes megoldás mindig van: kézi deploy
   ([[deploy-es-visszaallitas]]).
