// Az ismétléses ütemezés. Ez dönti el, mikor lát viszont egy madarat a
// felhasználó — egy csendes hiba itt hetekre elrontja a tanulást, ezért a
// lépcsők, a visszaesés és a napi pakli összeállítása is tesztelt.

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  loadState, pickSession, schedule, counts, cardStatus, streak, daysUntil, today, usableIn,
  MAX_LEVEL, MODES,
} from '../public/srs.js';

const bird = (id, { audio = true, images = true } = {}) => ({
  id,
  name: id,
  taxon: id,
  images: images ? [{ file: `${id}.jpg` }] : [],
  audio: audio ? [{ file: `${id}.m4a` }] : [],
});

const BIRDS = [bird('a'), bird('b'), bird('c'), bird('d')];

let state;
beforeEach(() => {
  state = { version: 1, dose: 5, cards: {}, days: {} };
});

function dayOffset(days) {
  const now = new Date();
  const then = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
  return `${then.getFullYear()}-${String(then.getMonth() + 1).padStart(2, '0')}-${String(then.getDate()).padStart(2, '0')}`;
}

test('az első sikeres válasz után egy szinttel feljebb, három nap múlva jön vissza', () => {
  const card = schedule(state, 'a', 'both', true);

  assert.equal(card.level, 1);
  assert.equal(card.due, dayOffset(3));
});

test('a lépcsők egyre ritkábbak, és van felső határ', () => {
  const seen = [];
  for (let i = 0; i < MAX_LEVEL + 3; i += 1) seen.push(schedule(state, 'a', 'both', true).level);

  assert.deepEqual(seen.slice(0, MAX_LEVEL), [1, 2, 3, 4, 5, 6]);
  assert.ok(seen.every((level) => level <= MAX_LEVEL), 'a szint nem szalad el');
  assert.equal(state.cards['a|both'].due, dayOffset(90), 'a tetőn 90 nap a szünet');
});

test('a hiba nullázza a szintet és másnapra hozza vissza', () => {
  schedule(state, 'a', 'both', true);
  schedule(state, 'a', 'both', true);

  const card = schedule(state, 'a', 'both', false);

  assert.equal(card.level, 0);
  assert.equal(card.due, dayOffset(1));
  assert.equal(card.lapses, 1);
});

test('a három mód külön halad ugyanazon a fajon', () => {
  schedule(state, 'a', 'image', true);

  assert.equal(cardStatus(state, 'a', 'image').state, 'resting');
  assert.equal(cardStatus(state, 'a', 'sound').state, 'new', 'a hang még érintetlen');
  assert.equal(cardStatus(state, 'a', 'both').state, 'new', 'a kettős kártya is külön áll');
});

test('a módok igénye: a kép nélküli faj csak a hangos pakliba fér be', () => {
  const nemaKep = bird('csak-hang', { images: false });

  assert.equal(usableIn(nemaKep, 'sound'), true);
  assert.equal(usableIn(nemaKep, 'image'), false);
  assert.equal(usableIn(nemaKep, 'both'), false, 'a kettős mód mindkét médiát kéri');
});

test('a napi pakli előbb az esedékeseket hozza, a legrégebben esedékessel kezdve', () => {
  state.cards['a|both'] = { level: 1, due: dayOffset(-3), seen: 1, lapses: 0 };
  state.cards['b|both'] = { level: 1, due: dayOffset(-1), seen: 1, lapses: 0 };
  state.cards['c|both'] = { level: 1, due: dayOffset(5), seen: 1, lapses: 0 };

  const picked = pickSession(state, BIRDS, 'both', 5).map((b) => b.id);

  assert.deepEqual(picked, ['a', 'b', 'd'], 'a pihenő c kimarad, a tanulatlan d feltölti');
});

test('a napi adag korlátozza a pakli méretét', () => {
  assert.equal(pickSession(state, BIRDS, 'both', 2).length, 2);
});

test('üres tárolóból induláskor a napi adag három', () => {
  globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };

  assert.equal(loadState().dose, 3);
  assert.deepEqual(MODES, ['image', 'sound', 'both']);
});

test('ha mindenki pihen, a soron következő ismétlések jönnek elő', () => {
  for (const b of BIRDS) state.cards[`${b.id}|both`] = { level: 2, due: dayOffset(7), seen: 1, lapses: 0 };
  state.cards['c|both'].due = dayOffset(2);

  const picked = pickSession(state, BIRDS, 'both', 2).map((b) => b.id);

  assert.equal(picked[0], 'c', 'a legközelebb esedékes az első');
  assert.equal(picked.length, 2);
});

test('hang nélküli faj nem kerül a hangos paklikba, a képesbe igen', () => {
  const birds = [bird('a'), bird('néma', { audio: false })];

  assert.deepEqual(pickSession(state, birds, 'sound', 5).map((b) => b.id), ['a']);
  assert.deepEqual(pickSession(state, birds, 'both', 5).map((b) => b.id), ['a']);
  assert.deepEqual(pickSession(state, birds, 'image', 5).map((b) => b.id), ['a', 'néma']);
  assert.equal(counts(state, birds, 'sound').fresh, 1, 'a néma faj a számlálóból is kimarad');
  assert.equal(counts(state, birds, 'image').fresh, 2);
});

test('a számlálók az esedékes, az új és a pihenő kártyákat különválasztják', () => {
  state.cards['a|both'] = { level: 1, due: dayOffset(-1), seen: 1, lapses: 0 };
  state.cards['b|both'] = { level: 1, due: dayOffset(4), seen: 1, lapses: 0 };

  assert.deepEqual(counts(state, BIRDS, 'both'), { due: 1, fresh: 2, learned: 1, ready: 3 });
});

test('a napi statisztika a lezárt kártyákat gyűjti', () => {
  schedule(state, 'a', 'both', true);
  schedule(state, 'b', 'both', false);

  assert.deepEqual(state.days[today()], { cards: 2, clean: 1 });
});

test('a sorozat a tegnapi naptól is folytatódik, de a tegnapelőttitől már nem', () => {
  state.days[dayOffset(-1)] = { cards: 3, clean: 3 };
  state.days[dayOffset(-2)] = { cards: 3, clean: 3 };
  assert.equal(streak(state), 2, 'a ma még hiányzó nap nem szakítja meg');

  state.days = { [dayOffset(-3)]: { cards: 1, clean: 1 } };
  assert.equal(streak(state), 0, 'a kihagyott tegnap viszont igen');
});

test('a napszámítás a naptári napokat nézi, nem a 24 órás különbséget', () => {
  assert.equal(daysUntil(today()), 0);
  assert.equal(daysUntil(dayOffset(1)), 1);
  assert.equal(daysUntil(dayOffset(-2)), -2);
});
