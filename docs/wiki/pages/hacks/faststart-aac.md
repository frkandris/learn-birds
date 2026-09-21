---
type: Hack
title: AAC faststart és bájttartomány-kérések
description: A hang csak akkor indul el Safariban, ha a fejléc a fájl elején van (+movflags faststart) és a kiszolgáló 206-tal válaszol a Range-kérésekre.
tags: [audio, ffmpeg, nginx, ios]
status: stable
generated: { by: claude-opus-5/claude-code, at: 2026-09-21T09:00:00Z }
resource: scripts/fetch-birds.mjs
---

# AAC faststart és bájttartomány-kérések

*Két külön beállítás, ugyanazzal a tünettel: a hang nem indul el.*

## 1. A fejléc a fájl elején (`+movflags faststart`)

Az `ffmpeg` alapértelmezésben a `moov` atomot (a médiafejlécet, ami a keresési
táblát tartalmazza) az MP4/M4A **végére** írja. Ilyen fájlt a böngésző csak a
teljes letöltés után tud lejátszani — vagy sehogy:

```
{ paused: false, currentTime: 0, readyState: 0 }   // örökre így marad
```

Javítás a kódolásban (`scripts/fetch-birds.mjs`):

```sh
ffmpeg -i in.mp3 -t 22 -ac 1 -c:a aac -b:a 96k -movflags +faststart out.m4a
```

Meglévő fájlokon újrakódolás nélkül is megoldható:

```sh
ffmpeg -i régi.m4a -c copy -movflags +faststart új.m4a
```

## 2. A kiszolgáló válaszoljon 206-tal

A médialejátszók bájttartományt kérnek (`Range: bytes=0-`). Safari **kizárólag**
így tölt médiát: ha a szerver a teljes fájlt adja 200-zal, a lejátszás el sem
indul. Ezért:

- a fejlesztői szerver (`scripts/serve.mjs`) kezeli a `Range` fejlécet és 206-ot ad;
- az nginx `Accept-Ranges: bytes`-t hirdet (`deploy/nginx.conf`).

Ellenőrzés:

```sh
curl -s -o /dev/null -H 'Range: bytes=0-99' -w '%{http_code}\n' <url>/media/hollo-1.m4a
# 206
```

## Miért fontos

A tünet megtévesztő: a `play()` ígérete teljesül, az esemény lefut, csak épp nincs
hang. Ugyanezt a tünetet adja a felfüggesztett hangkörnyezet is
([[2026-09-18-nema-lejatszas-felfuggesztett-audiocontext]]) — a kettőt a
`readyState` és egy friss `new Audio()` teszt különbözteti meg.
