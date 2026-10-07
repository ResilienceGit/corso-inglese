const path = require('path');
const crypto = require('crypto');
const express = require('express');
const { rows, row, run } = require('./db');
const { seedContent, seedDemoData } = require('./seed');
const { render, NOT_FOUND, PRIVACY } = require('./render');

seedContent();
if (process.env.SEED_DEMO !== '0') seedDemoData();

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'easyenglish';
const SECRET = process.env.SESSION_SECRET || crypto.createHash('sha256').update('easyenglish-demo:' + ADMIN_PASSWORD).digest('hex');
const SESSION_MS = 1000 * 60 * 60 * 12;

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  });
  next();
});

// ---------- utils ----------
const hits = new Map();
function rateLimit(name, max, windowMs) {
  return (req, res, next) => {
    const key = `${name}:${req.ip}`;
    const now = Date.now();
    const arr = (hits.get(key) || []).filter(t => now - t < windowMs);
    if (arr.length >= max) return res.status(429).json({ error: 'Troppe richieste, riprova tra poco.' });
    arr.push(now); hits.set(key, arr); next();
  };
}
const sign = v => crypto.createHmac('sha256', SECRET).update(v).digest('hex');
const safeEq = (a, b) => { const A = Buffer.from(a), B = Buffer.from(b); return A.length === B.length && crypto.timingSafeEqual(A, B); };
function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').map(c => c.trim().split('=')).filter(p => p[0]).map(([k, ...v]) => [k, decodeURIComponent(v.join('='))]));
}
function isAuthed(req) {
  const tok = parseCookies(req).ee_session;
  if (!tok) return false;
  const [exp, sig] = tok.split('.');
  return !!exp && !!sig && Number(exp) > Date.now() && safeEq(sig, sign(exp));
}
const requireAuth = (req, res, next) => isAuthed(req) ? next() : res.status(401).json({ error: 'Non autorizzato' });
const clean = (v, max = 500) => String(v ?? '').trim().slice(0, max);
const wrap = fn => (req, res) => { try { fn(req, res); } catch (e) { console.error(e); res.status(500).json({ error: 'Errore interno' }); } };

// ---------- public API ----------
app.get('/api/content', wrap((req, res) => {
  const out = {};
  rows('SELECT key,value FROM content').forEach(r => { out[r.key] = JSON.parse(r.value); });
  res.set('Cache-Control', 'no-store').json(out);
}));

app.post('/api/contact', rateLimit('contact', 6, 10 * 60 * 1000), wrap((req, res) => {
  const b = req.body || {};
  if (b.website) return res.json({ ok: true }); // honeypot
  const name = clean(b.name, 120), email = clean(b.email, 160), phone = clean(b.phone, 40);
  const audience = ['bambini', 'adulti', 'azienda'].includes(b.audience) ? b.audience : null;
  const mode = ['online', 'presenza', 'entrambi'].includes(b.mode) ? b.mode : null;
  let message = clean(b.message, 2000);
  const slot = clean(b.slot, 80);
  if (slot) message = `[Preferenza orario: ${slot}] ${message}`.trim();
  if (name.length < 2) return res.status(400).json({ error: 'Inserisci il tuo nome.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Inserisci un indirizzo email valido.' });
  if (!b.privacy) return res.status(400).json({ error: 'Devi accettare l\'informativa privacy.' });
  const r = run('INSERT INTO leads(name,email,phone,audience,mode,message) VALUES(?,?,?,?,?,?)', name, email, phone, audience, mode, message);
  res.status(201).json({ ok: true, id: Number(r.lastInsertRowid) });
}));

// ---------- auth ----------
app.post('/api/admin/login', rateLimit('login', 8, 10 * 60 * 1000), wrap((req, res) => {
  const pw = String((req.body || {}).password || '');
  if (!safeEq(sign(pw), sign(ADMIN_PASSWORD))) return res.status(401).json({ error: 'Password errata' });
  const exp = String(Date.now() + SESSION_MS);
  res.cookie('ee_session', `${exp}.${sign(exp)}`, { httpOnly: true, sameSite: 'lax', maxAge: SESSION_MS, secure: req.secure });
  res.json({ ok: true });
}));
app.post('/api/admin/logout', (req, res) => { res.clearCookie('ee_session'); res.json({ ok: true }); });
app.get('/api/admin/me', (req, res) => res.json({ authed: isAuthed(req) }));

