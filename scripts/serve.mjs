#!/usr/bin/env node
// Egyszerű statikus szerver a public/ könyvtárhoz — fejlesztéshez és
// a telefonos kipróbáláshoz ugyanarról a wifiről.
//
//   npm start

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { networkInterfaces } from 'node:os';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const PORT = Number(process.env.PORT ?? 5173);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.m4a': 'audio/mp4',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
};

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  let file = join(ROOT, normalize(path).replace(/^(\.\.[/\\])+/, ''));

  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    const body = await readFile(file);
    const type = TYPES[extname(file)] ?? 'application/octet-stream';

    // A médialejátszók bájttartományt kérnek; Safari e nélkül el sem indul.
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '');
    if (range) {
      const start = range[1] ? Number(range[1]) : 0;
      const end = range[2] ? Number(range[2]) : body.length - 1;
      res.writeHead(206, {
        'Content-Type': type,
        'Content-Range': `bytes ${start}-${end}/${body.length}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
        'Cache-Control': 'no-cache',
      });
      res.end(body.subarray(start, end + 1));
      return;
    }

    res.writeHead(200, {
      'Content-Type': type,
      'Accept-Ranges': 'bytes',
      'Content-Length': body.length,
      'Cache-Control': 'no-cache',
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Nincs ilyen fájl');
  }
}).listen(PORT, () => {
  const lan = Object.values(networkInterfaces())
    .flat()
    .find((net) => net?.family === 'IPv4' && !net.internal);
  console.log(`Madarak: http://localhost:${PORT}`);
  if (lan) console.log(`Telefonról ugyanarról a wifiről: http://${lan.address}:${PORT}`);
});
