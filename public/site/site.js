(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Rivela al scroll
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  // Contatori
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const to = +e.target.dataset.to; if (reduce || !to) return;
    const t0 = performance.now(), dur = 1400;
    const tick = t => { const p = Math.min(1, (t - t0) / dur); e.target.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }), { threshold: .6 });
  $$('.count').forEach(el => cio.observe(el));

  // Parole che ruotano nell'hero
  const word = $('#word');
  if (word && !reduce) {
    let words = []; try { words = JSON.parse(word.dataset.words); } catch {}
    let i = 0;
    if (words.length > 1) setInterval(() => {
      word.classList.add('out');
      setTimeout(() => { i = (i + 1) % words.length; word.textContent = words[i]; word.classList.remove('out'); }, 260);
    }, 2200);
  }

  // Nav, progress bar, FAB
  const nav = $('.nav'), bar = $('.progress'), fab = $('.fab');
  let ticking = false;
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
      nav.classList.toggle('solid', y > 40);
      bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      const contact = $('#contatti').getBoundingClientRect().top;
      fab.classList.toggle('show', y > innerHeight * .8 && contact > innerHeight * .6);
      ticking = false;
    });
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Menu mobile
  const burger = $('.burger'), menu = $('#menu');
  burger.addEventListener('click', () => { const o = menu.classList.toggle('open'); burger.setAttribute('aria-expanded', o); });
  $$('#menu a').forEach(a => a.addEventListener('click', () => { menu.classList.remove('open'); burger.setAttribute('aria-expanded', false); }));

  // Tilt 3D sulle card
  if (!reduce && matchMedia('(hover:hover)').matches) {
    $$('.tilt').forEach(c => {
      c.addEventListener('pointermove', e => {
        const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        c.style.transform = `perspective(700px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
      });
      c.addEventListener('pointerleave', () => { c.style.transform = ''; });
    });
  }

  // Preselezione dal click su card / pacchetto
  const form = $('#contact-form');
  $$('[data-pick]').forEach(a => a.addEventListener('click', () => { form.audience.value = a.dataset.pick; }));
  $$('[data-pick-pack]').forEach(a => a.addEventListener('click', () => {
    const m = form.message; if (!m.value) m.value = `Mi interessa il pacchetto ${a.dataset.pickPack}.`;
  }));

  // Invio modulo
  const msg = $('.msg', form), btn = $('button[type=submit]', form);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    msg.className = 'msg'; msg.textContent = '';
    $$('.invalid', form).forEach(x => x.classList.remove('invalid'));
    const bad = [];
    if (form.name.value.trim().length < 2) bad.push(form.name);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.value.trim())) bad.push(form.email);
    if (bad.length || !form.privacy.checked) {
      bad.forEach(x => x.classList.add('invalid'));
      msg.className = 'msg err';
      msg.textContent = bad.length ? 'Controlla i campi evidenziati.' : 'Accetta l\'informativa privacy per continuare.';
      (bad[0] || form.privacy).focus(); return;
    }
    btn.disabled = true;
    try {
      const body = Object.fromEntries(new FormData(form)); body.privacy = form.privacy.checked;
      const r = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Invio non riuscito, riprova.');
      form.reset(); msg.className = 'msg ok'; msg.textContent = 'Grazie! Ti risponderemo entro 48 ore. 🎉';
      if (!reduce) confetti(btn);
    } catch (err) { msg.className = 'msg err'; msg.textContent = err.message; }
    btn.disabled = false;
  });

  function confetti(origin) {
    const r = origin.getBoundingClientRect(), colors = ['#ffd23f', '#ff5c7a', '#2ee6a6', '#5b8cff'];
    for (let i = 0; i < 28; i++) {
      const p = document.createElement('i');
      Object.assign(p.style, { position: 'fixed', left: r.left + r.width / 2 + 'px', top: r.top + 'px', width: '9px', height: '9px', background: colors[i % 4], borderRadius: i % 2 ? '50%' : '2px', pointerEvents: 'none', zIndex: 99 });
      document.body.appendChild(p);
      const a = Math.random() * Math.PI * 2, v = 90 + Math.random() * 160;
      p.animate([{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: `translate(${Math.cos(a) * v}px,${Math.sin(a) * v - 120 + 260}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }], { duration: 1100 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => p.remove();
    }
  }
})();
