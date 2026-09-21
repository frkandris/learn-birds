// Ismétléses ütemezés (spaced repetition) és a tanulási állapot.
//
// Minden fajhoz két külön kártya tartozik: a kép- és a hangfelismerés
// önálló készség, ezért külön ütemezéssel halad. Egy kártya szintje azt
// mondja meg, hány nap múlva kerül elő újra.

const KEY = 'learn-birds/v1';
const STEPS = [1, 3, 7, 16, 35, 90]; // napok a 0., 1., … szinten
export const MAX_LEVEL = STEPS.length;
export const MODE_LABEL = { both: 'Kép és hang', sound: 'Csak hang' };

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

const emptyState = () => ({ version: 1, dose: 5, cards: {}, days: {} });

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    return { ...emptyState(), ...JSON.parse(raw) };
  } catch {
    return emptyState();
  }
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
  const usable = birds.filter((b) => (mode === 'sound' ? b.audio.length : b.audio.length || b.images.length));
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
    if (mode === 'sound' && !bird.audio.length) continue;
    const card = getCard(state, bird.id, mode);
    if (!card) fresh += 1;
    else if (card.due <= day) due += 1;
    else learned += 1;
  }
  return { due, fresh, learned, ready: due + fresh };
}

// Egy kártya lezárása a gyakorlás végén. `clean` = elsőre sikerült.
export function schedule(state, birdId, mode, clean) {
  const key = cardKey(birdId, mode);
  const card = state.cards[key] ?? { level: 0, due: today(), seen: 0, lapses: 0 };
  const level = clean ? Math.min(card.level + 1, MAX_LEVEL) : 0;
  const interval = STEPS[Math.min(level, STEPS.length - 1)];

  state.cards[key] = {
    level,
    due: addDays(today(), clean ? interval : 1),
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
