// A begyűjtés szerzőfeltüntetése. A licencek többsége megköveteli a szerző
// megnevezését; ami itt elcsúszik, az a kártyán „ismeretlen szerző" lesz.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authorOf } from '../scripts/fetch-birds.mjs';

const meta = (fields) => Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, { value }]));

test('a szerző az Artist mezőből jön, HTML nélkül', () => {
  const author = authorOf(meta({ Artist: '<a href="//commons.wikimedia.org/wiki/User:Diliff">Diliff</a>' }));

  assert.equal(author, 'Diliff');
});

test('az „Own work" jellegű Credit nem szerzőnév', () => {
  assert.equal(authorOf(meta({ Artist: '', Credit: 'Own work' })), 'ismeretlen szerző');
});

test('intézményi feltöltésnél a hosszú Credit-ből a szolgáltató neve marad', () => {
  const credit = 'This file has been provided by the British Library from its digital collections. '
    + 'Links to the British Library\'s website may be broken as the library recovers from a cyber attack.';

  assert.equal(authorOf(meta({ Credit: credit })), 'British Library');
});

test('ha semmi nem nevezi meg, ismeretlen szerző', () => {
  assert.equal(authorOf({}), 'ismeretlen szerző');
});
