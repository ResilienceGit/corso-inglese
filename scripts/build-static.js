// Esporta intro + sito pubblico in ./dist, pronto per Netlify Drop (https://app.netlify.com/drop).
// Uso: npm run build:static   → poi trascina la cartella "dist" su Netlify.
const fs = require('fs');
const path = require('path');
const { render, NOT_FOUND, PRIVACY } = require('../server/render');
const defaults = require('../server/defaults');

const root = path.join(__dirname, '..');
const out = path.join(root, 'dist');
fs.rmSync(out, { recursive: true, force: true });
const w = (rel, data) => { const f = path.join(out, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, data); };

// Il contenuto arriva dal DB se esiste (così l'export riflette le modifiche fatte dal gestionale), altrimenti dai default.
let content = defaults;
try {
  const dbFile = path.join(process.env.DATA_DIR || path.join(root, 'data'), 'easyenglish.db');
  if (fs.existsSync(dbFile)) {
    const { DatabaseSync } = require('node:sqlite');
    const rows = new DatabaseSync(dbFile, { readOnly: true }).prepare('SELECT key,value FROM content').all();
    content = { ...defaults, ...Object.fromEntries(rows.map(r => [r.key, JSON.parse(r.value)])) };
  }
} catch (e) { console.warn('DB non letto, uso i contenuti di default:', e.message); }

w('site/index.html', render(content, { static: true }));
w('site/privacy/index.html', PRIVACY(content));
w('404.html', NOT_FOUND);
// Intro: nel sito statico non esiste il gestionale, quindi il secondo bottone è sostituito dal link al sito.
w('index.html', fs.readFileSync(path.join(root, 'public/index.html'), 'utf8').replace(/\s*<a class="btn ghost" href="\/admin\/">.*?<\/a>/, ''));
for (const f of ['site.css', 'site.js', 'favicon.svg']) w('site/' + f, fs.readFileSync(path.join(root, 'public/site', f)));
w('_headers', '/site/*\n  Cache-Control: public, max-age=300\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n');
console.log('Creato ' + out);
