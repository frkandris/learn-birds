#!/usr/bin/env node
// A scripts/icon.svg és icon-maskable.svg alapján legenerálja az app
// ikonjait (macOS `sips`-szel, külső függőség nélkül).
//
//   npm run icons

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'icons');

const TARGETS = [
  ['icon.svg', 'icon-192.png', 192],
  ['icon.svg', 'icon-512.png', 512],
  ['icon.svg', 'apple-touch-icon.png', 180],
  ['icon-maskable.svg', 'icon-maskable-512.png', 512],
];

for (const [source, name, size] of TARGETS) {
  await run('sips', ['-s', 'format', 'png', '-Z', String(size), join(ROOT, 'scripts', source), '--out', join(OUT, name)]);
  console.log(`${name} (${size}px)`);
}
