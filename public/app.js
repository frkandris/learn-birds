import {
  loadState, saveState, clearState, pickSession, schedule, counts,
  cardStatus, streak, daysUntil, today, usableIn, MAX_LEVEL, MODES, MODE_LABEL,
} from './srs.js';
import { Player } from './audio.js';
import { Round } from './round.js';

const $ = (id) => document.getElementById(id);
const DOSES = [3, 5, 8, 12];
const START_BUTTON = { image: 'start-image', sound: 'start-sound', both: 'start-both' };
const MODE_NOTE = {
  image: 'Fotó, hang nélkül — a tollruha.',
  sound: 'Semmi kép. Ahogy a terepen hallod.',
  both: 'A kettő együtt — a teljes madár.',
};
const SKILL_LABEL = { image: 'kép', sound: 'hang', both: 'kép+hang' };

let birds = [];
let state = loadState();
let round = null;
let revealed = false;
let freePractice = false;  // ma már nem esedékes kártyákat forgatunk
let autoPlay = null;       // a következő kártya hangjának időzítője
let shownDay = today();    // melyik nap szerint rajzoltuk ki a nézeteket

const player = new Player($('audio'), $('spectro'));

/* ---------- indulás ---------- */

async function boot() {
  let data;
  try {
    const res = await fetch('data/birds.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
    if (!Array.isArray(data?.birds)) throw new Error('hiányzó birds tömb');
  } catch {
    $('today-lead').hidden = false;
    $('today-lead').textContent = 'A madarak adatai nem töltődtek be. Indítsd az alkalmazást webszerverről (npm start).';
    return;
  }
  birds = data.birds.filter((bird) => bird.images?.length || bird.audio?.length);

  renderDose();
  renderToday();
  renderBirds();
  wire();
  renderOfflineState();

  // Fejlesztés közben (localhost) nincs offline gyorsítótár, hogy a
  // módosított fájlok azonnal látszódjanak.
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  if ('serviceWorker' in navigator && !local) {
    // Az első látogatáskor a jelzés csak a telepítés után lesz igaz, ezért az
    // aktiválás után újra lefut — enélkül a következő oldalbetöltésig hallgatna.
    navigator.serviceWorker.addEventListener('controllerchange', renderOfflineState);
    navigator.serviceWorker
      .register('sw.js')
      .then(() => navigator.serviceWorker.ready)
      .then(renderOfflineState)
      .catch(() => {
        // Offline gyorsítótár nélkül is használható marad.
      });
  }
}

/* ---------- Ma ---------- */

function renderToday() {
  const byMode = new Map(MODES.map((mode) => [mode, counts(state, birds, mode)]));
  const waiting = MODES.reduce((sum, mode) => sum + byMode.get(mode).ready, 0);

  $('today-title').textContent = waiting ? 'Mai adag' : 'Mára megvan';

  for (const mode of MODES) {
    const count = byMode.get(mode);
    const usable = birds.some((bird) => usableIn(bird, mode));
    const ready = Math.min(count.ready, state.dose);
    const button = $(START_BUTTON[mode]);
    button.disabled = !usable;
    button.querySelector('.start-count').textContent = usable ? ready || '↻' : '–';
    button.querySelector('.start-note').textContent = usable
      ? (ready ? MODE_NOTE[mode] : `${MODE_NOTE[mode]} Mára kész, de átforgathatod újra.`)
      : 'Ehhez a módhoz még nincs elég média.';
  }

  const days = streak(state);
  $('today-foot').textContent = days ? `${days} napja gyakorolsz egyhuzamban.` : '';
}

function renderDose() {
  const box = $('dose');
  box.innerHTML = '';
  for (const n of DOSES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = n;
    btn.setAttribute('aria-pressed', String(n === state.dose));
    btn.addEventListener('click', () => {
      state.dose = n;
      saveState(state);
      renderDose();
      renderToday();
    });
    box.append(btn);
  }
}

/* ---------- Fajok ---------- */

function renderBirds() {
  const list = $('bird-list');
  list.innerHTML = '';

  for (const bird of birds) {
    const li = document.createElement('li');
    li.className = 'bird';

    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.className = 'bird-row';

    const img = document.createElement('img');
    if (bird.images[0]) img.src = bird.images[0].file;
    img.alt = '';
    img.loading = 'lazy';

    const text = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'bird-name';
    name.textContent = capitalize(bird.name);
    const chevron = document.createElement('span');
    chevron.className = 'chevron';
    chevron.setAttribute('aria-hidden', 'true');
    name.append(' ', chevron);
    const latin = document.createElement('div');
    latin.className = 'bird-latin';
    latin.textContent = bird.taxon;
    text.append(name, latin);

    const skills = document.createElement('div');
    skills.className = 'skills';
    skills.append(...MODES.map((mode) => skillRow(bird, mode)));

    summary.append(img, text, skills);
    const panel = document.createElement('div');
    panel.className = 'bird-detail';
    // A tartalom csak első kinyitáskor épül fel: 27 fajnál a képek és a
    // lejátszók előre legyártva fölösleges DOM-ot és kéréseket jelentenének.
    details.addEventListener('toggle', () => {
      if (details.open && !panel.childElementCount) fillDetail(panel, bird);
      if (!details.open) stopDetailAudio(panel);
    });

    details.append(summary, panel);
    li.append(details);
    list.append(li);
  }

  $('birds-lead').textContent =
    `${birds.length} faj, módonként külön haladással. Koppints egy fajra: ott a fotói, a felvételei és a szerzőik.`;
}

// Egy faj teljes anyaga: a kártyákon látható fotók és hangok, forrással.
function fillDetail(panel, bird) {
  if (bird.images.length) {
    const photos = document.createElement('div');
    photos.className = 'detail-photos';
    for (const image of bird.images) {
      const figure = document.createElement('figure');
      const img = document.createElement('img');
      img.src = image.file;
      img.alt = `${capitalize(bird.name)} — fotó`;
      img.loading = 'lazy';
      const caption = document.createElement('figcaption');
      caption.append(...attribution(image));
      figure.append(img, caption);
      photos.append(figure);
    }
    panel.append(photos);
  }

  for (const sound of bird.audio) {
    const row = document.createElement('div');
    row.className = 'detail-audio';
    const player = document.createElement('audio');
    player.controls = true;
    player.preload = 'none';
    player.src = sound.file;
    const credit = document.createElement('p');
    credit.className = 'detail-credit';
    credit.append(...attribution(sound));
    row.append(player, credit);
    panel.append(row);
  }
}

// Szerző és licenc, a forrásra és a licenc szövegére mutató linkkel: a szabad
// licencek többsége a megnevezés mellett ezt is kéri, ahol megoldható.
function attribution(item) {
  const link = (text, href) => {
    if (!href) return text;
    const a = document.createElement('a');
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = text;
    return a;
  };
  return [link(item.author, item.source), ' · ', link(item.license, item.licenseUrl)];
}

function skillRow(bird, mode) {
  const row = document.createElement('span');
  row.className = `skill ${mode}`;

  const label = document.createElement('span');
  label.className = 'skill-label';
  label.textContent = SKILL_LABEL[mode];

  const pips = document.createElement('span');
  pips.className = 'pips';
  const status = cardStatus(state, bird.id, mode);
  for (let i = 0; i < MAX_LEVEL; i += 1) {
    const pip = document.createElement('span');
    pip.className = 'pip' + (i < status.level ? ' on' : '');
    pips.append(pip);
  }

  const when = document.createElement('span');
  when.className = 'skill-when';
  when.textContent = whenLabel(status, !usableIn(bird, mode));
  row.append(label, pips, when);
  return row;
}

function whenLabel(status, missing) {
  if (missing) return 'nincs média';
  if (status.state === 'new') return 'új';
  if (status.state === 'due') return 'ma';
  const days = daysUntil(status.due);
  return days === 1 ? 'holnap' : `${days} nap`;
}

// Ha a média már a készüléken van, azt érdemes tudni: onnantól térerő nélkül
// is megy a gyakorlás. A fájlok számából következtetni félrevezető lenne (az
// app és a betűk maguktól is kitesznek tucatnyit), ezért tételesen nézzük meg,
// hány fotó és felvétel van meg a gyorsítótárban.
async function renderOfflineState() {
  const note = $('offline-note');
  note.hidden = true;
  try {
    if (!('caches' in window) || !navigator.serviceWorker?.controller) return;

    const stored = new Set();
    for (const name of await caches.keys()) {
      for (const request of await (await caches.open(name)).keys()) {
        stored.add(new URL(request.url).pathname);
      }
    }

    const media = birds.flatMap((bird) => [...bird.images, ...bird.audio].map((item) => item.file));
    const present = media.filter((file) => stored.has(new URL(file, location.href).pathname)).length;
    if (!present) return;

    note.textContent = present === media.length
      ? `Offline is működik: mind a ${media.length} fotó és felvétel a készüléken van.`
      : `Offline részben: ${present} a ${media.length} fotóból és felvételből van meg.`;
    note.hidden = false;
  } catch {
    // A gyorsítótár lekérdezése nem létfontosságú, a jelzés ilyenkor elmarad.
  }
}

/* ---------- Gyakorlás ---------- */

function startSession(mode) {
  const picked = pickSession(state, birds, mode, state.dose);
  if (!picked.length) return;

  player.unlock(); // még a gombnyomás gesztusán belül
  round = new Round({ mode, birds: picked });
  freePractice = counts(state, birds, mode).ready === 0;

  stopDetailAudio();
  setBackgroundInert(true);
  $('session').hidden = false;
  $('session').dataset.mode = mode;
  $('session-mode').textContent = [
    MODE_LABEL[mode],
    `${picked.length} madár`,
    freePractice ? 'szabadgyakorlás — az ütemezés nem változik' : null,
  ].filter(Boolean).join(' · ');
  document.body.style.overflow = 'hidden';
  showCard();
  $('reveal').focus({ preventScroll: true });
}

// A gyakorlás és az összegzés modális réteg: amíg nyitva van, a mögötte lévő
// felület ne legyen fókuszálható, se képernyőolvasóval bejárható.
function setBackgroundInert(on) {
  for (const el of [document.querySelector('.app'), document.querySelector('.tabbar')]) {
    if (el) el.inert = on;
  }
}

// A fajlista natív lejátszói nem a Player kezében vannak: gyakorlás indításakor,
// fülváltáskor és a panel becsukásakor el kell hallgatniuk, különben két hang
// szól egyszerre.
function stopDetailAudio(root = document) {
  for (const audio of root.querySelectorAll('.bird-detail audio')) {
    if (!audio.paused) audio.pause();
  }
}

function showCard() {
  const item = round.current;
  if (!item) return finishSession();

  const withPhoto = round.mode !== 'sound' && item.image;
  const withSound = round.mode !== 'image' && item.audio;

  revealed = false;
  $('card').classList.remove('revealed');
  $('answer').hidden = true;
  $('reveal').hidden = false;
  $('grade').hidden = true;
  $('photo').hidden = !withPhoto;
  $('sound').hidden = !withSound;
  $('sound-hint').textContent = 'Koppints a hanghoz';

  if (item.image) {
    const photo = $('photo-img');
    const wanted = item.image.file;
    photo.classList.remove('ready');
    // Hibánál is megjelenítjük: jobb a böngésző törött-kép jelzése, mint egy
    // üresnek tűnő kártya. A késve érkező esemény viszont ne jelölje késznek a
    // következő kártya képét — ezért ellenőrizzük, melyik fájlról van szó.
    const markReady = () => {
      if (photo.src.endsWith(wanted)) photo.classList.add('ready');
    };
    photo.onload = markReady;
    photo.onerror = markReady;
    photo.src = wanted;
    photo.alt = withPhoto ? 'A felismerendő madár fotója' : '';
    if (photo.complete) markReady(); // gyorsítótárból azonnal kész
  }

  player.clear();
  clearTimeout(autoPlay);
  if (withSound) {
    player.load(item.audio.file);
    // Rövid késleltetés, hogy a kártya előbb kirajzolódjon; ha közben tovább
    // lépünk vagy kilépünk, ez az időzítő törlődik. Ha a felhasználó addig
    // maga elindította, a play() nem nyúl hozzá.
    autoPlay = setTimeout(() => player.play(), 320);
  }

  renderProgress();
  replay($('stage'));
}

// A kártyaváltás látsszon is: az animáció csak kíséri az állapotot, nem
// hordozza — az osztály eltávolítása és a reflow újraindítja, gyors
// értékelésnél is.
function replay(element) {
  element.classList.remove('enter');
  void element.offsetWidth;
  element.classList.add('enter');
}

function renderProgress() {
  const box = $('progress');
  box.innerHTML = '';
  for (const { state: mark } of round.progress()) {
    const span = document.createElement('span');
    if (mark) span.className = mark;
    box.append(span);
  }
}

function reveal() {
  const item = round.current;
  revealed = true;
  $('card').classList.add('revealed');
  $('photo').hidden = !item.image;
  // Hang-módban a fotó csak most jelenik meg: eddig dekoratív volt, mostantól
  // a válasz része.
  if (item.image) $('photo-img').alt = `${capitalize(item.bird.name)} — a megfejtés fotója`;
  $('answer').hidden = false;
  $('reveal').hidden = true;
  $('grade').hidden = false;
  $('answer-name').textContent = capitalize(item.bird.name);
  $('answer-latin').textContent = item.bird.taxon;
  $('answer-credit').textContent = credit(item);
  // A felfedő gomb eltűnt, és a következő lépés az értékelés: a fókusz oda
  // kerül. (Feltételhez kötni nem lehet: mire ide érünk, a böngésző már
  // elvette a fókuszt a rejtett gombtól.)
  $('grade-good').focus({ preventScroll: true });
}

function credit(item) {
  const parts = [];
  if (item.image) parts.push(`Fotó: ${item.image.author}`);
  if (round.mode !== 'image' && item.audio) parts.push(`Hang: ${item.audio.author}`);
  return parts.join(' · ');
}

function grade(ok) {
  const settled = round.grade(ok);
  if (settled) {
    schedule(state, settled.birdId, round.mode, settled.clean, { reschedule: !freePractice });
    saveState(state);
  }
  player.stop();
  showCard();
}

function finishSession() {
  const day = state.days[today()] ?? { cards: 0, clean: 0 };
  const { total, clean, missed, minutes } = round.summary();

  $('done-kicker').textContent = freePractice
    ? `${MODE_LABEL[round.mode]} · szabadgyakorlás`
    : MODE_LABEL[round.mode];
  $('done-title').textContent = clean === total ? 'Mind elsőre megvolt' : 'Kör letudva';
  $('done-stats').innerHTML = '';
  const rows = [
    ['Madarak ebben a körben', `${total}`],
    ['Elsőre sikerült', `${clean}`],
    ['Ismétlésre szorult', `${missed}`],
    ['Eltelt idő', `${minutes} perc`],
    ['Ma összesen', `${day.cards} kártya`],
  ];
  for (const [label, value] of rows) {
    const wrap = document.createElement('div');
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = value;
    wrap.append(dt, dd);
    $('done-stats').append(wrap);
  }

  const mode = round.mode;
  closeSession();
  setBackgroundInert(true); // az összegzés is modális
  $('done').hidden = false;
  $('done-close').focus({ preventScroll: true });
  $('done-again').onclick = () => {
    $('done').hidden = true;
    startSession(mode);
  };
}

function closeSession() {
  clearTimeout(autoPlay);
  autoPlay = null;
  player.stop();
  player.clear();
  round = null;
  revealed = false;
  freePractice = false;
  $('session').hidden = true;
  document.body.style.overflow = '';
  setBackgroundInert(false);
  renderToday();
  renderBirds();
}

/* ---------- események ---------- */

function wire() {
  for (const mode of MODES) $(START_BUTTON[mode]).addEventListener('click', () => startSession(mode));
  $('reveal').addEventListener('click', reveal);
  $('grade-good').addEventListener('click', () => grade(true));
  $('grade-again').addEventListener('click', () => grade(false));
  $('session-close').addEventListener('click', closeSession);
  $('play').addEventListener('click', () => player.toggle());
  $('done-close').addEventListener('click', () => {
    $('done').hidden = true;
    setBackgroundInert(false);
  });

  $('reset').addEventListener('click', () => {
    if (!confirm('Biztos törlöd a haladást? Minden faj visszaáll tanulatlanra.')) return;
    clearState();
    state = loadState();
    renderDose();
    renderToday();
    renderBirds();
    window.scrollTo(0, 0);
  });

  // A telepített app a háttérben napokig élhet újratöltés nélkül (iOS). Ha
  // közben napot váltottunk, a Ma nézet a tegnapi állapotot mutatná — reggel
  // „Mára megvan" az esedékes ismétlések helyett.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden || today() === shownDay) return;
    shownDay = today();
    renderToday();
    renderBirds();
  });

  player.onChange((event) => {
    $('play').classList.toggle('playing', event === 'play');
    $('play').setAttribute('aria-label', event === 'play' ? 'Hang megállítása' : 'Hang lejátszása');
    if (event === 'ended') $('sound-hint').textContent = 'Koppints, ha újra hallanád';
    if (event === 'error') $('sound-hint').textContent = 'A hang nem indult el — koppints a gombra';
  });

  for (const tab of document.querySelectorAll('.tab')) {
    tab.addEventListener('click', () => {
      for (const other of document.querySelectorAll('.tab')) {
        other.classList.toggle('is-current', other === tab);
        // A képernyőolvasó is tudja meg, melyik nézet aktív — az osztály csak a szemnek szól.
        if (other === tab) other.setAttribute('aria-current', 'page');
        else other.removeAttribute('aria-current');
      }
      for (const view of document.querySelectorAll('.view')) view.hidden = view.dataset.view !== tab.dataset.tab;
      stopDetailAudio();
      window.scrollTo(0, 0);
    });
  }

  document.addEventListener('keydown', (event) => {
    // A módosítóval lenyomott billentyű a böngészőé (pl. Alt+← = vissza).
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'Escape' && !$('done').hidden) {
      $('done-close').click();
      return;
    }
    if ($('session').hidden) return;
    if (event.key === 'Escape') closeSession();
    // A szóköz és az Enter a fókuszált gomb sajátja — a kártyát csak akkor
    // fedjük fel, ha a fókusz nincs vezérlőn (különben a lejátszógomb
    // billentyűzetről használhatatlan lenne).
    const onControl = document.activeElement?.closest('button, a, [role="button"], audio, input');
    if ((event.key === ' ' || event.key === 'Enter') && !onControl) {
      event.preventDefault();
      if (!revealed) reveal();
    }
    if (revealed && (event.key === '1' || event.key === 'ArrowLeft')) grade(false);
    if (revealed && (event.key === '2' || event.key === 'ArrowRight')) grade(true);
  });
}

/* ---------- apró segédek ---------- */

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

boot();
