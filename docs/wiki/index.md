---
okf_version: "0.2"
---

# Wiki Index

Tartalomkatalógus: egy sor oldalanként, kategóriánként csoportosítva, minden sor
az oldal `description` frontmatterét tükrözi. Az oldalformátum a
[SCHEMA.md](SCHEMA.md)-ben, a frissítési triggerek a [CLAUDE.md](CLAUDE.md)-ben.
Gyökérszintű társak: [glossary.md](glossary.md) (fogalomtár), [faq.md](faq.md)
(visszatérő kérdések).

## Architektúra

- [[rendszerkep]] — Build-időben begyűjtött média, statikus fájlok nginx mögött, és minden tanulási állapot a böngészőben — nincs szerveroldali logika.
- [[vegigvezetett-pelda]] — Végigvezetett példa a kék cinegén: SPARQL-lekérdezéstől az AAC-kódoláson át a felfedett válaszig és a következő esedékességig.

## Fogalmak

- [[harom-mod-harom-pakli]] — Csak kép, csak hang, és a kettő együtt — minden mód külön kártya külön ütemezéssel, ezért ugyanaz a faj a három módban külön szinten állhat.
- [[ismetlesi-modell]] — Hat lépcsős, szint alapú ütemezés (1/3/7/16/35/90 nap) kétértékű válasszal; a hiba nullázza a szintet, a kör pedig addig tart, amíg minden madár sikerül.
- [[szonogram-olvasas]] — A hang-mód futó szonogramja a ritmust és a hangmagasságot mutatja, a fajt viszont a fülnek kell eldöntenie — ezért van a rajz a válasz előtt is.

## Modulok

- [[felulet-vezerlo]] — A három nézet renderelése, az eseménykezelés és a kör vezérlése — minden DOM-érintés itt van, modulszintű állapottal.
- [[gyakorlokor-modul]] — A Round osztály tartja a pakli sorrendjét, a visszadobott kártyákat és a kör eredményét; DOM és tároló nélkül, ezért tesztelhető.
- [[hanglejatszas-es-szonogram]] — A Player osztály egy <audio> elemet és egy Web Audio elemzőt köt össze, és képkockánként rajzolja a futó szonogramot.
- [[media-begyujto]] — Wikidata + Commons lekérdezés, minőségi szűrés, kép- és hangátalakítás, és a birds.json kiírása licencadatokkal.
- [[offline-gyorsitotar]] — Telepítéskor bekerül az app, a média és a betűk; a média cache-first, az app kódja network-first, hogy a frissítés azonnal látsszon.
- [[tanulasi-allapot]] — Az ütemezés és a localStorage-ban tárolt állapot tiszta függvényei — a modul nem ismeri a DOM-ot, ezért Node-ból tesztelhető.

## Döntések

- [[2026-09-18-commons-a-xeno-canto-helyett]] — A xeno-canto API v2 megszűnt, a v3 kulcsot kér — a hangok a Commonsra átemelt xeno-canto felvételekből jönnek, kulcs nélkül.
- [[2026-09-18-hibas-kartya-a-pakli-vegere]] — A kör addig tart, amíg minden madár egyszer sikerül; a visszadobott kártya a sor végére megy, és `miss` marad az ütemezés szempontjából.
- [[2026-09-18-keretrendszer-nelkul]] — Natív ES-modulok, nulla függőség és nulla build — a projekt mérete nem indokol bundlert, cserébe a telepítés és a hosszú távú karbantartás triviális.
- [[2026-09-18-ket-gomb-az-ertekelesre]] — „Erre gondoltam" és „Nem erre gondoltam" — az önértékelés bináris, mert a felhasználó kérése is az volt, és a finomabb skála nem javítana az ütemezésen.
- [[2026-09-19-coolify-a-meetapedia-peldanyan]] — Statikus nginx-image saját Coolify-alkalmazásként, sslip.io domainen, GitHub-webhookkal — nem GitHub Pages, mert az offline PWA-hoz HTTPS és saját fejlécek kellenek.
- [[2026-09-22-akadalymentessegi-alapszint]] — Mért kontraszt és tapintható méret: a három szövegszint a leghalványabb felületen is 4.5:1 fölött marad, minden vezérlő legalább 44×44 px.
- [[2026-09-22-harmadik-mod-es-huszonhet-faj]] — A csak kép mód külön kártyatípusként került be (nem a kettős mód szűkítéseként), és a pakli 27 fajra nőtt — ezért lett a napi adag alapértéke 3.

