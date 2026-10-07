const { db, rows, row, run } = require('./db');
const defaults = require('./defaults');

const reset = process.argv.includes('--reset');
if (reset) {
  for (const t of ['payments', 'documents', 'appointments', 'leads', 'clients', 'content']) db.exec(`DELETE FROM ${t}`);
  db.exec("DELETE FROM sqlite_sequence");
}

function seedContent() {
  for (const [k, v] of Object.entries(defaults)) {
    run('INSERT OR IGNORE INTO content(key,value) VALUES(?,?)', k, JSON.stringify(v));
  }
}

const iso = (offsetDays, h = 0, m = 0) => {
  const d = new Date(); d.setDate(d.getDate() + offsetDays); d.setHours(h, m, 0, 0);
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(h)}:${p(m)}`;
};
const day = off => iso(off).slice(0, 10);

function seedDemoData() {
  if (row('SELECT COUNT(*) c FROM clients').c > 0) return;
  const clients = [
    ['Giulia Ferri', 'adulto', 'giulia.ferri@example.com', '3331112233', 'B1', 'Obiettivo: certificazione B2'],
    ['Luca Moretti', 'bambino', 'famiglia.moretti@example.com', '3334445566', 'A1', 'Ha 8 anni, lezioni il martedì'],
    ['Studio Rinaldi Srl', 'azienda', 'hr@rinaldi.example.com', '0655512345', 'B2', 'Business English per 6 persone'],
    ['Marta Colombo', 'adulto', 'marta.colombo@example.com', '3337778899', 'A2', 'Online da Milano'],
    ['Davide Greco', 'adulto', 'davide.greco@example.com', '3339990011', 'C1', 'Conversazione e preparazione colloquio']
  ];
  clients.forEach(c => run('INSERT INTO clients(name,type,email,phone,level,notes) VALUES(?,?,?,?,?,?)', ...c));

  const appts = [
    [1, 'Lezione individuale', iso(0, 17, 0), 60, 'online', 'Sarah', 'confermato'],
    [2, 'Lezione bambini', iso(1, 16, 30), 45, 'presenza', 'Emily', 'confermato'],
    [3, 'Business English – team', iso(2, 9, 30), 90, 'presenza', 'James', 'confermato'],
    [4, 'Lezione individuale', iso(3, 18, 30), 60, 'online', 'Sarah', 'richiesto'],
    [5, 'Mock interview', iso(4, 12, 0), 60, 'online', 'James', 'confermato'],
    [1, 'Lezione individuale', iso(-3, 17, 0), 60, 'online', 'Sarah', 'svolto']
  ];
  appts.forEach(a => run('INSERT INTO appointments(client_id,title,starts_at,duration_min,mode,teacher,status) VALUES(?,?,?,?,?,?,?)', ...a));

  const docs = [
    ['preventivo', 'P-2026-001', 3, [{ desc: 'Business English – 40 lezioni di gruppo (6 pers.)', qty: 1, price: 1900 }], 'inviato', day(-5), day(10)],
    ['fattura', 'F-2026-014', 1, [{ desc: 'Pacchetto Boost – 20 lezioni individuali', qty: 1, price: 520 }], 'pagata', day(-20), day(-10)],
    ['fattura', 'F-2026-015', 2, [{ desc: 'Pacchetto Start – 10 lezioni bambini', qty: 1, price: 290 }], 'emessa', day(-6), day(8)],
    ['preventivo', 'P-2026-002', 5, [{ desc: 'Pacchetto Pro – 40 lezioni individuali', qty: 1, price: 960 }], 'bozza', day(0), day(14)]
  ];
  docs.forEach(d => run('INSERT INTO documents(kind,number,client_id,items,status,issue_date,due_date) VALUES(?,?,?,?,?,?,?)', d[0], d[1], d[2], JSON.stringify(d[3]), d[4], d[5], d[6]));

  run('INSERT INTO payments(client_id,document_id,description,amount,due_date,paid_at,method) VALUES(?,?,?,?,?,?,?)', 1, 2, 'Pacchetto Boost', 520, day(-10), day(-11), 'Bonifico');
  run('INSERT INTO payments(client_id,document_id,description,amount,due_date) VALUES(?,?,?,?,?)', 2, 3, 'Pacchetto Start – saldo', 290, day(8));
  run('INSERT INTO payments(client_id,document_id,description,amount,due_date) VALUES(?,?,?,?,?)', 3, 1, 'Business English – acconto 50%', 950, day(5));
  run('INSERT INTO payments(client_id,document_id,description,amount,due_date) VALUES(?,?,?,?,?)', 4, null, 'Rata 2/3 – pacchetto Boost', 173.33, day(-2));

  run('INSERT INTO leads(name,email,phone,audience,mode,message,status) VALUES(?,?,?,?,?,?,?)', 'Paola Neri', 'paola.neri@example.com', '3335550101', 'bambini', 'online', 'Vorrei una prova per mia figlia di 7 anni.', 'nuova');
  run('INSERT INTO leads(name,email,phone,audience,mode,message,status) VALUES(?,?,?,?,?,?,?)', 'Andrea Sala', 'a.sala@example.com', '', 'azienda', 'presenza', 'Cerchiamo un corso per 10 dipendenti.', 'contattata');
}

seedContent();
seedDemoData();
if (require.main === module) console.log('Seed completato.');
module.exports = { seedContent, seedDemoData };
