// Ismétléses ütemezés (spaced repetition) és a tanulási állapot.
//
// Minden fajhoz módonként (csak kép, csak hang, a kettő együtt) külön kártya
// tartozik: mindegyik önálló készség, ezért külön ütemezéssel halad. Egy kártya szintje azt
// mondja meg, hány nap múlva kerül elő újra.

const KEY = 'learn-birds/v1';
const STEPS = [1, 3, 7, 16, 35, 90]; // napok a 0., 1., … szinten
export const MAX_LEVEL = STEPS.length;
export const MODES = ['image', 'sound', 'both'];
export const MODE_LABEL = { image: 'Csak kép', sound: 'Csak hang', both: 'Kép és hang' };

// Melyik mód mit igényel a fajtól: a kép nélküli faj a képes paklikból, a hang
// nélküli a hangosakból marad ki.
export function usableIn(bird, mode) {
  if (mode === 'image') return bird.images.length > 0;
  if (mode === 'sound') return bird.audio.length > 0;
  return bird.images.length > 0 && bird.audio.length > 0;
}

export function today() {
  return toDay(new Date());
}

function toDay(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addDays(day, days) {
  const [y, m, d] = day.split('-').map(Number);
  return toDay(new Date(y, m - 1, d + days));
}

export function daysUntil(day) {
  const [y, m, d] = day.split('-').map(Number);
  const then = new Date(y, m - 1, d);
  const now = new Date();
  return Math.round((then - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
}

const emptyState = () => ({ version: 1, dose: 3, cards: {}, days: {} });

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    return normalize(JSON.parse(raw));
  } catch {
    return emptyState();
  }
}

// A tároló tartalma sérült vagy régi sémájú is lehet; a hiányzó vagy rossz
// típusú mezők miatt ne boruljon fel az app, inkább induljunk üresen.
function normalize(stored) {
  const base = emptyState();
  if (!stored || typeof stored !== 'object') return base;
  const isPlain = (value) => value && typeof value === 'object' && !Array.isArray(value);
  return {
    version: base.version,
    dose: Number.isFinite(stored.dose) && stored.dose > 0 ? stored.dose : base.dose,
    cards: isPlain(stored.cards) ? validCards(stored.cards) : {},
    days: isPlain(stored.days) ? stored.days : {},
  };
}

// Egy-egy kártya is lehet hibás; azt eldobjuk (a faj abban a módban újként
// indul), a többi haladás viszont megmarad. Esedékesség nélkül a lista és a
// pakli összeállítása is elszállna.
function validCards(cards) {
  const count = (value) => (Number.isFinite(value) && value >= 0 ? value : 0);
  const out = {};
  for (const [key, card] of Object.entries(cards)) {
    if (!card || typeof card !== 'object') continue;
    if (typeof card.due !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(card.due)) continue;
    if (!Number.isInteger(card.level) || card.level < 0 || card.level > MAX_LEVEL) continue;
    out[key] = { ...card, seen: count(card.seen), lapses: count(card.lapses) };
  }
  return out;
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Privát módban a tárolás megtagadható; a gyakorlás ettől még megy.
  }
}

export function clearState() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nincs teendő */
  }
}

const cardKey = (birdId, mode) => `${birdId}|${mode}`;

export function getCard(state, birdId, mode) {
  return state.cards[cardKey(birdId, mode)] ?? null;
}

// Egy kártya besorolása a faj-listához: még nem tanult / esedékes / pihen.
export function cardStatus(state, birdId, mode) {
  const card = getCard(state, birdId, mode);
  if (!card) return { level: 0, state: 'new' };
  const days = daysUntil(card.due);
  return { level: card.level, state: days <= 0 ? 'due' : 'resting', days, due: card.due };
}

// A mai pakli: előbb az esedékes ismétlések (a legrégebben esedékes elöl),
// majd feltöltés még nem tanult fajokkal.
export function pickSession(state, birds, mode, dose) {
  const usable = birds.filter((bird) => usableIn(bird, mode));
  const day = today();

  const due = usable
    .filter((b) => {
      const card = getCard(state, b.id, mode);
      return card && card.due <= day;
    })
    .sort((a, b) => {
      const cardA = getCard(state, a.id, mode);
      const cardB = getCard(state, b.id, mode);
      return cardA.due.localeCompare(cardB.due) || cardA.level - cardB.level;
    });

  const fresh = usable.filter((b) => !getCard(state, b.id, mode));

  // Ha mára minden faj kész, engedjük a szabadgyakorlást: a soron
  // következő ismétlések jönnek elő, előrehozva.
  const ahead = usable
    .filter((b) => getCard(state, b.id, mode))
    .sort((a, b) => getCard(state, a.id, mode).due.localeCompare(getCard(state, b.id, mode).due));

  const picked = [...due, ...fresh];
  return (picked.length ? picked : ahead).slice(0, dose);
}

export function counts(state, birds, mode) {
  const day = today();
  let due = 0;
  let fresh = 0;
  let learned = 0;
  for (const bird of birds) {
    if (!usableIn(bird, mode)) continue;
    const card = getCard(state, bird.id, mode);
    if (!card) fresh += 1;
    else if (card.due <= day) due += 1;
    else learned += 1;
  }
  return { due, fresh, learned, ready: due + fresh };
}

// Egy kártya lezárása a gyakorlás végén. `clean` = elsőre sikerült.
//
// `reschedule: false` esetén a kártya szintje és esedékessége változatlan marad:
// ez a szabadgyakorlás, amikor a felhasználó olyan kártyát vesz elő, ami még nem
// volt esedékes. Egy korán elővett válasz nem érdemel jutalmat (hetekkel odébb
// tolt ismétlést), és nem is büntetendő — csak a napi statisztikába számít.
export function schedule(state, birdId, mode, clean, { reschedule = true } = {}) {
  const key = cardKey(birdId, mode);
  const card = state.cards[key] ?? { level: 0, due: today(), seen: 0, lapses: 0 };
  const level = clean ? Math.min(card.level + 1, MAX_LEVEL) : 0;
  const interval = STEPS[Math.min(level, STEPS.length - 1)];

  state.cards[key] = reschedule
    ? {
        level,
        due: addDays(today(), clean ? interval : 1),
        seen: card.seen + 1,
        lapses: card.lapses + (clean ? 0 : 1),
        last: today(),
      }
    : {
        ...card,
        seen: card.seen + 1,
        lapses: card.lapses + (clean ? 0 : 1),
        last: today(),
      };

  const day = (state.days[today()] ??= { cards: 0, clean: 0 });
  day.cards += 1;
  if (clean) day.clean += 1;

  return state.cards[key];
}

// Hány napja gyakorol egyhuzamban.
export function streak(state) {
  let day = today();
  let count = 0;
  if (!state.days[day]) day = addDays(day, -1);
  while (state.days[day]) {
    count += 1;
    day = addDays(day, -1);
  }
  return count;
}
