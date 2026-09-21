// A wiki szerkezeti épsége. Ezek nem a tartalmat ítélik meg, hanem azt, hogy a
// bundle önmagában teljes-e: minden oldal formás, minden link célba ér, és az
// index a valóságot tükrözi.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintWiki } from '../scripts/lint-wiki.mjs';

test('a wiki átmegy a linten', () => {
  const { problems, pageCount } = lintWiki();

  assert.deepEqual(problems, [], 'a lint hibái:\n' + problems.join('\n'));
  assert.ok(pageCount > 0, 'van legalább egy oldal');
});
