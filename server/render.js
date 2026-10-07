// Rendering lato server della pagina pubblica: HTML completo (veloce e indicizzabile), nessuna dipendenza dal JS per i contenuti.
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = n => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

const LOGO = `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 6h32a6 6 0 0 1 6 6v18a6 6 0 0 1-6 6H24l-10 8v-8H8a6 6 0 0 1-6-6V12a6 6 0 0 1 6-6Z" fill="#ffd23f"/><path d="M17 14h14M17 22h10M17 30h14M17 14v16" stroke="#14103a" stroke-width="3.4" stroke-linecap="round" fill="none"/></svg>`;

function render(c, opts = {}) {
  const st = !!opts.static; // export statico per Netlify Drop: il modulo usa Netlify Forms
  const b = c.brand, h = c.hero;
  const marquee = ['Speak', 'Listen', 'Learn', 'Grow', 'Parla', 'Ascolta', 'Impara', 'Cresci'];
  const marqueeHtml = [...marquee, ...marquee].map(w => `<span>${esc(w)}</span><i aria-hidden="true">✦</i>`).join('');

  const ld = {
    '@context': 'https://schema.org', '@type': 'LanguageSchool', name: b.name, description: h.subtitle,
    telephone: b.phone, email: b.email, areaServed: 'IT', address: { '@type': 'PostalAddress', addressLocality: 'Roma', addressCountry: 'IT' }
  };

  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(b.name)} — Corsi di inglese a Roma e online</title>
<meta name="description" content="${esc(h.subtitle)}">
<meta name="theme-color" content="#14103a">
<meta property="og:title" content="${esc(b.name)} — ${esc(b.tagline)}">
<meta property="og:description" content="${esc(h.subtitle)}">
<meta property="og:type" content="website">
<link rel="icon" href="/site/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,800&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/site/site.css">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
</head>
<body>
<a class="skip" href="#main">Vai al contenuto</a>
<div class="progress" aria-hidden="true"></div>

<header class="nav" id="top">
  <a class="brand" href="/site/" aria-label="${esc(b.name)}">${LOGO}<span>${esc(b.name)}</span></a>
  <nav aria-label="Principale">
    <ul id="menu">
      <li><a href="#per-chi">Per chi</a></li>
      <li><a href="#come">Come funziona</a></li>
      <li><a href="#prezzi">Prezzi</a></li>
      <li><a href="#faq">FAQ</a></li>
      <li><a class="nav-cta" href="#contatti">Prova gratis</a></li>
    </ul>
    <button class="burger" aria-label="Apri il menu" aria-expanded="false" aria-controls="menu"><span></span><span></span></button>
  </nav>
</header>

<main id="main">
<section class="hero">
  <div class="blob b1"></div><div class="blob b2"></div>
  <div class="hero-in">
    <p class="kicker reveal">${esc(h.kicker)}</p>
    <h1 class="reveal">${esc(h.title)}</h1>
    <p class="typed reveal">Inglese <strong id="word" data-words='${esc(JSON.stringify(h.words))}'>${esc(h.words[0] || '')}</strong><span class="caret" aria-hidden="true"></span></p>
    <p class="lead reveal">${esc(h.subtitle)}</p>
    <div class="cta-row reveal">
      <a class="btn" href="#contatti">${esc(h.cta)} <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg></a>
      <a class="btn ghost" href="#per-chi">${esc(h.cta2)}</a>
    </div>
  </div>
  <div class="hero-art" aria-hidden="true">
    <div class="card-art a1"><b>Hello!</b><small>Lezione di prova gratis</small></div>
    <div class="card-art a2"><b>B2</b><small>Obiettivo certificazione</small></div>
    <div class="card-art a3"><b>1:1</b><small>Online · Roma</small></div>
    <div class="ring"></div>
  </div>
</section>

<div class="marquee" aria-hidden="true"><div class="track">${marqueeHtml}</div></div>

