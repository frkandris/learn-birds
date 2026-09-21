# GYIK

Kérdések, amik kétszer is előkerültek, a válaszra mutató linkkel.

**Miért nem a xeno-canto API-ból jönnek a hangok?**
Mert az API v2 megszűnt, a v3 pedig kulcsot kér. A Commonson viszont ott van a
xeno-canto felvételek java, kulcs nélkül — [[2026-09-18-commons-a-xeno-canto-helyett]].

**Elindult a lejátszás, de nem hallok semmit. Mi a teendő?**
Nézd meg a `readyState`-et: ha 0 marad, vagy a fájl fejléce van rossz helyen
([[faststart-aac]]), vagy a hangkörnyezet aludt el
([[2026-09-18-nema-lejatszas-felfuggesztett-audiocontext]]).

**Miért nem látszik a módosításom a böngészőben?**
Localhoston nem lehet a service worker (nem is regisztrálódik), de ha korábban
beragadt egy, az a régi kódot adja — [[2026-09-18-regi-kod-a-gyorsitotarbol]].

**A szonogram üres. Elromlott?**
Automatizált böngészőben normális: a nem látható lapon nem fut a rajzoló hurok —
[[2026-09-18-hatterlapon-nem-fut-a-rajzolas]].

**Hogyan veszek fel új madarat?**
Egy sor a `scripts/birds.js`-be, `npm run fetch`, majd **nézd is meg a képeket** —
[[uj-madar-felvetele]].

**Miért nem javítja a szintet, ha másodszorra eltaláltam?**
Mert a `miss` ragadós: a körön belüli ismétlés nem számít elsőre tudásnak —
[[2026-09-18-hibas-kartya-a-pakli-vegere]].

**Tudja két telefonom szinkronizálni a haladást?**
Nem. Az állapot a `localStorage`-ban van, készülékenként külön —
[[rendszerkep]].

**Miért olyan csúnya az éles cím?**
Mert a Coolify automatikus sslip.io domainjét kapta; a telefonon ikonként nyílik,
így ritkán látszik — [[2026-09-19-coolify-a-meetapedia-peldanyan]].

**Melyik Coolify-token kell?**
A személyes példányé (`coolify-birds.sh`); a céges `coolify.strt.hu` tokenje itt
érvénytelen — [[coolify]].

**Elég egy push a deployhoz?**
Igen, a webhook ~15 másodperc alatt kiviszi. A CI viszont nem kapuőr: bukó teszttel
is deployol — [[github-actions-es-webhook]].
