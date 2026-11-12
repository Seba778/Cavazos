(() => {
  // Si el sistema pide menos movimiento (p. ej. Windows con animaciones apagadas), las animaciones
  // siguen funcionando pero con menos recorrido.
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const amp = calm ? 0.45 : 1;

  /* ---------- Video de inicio ---------- */
  const video = document.querySelector('.intro-video');
  const toggle = document.querySelector('.intro-toggle');
  if (video && toggle) {
    let userPaused = false;
    const play = () => { const r = video.play(); if (r && r.catch) r.catch(() => {}); };
    const label = () => {
      toggle.textContent = video.paused ? 'Reproducir video' : 'Pausar video';
      toggle.setAttribute('aria-pressed', String(video.paused));
    };
    toggle.addEventListener('click', () => {
      if (video.paused) { userPaused = false; play(); } else { userPaused = true; video.pause(); }
    });
    video.addEventListener('play', label);
    video.addEventListener('pause', label);
    // Se pausa fuera de pantalla para no gastar batería ni datos, y vuelve al regresar
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { if (!userPaused) play(); } else video.pause();
      }, { threshold: 0.15 }).observe(video);
    }
    play();
  }

  /* ---------- Selector: Mariscos · Carnes · Cabritos ---------- */
  const tabs = [...document.querySelectorAll('.picker-tab')];
  const items = [...document.querySelectorAll('.picker-list li')];
  const dishes = items.map(li => li.querySelector('.dish'));
  const imgs = [...document.querySelectorAll('.hero-img')];
  const card = document.querySelector('.hero-card');
  const cName = card.querySelector('.hero-card-name');
  const cPrice = card.querySelector('.hero-card-price');
  const cFact = card.querySelector('.hero-card-fact');
  let front = 0;
  let current = 0;
  let timer = null;
  let userTook = false;
  let swapTurn = 0;

  // Precarga las fotos grandes del selector
  dishes.forEach(d => { const i = new Image(); i.src = `assets/img/${d.dataset.img}.jpg`; });

  function showGroup(group) {
    tabs.forEach(t => t.setAttribute('aria-selected', String(t.dataset.group === group)));
    items.forEach(li => { li.hidden = li.dataset.group !== group; });
  }

  function select(index) {
    const d = dishes[index];
    if (!d) return;
    current = index;
    showGroup(d.closest('li').dataset.group);
    dishes.forEach(x => x.setAttribute('aria-pressed', String(x === d)));

    // Cada cambio lleva un turno; solo el último se aplica, y siempre queda una foto visible.
    const turn = ++swapTurn;
    const shown = imgs[front];
    const next = imgs[1 - front];
    const name = d.textContent.trim();
    const url = `assets/img/${d.dataset.img}.jpg`;
    const reveal = () => {
      if (turn !== swapTurn) return;
      next.alt = name; next.removeAttribute('aria-hidden');
      next.classList.add('is-on');
      shown.classList.remove('is-on');
      shown.alt = ''; shown.setAttribute('aria-hidden', 'true');
      front = imgs.indexOf(next);
    };
    const loader = new Image();
    loader.src = url;
    const ready = loader.decode ? loader.decode() : new Promise((ok, ko) => { loader.onload = ok; loader.onerror = ko; });
    ready.then(() => {
      if (turn !== swapTurn) return;
      next.src = url;
      (next.decode ? next.decode() : Promise.resolve()).then(reveal, reveal);
    }, () => { /* si la foto falla, se queda la actual */ });

    card.dataset.tone = d.dataset.tone;
    cName.textContent = d.textContent.trim();
    cPrice.textContent = d.dataset.price;
    cFact.textContent = d.dataset.fact;
  }

  function stopAuto() { clearInterval(timer); timer = null; }
  function startAuto() {
    if (userTook || timer) return;
    timer = setInterval(() => select((current + 1) % dishes.length), 6000);
  }

  dishes.forEach((d, i) => d.addEventListener('click', () => { userTook = true; stopAuto(); select(i); }));
  tabs.forEach(t => t.addEventListener('click', () => {
    userTook = true; stopAuto();
    const first = dishes.findIndex(d => d.closest('li').dataset.group === t.dataset.group);
    select(first);
  }));
  // Flechas entre pestañas
  tabs.forEach((t, i) => t.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
    n.focus(); n.click();
  }));

  const picker = document.querySelector('.picker');
  picker.addEventListener('mouseenter', stopAuto);
  picker.addEventListener('mouseleave', startAuto);
  picker.addEventListener('focusin', stopAuto);
  document.addEventListener('visibilitychange', () => document.hidden ? stopAuto() : startAuto());

  showGroup('mariscos');
  startAuto();

  /* ---------- Entradas escalonadas ---------- */
  // La carta y la visita también entran por partes
  document.querySelectorAll('.cat, .chapter-head, .chapter-strip, .visit-rows > div, .foot-blocks p').forEach(el => el.setAttribute('data-reveal', ''));
  const groups = new Map();
  document.querySelectorAll('[data-reveal]').forEach(el => {
    const parent = el.closest('section, footer') || document.body;
    const list = groups.get(parent) || [];
    el.style.setProperty('--d', `${Math.min(list.length, 6) * 80}ms`);
    list.push(el); groups.set(parent, list);
  });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('is-in'));
  }

  /* ---------- Parrillada: tres distancias ---------- */
  const show = document.querySelector('.showcase');
  if (show && 'IntersectionObserver' in window) {
    const markers = [...show.querySelectorAll('[data-stage]')];
    const so = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) show.dataset.stage = e.target.dataset.stage; });
    }, { rootMargin: '-50% 0px -50% 0px' });
    markers.forEach(m => so.observe(m));
  }

  /* ---------- Carta: pestañas ---------- */
  const mTabs = [...document.querySelectorAll('.menu-tab')];
  const panels = mTabs.map(t => document.getElementById(t.getAttribute('aria-controls')));
  function openChapter(id, animate) {
    mTabs.forEach((t, i) => {
      const on = panels[i].id === id;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      panels[i].hidden = !on;
      if (on && animate) {
        panels[i].classList.remove('is-entering'); void panels[i].offsetWidth; panels[i].classList.add('is-entering');
      }
    });
  }
  mTabs.forEach((t, i) => {
    t.addEventListener('click', () => openChapter(panels[i].id, true));
    t.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const n = mTabs[(i + (e.key === 'ArrowRight' ? 1 : mTabs.length - 1)) % mTabs.length];
      n.focus(); n.click();
    });
  });
  openChapter(panels[0].id, false);

  // Enlaces a un capítulo (#m-...) abren su pestaña y bajan a la carta
  document.querySelectorAll('a[href^="#m-"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1);
    if (!panels.some(p => p.id === id)) return;
    e.preventDefault();
    openChapter(id, true);
    document.getElementById('menu').scrollIntoView({ behavior: 'smooth' });
  }));

  // Teléfono: categorías plegadas salvo la primera de cada capítulo
  const phone = window.matchMedia('(max-width: 720px)');
  const cats = [...document.querySelectorAll('details.cat')];
  function setCats() {
    cats.forEach(d => { d.open = !phone.matches || d === d.parentElement.firstElementChild; });
  }
  setCats();
  phone.addEventListener('change', setCats);
  cats.forEach(d => d.querySelector('summary').addEventListener('click', e => { if (!phone.matches) e.preventDefault(); }));

  /* ---------- Animaciones ligadas al scroll ---------- */
  {
    const bands = [...document.querySelectorAll('[data-band]')];
    const para = [...document.querySelectorAll('[data-parallax]')];
    const row = document.querySelector('.gallery-row');
    let ticking = false;
    const vh = () => window.innerHeight;
    function frame() {
      ticking = false;
      const h = vh();
      bands.forEach(b => {
        const r = b.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > h + 200) return;
        const prog = (h - r.top) / (h + r.height);           // 0 → 1 mientras cruza la pantalla
        b.style.setProperty('--band-translate', `${(prog - .5) * 50 * amp * b.dataset.band}vw`);
      });
      para.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > h) return;
        const mid = (r.top + r.height / 2 - h / 2);
        el.style.setProperty('--parallax-translate', `${(-mid * amp * parseFloat(el.dataset.parallax)).toFixed(1)}px`);
      });
      if (row) {
        const r = row.getBoundingClientRect();
        if (r.bottom > 0 && r.top < h) row.style.setProperty('--gallery-translate', `${((r.top + r.height / 2 - h / 2) * 0.25 * amp).toFixed(1)}px`);
      }
    }
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    frame();
  }
})();
