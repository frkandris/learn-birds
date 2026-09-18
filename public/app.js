import {
  loadState, saveState, clearState, pickSession, schedule, counts,
  cardStatus, streak, daysUntil, today, MAX_LEVEL, MODE_LABEL,
} from './srs.js';
import { Player } from './audio.js';

const $ = (id) => document.getElementById(id);
const DOSES = [3, 5, 8, 12];

let birds = [];
let state = loadState();
let session = null;

const player = new Player($('audio'), $('spectro'));

/* ---------- indulás ---------- */

async function boot() {
  let data;
  try {
    const res = await fetch('data/birds.json');
    data = await res.json();
  } catch {
    $('today-lead').textContent = 'A madarak adatai nem töltődtek be. Indítsd az alkalmazást webszerverről (npm start).';
    return;
  }
  birds = data.birds.filter((b) => b.images.length || b.audio.length);

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
  const both = counts(state, birds, 'both');
  const sound = counts(state, birds, 'sound');
  const dose = state.dose;

  $('today-date').textContent = new Date().toLocaleDateString('hu-HU', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });

  const ready = both.ready + sound.ready;
  $('today-title').textContent = ready ? 'Mai adag' : 'Mára megvan';
  $('today-lead').textContent = ready
    ? `${describe(both, 'Kép és hang')} ${describe(sound, 'Csak hang')}`
    : 'Minden faj pihen. Ha akarsz, akkor is gyakorolhatsz — a korán elővett kártyák nem rontják el az ütemezést.';

  for (const [mode, count, btn, label] of [
    ['both', both, $('start-both'), $('count-both')],
    ['sound', sound, $('start-sound'), $('count-sound')],
  ]) {
    const n = Math.min(count.ready || 0, dose);
    label.textContent = n || '↻';
    btn.disabled = !birds.some((b) => (mode === 'sound' ? b.audio.length : true));
    btn.querySelector('.start-note').textContent = noteFor(mode, count, n);
  }

  const days = streak(state);
  const learned = birds.filter((b) => cardStatus(state, b.id, 'both').state !== 'new').length;
  $('today-foot').textContent = [
    days ? `${days} napja gyakorolsz egyhuzamban.` : 'Még nincs gyakorlónapod — kezdd el ma.',
    learned ? `${learned} faj van a képes pakliban a ${birds.length}-ből.` : '',
  ].filter(Boolean).join(' ');
}

function describe(count, name) {
  if (!count.ready) return `${name}: minden faj pihen.`;
  const parts = [];
  if (count.due) parts.push(`${count.due} ismétlés`);
  if (count.fresh) parts.push(`${count.fresh} új faj`);
  return `${name}: ${parts.join(' és ')}.`;
}

function noteFor(mode, count, n) {
  const base = mode === 'both' ? 'Fotó és hangfelvétel — a teljes madár.' : 'Semmi kép. Ahogy a terepen hallod.';
  return n ? base : `${base} Mára kész, de átforgathatod újra.`;
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
    img.src = bird.images[0]?.file ?? '';
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
    skills.append(skillRow(bird, 'both', 'kép'), skillRow(bird, 'sound', 'hang'));

    li.append(img, text, skills);
    list.append(li);
  }

  $('birds-lead').textContent = `${birds.length} faj a pakliban. A pöttyök azt mutatják, milyen messzire tolódott a következő ismétlés.`;
}

function skillRow(bird, mode, label) {
  const row = document.createElement('span');
  row.className = `skill ${mode === 'sound' ? 'ear' : 'eye'}`;

  const pips = document.createElement('span');
  pips.className = 'pips';
  const status = cardStatus(state, bird.id, mode);
  for (let i = 0; i < MAX_LEVEL; i += 1) {
    const pip = document.createElement('span');
    pip.className = 'pip' + (i < status.level ? ' on' : '');
    pips.append(pip);
  }

  const when = document.createElement('span');
  when.textContent = whenLabel(status, mode === 'sound' && !bird.audio.length);
  row.append(pips, when);
  row.title = `${label}: ${when.textContent}`;
  return row;
}