// ---------- admin API ----------
const admin = express.Router();
admin.use(requireAuth);

const TABLES = {
  clients: { fields: ['name', 'type', 'email', 'phone', 'level', 'notes'], order: 'name COLLATE NOCASE' },
  appointments: { fields: ['client_id', 'title', 'starts_at', 'duration_min', 'mode', 'teacher', 'status', 'notes'], order: 'starts_at' },
  documents: { fields: ['kind', 'number', 'client_id', 'items', 'status', 'issue_date', 'due_date', 'notes'], order: 'issue_date DESC, id DESC', json: ['items'] },
  payments: { fields: ['client_id', 'document_id', 'description', 'amount', 'due_date', 'paid_at', 'method'], order: 'due_date' },
  leads: { fields: ['name', 'email', 'phone', 'audience', 'mode', 'message', 'status'], order: 'created_at DESC, id DESC' }
};
const required = { clients: ['name'], appointments: ['title', 'starts_at'], documents: ['kind'], payments: ['amount', 'due_date'], leads: ['name', 'email'] };

function prep(table, body) {
  const cfg = TABLES[table];
  const data = {};
  for (const f of cfg.fields) {
    if (!(f in body)) continue;
    let v = body[f];
    if (cfg.json?.includes(f)) v = JSON.stringify(Array.isArray(v) ? v.map(i => ({ desc: clean(i.desc, 300), qty: Number(i.qty) || 0, price: Number(i.price) || 0 })) : []);
    else if (v === '' || v === undefined) v = null;
    else if (['client_id', 'document_id', 'duration_min'].includes(f)) v = v == null ? null : Number(v);
    else if (f === 'amount') v = Number(v);
    else if (typeof v === 'string') v = v.slice(0, 2000);
    data[f] = v;
  }
  return data;
}
const hydrate = (table, r) => (r && TABLES[table].json ? { ...r, ...Object.fromEntries(TABLES[table].json.map(f => [f, JSON.parse(r[f] || '[]')])) } : r);

for (const table of Object.keys(TABLES)) {
  admin.get(`/${table}`, wrap((req, res) => res.json(rows(`SELECT * FROM ${table} ORDER BY ${TABLES[table].order}`).map(r => hydrate(table, r)))));
  admin.post(`/${table}`, wrap((req, res) => {
    const d = prep(table, req.body || {});
    if (required[table].some(f => d[f] == null || d[f] === '' || Number.isNaN(d[f]))) return res.status(400).json({ error: 'Campi obbligatori mancanti' });
    const keys = Object.keys(d);
    const r = run(`INSERT INTO ${table}(${keys.join(',')}) VALUES(${keys.map(() => '?').join(',')})`, ...keys.map(k => d[k]));
    res.status(201).json(hydrate(table, row(`SELECT * FROM ${table} WHERE id=?`, r.lastInsertRowid)));
  }));
  admin.put(`/${table}/:id`, wrap((req, res) => {
    const d = prep(table, req.body || {});
    const keys = Object.keys(d);
    if (!keys.length) return res.status(400).json({ error: 'Nessun campo' });
    const r = run(`UPDATE ${table} SET ${keys.map(k => k + '=?').join(',')} WHERE id=?`, ...keys.map(k => d[k]), req.params.id);
    if (!r.changes) return res.status(404).json({ error: 'Non trovato' });
    res.json(hydrate(table, row(`SELECT * FROM ${table} WHERE id=?`, req.params.id)));
  }));
  admin.delete(`/${table}/:id`, wrap((req, res) => {
    run(`DELETE FROM ${table} WHERE id=?`, req.params.id);
    res.json({ ok: true });
  }));
}

