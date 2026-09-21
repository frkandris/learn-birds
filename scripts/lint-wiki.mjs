#!/usr/bin/env node
// A wiki szerkezeti ellenőrzése. Az OKF megengedő (a fogyasztó nem utasíthat el
// hiányos oldalt), ez a repó viszont a saját bundle-jét teljesnek tartja: a lint
// bukik, ha egy oldal hiányos, egy [[wikilink]] sehova nem mutat, vagy az index
// nem tükrözi a valóságot.
//
//   node scripts/lint-wiki.mjs      (a tesztcsomag is ezt hívja)

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const WIKI = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'wiki');
const PAGES = join(WIKI, 'pages');

const REQUIRED = ['type', 'title', 'description', 'tags', 'status', 'generated'];
const STATUSES = ['draft', 'stable', 'deprecated'];

// A kódpéldákban szereplő [[wikilink]] nem hivatkozás, hanem szemléltetés.
function stripCode(text) {
  return text.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
}

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : path.endsWith('.md') ? [path] : [];
  });
}

// Szándékosan pici YAML-olvasó: csak a `kulcs: érték` és a `- elem` alakot ismeri,
// mert a frontmatter ennél nem bonyolultabb (a `{ by: …, at: … }` egy sorban áll).
function frontmatter(text) {
  if (!text.startsWith('---\n')) return null;
  const end = text.indexOf('\n---', 4);
  if (end === -1) return null;
  const fields = {};
  for (const line of text.slice(4, end).split('\n')) {
    const match = /^([a-z_]+):\s*(.*)$/.exec(line);
    if (match) fields[match[1]] = match[2].trim();
  }
  return { fields, body: text.slice(end + 4) };
}

export function lintWiki() {
  const problems = [];
  const pages = walk(PAGES);
  const names = new Set(pages.map((path) => basename(path, '.md')));
  const descriptions = new Map();
  const linked = new Set();

  for (const path of pages) {
    const rel = path.slice(WIKI.length + 1);
    const text = readFileSync(path, 'utf8');
    const parsed = frontmatter(text);
    if (!parsed) {
      problems.push(`${rel}: hiányzik a YAML frontmatter`);
      continue;
    }
    const { fields, body } = parsed;

    for (const key of REQUIRED) {
      if (!fields[key]) problems.push(`${rel}: hiányzó frontmatter mező: ${key}`);
    }
    if (fields.status && !STATUSES.includes(fields.status)) {
      problems.push(`${rel}: ismeretlen status: ${fields.status} (${STATUSES.join(' | ')})`);
    }
    if (fields.generated && !/by:\s*\S+.*at:\s*\d{4}-\d{2}-\d{2}T/.test(fields.generated)) {
      problems.push(`${rel}: a generated mezőben by és ISO 8601 at kell`);
    }

    const h1 = /^#\s+(.+)$/m.exec(body);
    if (!h1) problems.push(`${rel}: nincs H1 cím`);
    else if (fields.title && h1[1].trim() !== fields.title.replace(/^["']|["']$/g, '')) {
      problems.push(`${rel}: a H1 ("${h1[1].trim()}") nem egyezik a title mezővel ("${fields.title}")`);
    }

    if (fields.description) descriptions.set(basename(path, '.md'), fields.description);

    for (const [, target] of stripCode(body).matchAll(/\[\[([^\]]+)\]\]/g)) {
      linked.add(target);
      if (!names.has(target)) problems.push(`${rel}: a [[${target}]] link sehova nem mutat`);
    }
  }

  // Az index: pontosan a létező oldalak, szó szerinti leírással.
  const index = readFileSync(join(WIKI, 'index.md'), 'utf8');
  const indexed = new Map();
  for (const [, name, description] of index.matchAll(/^- \[\[([^\]]+)\]\] — (.+)$/gm)) {
    indexed.set(name, description.trim());
    linked.add(name);
  }
  for (const name of names) {
    if (!indexed.has(name)) problems.push(`index.md: hiányzik a(z) ${name} oldal`);
    else if (indexed.get(name) !== descriptions.get(name)) {
      problems.push(`index.md: a(z) ${name} leírása nem egyezik az oldal description mezőjével`);
    }
  }
  for (const name of indexed.keys()) {
    if (!names.has(name)) problems.push(`index.md: nem létező oldalra hivatkozik: ${name}`);
  }

  // A gyökérszintű társakból induló linkek is számítanak hivatkozásnak.
  for (const file of ['glossary.md', 'faq.md', 'log.md', 'CLAUDE.md', 'SCHEMA.md']) {
    const text = stripCode(readFileSync(join(WIKI, file), 'utf8'));
    for (const [, target] of text.matchAll(/\[\[([^\]]+)\]\]/g)) {
      linked.add(target);
      if (!names.has(target) && target !== 'index') {
        problems.push(`${file}: a [[${target}]] link sehova nem mutat`);
      }
    }
  }

  for (const name of names) {
    if (!linked.has(name)) problems.push(`${name}: árva oldal, semmi nem hivatkozik rá`);
  }

  // A napló csökkenő dátumsorrendben áll.
  const log = readFileSync(join(WIKI, 'log.md'), 'utf8');
  const dates = [...log.matchAll(/^## (\d{4}-\d{2}-\d{2})$/gm)].map((m) => m[1]);
  for (let i = 1; i < dates.length; i += 1) {
    if (dates[i] > dates[i - 1]) problems.push(`log.md: ${dates[i]} a ${dates[i - 1]} után áll, a legújabb legyen elöl`);
  }

  return { problems, pageCount: pages.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { problems, pageCount } = lintWiki();
  for (const problem of problems) console.error(`✗ ${problem}`);
  console.log(problems.length ? `\n${problems.length} hiba ${pageCount} oldalon` : `✓ ${pageCount} oldal rendben`);
  process.exit(problems.length ? 1 : 0);
}
