(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = n => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n || 0);
const fdate = d => d ? new Date(d.length > 10 ? d : d + 'T00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const today = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
const sum = items => (items || []).reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.price) || 0), 0);

async function api(path, opts = {}) {
  const r = await fetch('/api/admin' + path, { method: opts.method || 'GET', headers: { 'Content-Type': 'application/json' }, body: opts.body ? JSON.stringify(opts.body) : undefined });
  if (r.status === 401) { showLogin(); throw new Error('Sessione scaduta'); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Errore');
  return j;
}
function toast(m, bad) { const t = $('#toast'); t.textContent = m; t.className = 'toast show' + (bad ? ' bad' : ''); clearTimeout(toast.t); toast.t = setTimeout(() => t.className = 'toast', 2600); }

// ---------- stato ----------
const S = { clients: [], docs: [] };
const clientName = id => (S.clients.find(c => c.id === id) || {}).name || '—';
const clientOpts = () => [['', '— nessuno —'], ...S.clients.map(c => [c.id, c.name])];
async function loadRefs() { [S.clients, S.docs] = await Promise.all([api('/clients'), api('/documents')]); }

// ---------- form generico ----------
// campo: {k, label, t: text|textarea|number|select|date|datetime|lines|check|email|tel, opts, req, step, full}
function fieldHtml(f, v) {
  const id = 'f_' + f.k, val = v ?? '';
  let inp;
  if (f.t === 'textarea') inp = `<textarea id="${id}" name="${f.k}" rows="3">${esc(val)}</textarea>`;
  else if (f.t === 'lines') inp = `<textarea id="${id}" name="${f.k}" rows="4">${esc((v || []).join('\n'))}</textarea>`;
  else if (f.t === 'select') inp = `<select id="${id}" name="${f.k}">${(typeof f.opts === 'function' ? f.opts() : f.opts).map(o => { const [ov, ol] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(ov)}"${String(ov) === String(val) ? ' selected' : ''}>${esc(ol)}</option>`; }).join('')}</select>`;
  else if (f.t === 'check') return `<label style="display:flex;gap:.5rem;align-items:center"><input type="checkbox" name="${f.k}"${v ? ' checked' : ''}> ${esc(f.label)}</label>`;
  else inp = `<input id="${id}" name="${f.k}" type="${f.t === 'datetime' ? 'datetime-local' : f.t || 'text'}" value="${esc(val)}"${f.req ? ' required' : ''}${f.t === 'number' ? ` step="${f.step || 'any'}"` : ''}>`;
  return `<label for="${id}">${esc(f.label)}${f.req ? ' *' : ''}${inp}</label>`;
}
function readFields(fields, root) {
  const o = {};
  for (const f of fields) {
    const el = root.querySelector(`[name="${f.k}"]`); if (!el) continue;
    if (f.t === 'check') o[f.k] = el.checked;
    else if (f.t === 'number') o[f.k] = el.value === '' ? null : Number(el.value);
    else if (f.t === 'lines') o[f.k] = el.value.split('\n').map(s => s.trim()).filter(Boolean);
    else o[f.k] = el.value;
  }
  return o;
}
function openModal(title, bodyHtml, onSave, { save = 'Salva', extra = '' } = {}) {
  const m = $('#modal'), f = $('#modal-form');
  f.className = 'mf';
  f.innerHTML = `<h2>${esc(title)}</h2>${bodyHtml}<div class="foot">${extra}<button type="button" class="btn sec" data-x>Annulla</button><button type="submit" class="btn">${save}</button></div>`;
  f.querySelector('[data-x]').onclick = () => m.close();
  f.onsubmit = async e => { e.preventDefault(); try { if ((await onSave(f)) !== false) m.close(); } catch (err) { toast(err.message, true); } };
  m.showModal();
  return f;
}
const confirmDel = async (path, label) => { if (!confirm(`Eliminare ${label}?`)) return false; await api(path, { method: 'DELETE' }); toast('Eliminato'); return true; };

// ---------- entità ----------
const STATUS = {
  lead: ['nuova', 'contattata', 'convertita', 'persa'],
  appt: ['richiesto', 'confermato', 'svolto', 'annullato'],
  quote: ['bozza', 'inviato', 'accettato', 'rifiutato'],
  invoice: ['bozza', 'emessa', 'pagata']
};
const badge = s => `<span class="badge ${esc(s)}">${esc(s)}</span>`;
const F = {
  leads: [
    { k: 'name', label: 'Nome', req: 1 }, { k: 'email', label: 'Email', t: 'email', req: 1 }, { k: 'phone', label: 'Telefono', t: 'tel' },
    { k: 'audience', label: 'Per chi', t: 'select', opts: [['', '—'], 'bambini', 'adulti', 'azienda'] },
    { k: 'mode', label: 'Modalità', t: 'select', opts: [['', '—'], 'online', 'presenza', 'entrambi'] },
    { k: 'status', label: 'Stato', t: 'select', opts: STATUS.lead }, { k: 'message', label: 'Messaggio', t: 'textarea' }
  ],
  clients: [
    { k: 'name', label: 'Nome / Ragione sociale', req: 1 }, { k: 'type', label: 'Tipo', t: 'select', opts: ['adulto', 'bambino', 'azienda'] },
    { k: 'email', label: 'Email', t: 'email' }, { k: 'phone', label: 'Telefono', t: 'tel' },
    { k: 'level', label: 'Livello (A1–C2)' }, { k: 'notes', label: 'Note', t: 'textarea' }
  ],
  appointments: [
    { k: 'title', label: 'Titolo', req: 1 }, { k: 'client_id', label: 'Cliente', t: 'select', opts: clientOpts },
    { k: 'starts_at', label: 'Data e ora', t: 'datetime', req: 1 }, { k: 'duration_min', label: 'Durata (min)', t: 'number', step: 5 },
    { k: 'mode', label: 'Modalità', t: 'select', opts: ['online', 'presenza'] }, { k: 'teacher', label: 'Insegnante' },
    { k: 'status', label: 'Stato', t: 'select', opts: STATUS.appt }, { k: 'notes', label: 'Note', t: 'textarea' }
  ],
  payments: [
    { k: 'description', label: 'Descrizione' }, { k: 'client_id', label: 'Cliente', t: 'select', opts: clientOpts },
    { k: 'amount', label: 'Importo (€)', t: 'number', req: 1, step: '0.01' }, { k: 'due_date', label: 'Scadenza', t: 'date', req: 1 },
    { k: 'paid_at', label: 'Pagato il', t: 'date' }, { k: 'method', label: 'Metodo', t: 'select', opts: [['', '—'], 'Bonifico', 'Carta', 'Contanti', 'PayPal'] }
  ]
};

function grid(fields, values) { return `<div class="grid2">${fields.map(f => fieldHtml(f, values[f.k])).join('')}</div>`; }
async function editEntity(table, title, item = {}, refresh) {
  const isNew = !item.id;
  const vals = { ...item };
  if (table === 'appointments' && vals.starts_at) vals.starts_at = vals.starts_at.slice(0, 16);
  openModal((isNew ? 'Nuovo ' : 'Modifica ') + title, grid(F[table], vals), async f => {
    const body = readFields(F[table], f);
    await api(`/${table}${isNew ? '' : '/' + item.id}`, { method: isNew ? 'POST' : 'PUT', body });
    toast('Salvato'); await loadRefs(); refresh();
  });
}

// ---------- viste ----------
const views = {};
const NAV = [['dashboard', 'Dashboard'], ['leads', 'Richieste'], ['clients', 'Clienti'], ['appointments', 'Appuntamenti'], ['documents', 'Preventivi e fatture'], ['payments', 'Pagamenti'], ['content', 'Contenuti sito']];
const view = () => $('#view');
const head = (t, btn = '') => `<div class="head"><h1 class="t">${t}</h1><div>${btn}</div></div>`;
const tableHtml = (cols, rows, empty = 'Nessun dato.') => rows.length ? `<div class="tw"><table><thead><tr>${cols.map(c => `<th class="${c.num ? 'num' : ''}">${c.h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>` : `<div class="tw"><p class="empty">${empty}</p></div>`;

views.dashboard = async () => {
  const d = await api('/dashboard');
  view().innerHTML = head('Dashboard') + `
  <div class="cards">
    <div class="kpi"><b>${d.newLeads}</b><span>Nuove richieste</span></div>
    <div class="kpi"><b>${d.clients}</b><span>Clienti</span></div>
    <div class="kpi"><b>${d.openQuotes}</b><span>Preventivi aperti</span></div>
    <div class="kpi"><b>${eur(d.toCollect)}</b><span>Da incassare</span></div>
    <div class="kpi ${d.overdue ? 'warn' : ''}"><b>${eur(d.overdue)}</b><span>Scaduto</span></div>
    <div class="kpi good"><b>${eur(d.collected)}</b><span>Incassato</span></div>
  </div>
  <div class="two">
    <section class="panel"><h2 class="t">Prossimi appuntamenti</h2>${d.upcoming.length ? `<ul class="list">${d.upcoming.map(a => `<li><span><b>${esc(a.title)}</b><br><small>${esc(a.client_name || '—')} · ${esc(a.mode)}</small></span><span>${fdate(a.starts_at.slice(0, 10))} ${esc(a.starts_at.slice(11, 16))}</span></li>`).join('')}</ul>` : '<p class="empty">Nessun appuntamento.</p>'}</section>
    <section class="panel"><h2 class="t">Ultime richieste dal sito</h2>${d.recentLeads.length ? `<ul class="list">${d.recentLeads.map(l => `<li><span><b>${esc(l.name)}</b><br><small>${esc(l.audience || '—')} · ${esc(l.email)}</small></span>${badge(l.status)}</li>`).join('')}</ul>` : '<p class="empty">Nessuna richiesta.</p>'}</section>
  </div>`;
};

views.leads = async () => {
  const draw = async () => {
    const q = ($('#q') || {}).value?.toLowerCase() || '', st = ($('#st') || {}).value || '';
    const all = await api('/leads');
    const rows = all.filter(l => (!st || l.status === st) && (!q || (l.name + l.email + (l.message || '')).toLowerCase().includes(q))).map(l => `<tr>
      <td><b>${esc(l.name)}</b><br><small>${esc(l.email)}${l.phone ? ' · ' + esc(l.phone) : ''}</small></td>
      <td>${esc(l.audience || '—')}<br><small>${esc(l.mode || '')}</small></td><td style="max-width:22rem">${esc(l.message || '')}</td>
      <td>${fdate(l.created_at)}</td><td>${badge(l.status)}</td>
      <td class="act">${l.client_id ? '' : `<button class="btn sm" data-conv="${l.id}">→ Cliente</button>`}<button class="btn sm sec" data-edit="${l.id}">Modifica</button><button class="btn sm danger" data-del="${l.id}">✕</button></td></tr>`);
    $('#tbl').innerHTML = tableHtml([{ h: 'Contatto' }, { h: 'Interesse' }, { h: 'Messaggio' }, { h: 'Data' }, { h: 'Stato' }, { h: '' }], rows, 'Nessuna richiesta.');
    $('#tbl').onclick = async e => {
      const b = e.target.closest('button'); if (!b) return;
      try {
        if (b.dataset.conv) { await api(`/leads/${b.dataset.conv}/convert`, { method: 'POST' }); toast('Cliente creato'); await loadRefs(); draw(); }
        if (b.dataset.edit) editEntity('leads', 'richiesta', all.find(x => x.id == b.dataset.edit), draw);
        if (b.dataset.del && await confirmDel('/leads/' + b.dataset.del, 'la richiesta')) draw();
      } catch (err) { toast(err.message, true); }
    };
  };
  view().innerHTML = head('Richieste dal sito') + `<div class="tools"><input id="q" placeholder="Cerca…" aria-label="Cerca"><select id="st" aria-label="Stato"><option value="">Tutti gli stati</option>${STATUS.lead.map(s => `<option>${s}</option>`).join('')}</select></div><div id="tbl"></div>`;
  $('#q').oninput = draw; $('#st').onchange = draw; draw();
};

views.clients = async () => {
  const draw = () => {
    const q = ($('#q') || {}).value?.toLowerCase() || '';
    const rows = S.clients.filter(c => !q || (c.name + (c.email || '') + (c.notes || '')).toLowerCase().includes(q)).map(c => `<tr>
      <td><b>${esc(c.name)}</b><br><small>${esc(c.notes || '')}</small></td><td>${esc(c.type)}</td><td>${esc(c.email || '')}<br><small>${esc(c.phone || '')}</small></td><td>${esc(c.level || '—')}</td>
      <td class="act"><button class="btn sm sec" data-edit="${c.id}">Modifica</button><button class="btn sm danger" data-del="${c.id}">✕</button></td></tr>`);
    $('#tbl').innerHTML = tableHtml([{ h: 'Cliente' }, { h: 'Tipo' }, { h: 'Contatti' }, { h: 'Livello' }, { h: '' }], rows, 'Nessun cliente.');
  };
  view().innerHTML = head('Clienti', '<button class="btn" id="add">+ Nuovo cliente</button>') + `<div class="tools"><input id="q" placeholder="Cerca cliente…" aria-label="Cerca"></div><div id="tbl"></div>`;
  $('#q').oninput = draw; $('#add').onclick = () => editEntity('clients', 'cliente', {}, draw);
  $('#tbl').onclick = async e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.edit) editEntity('clients', 'cliente', S.clients.find(x => x.id == b.dataset.edit), draw);
    if (b.dataset.del && await confirmDel('/clients/' + b.dataset.del, 'il cliente')) { await loadRefs(); draw(); }
  };
  draw();
};

