// A tanulandó fajok. Bővítéshez elég ide felvenni egy sort,
// majd újra lefuttatni: npm run fetch
//
// Az `id` a médiafájlok neve is lesz, ezért ékezet nélküli kebab-case.
// A `taxon` a Wikidata és a Commons felé a kulcs — pontos tudományos név kell.
// A `skipFiles` opcionális: olyan Commons-fájlnevekre illesztő szövegrészek,
// amiket a begyűjtés hagyjon ki (rossz fajmeghatározás, zavaró kép).
export const BIRDS = [
  { id: 'hazi-vereb', hu: 'házi veréb', taxon: 'Passer domesticus' },
  // A "Carcassonne - Passereau" képeken a madár aprón, ágak között ül.
  { id: 'csilpcsalpfuzike', hu: 'csilpcsalpfüzike', taxon: 'Phylloscopus collybita', skipFiles: ['Carcassonne - Passereau'] },
  { id: 'barazdabillegeto', hu: 'barázdabillegető', taxon: 'Motacilla alba' },
  { id: 'hollo', hu: 'holló', taxon: 'Corvus corax' },
  { id: 'baratcinege', hu: 'barátcinege', taxon: 'Poecile palustris' },
  { id: 'tengelic', hu: 'tengelic', taxon: 'Carduelis carduelis' },
  { id: 'szirti-galamb', hu: 'szirti galamb', taxon: 'Columba livia' },
  { id: 'vorosbegy', hu: 'vörösbegy', taxon: 'Erithacus rubecula' },
  { id: 'dankasiraly', hu: 'dankasirály', taxon: 'Chroicocephalus ridibundus' },
  // A Commons-kategória a világ összes alfaját tartalmazza; a kelet-ázsiai
  // alakok (karpowi, formosanus, torquatus) mást mutatnak, mint a hazai madár.
  { id: 'facan', hu: 'fácán', taxon: 'Phasianus colchicus',
    skipFiles: ['karpowi', 'formosanus', 'torquatus'] },
  { id: 'kormos-varju', hu: 'kormos varjú', taxon: 'Corvus corone' },
  { id: 'zoldike', hu: 'zöldike', taxon: 'Chloris chloris' },
  { id: 'nagy-fakopancs', hu: 'nagy fakopáncs', taxon: 'Dendrocopos major' },
  { id: 'hazi-rozsdafarku', hu: 'házi rozsdafarkú', taxon: 'Phoenicurus ochruros' },
  // A "Swifts at Breznice" képek a Commonson molnárfecske-kategóriában vannak,
  // de a fájlnevük szerint sarlósfecskék — tanulókártyára alkalmatlanok.
  // A "Swifts at Breznice" képek sarlósfecskék, a "Deloichon" sorozat (elírt
  // fájlnév) pedig fészekfotó; a maradék repülő pontokat mutat az égen.
  { id: 'molnarfecske', hu: 'molnárfecske', taxon: 'Delichon urbicum',
    skipFiles: ['Swifts at Breznice', 'Deloichon', 'Delichon urbicum14', 'Delichon urbicum105', 'Delichon urbicum1341'] },
  { id: 'erdei-pinty', hu: 'erdei pinty', taxon: 'Fringilla coelebs' },
  { id: 'szarka', hu: 'szarka', taxon: 'Pica pica' },
  { id: 'oszapo', hu: 'őszapó', taxon: 'Aegithalos caudatus' },
  { id: 'meggyvago', hu: 'meggyvágó', taxon: 'Coccothraustes coccothraustes' },
  { id: 'szajko', hu: 'szajkó', taxon: 'Garrulus glandarius' },
  { id: 'fekete-rigo', hu: 'fekete rigó', taxon: 'Turdus merula' },
  { id: 'dolmanyos-varju', hu: 'dolmányos varjú', taxon: 'Corvus cornix' },
  { id: 'zold-kullo', hu: 'zöld küllő', taxon: 'Picus viridis' },
  { id: 'tokes-rece', hu: 'tőkés réce', taxon: 'Anas platyrhynchos' },
  { id: 'szencinege', hu: 'széncinege', taxon: 'Parus major' },
  { id: 'balkani-gerle', hu: 'balkáni gerle', taxon: 'Streptopelia decaocto' },
  { id: 'kek-cinege', hu: 'kék cinege', taxon: 'Cyanistes caeruleus' },
];
