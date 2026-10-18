/* ==========================================================================
   Imane Meftah — motion & interaction
   GSAP + ScrollTrigger + MotionPath, Lenis smooth scroll.
   Everything degrades gracefully: no JS or reduced motion = static, readable page.
   ========================================================================== */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const I18N = window.I18N;
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const motion = hasGSAP && !reduce;
  if (reduce) root.classList.add('reduced');
  if (motion) root.classList.add('motion');

  /* ------------------------------------------------------------------ i18n */
  let lang = 'en';
  try { lang = localStorage.getItem('im-lang') || (/^zh/i.test(navigator.language) ? 'zh' : 'en'); } catch (e) { /* storage blocked */ }
  if (!I18N[lang]) lang = 'en';
  const t = key => (I18N[lang] && I18N[lang][key]) || I18N.en[key] || '';

  const CJK = /[　-鿿＀-￯]/;
  // Latin text splits by word; CJK by character, keeping punctuation glued to its neighbour so it never wraps alone.
  const unitsOf = text => {
    if (!CJK.test(text)) return text.split(/\s+/);
    const out = [];
    for (const ch of text) {
      const prev = out[out.length - 1];
      if (prev && (/[，。、！？：；”’）》\s]/.test(ch) || /^[“‘（《]$/.test(prev))) out[out.length - 1] += ch;
      else out.push(ch);
    }
    return out;
  };

  // Masked split: each word (or CJK character) is a clipping box holding chars/words that rise into view.
  function split(el) {
    const type = el.dataset.split;
    const text = el.textContent.trim();
    const cjk = CJK.test(text);
    el.setAttribute('aria-label', text);
    el.textContent = '';
    unitsOf(text).forEach((u, i, arr) => {
      const w = document.createElement('span');
      w.className = 'w';
      w.setAttribute('aria-hidden', 'true');
      if (type === 'chars') {
        Array.from(u).forEach(ch => {
          const c = document.createElement('span');
          c.className = 'char';
          c.textContent = ch;
          w.appendChild(c);
        });
      } else {
        const s = document.createElement('span');
        s.className = 'word';
        s.textContent = u;
        w.appendChild(s);
      }
      el.appendChild(w);
      if (!cjk && i < arr.length - 1) el.appendChild(document.createTextNode(' '));
    });
  }

  // Scrub split: plain word spans whose opacity follows the scroll.
  function splitScrub(el) {
    const text = el.textContent.trim();
    const cjk = CJK.test(text);
    el.setAttribute('aria-label', text);
    el.textContent = '';
    unitsOf(text).forEach((u, i, arr) => {
      const s = document.createElement('span');
      s.className = 'sw';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = u;
      el.appendChild(s);
      if (!cjk && i < arr.length - 1) el.appendChild(document.createTextNode(' '));
    });
  }

  function applyText() {
    root.lang = lang === 'zh' ? 'zh-CN' : 'en';
    $$('[data-i18n]').forEach(el => {
      const v = t(el.dataset.i18n);
      if (v) el.textContent = v;
    });
    $$('[data-split]').forEach(split);
    $$('[data-scrub]').forEach(splitScrub);
  }

  /* --------------------------------------------------------- split-flap board */
  const FLAP_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let boardShown = false;

  function buildFlap(row, animate) {
    const text = t(row.dataset.flap);
    row.textContent = '';
    Array.from(text).forEach((ch, i) => {
      const s = document.createElement('span');
      s.className = 'flap' + (ch === ' ' ? ' is-space' : '');
      row.appendChild(s);
      if (ch === ' ') return;
      if (!animate) { s.textContent = ch; return; }
      const steps = 6 + Math.round(i * 0.9);
      const o = { n: 0 };
      let last = -1;
      gsap.to(o, {
        n: steps, duration: steps * 0.055, ease: 'none', delay: i * 0.025,
        onUpdate() {
          const k = Math.floor(o.n);
          if (k === last) return;
          last = k;
          s.textContent = FLAP_CHARS[(Math.random() * FLAP_CHARS.length) | 0];
          gsap.fromTo(s, { rotateX: -80 }, { rotateX: 0, duration: 0.09, ease: 'none' });
        },
        onComplete() { s.textContent = ch; }
      });
    });
  }
  const flapAll = animate => $$('[data-flap]').forEach(r => buildFlap(r, animate));

  /* ------------------------------------------------------------- map dots */
  // Hand-drawn equirectangular land mask: [row, [[colStart, colEnd], ...]], 6° per cell.
  const LAND = [
    [0, [[18, 23], [44, 52]]],
    [1, [[4, 14], [17, 23], [31, 33], [35, 58]]],
    [2, [[2, 15], [17, 22], [26, 26], [30, 34], [35, 59]]],
    [3, [[3, 11], [14, 16], [19, 20], [30, 57]]],
    [4, [[6, 11], [14, 19], [29, 55]]],
    [5, [[7, 19], [29, 53]]],
    [6, [[8, 18], [28, 33], [35, 52], [54, 54]]],
    [7, [[9, 16], [28, 50], [52, 53]]],
    [8, [[10, 15], [27, 35], [36, 38], [39, 50]]],
    [9, [[11, 14], [16, 16], [27, 36], [37, 39], [41, 44], [46, 50]]],
    [10, [[12, 14], [27, 37], [38, 39], [42, 43], [46, 48], [50, 50]]],
    [11, [[14, 15], [17, 20], [27, 38], [43, 43], [46, 47]]],
    [12, [[16, 22], [28, 37], [47, 47], [49, 50]]],
    [13, [[16, 22], [31, 37], [46, 47], [49, 50]]],
    [14, [[16, 24], [32, 37], [48, 49], [52, 54]]],
    [15, [[17, 24], [32, 37], [38, 38], [51, 53]]],
    [16, [[18, 23], [32, 36], [38, 38], [49, 55]]],
    [17, [[18, 22], [32, 35], [48, 55]]],
    [18, [[18, 21], [33, 35], [48, 55]]],
    [19, [[18, 20], [52, 54], [58, 58]]],
    [20, [[18, 19], [54, 54], [58, 58]]],
    [21, [[18, 19]]],
    [22, [[19, 19]]]
  ];
  function drawMap() {
    const g = $('.map__dots');
    if (!g) return;
    const NS = 'http://www.w3.org/2000/svg';
    const frag = document.createDocumentFragment();
    LAND.forEach(([r, ranges]) => ranges.forEach(([a, b]) => {
      for (let c = a; c <= b; c++) {
        const dot = document.createElementNS(NS, 'circle');
        dot.setAttribute('cx', c * 10 + 5);
        dot.setAttribute('cy', r * 10 + 5);
        dot.setAttribute('r', 2.1);
        frag.appendChild(dot);
      }
    }));
    g.appendChild(frag);
  }

  /* ------------------------------------------------------------- utilities */
  function toast(msg) {
    const el = $('.toast');
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove('is-on'), 2400);
  }

  $('.copy-email')?.addEventListener('click', async e => {
    const email = e.currentTarget.dataset.email;
    try {
      await navigator.clipboard.writeText(email);
    } catch (err) {
      const ta = document.createElement('textarea');
      ta.value = email;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e2) { /* ignore */ }
      ta.remove();
    }
    toast(t('contact.copied'));
  });

  // Hide the CV button on the live site if the PDF hasn't been added yet.
  const cv = $('.cv-link');
  if (cv && location.protocol.startsWith('http')) {
    fetch(cv.href, { method: 'HEAD' }).then(r => { if (!r.ok) cv.remove(); }).catch(() => {});
  }

  const year = $('.year');
  if (year) year.textContent = new Date().getFullYear();

  // Header: glass background once scrolled, tucks away while scrolling down (native scroll fires under Lenis too)
  const header = $('.header');
  let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    header.classList.toggle('is-scrolled', y > 40);
    header.classList.toggle('is-hidden', !reduce && y > lastY && y > innerHeight * 0.6);
    lastY = y;
  }, { passive: true });

  /* ===================================================== static fallback */
  applyText();
  drawMap();

  $('.lang-toggle').addEventListener('click', () => setLang(lang === 'en' ? 'zh' : 'en'));

  if (!motion) {
    flapAll(false);
    $('.preloader')?.remove();
    $$('.lstamp').forEach(s => {
      const arc = $('.lstamp__arc', s);
      const C = 2 * Math.PI * 64;
      arc.style.strokeDasharray = C;
      arc.style.strokeDashoffset = C * (1 - +s.dataset.level);
    });
    window.setLang = setLang;
    return;
  }

  /* ===================================================== motion setup */
  gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

  // Smooth scroll
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const target = id === '#top' ? 0 : $(id);
    if (target == null) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { duration: 1.6 });
    else if (target === 0) scrollTo({ top: 0, behavior: 'smooth' });
    else target.scrollIntoView({ behavior: 'smooth' });
  });

  /* --------------------------------------------------- reveal system */
  const revealUnits = el => (el.dataset.split ? $$(el.dataset.split === 'chars' ? '.char' : '.word', el) : [el]);

  function hide(el) {
    if (el.dataset.shown) return;
    gsap.set(revealUnits(el), el.dataset.split ? { yPercent: 118 } : { y: 40, autoAlpha: 0 });
  }
  function show(el, delay = 0) {
    el.dataset.shown = '1';
    const u = revealUnits(el);
    if (el.dataset.split) {
      gsap.to(u, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: el.dataset.split === 'chars' ? 0.035 : 0.07, delay });
    } else {
      gsap.to(u, { y: 0, autoAlpha: 1, duration: 1.1, ease: 'expo.out', delay });
    }
  }

  $$('[data-reveal], .hero__line').forEach(hide);
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    once: true,
    onEnter: batch => batch.forEach((el, i) => show(el, i * 0.09))
  });

  /* --------------------------------------------------- hero */
  const typer = $('.typer');
  typer.textContent = '';
  let typeTween = null;
  let introDone = false;

  function typeRole() {
    const full = Array.from(t('hero.role'));
    const o = { n: 0 };
    typeTween?.kill();
    typer.classList.add('is-typing');
    typeTween = gsap.to(o, {
      n: full.length, duration: Math.min(2.2, full.length * 0.035), ease: 'none',
      onUpdate: () => { typer.textContent = full.slice(0, Math.round(o.n)).join(''); },
      onComplete: () => setTimeout(() => typer.classList.remove('is-typing'), 2600)
    });
  }

  gsap.set('.arch__cover', { scaleY: 1 });

  function heroIntro() {
    const tl = gsap.timeline({ onComplete: () => { introDone = true; } });
    $$('.hero__line').forEach(el => { el.dataset.shown = '1'; });
    tl.to('.hero__line .char', { yPercent: 0, duration: 1.4, ease: 'expo.out', stagger: 0.045 }, 0)
      .from('.hero__star', { rotate: -120, scale: 0.5, autoAlpha: 0, duration: 2.2, ease: 'expo.out', stagger: 0.15 }, 0)
      .to('.arch__cover', { scaleY: 0, duration: 1.4, ease: 'expo.inOut' }, 0.1)
      .from('.arch__img, .arch__mono', { scale: 1.4, duration: 2, ease: 'expo.out' }, 0.4)
      .from('.hero__eyebrow', { y: 20, autoAlpha: 0, duration: 0.9, ease: 'power3.out' }, 0.3)
      .from('.header', { yPercent: -100, autoAlpha: 0, duration: 1, ease: 'expo.out', clearProps: 'transform,opacity,visibility' }, 0.4)
      .add(typeRole, 0.75)
      .from('.hero__meta, .hero__ctas .btn, .hero__scroll', { y: 24, autoAlpha: 0, stagger: 0.08, duration: 0.9, ease: 'power3.out' }, 1)
      .from('.hero__badge', { scale: 0, rotate: -180, duration: 1.3, ease: 'back.out(1.6)' }, 1.1);
  }

  // Scroll parallax
  const heroST = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
  gsap.to('.hero__text', { yPercent: -14, ease: 'none', scrollTrigger: heroST });
  gsap.to('.hero__visual', { yPercent: -28, ease: 'none', scrollTrigger: { ...heroST } });
  gsap.to('.hero__star--a', { rotation: 90, ease: 'none', scrollTrigger: { ...heroST } });
  gsap.to('.hero__star--b', { rotation: -60, ease: 'none', scrollTrigger: { ...heroST } });

  // Mouse parallax
  if (finePointer) {
    const layers = [
      ['.hero__star--a', 40], ['.hero__star--b', -30], ['.hero__visual', 14]
    ].map(([sel, amt]) => {
      const el = $(sel);
      return { amt, x: gsap.quickTo(el, 'x', { duration: 1.2, ease: 'power3' }), y: gsap.quickTo(el, 'y', { duration: 1.2, ease: 'power3' }) };
    });
    $('.hero').addEventListener('pointermove', e => {
      const px = e.clientX / innerWidth - 0.5;
      const py = e.clientY / innerHeight - 0.5;
      layers.forEach(l => { l.x(px * l.amt); l.y(py * l.amt); });
    });
  }

  /* --------------------------------------------------- preloader */
  function preloader(done) {
    const pre = $('.preloader');
    if (!pre) { done(); return; }
    lenis?.stop();
    const words = $$('.preloader__words span');
    const num = $('.preloader__num');
    const counter = { v: 0 };
    const tl = gsap.timeline({ onComplete: () => { pre.remove(); lenis?.start(); } });
    tl.to(counter, { v: 100, duration: 2.4, ease: 'power2.inOut', onUpdate: () => { num.textContent = Math.round(counter.v); } }, 0)
      .from('.preloader__meta i', { scaleX: 0, duration: 2.4, ease: 'power2.inOut' }, 0);
    words.forEach((w, i) => {
      const at = i * 0.6;
      tl.fromTo(w, { yPercent: 70, autoAlpha: 0, filter: 'blur(10px)' },
        { yPercent: 0, autoAlpha: 1, filter: 'blur(0px)', duration: 0.45, ease: 'power3.out' }, at);
      if (i < words.length - 1) {
        tl.to(w, { yPercent: -70, autoAlpha: 0, filter: 'blur(10px)', duration: 0.32, ease: 'power3.in' }, at + 0.42);
      }
    });
    tl.to(pre, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut' }, '+=0.25')
      .add(done, '-=0.7');
  }

  /* --------------------------------------------------- progress */
  gsap.to('.progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  /* --------------------------------------------------- about: map route */
  gsap.from('.map__dots circle', {
    scale: 0, autoAlpha: 0, transformOrigin: '50% 50%', duration: 0.7, ease: 'back.out(2)',
    stagger: { amount: 1.4, from: 'random' },
    scrollTrigger: { trigger: '.map', start: 'top 82%' }
  });
  const arc = $('.map__arc');
  const arcLen = arc.getTotalLength();
  gsap.set(arc, { strokeDasharray: arcLen, strokeDashoffset: arcLen });
  const planePath = { path: '#arc', align: '#arc', alignOrigin: [0.5, 0.5], autoRotate: true };
  gsap.set('.map__plane', { motionPath: { ...planePath, end: 0 } });
  gsap.timeline({ scrollTrigger: { trigger: '.map', start: 'top 70%', end: 'bottom 35%', scrub: 1 } })
    .to(arc, { strokeDashoffset: 0, ease: 'none', duration: 1 }, 0)
    .to('.map__plane', { motionPath: planePath, ease: 'none', duration: 1 }, 0)
    .fromTo('.map__label--b', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.12 }, 0.88)
    .fromTo('.map__pin--b', { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.1 }, 0.9);
  gsap.from('.map__label--a, .map__pin--a', {
    autoAlpha: 0, y: 14, duration: 0.8, ease: 'expo.out', stagger: 0.1,
    scrollTrigger: { trigger: '.map', start: 'top 70%' }
  });

  let scrubST = null;
  function buildScrub() {
    if (scrubST) { scrubST.animation?.kill(); scrubST.kill(); }
    const el = $('[data-scrub]');
    const tween = gsap.fromTo($$('.sw', el), { opacity: 0.14 }, {
      opacity: 1, ease: 'none', stagger: 0.1,
      scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 50%', scrub: true }
    });
    scrubST = tween.scrollTrigger;
  }
  buildScrub();

  /* --------------------------------------------------- stats + marquee */
  $$('.counter').forEach(el => {
    const to = +el.dataset.to;
    const from = +(el.dataset.from || 0);
    const o = { v: from };
    el.textContent = from;
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: () => gsap.to(o, { v: to, duration: 2.2, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v); } })
    });
  });

  const marquee = gsap.to('.marquee__track', { xPercent: -50, ease: 'none', duration: 38, repeat: -1 });
  marquee.totalTime(marquee.duration() * 100); // headroom so it can run backwards
  let mqBoost = 0, mqDir = 1;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: s => { mqDir = s.direction; mqBoost = Math.min(Math.abs(s.getVelocity()) / 250, 8); }
  });
  gsap.ticker.add(() => { mqBoost *= 0.93; marquee.timeScale(mqDir * (1 + mqBoost)); });

  /* --------------------------------------------------- work: shipments */
  function stampIn(card, st) {
    const stamp = $('.stamp', card);
    gsap.fromTo(stamp, { scale: 2.8, autoAlpha: 0, rotation: -35 }, {
      scale: 1, autoAlpha: 0.9, rotation: -12, duration: 0.45, ease: 'back.out(2.4)',
      scrollTrigger: { ...st, toggleActions: 'play none none reverse' },
      onComplete: () => gsap.fromTo(card, { y: 0 }, { keyframes: { y: [5, -3, 1, 0] }, duration: 0.35, ease: 'none' })
    });
  }

  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', () => {
    const track = $('.work__track');
    const dist = () => Math.max(0, track.offsetWidth - innerWidth);
    const hz = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '.work', pin: true, scrub: 1, end: () => '+=' + dist(), invalidateOnRefresh: true, anticipatePin: 1 }
    });
    $$('.card', track).forEach(card => {
      gsap.from(card, {
        rotation: 5, yPercent: 10, ease: 'none',
        scrollTrigger: { trigger: card, containerAnimation: hz, start: 'left right', end: 'center 60%', scrub: true }
      });
      stampIn(card, { trigger: card, containerAnimation: hz, start: 'left 40%' });
    });
    gsap.from('.work__container span', {
      y: -120, autoAlpha: 0, stagger: 0.08, ease: 'bounce.out', duration: 1,
      scrollTrigger: { trigger: '.work__end', containerAnimation: hz, start: 'left 85%' }
    });
  });
  mm.add('(max-width: 899px)', () => {
    $$('.card').forEach(card => {
      gsap.from(card, { y: 70, autoAlpha: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: card, start: 'top 88%' } });
      stampIn(card, { trigger: card, start: 'top 55%' });
    });
  });

  // Supply-chain loop on the trade-simulation card
  const flow = $('.flow');
  if (flow) {
    const nodes = $$('.flow__node', flow);
    const box = $('.flow__box', flow);
    const last = nodes.length - 1;
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.8 });
    tl.call(() => nodes.forEach(n => n.classList.remove('is-on')))
      .set(box, { left: '0%', xPercent: 0, autoAlpha: 1 });
    nodes.forEach((n, i) => {
      const pct = (i / last) * 100;
      if (i) tl.to(box, { left: pct + '%', xPercent: -pct, duration: 0.9, ease: 'power2.inOut' });
      tl.call(() => n.classList.add('is-on'))
        .fromTo($('i', n), { scale: 1 }, { scale: 1.18, duration: 0.14, yoyo: true, repeat: 1, ease: 'power2.out' })
        .to({}, { duration: 0.2 });
    });
    tl.to(box, { autoAlpha: 0, duration: 0.3 }, '+=0.6');
  }

  // 3D tilt on cards
  if (finePointer) {
    gsap.set('.card', { transformPerspective: 1400 });
    $$('.card').forEach(card => {
      const rx = gsap.quickTo(card, 'rotationX', { duration: 0.7, ease: 'power3' });
      const ry = gsap.quickTo(card, 'rotationY', { duration: 0.7, ease: 'power3' });
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 9);
        rx(-((e.clientY - r.top) / r.height - 0.5) * 9);
      });
      card.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  }

  /* --------------------------------------------------- honors */
  gsap.from('.medal', {
    scale: 0.3, rotation: -160, autoAlpha: 0, duration: 1.8, ease: 'expo.out',
    scrollTrigger: { trigger: '.medal', start: 'top 80%' }
  });
  gsap.to('.medal__ring', { rotation: 360, duration: 34, repeat: -1, ease: 'none' });
  gsap.fromTo('.medal__shine', { xPercent: -100 }, { xPercent: 100, duration: 1.5, ease: 'power2.inOut', repeat: -1, repeatDelay: 2.4 });
  gsap.to('.medal__core svg', { rotation: 135, ease: 'none', scrollTrigger: { trigger: '.honors', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* --------------------------------------------------- languages */
  const C = 2 * Math.PI * 64;
  $$('.lstamp').forEach((s, i) => {
    const arcEl = $('.lstamp__arc', s);
    gsap.set(arcEl, { strokeDasharray: C, strokeDashoffset: C });
    gsap.timeline({ scrollTrigger: { trigger: '.stamps', start: 'top 78%' }, delay: i * 0.16 })
      .from(s, { scale: 0.55, rotation: -25, autoAlpha: 0, duration: 1, ease: 'back.out(1.7)' })
      .to(arcEl, { strokeDashoffset: C * (1 - +s.dataset.level), duration: 1.8, ease: 'expo.out' }, '-=0.6')
      .from($('.lstamp__glyph', s), { scale: 0, duration: 0.9, ease: 'back.out(2.2)' }, '-=1.6');
    gsap.to($('.lstamp__ring', s), { rotation: i % 2 ? -360 : 360, svgOrigin: '100 100', duration: 40, repeat: -1, ease: 'none' });
  });

  /* --------------------------------------------------- skills: goods sorted into place */
  gsap.from('.chips li', {
    x: () => gsap.utils.random(-320, 320),
    y: () => gsap.utils.random(-180, 220),
    rotation: () => gsap.utils.random(-45, 45),
    autoAlpha: 0, duration: 1.5, ease: 'expo.out',
    stagger: { amount: 0.6, from: 'random' },
    scrollTrigger: { trigger: '.chips', start: 'top 85%' }
  });

  /* --------------------------------------------------- contact */
  $$('[data-flap]').forEach(r => { r.textContent = ''; });
  ScrollTrigger.create({
    trigger: '.board', start: 'top 85%', once: true,
    onEnter: () => { boardShown = true; flapAll(true); }
  });

  /* --------------------------------------------------- magnetic + cursor */
  if (finePointer) {
    $$('.magnetic').forEach(el => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.35);
        yTo((e.clientY - r.top - r.height / 2) * 0.35);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });

    const cursor = $('.cursor');
    const dot = $('.cursor__dot');
    const ring = $('.cursor__ring');
    const label = $('.cursor__label');
    const dx = gsap.quickTo(dot, 'x', { duration: 0.08 });
    const dy = gsap.quickTo(dot, 'y', { duration: 0.08 });
    const rx = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' });
    const ry = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' });
    gsap.set([dot, ring], { autoAlpha: 0 });
    addEventListener('pointermove', e => {
      gsap.to([dot, ring], { autoAlpha: 1, duration: 0.3, overwrite: 'auto' });
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
    }, { passive: true });
    document.addEventListener('pointerleave', () => gsap.to([dot, ring], { autoAlpha: 0, duration: 0.3 }));
    document.addEventListener('pointerover', e => {
      const lab = e.target.closest('[data-cursor]');
      const link = e.target.closest('a, button, .chips li, .lstamp');
      cursor.classList.toggle('is-label', !!lab && !link);
      cursor.classList.toggle('is-link', !!link);
      if (lab) label.textContent = lab.dataset.cursor;
    });
  }

  /* --------------------------------------------------- page-long route line */
  const route = {
    svg: $('.route'), path: $('.route__path'), mask: $('.route__mask'), tip: $('.route__tip'),
    len: 0, samples: []
  };

  function buildRoute() {
    if (innerWidth <= 720) return;
    const W = root.clientWidth;
    route.svg.style.height = '0px';
    const H = root.scrollHeight;
    route.svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    route.svg.style.height = H + 'px';

    const top = el => {
      const box = el.parentElement.classList.contains('pin-spacer') ? el.parentElement : el;
      return box.getBoundingClientRect().top + scrollY;
    };
    const secs = ['#about', '.stats', '#work', '#honors', '#languages', '#skills', '#contact'].map(s => $(s));
    const ys = secs.map(top);
    const g = Math.min(56, Math.max(16, W * 0.04));
    const xL = (W - Math.min(W, 1280)) / 2 + g * 0.45;
    const xR = W - xL;
    const bend = 110;
    let x = xL;
    let d = `M${xL},${ys[0] - 180}`;
    for (let i = 1; i < ys.length; i++) {
      const nx = i % 2 ? xR : xL;
      const y = ys[i];
      d += ` L${x},${y - bend} C${x},${y} ${nx},${y} ${nx},${y + bend}`;
      x = nx;
    }
    const contact = $('#contact');
    d += ` L${x},${top(contact) + contact.offsetHeight - 40}`;
    route.path.setAttribute('d', d);
    route.mask.setAttribute('d', d);
    route.len = route.path.getTotalLength();
    route.mask.style.strokeDasharray = route.len;
    route.samples = [];
    const N = 600;
    for (let k = 0; k <= N; k++) {
      const L = (route.len * k) / N;
      const p = route.path.getPointAtLength(L);
      route.samples.push([L, p.x, p.y]);
    }
  }

  function updateRoute() {
    const S = route.samples;
    if (!S.length || innerWidth <= 720) return;
    const target = scrollY + innerHeight * 0.62;
    let lo = 0, hi = S.length - 1;
    if (target <= S[0][2]) hi = 0;
    else if (target >= S[hi][2]) lo = hi;
    else {
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (S[mid][2] < target) lo = mid; else hi = mid;
      }
    }
    const [L, x, y] = S[hi === 0 ? 0 : (lo === hi ? hi : lo)];
    route.mask.style.strokeDashoffset = route.len - L;
    route.tip.setAttribute('cx', x);
    route.tip.setAttribute('cy', y);
    route.tip.style.opacity = target < S[0][2] ? 0 : 1;
  }

  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: updateRoute });
  ScrollTrigger.addEventListener('refresh', () => { buildRoute(); updateRoute(); });

  /* --------------------------------------------------- language switch */
  let switching = false;
  function refreshText() {
    applyText();
    $$('[data-split]').forEach(hide);
    if (introDone) typeRole(); else typer.textContent = '';
    buildScrub();
    if (boardShown) flapAll(true); else $$('[data-flap]').forEach(r => { r.textContent = ''; });
    ScrollTrigger.refresh();
  }

  function setLang(next) {
    if (next === lang || switching) return;
    try { localStorage.setItem('im-lang', next); } catch (e) { /* storage blocked */ }
    if (!motion) { lang = next; applyText(); flapAll(false); return; }
    switching = true;
    const wipe = $('.wipe');
    const word = $('.wipe__word');
    word.textContent = I18N[next].wipe;
    word.setAttribute('lang', next === 'zh' ? 'zh-CN' : 'en');
    gsap.timeline({ onComplete: () => { switching = false; } })
      .set(wipe, { clipPath: 'inset(100% 0% 0% 0%)' })
      .to(wipe, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.65, ease: 'expo.inOut' })
      .fromTo(word, { yPercent: 70, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.5, ease: 'expo.out' }, '-=0.25')
      .add(() => { lang = next; refreshText(); })
      .to(word, { yPercent: -70, autoAlpha: 0, duration: 0.35, ease: 'power3.in' }, '+=0.3')
      .to(wipe, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.75, ease: 'expo.inOut' }, '-=0.15');
  }
  window.setLang = setLang;

  /* --------------------------------------------------- go */
  const start = () => preloader(heroIntro);
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]).then(() => { ScrollTrigger.refresh(); start(); });
  } else {
    start();
  }
  addEventListener('load', () => ScrollTrigger.refresh());
})();