views.appointments = async () => {
  const draw = async () => {
    const all = await api('/appointments'), showPast = $('#past').checked, t = today();
    const list = all.filter(a => showPast || a.starts_at.slice(0, 10) >= t);
    const byDay = {}; list.forEach(a => (byDay[a.starts_at.slice(0, 10)] ||= []).push(a));
    $('#ag').innerHTML = Object.keys(byDay).length ? Object.entries(byDay).map(([d, arr]) => `<h2 class="day">${new Date(d + 'T00:00').toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>` + arr.map(a => `
      <div class="ag"><time>${esc(a.starts_at.slice(11, 16))}</time><div><b>${esc(a.title)}</b> ${badge(a.status)}<br><small>${esc(clientName(a.client_id))} · ${esc(a.mode)} · ${a.duration_min} min${a.teacher ? ' · ' + esc(a.teacher) : ''}</small></div>
      <div><button class="btn sm sec" data-edit="${a.id}">Modifica</button> <button class="btn sm danger" data-del="${a.id}">✕</button></div></div>`).join('')).join('') : '<div class="tw"><p class="empty">Nessun appuntamento in agenda.</p></div>';
    $('#ag').onclick = async e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.edit) editEntity('appointments', 'appuntamento', all.find(x => x.id == b.dataset.edit), draw);
      if (b.dataset.del && await confirmDel('/appointments/' + b.dataset.del, "l'appuntamento")) draw();
    };
  };
  view().innerHTML = head('Appuntamenti e prenotazioni', '<button class="btn" id="add">+ Nuovo appuntamento</button>') + `<div class="tools"><label style="display:flex;gap:.5rem;align-items:center"><input type="checkbox" id="past"> Mostra anche passati</label></div><div id="ag"></div>`;
  $('#past').onchange = draw; $('#add').onclick = () => editEntity('appointments', 'appuntamento', { status: 'confermato', mode: 'online', duration_min: 60, starts_at: today() + 'T17:00' }, draw);
  draw();
};