admin.post('/leads/:id/convert', wrap((req, res) => {
  const lead = row('SELECT * FROM leads WHERE id=?', req.params.id);
  if (!lead) return res.status(404).json({ error: 'Non trovato' });
  if (lead.client_id) return res.json({ client_id: lead.client_id });
  const type = lead.audience === 'bambini' ? 'bambino' : lead.audience === 'azienda' ? 'azienda' : 'adulto';
  const r = run('INSERT INTO clients(name,type,email,phone,notes) VALUES(?,?,?,?,?)', lead.name, type, lead.email, lead.phone, lead.message);
  run("UPDATE leads SET status='convertita', client_id=? WHERE id=?", Number(r.lastInsertRowid), lead.id);
  res.json({ client_id: Number(r.lastInsertRowid) });
}));

admin.get('/next-number/:kind', wrap((req, res) => {
  const kind = req.params.kind === 'fattura' ? 'fattura' : 'preventivo';
  const prefix = kind === 'fattura' ? 'F' : 'P';
  const year = new Date().getFullYear();
  const n = row('SELECT COUNT(*) c FROM documents WHERE kind=? AND number LIKE ?', kind, `${prefix}-${year}-%`).c + 1;
  res.json({ number: `${prefix}-${year}-${String(n).padStart(3, '0')}` });
}));

admin.put('/content/:key', wrap((req, res) => {
  if (!/^[a-z]+$/.test(req.params.key)) return res.status(400).json({ error: 'Chiave non valida' });
  run('INSERT INTO content(key,value,updated_at) VALUES(?,?,CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP', req.params.key, JSON.stringify(req.body));
  res.json({ ok: true });
}));

admin.get('/dashboard', wrap((req, res) => {
  const today = new Date(); const p = n => String(n).padStart(2, '0');
  const d0 = `${today.getFullYear()}-${p(today.getMonth() + 1)}-${p(today.getDate())}`;
  const money = (cond, ...args) => rows('SELECT amount FROM payments WHERE ' + cond, ...args).reduce((s, x) => s + x.amount, 0);
  res.json({
    newLeads: row("SELECT COUNT(*) c FROM leads WHERE status='nuova'").c,
    clients: row('SELECT COUNT(*) c FROM clients').c,
    upcoming: rows(`SELECT a.*, c.name client_name FROM appointments a LEFT JOIN clients c ON c.id=a.client_id WHERE substr(a.starts_at,1,10) >= ? AND a.status IN ('richiesto','confermato') ORDER BY a.starts_at LIMIT 6`, d0),
    toCollect: money('paid_at IS NULL'),
    overdue: money('paid_at IS NULL AND due_date < ?', d0),
    collected: money('paid_at IS NOT NULL'),
    openQuotes: row("SELECT COUNT(*) c FROM documents WHERE kind='preventivo' AND status IN ('bozza','inviato')").c,
    recentLeads: rows('SELECT * FROM leads ORDER BY created_at DESC, id DESC LIMIT 5')
  });
}));

app.use('/api/admin', admin);
app.use('/api', (req, res) => res.status(404).json({ error: 'Non trovato' }));

// ---------- pagine pubbliche (SSR) ----------
const loadContent = () => Object.fromEntries(rows('SELECT key,value FROM content').map(r => [r.key, JSON.parse(r.value)]));
const sendHtml = (res, html, status = 200) => res.status(status).set('Content-Type', 'text/html; charset=utf-8').send(html);
app.get(['/site', '/site/', '/site/index.html'], wrap((req, res) => sendHtml(res, render(loadContent()))));
app.get('/site/privacy', wrap((req, res) => sendHtml(res, PRIVACY(loadContent()))));

// ---------- static ----------
const pub = path.join(__dirname, '..', 'public');
app.use(express.static(pub, { extensions: ['html'], maxAge: '5m' }));
app.use((req, res) => sendHtml(res, NOT_FOUND, 404));

app.listen(PORT, () => console.log(`EasyEnglish demo su http://localhost:${PORT}  (admin: /admin)`));
