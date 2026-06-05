// heroAbout.js — Hero = the glowing pool. A crude rail-riding robot lays glowing
// tiles along the wall (faithful to 安装瓷砖过程): pick → swing down → press → retract
// → advance, on an endless treadmill so the lit band always grows under it. The mouse
// disturbs the water (a lagging glow + expanding rings); a ripple near the robot startles
// it. Scrolling DIVES through the water into the cosmos; the signature draws then
// dissolves before About lands.  Grounded in docs/reference-artbook.md.
import { maskLines } from './lib/util.js';

const NS = 'http://www.w3.org/2000/svg';
function S(tag, attrs) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}

// ----- starfield (deep navy, colourful, gently twinkling) -----
function buildStarfield(canvas, host, reduce) {
  const c = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1, stars = [];
  const COLORS = ['#F2F2F0', '#F2F2F0', '#F2F2F0', '#9FE4F2', '#3BB3E0', '#E8B04B', '#C77FD6'];
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = host.clientWidth; H = host.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = [];
    const n = Math.round(Math.min(260, (W * H) / 7000));
    for (let i = 0; i < n; i++) {
      stars.push({
        x: Math.random() * W, y: Math.random() * H,
        r: 0.4 + Math.random() * 1.6,
        col: COLORS[(Math.random() * COLORS.length) | 0],
        base: 0.25 + Math.random() * 0.6,
        tw: 0.3 + Math.random() * 1.4, ph: Math.random() * 6.28,
      });
    }
  }
  resize(); window.addEventListener('resize', resize);
  let raf = 0;
  function draw(t) {
    c.clearRect(0, 0, W, H);
    const k = t * 0.001;
    for (const s of stars) {
      const a = reduce ? s.base : s.base * (0.55 + 0.45 * Math.sin(k * s.tw + s.ph));
      c.globalAlpha = Math.max(0, a);
      c.fillStyle = s.col;
      c.beginPath(); c.arc(s.x, s.y, s.r, 0, 6.283); c.fill();
    }
    c.globalAlpha = 1;
    if (!reduce) raf = requestAnimationFrame(draw);
  }
  draw(0);
  return { stop() { cancelAnimationFrame(raf); } };
}