// Preventivi e fatture
views.documents = async () => {
  const draw = async () => {
    S.docs = await api('/documents');
    const kind = $('#kind').value;
    const rows = S.docs.filter(d => !kind || d.kind === kind).map(d => `<tr>
      <td><b>${esc(d.number || '—')}</b><br><small>${esc(d.kind)}</small></td><td>${esc(clientName(d.client_id))}</td><td>${fdate(d.issue_date)}</td><td>${fdate(d.due_date)}</td>
      <td class="num"><b>${eur(sum(d.items))}</b></td><td>${badge(d.status)}</td>
      <td class="act"><button class="btn sm sec" data-print="${d.id}">Stampa</button>${d.kind === 'fattura' ? `<button class="btn sm sec" data-pay="${d.id}">+ Scadenza</button>` : `<button class="btn sm sec" data-inv="${d.id}">→ Fattura</button>`}<button class="btn sm sec" data-edit="${d.id}">Modifica</button><button class="btn sm danger" data-del="${d.id}">✕</button></td></tr>`);
    $('#tbl').innerHTML = tableHtml([{ h: 'Numero' }, { h: 'Cliente' }, { h: 'Data' }, { h: 'Scadenza' }, { h: 'Totale', num: 1 }, { h: 'Stato' }, { h: '' }], rows, 'Nessun documento.');
    $('#tbl').onclick = async e => {
      const b = e.target.closest('button'); if (!b) return;
      const d = S.docs.find(x => x.id == (b.dataset.edit || b.dataset.print || b.dataset.pay || b.dataset.inv || b.dataset.del));
      try {
        if (b.dataset.edit) editDoc(d, draw);
        if (b.dataset.print) printDoc(d);
        if (b.dataset.del && await confirmDel('/documents/' + d.id, 'il documento')) draw();
        if (b.dataset.pay) { await api('/payments', { method: 'POST', body: { client_id: d.client_id, document_id: d.id, description: `Fattura ${d.number}`, amount: sum(d.items), due_date: d.due_date || today() } }); toast('Scadenza creata in Pagamenti'); }
        if (b.dataset.inv) { const { number } = await api('/next-number/fattura'); await api('/documents', { method: 'POST', body: { kind: 'fattura', number, client_id: d.client_id, items: d.items, status: 'bozza', issue_date: today(), due_date: d.due_date, notes: `Da preventivo ${d.number}` } }); await api('/documents/' + d.id, { method: 'PUT', body: { status: 'accettato' } }); toast('Fattura creata'); draw(); }
      } catch (err) { toast(err.message, true); }
    };
  };
  view().innerHTML = head('Preventivi e fatture', '<button class="btn sec" id="addq">+ Preventivo</button> <button class="btn" id="addf">+ Fattura</button>') + `<div class="tools"><select id="kind" aria-label="Tipo"><option value="">Tutti</option><option value="preventivo">Preventivi</option><option value="fattura">Fatture</option></select></div><div id="tbl"></div>`;
  $('#kind').onchange = draw;
  for (const [id, kind] of [['addq', 'preventivo'], ['addf', 'fattura']]) $('#' + id).onclick = async () => {
    const { number } = await api('/next-number/' + kind);
    editDoc({ kind, number, status: kind === 'fattura' ? 'emessa' : 'bozza', issue_date: today(), items: [{ desc: '', qty: 1, price: 0 }] }, draw);
  };
  draw();
};
function editDoc(d, refresh) {
  const isNew = !d.id;
  const fields = [
    { k: 'number', label: 'Numero' }, { k: 'client_id', label: 'Cliente', t: 'select', opts: clientOpts },
    { k: 'status', label: 'Stato', t: 'select', opts: d.kind === 'fattura' ? STATUS.invoice : STATUS.quote },
    { k: 'issue_date', label: 'Data emissione', t: 'date' }, { k: 'due_date', label: d.kind === 'fattura' ? 'Scadenza pagamento' : 'Valido fino al', t: 'date' }
  ];
  const itemRow = (i = {}) => `<div class="rep-row"><input placeholder="Descrizione" value="${esc(i.desc)}" data-k="desc"><input type="number" min="0" step="1" value="${esc(i.qty ?? 1)}" data-k="qty" aria-label="Quantità"><input type="number" min="0" step="0.01" value="${esc(i.price ?? 0)}" data-k="price" aria-label="Prezzo"><button type="button" class="btn sm danger" data-rm>✕</button></div>`;
  const f = openModal((isNew ? 'Nuovo ' : 'Modifica ') + d.kind, grid(fields, d) + `<div><b style="font-size:.85rem">Voci</b><div class="rep" id="items">${(d.items.length ? d.items : [{}]).map(itemRow).join('')}</div><button type="button" class="btn sm sec" id="addi" style="margin-top:.5rem">+ Voce</button><p style="text-align:right;margin-top:.5rem">Totale: <b id="tot"></b></p></div>${fieldHtml({ k: 'notes', label: 'Note', t: 'textarea' }, d.notes)}`, async f => {
    const body = { ...readFields(fields, f), kind: d.kind, notes: f.querySelector('[name=notes]').value, items: readItems(f) };
    await api('/documents' + (isNew ? '' : '/' + d.id), { method: isNew ? 'POST' : 'PUT', body });
    toast('Salvato'); refresh();
  });
  const readItems = root => [...root.querySelectorAll('.rep-row')].map(r => ({ desc: r.querySelector('[data-k=desc]').value, qty: r.querySelector('[data-k=qty]').value, price: r.querySelector('[data-k=price]').value })).filter(i => i.desc.trim());
  const upd = () => { f.querySelector('#tot').textContent = eur(sum(readItems(f))); };
  f.addEventListener('input', upd); upd();
  f.querySelector('#addi').onclick = () => { f.querySelector('#items').insertAdjacentHTML('beforeend', itemRow()); };
  f.addEventListener('click', e => { if (e.target.dataset.rm !== undefined) { e.target.closest('.rep-row').remove(); upd(); } });
}
function printDoc(d) {
  const w = open('', '_blank'); if (!w) return toast('Consenti i popup per stampare', true);
  const c = S.clients.find(x => x.id === d.client_id) || {};
  w.document.write(`<!doctype html><meta charset=utf-8><title>${esc(d.number)}</title><style>body{font:15px/1.5 system-ui;margin:3rem;color:#14103a}h1{font-size:1.8rem;margin:0}table{width:100%;border-collapse:collapse;margin:2rem 0}th,td{padding:.6rem;border-bottom:1px solid #ddd;text-align:left}td:last-child,th:last-child{text-align:right}.tot{text-align:right;font-size:1.3rem;font-weight:700}small{color:#666}</style>
  <h1>EasyEnglish</h1><small>Roma · ciao@easyenglish.demo · documento dimostrativo</small><h2 style="margin-top:2rem;text-transform:capitalize">${esc(d.kind)} ${esc(d.number)}</h2>
  <p><b>${esc(c.name || '')}</b><br>${esc(c.email || '')}</p><p>Data: ${fdate(d.issue_date)} · ${d.kind === 'fattura' ? 'Scadenza' : 'Valido fino al'}: ${fdate(d.due_date)}</p>
  <table><thead><tr><th>Descrizione</th><th>Qtà</th><th>Prezzo</th><th>Importo</th></tr></thead><tbody>${d.items.map(i => `<tr><td>${esc(i.desc)}</td><td>${esc(i.qty)}</td><td>${eur(i.price)}</td><td>${eur(i.qty * i.price)}</td></tr>`).join('')}</tbody></table>
  <p class="tot">Totale ${eur(sum(d.items))}</p><p>${esc(d.notes || '')}</p><script>onload=()=>print()<\/script>`);
  w.document.close();
}