<section class="stats" aria-label="In numeri">
  ${c.stats.map(s => `<div class="stat reveal"><strong><span class="count" data-to="${Number(s.value) || 0}">${Number(s.value) || 0}</span>${esc(s.suffix)}</strong><span>${esc(s.label)}</span></div>`).join('')}
</section>

<section class="section" id="per-chi">
  <div class="wrap">
    <p class="eyebrow reveal">Per chi</p>
    <h2 class="reveal">Un corso per ogni <em>età</em> e ogni obiettivo</h2>
    <div class="grid3">
      ${c.audiences.map((a, i) => `<article class="card tilt reveal" style="--d:${i * 90}ms" data-aud="${esc(a.id)}">
        <span class="emoji" aria-hidden="true">${esc(a.icon)}</span>
        <span class="tag">${esc(a.tag)}</span>
        <h3>${esc(a.title)}</h3>
        <p>${esc(a.text)}</p>
        <a class="more" href="#contatti" data-pick="${esc(a.id)}">Richiedi informazioni →</a>
      </article>`).join('')}
    </div>
  </div>
</section>

<section class="section dark">
  <div class="wrap">
    <p class="eyebrow reveal">Come vuoi imparare</p>
    <h2 class="reveal">Scegli il formato <em>giusto per te</em></h2>
    <div class="bento">
      ${c.modes.map((m, i) => `<article class="bento-i reveal bi${i}" style="--d:${i * 80}ms"><h3>${esc(m.title)}</h3><p>${esc(m.text)}</p></article>`).join('')}
    </div>
  </div>
</section>

<section class="section" id="come">
  <div class="wrap">
    <p class="eyebrow reveal">Come funziona</p>
    <h2 class="reveal">Dal primo messaggio alla prima <em>conversazione</em></h2>
    <ol class="steps">
      ${c.steps.map((s, i) => `<li class="reveal" style="--d:${i * 100}ms"><span class="n">${i + 1}</span><div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div></li>`).join('')}
    </ol>
  </div>
</section>

<section class="section tint" id="prezzi">
  <div class="wrap">
    <p class="eyebrow reveal">Prezzi chiari</p>
    <h2 class="reveal">Lezioni individuali <em>accessibili</em></h2>
    <div class="grid3 packs">
      ${c.packs.map((p, i) => `<article class="pack reveal${p.featured ? ' featured' : ''}" style="--d:${i * 90}ms">
        ${p.featured ? '<span class="badge">Più scelto</span>' : ''}
        <h3>${esc(p.name)}</h3>
        <p class="note">${esc(p.note)}</p>
        <p class="price">${eur(p.price)}<small> / ${esc(p.lessons)} lezioni</small></p>
        <p class="per">≈ ${eur(Math.round(p.price / Math.max(1, p.lessons)))} a lezione</p>
        <ul>${(p.features || []).map(f => `<li>${esc(f)}</li>`).join('')}</ul>
        <a class="btn ${p.featured ? '' : 'ghost-dark'}" href="#contatti" data-pick-pack="${esc(p.name)}">Scegli ${esc(p.name)}</a>
      </article>`).join('')}
    </div>
    <p class="fine reveal">${esc(c.priceNote)}</p>
  </div>
</section>

