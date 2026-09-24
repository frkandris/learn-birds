// A gyakorlókör szabályai. A viselkedést teszteljük, nem a belső
// adatszerkezetet: mit lát a felhasználó, és mi kerül ütemezésre.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Round } from '../public/round.js';

const bird = (id) => ({ id, name: id, taxon: id, images: [{ file: `${id}.jpg` }], audio: [{ file: `${id}.m4a` }] });
const firstMedia = (items) => items[0] ?? null;
const newRound = (ids, mode = 'both') =>
  new Round({ mode, birds: ids.map(bird), pick: firstMedia });

test('a kártyák a kiválasztás sorrendjében jönnek', () => {
  const round = newRound(['a', 'b', 'c']);

  assert.equal(round.current.bird.id, 'a');
  round.grade(true);
  assert.equal(round.current.bird.id, 'b');
});

test('az eltalált kártya kikerül a körből és ütemezésre jelölődik', () => {
  const round = newRound(['a', 'b']);

  const settled = round.grade(true);

  assert.deepEqual(settled, { birdId: 'a', clean: true });
});

test('az elrontott kártya a pakli végére kerül, és nem ütemeződik', () => {
  const round = newRound(['a', 'b', 'c']);

  const settled = round.grade(false);

  assert.equal(settled, null, 'a hibás válasz még nem zár le kártyát');
  assert.equal(round.current.bird.id, 'b', 'nem rögtön ugyanaz jön vissza');
  round.grade(true);
  round.grade(true);
  assert.equal(round.current.bird.id, 'a', 'a többi után újra elő kell jönnie');
});

test('a másodjára sikerült kártya nem számít elsőre tudottnak', () => {
  const round = newRound(['a', 'b']);

  round.grade(false); // a → vissza a végére
  round.grade(true); // b
  const settled = round.grade(true); // a, másodszorra

  assert.deepEqual(settled, { birdId: 'a', clean: false });
  assert.equal(round.summary().clean, 1, 'csak b ment elsőre');
  assert.equal(round.summary().missed, 1);
});

test('a kör addig tart, amíg minden madár egyszer sikerül', () => {
  const round = newRound(['a', 'b']);

  round.grade(false);
  round.grade(false);
  assert.equal(round.finished, false);

  round.grade(true);
  round.grade(true);
  assert.equal(round.finished, true);
  assert.equal(round.current, null);
});

test('az utolsó kártya elrontva is visszajön', () => {
  const round = newRound(['a']);

  round.grade(false);

  assert.equal(round.finished, false);
  assert.equal(round.current.bird.id, 'a');
});

test('a haladásjelző az aktuális kártyát és a hibákat mutatja', () => {
  const round = newRound(['a', 'b', 'c']);

  assert.deepEqual(round.progress(), [
    { id: 'a', state: 'now' },
    { id: 'b', state: '' },
    { id: 'c', state: '' },
  ]);

  round.grade(false);

  assert.deepEqual(round.progress(), [
    { id: 'a', state: 'miss' },
    { id: 'b', state: 'now' },
    { id: 'c', state: '' },
  ]);
});

test('a hibás jelölés akkor is megmarad, ha a kártya később sikerül', () => {
  const round = newRound(['a', 'b']);

  round.grade(false); // a
  round.grade(true); // b
  round.grade(true); // a másodszorra

  assert.deepEqual(
    round.progress().map((p) => p.state),
    ['miss', 'done'],
  );
});

test('a médiát a megadott választó adja, fajonként egyszer rögzítve', () => {
  const round = new Round({
    mode: 'both',
    birds: [{ id: 'a', images: [{ file: 'x.jpg' }, { file: 'y.jpg' }], audio: [] }],
    pick: (items) => items[items.length - 1] ?? null,
  });

  assert.equal(round.current.image.file, 'y.jpg');
  assert.equal(round.current.audio, null, 'hang nélküli faj is kezelhető');
});

test('az összegzés a kör méretét és az időt is jelenti', () => {
  const round = newRound(['a', 'b', 'c']);
  round.grade(true);
  round.grade(true);
  round.grade(true);

  const summary = round.summary();

  assert.equal(summary.total, 3);
  assert.equal(summary.clean, 3);
  assert.equal(summary.missed, 0);
  assert.ok(summary.minutes >= 1, 'a percek felfelé kerekítve, sosem nulla');
});

test('a kör előre megmondja, mely fájlok kerülnek elő benne', () => {
  const both = newRound(['a', 'b']);
  const image = newRound(['a', 'b'], 'image');
  const sound = newRound(['a'], 'sound');

  assert.deepEqual(both.files(), ['a.jpg', 'a.m4a', 'b.jpg', 'b.m4a']);
  assert.deepEqual(image.files(), ['a.jpg', 'b.jpg'], 'csak kép módban a hang nem kell');
  assert.deepEqual(sound.files(), ['a.jpg', 'a.m4a'], 'hang módban a fotó a felfedéskor jön elő');
});
