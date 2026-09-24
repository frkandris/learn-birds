// A média és a birds.json szerződése. A fájlnév a tartalom hash-ét hordozza:
// erre épül, hogy a service worker és a böngésző a médiát örökre tárolhatja,
// és hogy egy faj cseréje csak annak a fajnak a fájljait tölti le újra.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const { birds } = JSON.parse(readFileSync(join(PUBLIC, 'data', 'birds.json'), 'utf8'));
const files = birds.flatMap((bird) => [...bird.images, ...bird.audio].map((item) => item.file));

test('minden médiafájl neve a tartalma hash-ét hordozza', () => {
  for (const file of files) {
    const match = /^media\/[a-z-]+-\d\.([0-9a-f]{8})\.(jpg|m4a)$/.exec(file);
    assert.ok(match, `a név alakja faj-sorszám.hash.kiterjesztés: ${file}`);

    const content = readFileSync(join(PUBLIC, file));
    const hash = createHash('sha256').update(content).digest('hex').slice(0, 8);

    assert.equal(match[1], hash, `a hash a tartalomé: ${file}`);
  }
});

test('nincs gazdátlan médiafájl', () => {
  const referenced = new Set(files.map((file) => file.replace(/^media\//, '')));

  const orphans = readdirSync(join(PUBLIC, 'media')).filter((name) => !referenced.has(name));

  assert.deepEqual(orphans, [], 'a birds.json által nem hivatkozott fájlok');
});