## Trükkök

- [[faststart-aac]] — A hang csak akkor indul el Safariban, ha a fejléc a fájl elején van (+movflags faststart) és a kiszolgáló 206-tal válaszol a Range-kérésekre.
- [[frekvenciafuggo-szonogram-kuszob]] — A terepi felvételek alapzaja a mély tartományban a legerősebb, ezért a rajz küszöbe lefelé haladva nő — így a madár kiemelkedik, a zaj eltűnik.
- [[ikonok-sips-szel]] — A macOS beépített `sips` parancsa SVG-t is renderel PNG-be, így az ikonkészlet függőség nélkül generálható a scripts/icon.svg-ből.

## Post-mortemek

- [[2026-09-18-hatterlapon-nem-fut-a-rajzolas]] — A hibásnak hitt rajzoló hurok valójában jó volt — a böngésző a nem látható lapon felfüggeszti a requestAnimationFrame hívásokat, ami tesztelési, nem alkalmazásbeli hiba.
- [[2026-09-18-nema-lejatszas-felfuggesztett-audiocontext]] — A hang „elindult", de a readyState 0 maradt: a Web Audio elemző felfüggesztett állapotban megállítja a rá kötött <audio> elem lejátszását.
- [[2026-09-18-regi-kod-a-gyorsitotarbol]] — A cache-first service worker a módosított modulok helyett a telepítéskori változatot adta vissza, így a javítások látszólag hatástalanok maradtak.
- [[2026-09-18-tojasfoto-a-wikidatabol]] — A Wikidata P18 képe egy múzeumi tojásgyűjtemény fotója volt; a fájlnév-alapú szűrés nem fogta meg, a Commons-kategóriák alapú igen.
- [[2026-09-22-a-gyorsitotar-ket-csendes-hibaja]] — Külső review derítette ki, hogy a cserélt média a telepített appban régi maradt volna, és hogy a service worker a bájttartomány-kérésre teljes fájlt adott — Safariban ez néma offline lejátszást jelent.
- [[2026-09-22-nema-fajok-az-ogg-mime-tipus-miatt]] — A Commons az application/ogg típust adja a régi felvételekre, amit az audio/ előtagra szűrő feltétel csendben eldobott — a hiányt csak a begyűjtés összesítője mutatta.

## Runbookok

- [[deploy-es-visszaallitas]] — A main-re érkező push automatikusan deployol; kézi indítás, állapotellenőrzés és visszaállítás a Coolify API-ból, token a parancssor megkerülésével.
- [[fejlesztoi-futtatas]] — npm start a helyi kiszolgálóhoz, npm test a logikához, és a böngészős füstteszt lépései a felülethez.
- [[iphone-telepites]] — Safari → Megosztás → Főképernyőhöz adás; HTTPS kell hozzá, a helyi hálózati cím nem elég, és a frissítés az ikonból indítva is megjön.
- [[kulso-review]] — Hogyan nézessük át a munkát másik modellel és mérhető UI-ellenőrzőlistával — a két parancs, mit talált eddig, és mit nem érdemes tőlük várni.
- [[teszteles-es-ci]] — A kockázatos logikát Node beépített tesztfutója fedi (kör, ütemezés, wiki-lint); a GitHub Actions ugyanezt futtatja, plusz a Docker-image épülését.
- [[uj-madar-felvetele]] — Egy sor a scripts/birds.js-be, npm run fetch, a képek vizuális ellenőrzése kontaktlapon, majd commit — a média a repóban verziózva él.

## Integrációk

- [[coolify]] — Az app a meetapedia Coolify-példányán fut saját tokennel; a céges coolify.strt.hu tokenje ide nem érvényes.
- [[github-actions-es-webhook]] — A main-re érkező push egyszerre indítja a Coolify-deployt (webhookon) és a CI-t (Actions) — a kettő független, a CI nem kapuőr.
- [[wikimedia-commons]] — Kulcs nélküli API-k a képekhez, hangokhoz és licencadatokhoz; a szerződés, a szűrési fogódzók és a User-Agent követelmény.