views.payments = async () => {
  const draw = async () => {
    const all = await api('/payments'), t = today(), f = $('#pf').value;
    const state = p => p.paid_at ? 'pagato' : p.due_date < t ? 'scaduto' : 'da pagare';
    const rows = all.filter(p => !f || state(p) === f).map(p => { const s = state(p); return `<tr>
      <td><b>${esc(p.description || '—')}</b><br><small>${esc(clientName(p.client_id))}</small></td><td>${fdate(p.due_date)}</td><td class="num"><b>${eur(p.amount)}</b></td>
      <td><span class="badge ${s === 'pagato' ? 'ok' : s === 'scaduto' ? 'late' : 'nuova'}">${s}</span>${p.paid_at ? `<br><small>${fdate(p.paid_at)} ${esc(p.method || '')}</small>` : ''}</td>
      <td class="act">${p.paid_at ? '' : `<button class="btn sm" data-paid="${p.id}">Segna pagato</button>`}<button class="btn sm sec" data-edit="${p.id}">Modifica</button><button class="btn sm danger" data-del="${p.id}">✕</button></td></tr>`; });
    $('#tbl').innerHTML = tableHtml([{ h: 'Descrizione' }, { h: 'Scadenza' }, { h: 'Importo', num: 1 }, { h: 'Stato' }, { h: '' }], rows, 'Nessun pagamento.');
    $('#tbl').onclick = async e => {
      const b = e.target.closest('button'); if (!b) return;
      try {
        if (b.dataset.paid) { await api('/payments/' + b.dataset.paid, { method: 'PUT', body: { paid_at: today(), method: 'Bonifico' } }); toast('Pagamento registrato'); draw(); }
        if (b.dataset.edit) editEntity('payments', 'pagamento', all.find(x => x.id == b.dataset.edit), draw);
        if (b.dataset.del && await confirmDel('/payments/' + b.dataset.del, 'il pagamento')) draw();
      } catch (err) { toast(err.message, true); }
    };
  };
  view().innerHTML = head('Pagamenti e scadenze', '<button class="btn" id="add">+ Nuova scadenza</button>') + `<div class="tools"><select id="pf" aria-label="Filtro"><option value="">Tutti</option><option>da pagare</option><option>scaduto</option><option>pagato</option></select></div><div id="tbl"></div>`;
  $('#pf').onchange = draw; $('#add').onclick = () => editEntity('payments', 'pagamento', { due_date: today() }, draw);
  draw();
};

