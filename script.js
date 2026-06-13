/* ══════════════════════════════════════════════════════════
   FELIZ DÍA DEL PADRE — interactions
   ══════════════════════════════════════════════════════════ */
(() => {
  'use strict';
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer  = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ─────────────── Preloader ─────────────── */
  const preloader = $('#preloader');
  const hero = $('#inicio');
  const pFill = $('#preloaderFill');
  const pPct  = $('#preloaderPct');
  let preloaded = false;
  function finishPreload() {
    if (preloaded) return;
    preloaded = true;
    preloader && preloader.classList.add('is-done');
    requestAnimationFrame(() => hero && hero.classList.add('is-ready'));
  }
  if (preloader) {
    const MIN = reduceMotion ? 900 : 1700;       // minimum time on screen
    let loaded = document.readyState === 'complete';
    addEventListener('load', () => { loaded = true; });
    const t0 = performance.now();
    let shown = 0;
    (function tick(now) {
      if (preloaded) return;
      const elapsed = now - t0;
      let target = (elapsed / MIN) * 100;
      if (!loaded) target = Math.min(target, 92);  // hold near the end until fully loaded
      target = Math.min(target, 100);
      shown += (target - shown) * 0.18;
      const v = Math.min(100, Math.round(shown));
      if (pFill) pFill.style.width = v + '%';
      if (pPct)  pPct.textContent = v + '%';
      if (loaded && shown >= 99.2) {
        if (pFill) pFill.style.width = '100%';
        if (pPct)  pPct.textContent = '100%';
        setTimeout(finishPreload, 360);            // let "100%" breathe, then reveal
        return;
      }
      requestAnimationFrame(tick);
    })(performance.now());
  }
  setTimeout(finishPreload, 5000); // safety net — never hang

  /* ─────────────── Custom cursor ─────────────── */
  if (finePointer && !reduceMotion) {
    const ring = $('#cursorRing'), dot = $('#cursorDot');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, shown = false;
    addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      if (!shown) { shown = true; ring.style.opacity = dot.style.opacity = 1; }
    }, { passive: true });
    (function loop() {
      rx = lerp(rx, mx, 0.18); ry = lerp(ry, my, 0.18);
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    })();
    const hoverable = 'a, button, [data-cursor]';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverable)) { ring.classList.add('is-hover'); dot.classList.add('is-hover'); }
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverable)) { ring.classList.remove('is-hover'); dot.classList.remove('is-hover'); }
    });
    addEventListener('mouseleave', () => { ring.style.opacity = dot.style.opacity = 0; });
  }

  /* ─────────────── Scroll: progress, nav, parallax ─────────────── */
  const bar = $('#scrollBar');
  const nav = $('#nav');
  const heroBg = $('#heroBg');
  let lastY = 0, ticking = false, menuOpen = false;
  function onScroll() {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

    if (nav && !menuOpen) {
      if (y > lastY && y > 260) nav.classList.add('is-hidden');
      else nav.classList.remove('is-hidden');
    }
    if (heroBg && !reduceMotion && y < innerHeight) {
      heroBg.style.transform = `translateY(${y * 0.28}px) scale(1.04)`;
    }
    lastY = y; ticking = false;
  }
  addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });

  /* ─────────────── Mobile menu ─────────────── */
  const navToggle = $('#navToggle');
  const navPill = $('.nav__pill');
  if (navToggle && navPill) {
    const setMenu = (open) => {
      menuOpen = open;
      navPill.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      if (open && nav) nav.classList.remove('is-hidden');
    };
    navToggle.addEventListener('click', () => setMenu(!menuOpen));
    $$('.nav__links a', navPill).forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('click', (e) => {
      if (menuOpen && !e.target.closest('.nav__pill')) setMenu(false);
    });
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) setMenu(false); });
  }

  /* ─────────────── Split-text headings ─────────────── */
  if (!reduceMotion && 'IntersectionObserver' in window) {
    $$('.section-title').forEach((el) => {
      if (el.dataset.split) return;
      el.dataset.split = '1';
      const frag = document.createDocumentFragment();
      [...el.childNodes].forEach((node) => {
        if (node.nodeType === 3) {
          node.textContent.split(/(\s+)/).forEach((tok) => {
            if (tok === '') return;
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(tok)); return; }
            const w = document.createElement('span'); w.className = 'sw';
            const inner = document.createElement('span'); inner.textContent = tok;
            w.appendChild(inner); frag.appendChild(w);
          });
        } else {
          frag.appendChild(node.cloneNode(true)); // keep <br> etc.
        }
      });
      el.textContent = '';
      el.appendChild(frag);
      el.classList.remove('reveal');   // split replaces the generic reveal
      el.classList.add('split');
    });
    const sio = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        $$('.sw > span', en.target).forEach((w, i) => { w.style.transitionDelay = `${i * 55}ms`; });
        en.target.classList.add('is-in');
        sio.unobserve(en.target);
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -6% 0px' });
    $$('.split').forEach((el) => sio.observe(el));
  }

  /* ─────────────── Reveal on scroll ─────────────── */
  const revealEls = $$('.reveal');
  if (!('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          const sibs = $$('.reveal', en.target.parentElement);
          const idx = Math.max(0, sibs.indexOf(en.target));
          en.target.style.transitionDelay = `${Math.min(idx * 80, 320)}ms`;
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach((el) => io.observe(el));
  }

  /* ─────────────── Animated counters ─────────────── */
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  function countUp(el) {
    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || '';
    const dur = 1800; let start;
    function step(ts) {
      start ??= ts;
      const p = clamp((ts - start) / dur, 0, 1);
      el.textContent = Math.round(target * easeOut(p)).toLocaleString('es-ES') + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  const counters = $$('.stat__num[data-count]');
  if (counters.length) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { countUp(en.target); cio.unobserve(en.target); } });
    }, { threshold: 0.6 });
    counters.forEach((c) => cio.observe(c));
  }

  /* ─────────────── 3D tilt ─────────────── */
  if (finePointer) {
    $$('[data-tilt]').forEach((card) => {
      const inner = card.firstElementChild;
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        inner.style.transform = `rotateY(${px * 10}deg) rotateX(${-py * 10}deg) translateZ(0)`;
      });
      card.addEventListener('mouseleave', () => { inner.style.transform = ''; });
    });
  }

  /* ─────────────── Magnetic buttons ─────────────── */
  if (finePointer) {
    $$('[data-magnetic]').forEach((el) => {
      const strength = 0.4;
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * strength;
        const y = (e.clientY - r.top - r.height / 2) * strength;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ─────────────── Hero ember particles ─────────────── */
  (function embers() {
    if (reduceMotion) return;
    const canvas = $('#heroCanvas');
    if (!canvas || !hero) return;
    const ctx = canvas.getContext('2d');
    let w, h, dpr, parts = [], raf = null, visible = true;

    function size() {
      const r = hero.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(clamp(w / 16, 36, 90));
      parts = Array.from({ length: count }, makeP);
    }
    function makeP() {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 2.4 + 0.6,
        vy: -(Math.random() * 0.4 + 0.12),
        sway: Math.random() * 0.6 + 0.2,
        phase: Math.random() * Math.PI * 2,
        a: Math.random() * 0.5 + 0.2
      };
    }
    function frame(t) {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.y += p.vy;
        p.x += Math.sin(t / 1000 + p.phase) * p.sway * 0.3;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        const flick = p.a * (0.6 + 0.4 * Math.sin(t / 400 + p.phase));
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        g.addColorStop(0, `rgba(255,214,150,${flick})`);
        g.addColorStop(1, 'rgba(255,170,90,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2); ctx.fill();
      }
      raf = visible ? requestAnimationFrame(frame) : null;
    }
    function play() { if (!raf && visible) raf = requestAnimationFrame(frame); }
    size();
    addEventListener('resize', size, { passive: true });
    new IntersectionObserver((e) => {
      visible = e[0].isIntersecting;
      if (visible) play(); else if (raf) { cancelAnimationFrame(raf); raf = null; }
    }, { threshold: 0 }).observe(hero);
    play();
  })();

  /* ─────────────── Heart burst (fx canvas) ─────────────── */
  const fx = $('#fxCanvas');
  const fctx = fx.getContext('2d');
  let fxParts = [], fxRaf = null, fdpr = 1;
  function fxSize() {
    fdpr = Math.min(devicePixelRatio || 1, 2);
    fx.width = innerWidth * fdpr; fx.height = innerHeight * fdpr;
    fctx.setTransform(fdpr, 0, 0, fdpr, 0, 0);
  }
  fxSize();
  addEventListener('resize', fxSize, { passive: true });

  const HEART_COLORS = ['#f0962f', '#ec7a59', '#e8a44c', '#d96f8f', '#fff3e0'];
  function drawHeart(ctx, s) {
    const top = s * 0.3;
    ctx.beginPath();
    ctx.moveTo(0, top);
    ctx.bezierCurveTo(0, 0, -s / 2, 0, -s / 2, top);
    ctx.bezierCurveTo(-s / 2, (s + top) / 2, 0, (s + top) / 1.25, 0, s);
    ctx.bezierCurveTo(0, (s + top) / 1.25, s / 2, (s + top) / 2, s / 2, top);
    ctx.bezierCurveTo(s / 2, 0, 0, 0, 0, top);
    ctx.closePath();
  }
  function burst(x, y, n = 26) {
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.0;
      const sp = Math.random() * 7 + 4;
      fxParts.push({
        x, y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 2,
        g: 0.16 + Math.random() * 0.1,
        size: Math.random() * 14 + 14,
        rot: (Math.random() - 0.5) * 1.2,
        vr: (Math.random() - 0.5) * 0.2,
        life: 1,
        decay: 0.008 + Math.random() * 0.006,
        color: HEART_COLORS[(Math.random() * HEART_COLORS.length) | 0]
      });
    }
    if (!fxRaf) fxRaf = requestAnimationFrame(fxFrame);
  }
  function fxFrame() {
    fctx.clearRect(0, 0, innerWidth, innerHeight);
    fxParts = fxParts.filter((p) => p.life > 0);
    for (const p of fxParts) {
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.vx *= 0.99;
      p.rot += p.vr; p.life -= p.decay;
      fctx.save();
      fctx.globalAlpha = clamp(p.life, 0, 1);
      fctx.translate(p.x, p.y); fctx.rotate(p.rot);
      fctx.translate(0, -p.size / 2);
      fctx.fillStyle = p.color;
      fctx.shadowColor = p.color; fctx.shadowBlur = 12;
      drawHeart(fctx, p.size);
      fctx.fill();
      fctx.restore();
    }
    if (fxParts.length) fxRaf = requestAnimationFrame(fxFrame);
    else { fctx.clearRect(0, 0, innerWidth, innerHeight); fxRaf = null; }
  }

  /* ─────────────── Hug button ─────────────── */
  const hugBtn = $('#hugBtn');
  const hugMsg = $('#abrazoMsg');
  const hugCounter = $('#hugCounter');
  let hugs = 0;
  const hugReplies = [
    'Abrazo recibido. Te quiero, papá. 🧡',
    '¡Otro más! Que nunca te falten. 🤍',
    'Apretado y de los buenos. 💛',
    'Con estos, el día es mejor. 🧡'
  ];
  if (hugBtn) {
    hugBtn.addEventListener('click', () => {
      const r = hugBtn.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, 28);
      hugs++;
      if (hugMsg) hugMsg.textContent = hugReplies[Math.min(hugs - 1, hugReplies.length - 1)];
      if (hugCounter) hugCounter.textContent = hugs === 1
        ? 'Has enviado 1 abrazo'
        : `Has enviado ${hugs} abrazos`;
    });
  }

  /* ─────────────── Lightbox gallery ─────────────── */
  const figures = $$('.g-item');
  const lb = $('#lightbox');
  const lbImg = $('#lbImg'), lbTitle = $('#lbTitle'), lbPlace = $('#lbPlace');
  let lbIndex = 0;
  const data = figures.map((f) => ({
    src: $('img', f).src,
    title: f.dataset.caption || '',
    place: f.dataset.place || ''
  }));
  function showLb(i) {
    lbIndex = (i + data.length) % data.length;
    const d = data[lbIndex];
    lbImg.src = d.src; lbImg.alt = d.title;
    lbTitle.textContent = d.title; lbPlace.textContent = d.place;
  }
  function openLb(i) {
    showLb(i); lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeLb() {
    lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  figures.forEach((f, i) => f.addEventListener('click', () => openLb(i)));
  $('#lbClose').addEventListener('click', closeLb);
  $('#lbPrev').addEventListener('click', () => showLb(lbIndex - 1));
  $('#lbNext').addEventListener('click', () => showLb(lbIndex + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
  addEventListener('keydown', (e) => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLb();
    else if (e.key === 'ArrowLeft') showLb(lbIndex - 1);
    else if (e.key === 'ArrowRight') showLb(lbIndex + 1);
  });

  /* ─────────────── Ambient floating hearts ─────────────── */
  if (!reduceMotion) {
    $$('[data-hearts]').forEach((host) => {
      const layer = document.createElement('div');
      layer.className = 'float-hearts';
      layer.setAttribute('aria-hidden', 'true');
      const glyphs = ['🧡', '🤍', '💛', '🧡', '🧡'];
      for (let i = 0; i < 14; i++) {
        const h = document.createElement('span');
        h.className = 'float-heart';
        h.textContent = glyphs[(Math.random() * glyphs.length) | 0];
        h.style.left = (Math.random() * 100).toFixed(1) + '%';
        h.style.fontSize = (Math.random() * 1.4 + 0.8).toFixed(2) + 'rem';
        h.style.setProperty('--dur', (Math.random() * 10 + 12).toFixed(1) + 's');
        h.style.setProperty('--delay', (-Math.random() * 18).toFixed(1) + 's');
        h.style.setProperty('--drift', (Math.random() * 80 - 40).toFixed(0) + 'px');
        h.style.setProperty('--maxop', (Math.random() * 0.3 + 0.25).toFixed(2));
        layer.appendChild(h);
      }
      host.insertBefore(layer, host.firstChild);
    });
  }

  /* ─────────────── Smooth anchor offset for fixed nav ─────────────── */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });
})();
