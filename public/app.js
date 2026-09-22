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
    $('today-lead').textContent = 'A madarak adatai nem töltődtek be. Indítsd az alkalmazást webszerverről (npm start).';
    return;
  }
  birds = data.birds.filter((bird) => bird.images?.length || bird.audio?.length);

  renderDose();
  renderToday();
  renderBirds();
  renderSources();
  wire();

  // Fejlesztés közben (localhost) nincs offline gyorsítótár, hogy a
  // módosított fájlok azonnal látszódjanak.
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  if ('serviceWorker' in navigator && !local) {
    navigator.serviceWorker.register('sw.js').catch(() => {
      // Offline gyorsítótár nélkül is használható marad.
    });
  }
}

/* ---------- Ma ---------- */

function renderToday() {
  $('today-date').textContent = new Date().toLocaleDateString('hu-HU', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });

  const byMode = new Map(MODES.map((mode) => [mode, counts(state, birds, mode)]));
  const due = MODES.reduce((sum, mode) => sum + byMode.get(mode).due, 0);
  const fresh = MODES.reduce((sum, mode) => sum + byMode.get(mode).fresh, 0);

  $('today-title').textContent = due + fresh ? 'Mai adag' : 'Mára megvan';
  $('today-lead').textContent = describe(due, fresh);

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
  const learned = birds.filter((bird) => MODES.some((mode) => cardStatus(state, bird.id, mode).state !== 'new')).length;
  $('today-foot').textContent = [
    days ? `${days} napja gyakorolsz egyhuzamban.` : 'Még nincs gyakorlónapod — kezdd el ma.',
    learned ? `${learned} fajt láttál már a ${birds.length}-ből.` : '',
  ].filter(Boolean).join(' ');
}

function describe(due, fresh) {
  if (!due && !fresh) {
    return 'Minden faj pihen. Ha akarsz, akkor is gyakorolhatsz — a korán elővett kártyák nem rontják el az ütemezést.';
  }
  const parts = [];
  if (due) parts.push(`${due} ismétlés`);
  if (fresh) parts.push(`${fresh} új kártya`);
  return `${parts.join(' és ')} vár a három pakliban. Módonként legfeljebb ${state.dose} madár egy körben.`;
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

    const img = document.createElement('img');
    if (bird.images[0]) img.src = bird.images[0].file;
    img.alt = '';
    img.loading = 'lazy';

    const text = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'bird-name';
    name.textContent = capitalize(bird.name);
    const latin = document.createElement('div');
    latin.className = 'bird-latin';
    latin.textContent = bird.taxon;
    text.append(name, latin);

    const skills = document.createElement('div');
    skills.className = 'skills';
    skills.append(...MODES.map((mode) => skillRow(bird, mode)));

    li.append(img, text, skills);
    list.append(li);
  }

  $('birds-lead').textContent = `${birds.length} faj, módonként külön haladással. A pöttyök azt mutatják, milyen messzire tolódott a következő ismétlés.`;
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

/* ---------- Források ---------- */

function renderSources() {
  const box = $('sources');
  box.innerHTML = '';

  for (const bird of birds) {
    const block = document.createElement('div');
    block.className = 'source';
    const title = document.createElement('h2');
    title.textContent = capitalize(bird.name);
    const list = document.createElement('ul');

    for (const [kind, items] of [['Fotó', bird.images], ['Hang', bird.audio]]) {
      for (const item of items) {
        const li = document.createElement('li');
        const kindEl = document.createElement('span');
        kindEl.className = 'kind';
        kindEl.textContent = `${kind}: `;
        const link = document.createElement('a');
        link.href = item.source;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = `${item.author} (${item.license})`;
        li.append(kindEl, link);
        list.append(li);
      }
    }

    block.append(title, list);
    box.append(block);
  }
}

/* ---------- Gyakorlás ---------- */

function startSession(mode) {
  const picked = pickSession(state, birds, mode, state.dose);
  if (!picked.length) return;

  player.unlock(); // még a gombnyomás gesztusán belül
  round = new Round({ mode, birds: picked });
  freePractice = counts(state, birds, mode).ready === 0;

  $('session').hidden = false;
  $('session').dataset.mode = mode;
  $('session-mode').textContent = [
    MODE_LABEL[mode],
    `${picked.length} madár`,
    freePractice ? 'szabadgyakorlás — az ütemezés nem változik' : null,
  ].filter(Boolean).join(' · ');
  document.body.style.overflow = 'hidden';
  showCard();
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
    $('photo-img').src = item.image.file;
    $('photo-img').alt = withPhoto ? 'A felismerendő madár fotója' : '';
  }

  player.clear();
  clearTimeout(autoPlay);
  if (withSound) {
    player.load(item.audio.file);
    // Rövid késleltetés, hogy a kártya előbb kirajzolódjon; ha közben tovább
    // lépünk vagy kilépünk, ez az időzítő törlődik.
    autoPlay = setTimeout(() => player.toggle(), 320);
  }

  renderProgress();
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
  $('answer').hidden = false;
  $('reveal').hidden = true;
  $('grade').hidden = false;
  $('answer-name').textContent = capitalize(item.bird.name);
  $('answer-latin').textContent = item.bird.taxon;
  $('answer-credit').textContent = credit(item);
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
  $('done').hidden = false;
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
  });

  $('reset').addEventListener('click', () => {
    if (!confirm('Biztos törlöd a haladást? Minden faj visszaáll tanulatlanra.')) return;
    clearState();
    state = loadState();
    renderDose();
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
      for (const other of document.querySelectorAll('.tab')) other.classList.toggle('is-current', other === tab);
      for (const view of document.querySelectorAll('.view')) view.hidden = view.dataset.view !== tab.dataset.tab;
      window.scrollTo(0, 0);
    });
  }

  document.addEventListener('keydown', (event) => {
    if ($('session').hidden) return;
    if (event.key === 'Escape') closeSession();
    if (event.key === ' ' || event.key === 'Enter') {
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