// ---------- Contenuti sito (CMS) ----------
const SECTIONS = [
  { key: 'hero', title: 'Prima schermata (hero)', type: 'object', fields: [{ k: 'kicker', label: 'Sopratitolo' }, { k: 'title', label: 'Titolo', t: 'textarea' }, { k: 'subtitle', label: 'Sottotitolo', t: 'textarea' }, { k: 'cta', label: 'Testo bottone principale' }, { k: 'cta2', label: 'Testo bottone secondario' }, { k: 'words', label: 'Parole che ruotano (una per riga)', t: 'lines' }] },
  { key: 'stats', title: 'Numeri', type: 'list', fields: [{ k: 'value', label: 'Valore', t: 'number' }, { k: 'suffix', label: 'Suffisso' }, { k: 'label', label: 'Etichetta' }], blank: { value: 0, suffix: '', label: '' } },
  { key: 'audiences', title: 'Per chi (bambini, adulti, aziende)', type: 'list', fields: [{ k: 'id', label: 'ID (bambini / adulti / azienda)' }, { k: 'icon', label: 'Emoji' }, { k: 'title', label: 'Titolo' }, { k: 'tag', label: 'Etichetta' }, { k: 'text', label: 'Testo', t: 'textarea' }], blank: { id: '', icon: '⭐', title: '', tag: '', text: '' } },
  { key: 'modes', title: 'Formati di lezione', type: 'list', fields: [{ k: 'title', label: 'Titolo' }, { k: 'text', label: 'Testo', t: 'textarea' }], blank: { title: '', text: '' } },
  { key: 'steps', title: 'Come funziona', type: 'list', fields: [{ k: 'title', label: 'Titolo' }, { k: 'text', label: 'Testo', t: 'textarea' }], blank: { title: '', text: '' } },
  { key: 'packs', title: 'Prezzi e pacchetti', type: 'list', fields: [{ k: 'name', label: 'Nome' }, { k: 'lessons', label: 'N. lezioni', t: 'number' }, { k: 'price', label: 'Prezzo (€)', t: 'number' }, { k: 'note', label: 'Nota breve' }, { k: 'features', label: 'Cosa include (una per riga)', t: 'lines' }, { k: 'featured', label: 'Evidenzia come "Più scelto"', t: 'check' }], blank: { name: '', lessons: 10, price: 0, note: '', features: [], featured: false } },
  { key: 'priceNote', title: 'Nota sotto i prezzi', type: 'string' },
  { key: 'faq', title: 'Domande frequenti', type: 'list', fields: [{ k: 'q', label: 'Domanda' }, { k: 'a', label: 'Risposta', t: 'textarea' }], blank: { q: '', a: '' } },
  { key: 'cta', title: 'Sezione contatti', type: 'object', fields: [{ k: 'title', label: 'Titolo' }, { k: 'text', label: 'Testo', t: 'textarea' }] },
  { key: 'brand', title: 'Dati attività e contatti', type: 'object', fields: [{ k: 'name', label: 'Nome' }, { k: 'tagline', label: 'Slogan' }, { k: 'email', label: 'Email' }, { k: 'phone', label: 'Telefono' }, { k: 'address', label: 'Sede' }, { k: 'hours', label: 'Orari' }] }
];
views.content = async () => {
  const content = await (await fetch('/api/content')).json();
  view().innerHTML = head('Contenuti del sito') + `<p style="margin-bottom:1rem;opacity:.75">Modifica testi, prezzi e FAQ: le modifiche sono visibili subito sul <a href="/site/" target="_blank" rel="noopener">sito</a>.</p>` +
    SECTIONS.map(s => `<details class="sect" data-s="${s.key}"><summary>${esc(s.title)}</summary><div class="body">${sectionBody(s, content[s.key])}<div><button class="btn" data-save="${s.key}">Salva sezione</button></div></div></details>`).join('');
  view().onclick = async e => {
    const b = e.target.closest('button'); if (!b) return;
    const sec = b.closest('.sect'); if (!sec) return;
    const s = SECTIONS.find(x => x.key === sec.dataset.s);
    if (b.dataset.add !== undefined) { sec.querySelector('.items').insertAdjacentHTML('beforeend', itemCard(s, s.blank)); return; }
    if (b.dataset.rm !== undefined) { b.closest('.rep-card').remove(); return; }
    if (b.dataset.save) {
      try { await api('/content/' + s.key, { method: 'PUT', body: readSection(s, sec) }); toast('Pubblicato sul sito ✓'); } catch (err) { toast(err.message, true); }
    }
  };
};
const itemCard = (s, item) => `<div class="rep-card">${grid(s.fields, item)}<div><button type="button" class="btn sm danger" data-rm>Rimuovi</button></div></div>`;
function sectionBody(s, v) {
  if (s.type === 'string') return `<label>Testo<textarea name="_v" rows="3">${esc(v)}</textarea></label>`;
  if (s.type === 'object') return grid(s.fields, v || {});
  return `<div class="items" style="display:grid;gap:.8rem">${(v || []).map(i => itemCard(s, i)).join('')}</div><div><button type="button" class="btn sm sec" data-add>+ Aggiungi</button></div>`;
}
function readSection(s, sec) {
  if (s.type === 'string') return sec.querySelector('[name=_v]').value;
  if (s.type === 'object') return readFields(s.fields, sec.querySelector('.body'));
  return [...sec.querySelectorAll('.rep-card')].map(c => readFields(s.fields, c));
}