export function initHeroAbout(ctx) {
  const { gsap, ScrollTrigger, reduce } = ctx;
  const stage = document.getElementById('hero-about');
  if (!stage) return;

  const band = stage.querySelector('[data-band]');
  const tilesG = stage.querySelector('[data-tiles]');
  const botG = stage.querySelector('[data-bot]');
  const towersG = stage.querySelector('[data-towers]');
  const pool = stage.querySelector('[data-pool]');
  const water = stage.querySelector('[data-water]');
  const glow = stage.querySelector('[data-glow]');
  const cosmos = stage.querySelector('[data-cosmos]');
  const starsCv = stage.querySelector('[data-stars]');
  const heroCopy = stage.querySelector('[data-hero-copy]');
  const cue = stage.querySelector('[data-scroll-cue]');
  const sigLayer = stage.querySelector('[data-sig-layer]');
  const sigMain = stage.querySelector('.sig-main');
  const sigFlo = stage.querySelector('.sig-flourish');
  const resolve = stage.querySelector('[data-scene="resolve"]');

  // ---- bio copy ----
  const p = ctx.data && ctx.data.profile;
  const lead = stage.querySelector('[data-bio-lead]');
  if (lead && p && p.bioLead) lead.textContent = p.bioLead;
  const bioHost = stage.querySelector('[data-bio]');
  const lineEls = (bioHost && p && p.bio) ? maskLines(bioHost, p.bio) : [];

  // ---- signature dash setup ----
  const dash = (path) => { if (!path) return; const L = path.getTotalLength(); path.style.strokeDasharray = L; path.style.strokeDashoffset = L; };
  dash(sigMain); dash(sigFlo);

  // ---- distant industrial skyline ----
  if (towersG) {
    const T = [[760, 70, 26, 168], [800, 96, 14, 142], [928, 40, 30, 198], [968, 86, 12, 152], [690, 120, 18, 118]];
    for (const t of T) towersG.appendChild(S('rect', { x: t[0], y: t[1], width: t[2], height: t[3], fill: '#05080A', opacity: 0.92 }));
    towersG.appendChild(S('path', { d: 'M734 60 L734 250 M758 60 L758 250 M734 96 L758 120 M758 96 L734 120 M734 150 L758 174 M758 150 L734 174', stroke: '#05080A', 'stroke-width': 4, fill: 'none', opacity: 0.9 }));
  }

  // ===================== the tile band (endless treadmill) =====================
  const TILE_W = 44, TILE_H = 96, GAP = 6, PITCH = TILE_W + GAP; // 50
  const COUNT = 32;
  const ROBOT_LX = 520;          // robot's fixed local-x on the rail
  const SPAN = COUNT * PITCH;
  const tiles = [];
  let offset = 0;                // band scroll offset (<= 0); group.x = offset

  if (tilesG) {
    for (let i = 0; i < COUNT; i++) {
      const g = S('g', { transform: `translate(${i * PITCH},0)` });
      g.appendChild(S('rect', { x: 0, y: 0, width: TILE_W, height: TILE_H, rx: 1, fill: '#0c1a22' }));
      const lit = S('rect', { x: 0, y: 0, width: TILE_W, height: TILE_H, rx: 1, fill: 'url(#hero-tile)', opacity: 0 });
      g.appendChild(lit);
      if (i % 3 === 0) g.appendChild(S('path', { d: `M${TILE_W * 0.5} 8 L${TILE_W * 0.64} ${TILE_H * 0.42} L${TILE_W * 0.4} ${TILE_H * 0.6} L${TILE_W * 0.56} ${TILE_H - 8}`, stroke: '#0A2A33', 'stroke-width': 1, fill: 'none', opacity: 0.5 }));
      tilesG.appendChild(g);
      tiles.push({ g, lit, x: i * PITCH, on: false });
    }
  }
  function lightTile(t, instant) {
    if (!t) return; t.on = true;
    if (instant || !gsap) { t.lit.setAttribute('opacity', 1); return; }
    gsap.fromTo(t.lit, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power3.out' });
  }
  // already-tiled left half
  tiles.forEach((t) => { if (t.x < ROBOT_LX) lightTile(t, true); });

  function seatFrontier() {
    let best = null, bd = 1e9;
    for (const t of tiles) {
      if (t.on) continue;
      const sx = t.x + offset;
      const d = Math.abs(sx - ROBOT_LX);
      if (sx >= ROBOT_LX - PITCH * 0.6 && d < bd) { bd = d; best = t; }
    }
    lightTile(best, false);
  }
  function recycle() {
    for (const t of tiles) {
      if (t.x + offset < -PITCH * 2) {
        t.x += SPAN; t.on = false;
        t.g.setAttribute('transform', `translate(${t.x},0)`);
        t.lit.setAttribute('opacity', 0);
      }
    }
  }

  // ===================== the robot =====================
  // botG is translated to (ROBOT_LX,0) in band space; an inner group takes the flinch
  // scale; the arm pivots about its bbox top-centre (the shoulder).
  let armEl = null, heldEl = null, lensEl = null, botInner = null;
  if (botG) {
    botG.setAttribute('transform', `translate(${ROBOT_LX},0)`);
    botInner = S('g', { 'data-bot-inner': '' });
    botInner.appendChild(S('polygon', { points: '-48,-162 42,-162 54,-130 32,-118 -42,-118 -56,-134', fill: '#0E1418' }));
    botInner.appendChild(S('rect', { x: -12, y: -150, width: 24, height: 13, fill: '#05090c' }));
    const lensWrap = S('g', { 'data-bot-lens': '' });
    lensWrap.appendChild(S('circle', { cx: 14, cy: -140, r: 6, fill: '#04070d' }));
    lensWrap.appendChild(S('circle', { cx: 14, cy: -140, r: 3, fill: '#27C2F2' }));
    lensWrap.appendChild(S('circle', { cx: 15.4, cy: -141.4, r: 1, fill: '#fff' }));
    botInner.appendChild(S('path', { d: 'M-34,-132 C-46,-102 -40,-72 -16,-56', stroke: '#05090c', 'stroke-width': 2.6, fill: 'none', opacity: 0.85 }));
    botInner.appendChild(S('circle', { cx: 0, cy: -112, r: 12, fill: '#0a1015', stroke: '#05090c', 'stroke-width': 3 }));
    const mount = S('g', { transform: 'translate(0,-112)' });
    armEl = S('g', { 'data-arm': '' });
    armEl.appendChild(S('polygon', { points: '-7,0 7,0 8,52 -8,52', fill: '#0e1620' }));      // upper
    armEl.appendChild(S('polygon', { points: '-8,52 8,52 7,104 -7,104', fill: '#101a24' }));   // forearm
    const tray = S('g', { 'data-tray': '' });
    tray.appendChild(S('path', { d: 'M-16,104 L16,104 L16,110 L-16,110 Z', fill: '#0a1218' }));
    heldEl = S('rect', { x: -16, y: 108, width: TILE_W * 0.72, height: TILE_H * 0.42, rx: 1, fill: 'url(#hero-tile)', opacity: 0, 'data-held': '' });
    tray.appendChild(heldEl);
    armEl.appendChild(tray);
    mount.appendChild(armEl);
    botInner.appendChild(mount);
    botInner.appendChild(lensWrap);
    botG.appendChild(botInner);
    lensEl = lensWrap;
  }

  // ===================== mouse disturbs the water =====================
  if (water && !reduce) {
    const c = water.getContext('2d');
    let W = 0, H = 0, dpr = 1, rings = [];
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = stage.clientWidth; H = stage.clientHeight;
      water.width = W * dpr; water.height = H * dpr;
      water.style.width = W + 'px'; water.style.height = H + 'px';
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize(); window.addEventListener('resize', resize);
    const spawn = (x, y, strong) => rings.push({ x, y, r: 3, max: strong ? 170 : 70 + Math.random() * 60, w: strong ? 2.4 : 1.2 });
    let amb = 0;
    (function loop(t) {
      c.clearRect(0, 0, W, H);
      if (t - amb > 2400) { amb = t; spawn(Math.random() * W, H * (0.45 + Math.random() * 0.45)); }
      for (let i = rings.length - 1; i >= 0; i--) {
        const rp = rings[i]; rp.r += 1.5; const a = Math.max(0, 1 - rp.r / rp.max);
        c.beginPath(); c.arc(rp.x, rp.y, rp.r, 0, 6.283);
        c.strokeStyle = `rgba(90,200,224,${a * 0.4})`; c.lineWidth = rp.w; c.stroke();
        if (a <= 0) rings.splice(i, 1);
      }
      requestAnimationFrame(loop);
    })(0);

    const glowX = glow ? gsap.quickTo(glow, 'x', { duration: 0.6, ease: 'power3' }) : null;
    const glowY = glow ? gsap.quickTo(glow, 'y', { duration: 0.6, ease: 'power3' }) : null;
    if (glow) gsap.set(glow, { xPercent: -50, yPercent: -50, x: -300, y: -300 });
    let lastSpawn = 0, lastStartle = 0;
    function startle() {
      if (!gsap) return;
      if (botInner) gsap.to(botInner, { keyframes: [{ scale: 1.1, duration: 0.12, ease: 'power2.out' }, { scale: 1, duration: 0.6, ease: 'elastic.out(1,0.4)' }], transformOrigin: '50% 100%' });
      if (lensEl) gsap.to(lensEl, { keyframes: [{ scale: 1.5, duration: 0.12 }, { scale: 1, duration: 0.45, ease: 'power2.out' }], transformOrigin: '50% 50%' });
    }
    stage.addEventListener('pointermove', (e) => {
      const t = e.timeStamp || 0;
      if (glowX) { glowX(e.clientX); glowY(e.clientY); }
      if (t - lastSpawn > 50) { lastSpawn = t; spawn(e.clientX, e.clientY); }
      if (botG) {
        const r = botG.getBoundingClientRect();
        const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
        if (d < 150 && t - lastStartle > 1700) { lastStartle = t; startle(); spawn(e.clientX, e.clientY, true); }
      }
    });
  }

  // ===================== starfield =====================
  if (starsCv) { try { buildStarfield(starsCv, stage, reduce); } catch (e) { /* non-fatal */ } }

  // ===================== reduced-motion / no-gsap fallback =====================
  if (reduce || !gsap || !ScrollTrigger) {
    if (sigMain) sigMain.style.strokeDashoffset = 0;
    if (sigFlo) sigFlo.style.strokeDashoffset = 0;
    if (cosmos) cosmos.style.opacity = 1;
    if (resolve) resolve.style.opacity = 1;
    if (pool) pool.style.opacity = 0.5;
    return;
  }

  // ===================== the arm-motion cycle (endless) =====================
  if (armEl) {
    gsap.set(armEl, { transformOrigin: '50% 0%', rotation: -14 });
    const armTL = gsap.timeline({ repeat: -1 });
    armTL
      .to({}, { duration: 0.4 })                                                   // 1 REST
      .to(heldEl, { opacity: 1, duration: 0.3, ease: 'power1.in' })                // 2 PICK
      .to(armEl, { rotation: 30, duration: 0.5, ease: 'power2.inOut' })            // 3 SWING DOWN/OUT
      .to(armEl, { rotation: 34, duration: 0.1, yoyo: true, repeat: 1, ease: 'power1.out' }) // overshoot
      .add(seatFrontier)                                                            // 4 PRESS — light the wall tile
      .to(heldEl, { opacity: 0, duration: 0.18 }, '>-0.04')                        // 5 RELEASE
      .to(armEl, { rotation: -14, duration: 0.5, ease: 'power2.inOut' })           //   RETRACT
      .to(tilesG, { x: () => offset - PITCH, duration: 0.45, ease: 'power1.inOut', // 6 ADVANCE (band scrolls)
        onComplete() { offset -= PITCH; recycle(); } });
  }

  // ===================== the DIVE (pinned, scrubbed) → cosmos =====================
  gsap.set(cosmos, { opacity: 0 });
  gsap.set([lead, ...lineEls].filter(Boolean), { opacity: 0, yPercent: 60 });

  const tl = gsap.timeline({
    scrollTrigger: { trigger: stage, start: 'top top', end: '+=3000', pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true },
    defaults: { ease: 'none' },
  });
  tl.to(pool, { scale: 1.22, yPercent: 16, opacity: 0, duration: 1 }, 0)            // sink past the water
    .to(heroCopy, { opacity: 0, yPercent: -14, ease: 'power2.in', duration: 0.45 }, 0)
    .to(cue, { opacity: 0, duration: 0.16 }, 0)
    .fromTo(cosmos, { opacity: 0.25, scale: 1.2 }, { opacity: 1, scale: 1, duration: 1 }, 0)
    .to(sigMain, { strokeDashoffset: 0, duration: 0.62 }, 0)
    .to(sigFlo, { strokeDashoffset: 0, duration: 0.62 }, 0)
    .to(sigLayer, { autoAlpha: 0, duration: 0.16 }, 0.74)                            // signature dissolves
    .to(lead, { opacity: 1, yPercent: 0, ease: 'power3.out', duration: 0.4 }, 0.82)
    .to(lineEls, { opacity: 1, yPercent: 0, ease: 'power3.out', stagger: 0.1, duration: 0.5 }, 0.9);

  ctx.heroIntro = () => {
    if (heroCopy) gsap.from(heroCopy.children, { opacity: 0, y: 18, duration: 0.9, stagger: 0.08, ease: 'power3.out', delay: 0.1 });
  };
}
