/* Los Cavazos · capa de movimiento
   Telón de entrada, brasas sobre el video, scroll suave, títulos que suben letra a letra,
   panel del cabrito que se abre, muro de fotos que se cruza y la firma del pie.
   Si GSAP no carga, la página sigue completa con las entradas de main.js. */
(() => {
  const html = document.documentElement;
  const g = window.gsap;
  const ST = window.ScrollTrigger;
  const Split = window.SplitText;
  const loader = document.querySelector('.loader');
  const withLoader = loader && !html.classList.contains('no-loader');
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const bar = () => (document.querySelector('.bar') || { offsetHeight: 72 }).offsetHeight;

  embers();

  if (!g || !ST) { if (loader) loader.remove(); return; }
  g.registerPlugin(ST);
  if (Split) g.registerPlugin(Split);
  html.classList.add('has-motion');

  /* ---------- Scroll suave ---------- */
  let lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.12, smoothWheel: true });
    window.__lenis = lenis;
    lenis.on('scroll', ST.update);
    g.ticker.add((t) => lenis.raf(t * 1000));
    g.ticker.lagSmoothing(0);
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || e.defaultPrevented) return;
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: -bar() });
      history.replaceState(null, '', id);
    });
  }

  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  fontsReady.then(init);

  function splitChars(el) {
    el.removeAttribute('data-reveal');
    if (!Split) return [el];
    const s = new Split(el, { type: 'lines,chars', mask: 'lines' });
    return s.chars;
  }

  function init() {
    /* ---------- Inicio: telón + título ---------- */
    const title = document.querySelector('.intro-title');
    const introBits = g.utils.toArray('.intro-lede, .intro-actions');
    introBits.forEach((el) => el.removeAttribute('data-reveal'));
    const titleChars = title ? splitChars(title) : [];
    if (title) g.set(title, { visibility: 'visible' });

    const intro = g.timeline({ paused: true })
      .fromTo('.intro-video', { scale: 1.18 }, { scale: 1, duration: 2.4, ease: 'power2.out' }, 0)
      .from(titleChars, { yPercent: 115, rotate: 6, duration: 1.1, stagger: 0.035, ease: 'expo.out' }, 0.1)
      .from(introBits, { y: 28, opacity: calm ? 1 : 0, duration: 0.9, stagger: 0.1, ease: 'power3.out' }, 0.55);
    if (!calm) intro.from('.intro-toggle', { opacity: 0, duration: 0.6 }, 0.9);

    if (withLoader) {
      g.timeline({
        onComplete() {
          loader.remove();
          try { sessionStorage.setItem('cvz-seen', '1'); } catch (e) { /* sin almacenamiento */ }
        },
      })
        .from('.loader-logo', { yPercent: 40, opacity: 0, duration: 0.7, ease: 'power3.out' })
        .to('.loader-bar span', { scaleX: 1, duration: 0.9, ease: 'power2.inOut' }, '-=0.25')
        .to('.loader-panel--front', { yPercent: -100, duration: 0.95, ease: 'expo.inOut' }, '+=0.1')
        .to('.loader-panel--back', { yPercent: -100, duration: 0.95, ease: 'expo.inOut' }, '-=0.78')
        .add(() => intro.play(), '-=0.6');
    } else {
      if (loader) loader.remove();
      intro.play();
    }

    /* ---------- Títulos de sección: suben letra a letra ---------- */
    g.utils.toArray('.about-title, .hero-title, .section-title, .gallery-title > span:first-child, .visit-card h2').forEach((el) => {
      const chars = splitChars(el);
      g.from(chars, {
        yPercent: 110, duration: 0.9, stagger: 0.022, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    });

    /* ---------- El panel del cabrito se abre ---------- */
    g.fromTo('.about-panel',
      { clipPath: 'inset(9% 7% 9% 7%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: '.about', start: 'top 92%', end: 'top 20%', scrub: true } });
    const stamp = document.querySelector('.about-stamp');
    if (stamp) { stamp.removeAttribute('data-reveal'); stamp.classList.add('is-in'); }
    g.from('.about-stamp', {
      rotate: -14, scale: 0.6, opacity: 0, duration: 1, ease: 'back.out(2)',
      scrollTrigger: { trigger: '.about-stamp', start: 'top 85%', once: true },
    });

    /* ---------- Platillos: la foto se descubre ---------- */
    g.from('.hero-frame', {
      clipPath: 'inset(100% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut',
      scrollTrigger: { trigger: '.hero', start: 'top 70%', once: true },
    });
    g.from('.hero-card', {
      yPercent: 100, duration: 1, ease: 'expo.out',
      scrollTrigger: { trigger: '.hero', start: 'top 55%', once: true },
    });

    /* ---------- Carta: indicador de pestaña y fotos que se descubren ---------- */
    const tabs = document.querySelector('.menu-tabs');
    if (tabs) {
      const ink = document.createElement('span');
      ink.className = 'menu-ink';
      ink.setAttribute('aria-hidden', 'true');
      tabs.appendChild(ink);
      const place = () => {
        const t = tabs.querySelector('[aria-selected="true"]');
        if (!t) return;
        ink.style.width = `${t.offsetWidth}px`;
        ink.style.top = `${t.offsetTop + t.offsetHeight + 8}px`;
        ink.style.transform = `translateX(${t.offsetLeft}px)`;
      };
      place();
      window.addEventListener('resize', place);
      tabs.addEventListener('click', (e) => {
        if (!e.target.closest('.menu-tab')) return;
        requestAnimationFrame(() => {
          place();
          ST.refresh();
          const panel = document.querySelector('.chapter:not([hidden])');
          if (panel) revealStrip(panel.querySelectorAll('.chapter-strip img'));
        });
      });
    }
    document.querySelectorAll('.chapter-strip').forEach((el) => { el.removeAttribute('data-reveal'); el.classList.add('is-in'); });
    function revealStrip(imgs) {
      g.fromTo(imgs, { clipPath: 'inset(0% 0% 100% 0%)', scale: 1.15 },
        { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1.1, stagger: 0.08, ease: 'expo.out', overwrite: true });
    }
    const firstStrip = document.querySelector('.chapter:not([hidden]) .chapter-strip');
    if (firstStrip) {
      ST.create({ trigger: firstStrip, start: 'top 88%', once: true, onEnter: () => revealStrip(firstStrip.querySelectorAll('img')) });
      g.set(firstStrip.querySelectorAll('img'), { clipPath: 'inset(0% 0% 100% 0%)' });
    }

    /* ---------- Galería: dos filas que se cruzan ---------- */
    const rows = g.utils.toArray('.gallery-row');
    if (rows.length === 2) {
      g.set(rows[1], { marginLeft: 0 });
      const dist = (r) => Math.max(0, r.scrollWidth - window.innerWidth);
      g.timeline({
        scrollTrigger: {
          trigger: '.gallery', start: () => `top ${bar()}px`, end: () => `+=${window.innerHeight * 1.5}`,
          pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
        },
      })
        .fromTo(rows[0], { x: 0 }, { x: () => -dist(rows[0]), ease: 'none' }, 0)
        .fromTo(rows[1], { x: () => -dist(rows[1]) }, { x: 0, ease: 'none' }, 0);
    }

    /* ---------- Visítanos: la foto se acerca ---------- */
    g.fromTo('.visit-photo', { scale: 1.25 }, {
      scale: 1, ease: 'none', scrollTrigger: { trigger: '.visit', start: 'top bottom', end: 'bottom top', scrub: true },
    });

    /* ---------- Firma del pie ---------- */
    const word = document.querySelector('.foot-word');
    if (word) {
      const chars = splitChars(word);
      g.from(chars, {
        yPercent: 100, duration: 1.2, stagger: 0.045, ease: 'expo.out',
        scrollTrigger: { trigger: word, start: 'top 95%', once: true },
      });
    }

    window.addEventListener('load', () => ST.refresh());
  }

  /* ---------- Brasas de mezquite ---------- */
  function embers() {
    const c = document.querySelector('.intro-embers');
    if (!c || !c.getContext) return;
    const ctx = c.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const colors = ['#FFA500', '#FFB733', '#FF6A1A', '#FF8C00', '#9F1204'];
    const count = window.innerWidth < 720 ? 55 : 120;
    let w = 0; let h = 0; let raf = 0; let visible = true;
    const parts = [];

    const size = () => {
      w = c.clientWidth; h = c.clientHeight;
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const spawn = (p, anywhere) => {
      p.x = Math.random() * w;
      p.y = anywhere ? Math.random() * h : h + 8 + Math.random() * 40;
      p.r = 0.8 + Math.random() * 3;
      p.vy = -(0.35 + Math.random() * 1.25);
      p.vx = (Math.random() - 0.5) * 0.35;
      p.life = 0;
      p.max = 160 + Math.random() * 260;
      p.phase = Math.random() * Math.PI * 2;
      p.color = colors[Math.floor(Math.random() * colors.length)];
      return p;
    };
    size();
    for (let i = 0; i < count; i++) parts.push(spawn({}, true));

    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (const p of parts) {
        p.life += 1;
        p.phase += 0.035;
        p.x += p.vx + Math.sin(p.phase) * 0.4;
        p.y += p.vy;
        if (p.life > p.max || p.y < -10) spawn(p, false);
        ctx.globalAlpha = Math.max(0, Math.sin(Math.PI * (p.life / p.max))) * 0.9;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = visible && !document.hidden ? requestAnimationFrame(frame) : 0;
    };
    const start = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); };

    window.addEventListener('resize', size);
    document.addEventListener('visibilitychange', start);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; start(); }).observe(c);
    }
    start();
  }
})();