// ---------- routing / auth ----------
async function route() {
  const name = (location.hash.slice(1) || 'dashboard');
  const key = views[name] ? name : 'dashboard';
  document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('on', a.dataset.v === key));
  view().onclick = null;
  view().innerHTML = '<p class="empty">Caricamento…</p>';
  try { await loadRefs(); await views[key](); } catch (e) { if (e.message !== 'Sessione scaduta') view().innerHTML = `<p class="empty">${esc(e.message)}</p>`; }
  view().focus({ preventScroll: true });
  refreshBadge();
}
async function refreshBadge() {
  try { const d = await api('/dashboard'); const a = document.querySelector('#nav a[data-v=leads]'); if (a) a.innerHTML = `Richieste${d.newLeads ? `<span class="pill">${d.newLeads}</span>` : ''}`; } catch {}
}
function showLogin() { $('#app').hidden = true; $('#login').hidden = false; }
function showApp() {
  $('#login').hidden = true; $('#app').hidden = false;
  $('#nav').innerHTML = NAV.map(([k, l]) => `<a href="#${k}" data-v="${k}">${l}</a>`).join('');
  route();
}
addEventListener('hashchange', () => { if (!$('#app').hidden) route(); });
$('#logout').onclick = async () => { await fetch('/api/admin/logout', { method: 'POST' }); showLogin(); };
$('#login-form').onsubmit = async e => {
  e.preventDefault(); $('#login-err').textContent = '';
  const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: e.target.password.value }) });
  if (r.ok) { e.target.reset(); showApp(); } else $('#login-err').textContent = (await r.json().catch(() => ({}))).error || 'Errore';
};
fetch('/api/admin/me').then(r => r.json()).then(j => j.authed ? showApp() : showLogin()).catch(showLogin);
})();