<section class="section" id="faq">
  <div class="wrap narrow">
    <p class="eyebrow reveal">FAQ</p>
    <h2 class="reveal">Domande <em>frequenti</em></h2>
    <div class="faq">
      ${c.faq.map(f => `<details class="reveal"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}
    </div>
  </div>
</section>

<section class="section cta-sec" id="contatti">
  <div class="wrap two">
    <div class="reveal">
      <p class="eyebrow">Contatti</p>
      <h2>${esc(c.cta.title)}</h2>
      <p class="lead">${esc(c.cta.text)}</p>
      <ul class="contact-list">
        <li><span>✉️</span><a href="mailto:${esc(b.email)}">${esc(b.email)}</a></li>
        <li><span>📞</span><a href="tel:${esc(b.phone.replace(/\s/g, ''))}">${esc(b.phone)}</a></li>
        <li><span>📍</span>${esc(b.address)}</li>
        <li><span>🕐</span>${esc(b.hours)}</li>
      </ul>
    </div>
    <form class="form reveal" id="contact-form" novalidate${st ? ' name="contatti" method="POST" data-netlify="true" data-netlify-honeypot="website"' : ''}>
      ${st ? '<input type="hidden" name="form-name" value="contatti">' : ''}
      <h3>Richiedi la lezione di prova</h3>
      <label>Nome e cognome<input name="name" autocomplete="name" required maxlength="120"></label>
      <div class="row">
        <label>Email<input name="email" type="email" autocomplete="email" required maxlength="160"></label>
        <label>Telefono<input name="phone" type="tel" autocomplete="tel" maxlength="40"></label>
      </div>
      <div class="row">
        <label>Per chi è il corso?
          <select name="audience"><option value="">Seleziona…</option><option value="adulti">Per me (adulto)</option><option value="bambini">Per un bambino</option><option value="azienda">Per un'azienda</option></select>
        </label>
        <label>Modalità
          <select name="mode"><option value="">Seleziona…</option><option value="online">Online</option><option value="presenza">In presenza a Roma</option><option value="entrambi">Indifferente</option></select>
        </label>
      </div>
      <label>Quando preferisci essere contattato? <input name="slot" placeholder="Es. pomeriggio, dopo le 18" maxlength="80"></label>
      <label>Messaggio<textarea name="message" rows="3" maxlength="2000" placeholder="Raccontaci il tuo obiettivo…"></textarea></label>
      <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
      <label class="check"><input type="checkbox" name="privacy" required> Ho letto l'<a href="/site/privacy" target="_blank" rel="noopener">informativa privacy</a> e acconsento al trattamento dei dati.</label>
      <button class="btn" type="submit">Invia la richiesta <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg></button>
      <p class="msg" role="status" aria-live="polite"></p>
    </form>
  </div>
</section>
</main>

<footer class="foot">
  <div class="wrap foot-in">
    <a class="brand" href="/site/">${LOGO}<span>${esc(b.name)}</span></a>
    <p>${esc(b.tagline)}</p>
    <p class="small">© ${new Date().getFullYear()} ${esc(b.name)} · Demo · <a href="/site/privacy">Privacy</a>${st ? '' : ' · <a href="/admin/">Area gestionale</a>'}</p>
  </div>
</footer>

<a class="fab" href="#contatti" aria-label="${esc(h.cta)}">💬<span>Prova gratis</span></a>
<script src="/site/site.js" defer></script>
</body>
</html>`;
}

const NOT_FOUND = `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pagina non trovata — EasyEnglish</title><link rel="stylesheet" href="/site/site.css"></head><body><main class="nf"><h1>404</h1><p>Oops! This page doesn't exist.<br>Questa pagina non esiste.</p><a class="btn" href="/site/">Torna alla home</a></main></body></html>`;

const PRIVACY = c => `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Informativa privacy — ${esc(c.brand.name)}</title><meta name="robots" content="noindex"><link rel="stylesheet" href="/site/site.css"></head><body><main class="wrap narrow legal"><a class="brand dark" href="/site/">${LOGO}<span>${esc(c.brand.name)}</span></a><h1>Informativa privacy</h1><p><strong>Testo segnaposto della demo.</strong> Prima della pubblicazione andrà sostituito con l'informativa redatta ai sensi del GDPR.</p><p>I dati inseriti nel modulo di contatto (nome, email, telefono, messaggio) sono usati esclusivamente per rispondere alla tua richiesta da parte di ${esc(c.brand.name)}.</p><p>Per esercitare i tuoi diritti scrivi a <a href="mailto:${esc(c.brand.email)}">${esc(c.brand.email)}</a>.</p><p><a class="btn" href="/site/">← Torna al sito</a></p></main></body></html>`;

module.exports = { render, NOT_FOUND, PRIVACY };
