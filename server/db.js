const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const dir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
fs.mkdirSync(dir, { recursive: true });
const db = new DatabaseSync(path.join(dir, 'easyenglish.db'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS content (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  audience TEXT,           -- bambini | adulti | azienda
  mode TEXT,               -- online | presenza | entrambi
  message TEXT,
  status TEXT DEFAULT 'nuova',   -- nuova | contattata | convertita | persa
  client_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'adulto',    -- bambino | adulto | azienda
  email TEXT, phone TEXT,
  level TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  starts_at TEXT NOT NULL,       -- ISO local 'YYYY-MM-DDTHH:MM'
  duration_min INTEGER DEFAULT 60,
  mode TEXT DEFAULT 'online',
  teacher TEXT,
  status TEXT DEFAULT 'confermato',  -- richiesto | confermato | svolto | annullato
  notes TEXT
);
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,            -- preventivo | fattura
  number TEXT,
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  items TEXT NOT NULL DEFAULT '[]',   -- [{desc, qty, price}]
  status TEXT DEFAULT 'bozza',   -- bozza | inviato | accettato | rifiutato | emessa | pagata
  issue_date TEXT,
  due_date TEXT,
  notes TEXT
);
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
  description TEXT,
  amount REAL NOT NULL,
  due_date TEXT NOT NULL,
  paid_at TEXT,
  method TEXT
);
`);

const rows = (sql, ...p) => db.prepare(sql).all(...p);
const row = (sql, ...p) => db.prepare(sql).get(...p);
const run = (sql, ...p) => db.prepare(sql).run(...p);

module.exports = { db, rows, row, run };