function whenLabel(status, missing) {
  if (missing) return 'nincs hang';
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

  session = {
    mode,
    queue: picked.map((bird) => ({ bird, failed: false, image: pick(bird.images), audio: pick(bird.audio) })),
    order: picked.map((b) => b.id),
    results: new Map(),
    revealed: false,
    started: Date.now(),
  };

  $('session').hidden = false;
  $('session').dataset.mode = mode;
  $('session-mode').textContent = `${MODE_LABEL[mode]} · ${picked.length} madár`;
  document.body.style.overflow = 'hidden';
  showCard();
}

function showCard() {
  const item = session.queue[0];
  if (!item) return finishSession();

  session.revealed = false;
  $('card').classList.remove('revealed');
  $('answer').hidden = true;
  $('reveal').hidden = false;
  $('grade').hidden = true;
  $('photo').hidden = session.mode !== 'both';
  $('sound').hidden = !item.audio;
  $('sound-hint').textContent = 'Koppints a hanghoz';

  if (item.image) {
    $('photo-img').src = item.image.file;
    $('photo-img').alt = session.mode === 'both' ? 'A felismerendő madár fotója' : '';
  }

  player.clear();
  if (item.audio) {
    player.load(item.audio.file);
    setTimeout(() => player.toggle(), 320);
  }

  renderProgress();
}

function renderProgress() {
  const box = $('progress');
  box.innerHTML = '';
  const currentId = session.queue[0]?.bird.id;
  for (const id of session.order) {
    const span = document.createElement('span');
    const result = session.results.get(id);
    if (result) span.className = result;
    else if (id === currentId) span.className = 'now';
    box.append(span);
  }
}

function reveal() {
  const item = session.queue[0];
  session.revealed = true;
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
  if (item.audio) parts.push(`Hang: ${item.audio.author}`);
  return parts.join(' · ');
}

function grade(ok) {
  const item = session.queue.shift();
  const id = item.bird.id;

  if (ok) {
    schedule(state, id, session.mode, !item.failed);
    saveState(state);
    if (!session.results.has(id) || session.results.get(id) !== 'miss') {
      session.results.set(id, item.failed ? 'miss' : 'done');
    }
  } else {
    item.failed = true;
    session.results.set(id, 'miss');
    session.queue.push(item); // vissza a pakli végére, amíg nem sikerül
  }

  player.stop();
  showCard();
}

function finishSession() {
  const day = state.days[today()] ?? { cards: 0, clean: 0 };
  const total = session.order.length;
  const clean = [...session.results.values()].filter((v) => v === 'done').length;
  const minutes = Math.max(1, Math.round((Date.now() - session.started) / 60000));

  $('done-kicker').textContent = MODE_LABEL[session.mode];
  $('done-title').textContent = clean === total ? 'Mind elsőre megvolt' : 'Kör letudva';
  $('done-stats').innerHTML = '';
  const rows = [
    ['Madarak ebben a körben', `${total}`],
    ['Elsőre sikerült', `${clean}`],
    ['Ismétlésre szorult', `${total - clean}`],
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

  const mode = session.mode;
  closeSession();
  $('done').hidden = false;
  $('done-again').onclick = () => {
    $('done').hidden = true;
    startSession(mode);
  };
}

function closeSession() {
  player.stop();
  player.clear();
  session = null;
  $('session').hidden = true;
  document.body.style.overflow = '';
  renderToday();
  renderBirds();
}

/* ---------- események ---------- */

function wire() {
  $('start-both').addEventListener('click', () => startSession('both'));
  $('start-sound').addEventListener('click', () => startSession('sound'));
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
      if (!session?.revealed) reveal();
    }
    if (session?.revealed && (event.key === '1' || event.key === 'ArrowLeft')) grade(false);
    if (session?.revealed && (event.key === '2' || event.key === 'ArrowRight')) grade(true);
  });
}

/* ---------- apró segédek ---------- */

const pick = (items) => (items.length ? items[Math.floor(Math.random() * items.length)] : null);
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

boot();
