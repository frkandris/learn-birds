# Fogalomtár

Rövid, egysoros meghatározások. A részletek a [[index]]-ből nyíló oldalakon.

## Tanulás

- **Kártya** — egy faj egy módban (`<faj-id>|both` vagy `<faj-id>|sound`); ez az
  ütemezés egysége. Lásd [[ket-keszseg-ket-pakli]].
- **Szint (`level`)** — 0–6 közötti egész, ami megmondja, hányadik lépcsőn áll a
  kártya; a lépcsők 1/3/7/16/35/90 nap.
- **Esedékesség (`due`)** — az a naptári nap, amikortól a kártya újra előkerül.
- **Napi adag (`dose`)** — hány fajt akar a felhasználó egy körben gyakorolni
  (3/5/8/12).
- **Kör (round)** — egy gyakorlóalkalom; addig tart, amíg minden kiválasztott madár
  egyszer sikerül.
- **`clean`** — elsőre sikerült-e; ez dönti el, hogy a szint nő-e vagy nullázódik.
- **Visszaesés (`lapse`)** — hibás válasz egy korábban már tudott kártyán.
- **Sorozat (`streak`)** — hány napja gyakorol egyhuzamban a felhasználó.
- **Szabadgyakorlás** — ha mára minden faj pihen, a soron következő esedékességek
  jönnek elő, előrehozva.

## Hang

- **Szonogram** — idő-frekvencia rajz a felvételről; a madarászok ezt olvassák.
  Lásd [[szonogram-olvasas]].
- **Írótoll** — a szonogramon a pillanatnyi lejátszási helyet jelölő függőleges vonal.
- **`faststart`** — MP4/M4A fejléc a fájl elején, ami nélkül a lejátszás el sem indul
  ([[faststart-aac]]).
- **`loudnorm`** — az `ffmpeg` hangosságkiegyenlítő szűrője (EBU R128), hogy a
  felvételek azonos szinten szóljanak.
- **Bájttartomány-kérés (`Range`)** — a lejátszó részletekben kéri a fájlt; Safari
  csak így tölt médiát.

## Adat

- **Taxonnév** — a tudományos (latin) fajnév; ez a kulcs a Wikidata és a Commons felé.
- **`P18` / `P51` / `P225`** — Wikidata-tulajdonságok: kép, hang, taxonnév.
- **`extmetadata`** — a Commons API mezője, ami a szerzőt és a licencet adja.
- **Tiltólista (blocklist)** — regex a fájlnévre és a Commons-kategóriákra, ami a
  tojás-, fészek- és múzeumi képeket kiszűri ([[media-begyujto]]).

## Üzemeltetés

- **PWA** — telepíthető webalkalmazás; itt: főképernyő-ikon + offline gyorsítótár.
- **Service worker** — a böngészőben futó proxy, ami az offline működést adja
  ([[offline-gyorsitotar]]).
- **sslip.io** — DNS-szolgáltatás, ami az IP-címet domainné teszi; a Coolify ezt
  adja automatikus címnek.
- **Deploy-webhook** — a GitHub push-értesítése a Coolify felé
  ([[github-actions-es-webhook]]).
