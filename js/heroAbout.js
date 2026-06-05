// heroAbout.js — Hero = the pool seen from the BOTTOM (池底视角, ref 池底视角5):
// the surface glows far above, caustic light dances on a tilted tiled wall, and the
// little machine endlessly scrubs that wall (with its reflection on it). The mouse
// disturbs the water (ripples) and startles the robot. Scrolling FLOATS up to the
// surface and breaks through into the cosmos; the signature draws, then dissolves
// before About.  Grounded in docs/reference-artbook.md §2.5.
import { maskLines } from './lib/util.js';

const NS = 'http://www.w3.org/2000/svg';
function S(tag, attrs) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}
const lerp = (a, b, t) => a + (b - a) * t;
function mix(c1, c2, t) {
  const p = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const a = p(c1), b = p(c2);
  const h = (n) => Math.round(n).toString(16).padStart(2, '0');
  return '#' + h(lerp(a[0], b[0], t)) + h(lerp(a[1], b[1], t)) + h(lerp(a[2], b[2], t));
}

// ----- starfield (revealed once we break the surface) -----
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
    for (let i = 0; i < n; i++) stars.push({
      x: Math.random() * W, y: Math.random() * H, r: 0.4 + Math.random() * 1.6,
      col: COLORS[(Math.random() * COLORS.length) | 0], base: 0.25 + Math.random() * 0.6,
      tw: 0.3 + Math.random() * 1.4, ph: Math.random() * 6.28,
    });
  }
  resize(); window.addEventListener('resize', resize);
  let raf = 0;
  (function draw(t) {
    c.clearRect(0, 0, W, H);
    const k = t * 0.001;
    for (const s of stars) {
      c.globalAlpha = Math.max(0, reduce ? s.base : s.base * (0.55 + 0.45 * Math.sin(k * s.tw + s.ph)));
      c.fillStyle = s.col; c.beginPath(); c.arc(s.x, s.y, s.r, 0, 6.283); c.fill();
    }
    c.globalAlpha = 1;
    if (!reduce) raf = requestAnimationFrame(draw);
  })(0);
  return { stop() { cancelAnimationFrame(raf); } };
}

export function initHeroAbout(ctx) {
  const { gsap, ScrollTrigger, reduce } = ctx;
  const stage = document.getElementById('hero-about');
  if (!stage) return;

  const pool = stage.querySelector('[data-pool]');
  const wallG = stage.querySelector('[data-wall]');
  const layG = stage.querySelector('[data-lay]');
  const raysG = stage.querySelector('[data-rays]');
  const botG = stage.querySelector('[data-bot]');
  const botRefG = stage.querySelector('[data-bot-ref]');
  const turb = stage.querySelector('[data-turb]');
  const caustics = stage.querySelector('[data-caustics]');
  const cosmos = stage.querySelector('[data-cosmos]');
  const starsCv = stage.querySelector('[data-stars]');
  const heroCopy = stage.querySelector('[data-hero-copy]');
  const cue = stage.querySelector('[data-scroll-cue]');
  const sigLayer = stage.querySelector('[data-sig-layer]');
  const sigMain = stage.querySelector('.sig-main');
  const sigFlo = stage.querySelector('.sig-flourish');
  const resolve = stage.querySelector('[data-scene="resolve"]');

  // ---- bio ----
  const p = ctx.data && ctx.data.profile;
  const lead = stage.querySelector('[data-bio-lead]');
  if (lead && p && p.bioLead) lead.textContent = p.bioLead;
  const bioHost = stage.querySelector('[data-bio]');
  const lineEls = (bioHost && p && p.bio) ? maskLines(bioHost, p.bio) : [];

  // ---- signature dash ----
  const dash = (path) => { if (!path) return; const L = path.getTotalLength(); path.style.strokeDasharray = L; path.style.strokeDashoffset = L; };
  dash(sigMain); dash(sigFlo);

  // ===================== the tiled wall =====================
  // wall-local coords: y=0 is the coping (near the surface, bright); +y goes deep (dark).
  const PITCH = 64, GAP = 4, TS = PITCH - GAP;
  if (wallG) {
    wallG.appendChild(S('rect', { x: -640, y: -8, width: 1560, height: 1200, fill: '#0c343a' })); // grout substrate
    for (let gy = 0; gy < 19; gy++) {
      const t = Math.min(1, gy / 17);
      for (let gx = -10; gx < 15; gx++) {
        const shade = mix('#4FB6CE', '#0E363E', t * 0.92 + (Math.random() * 0.12 - 0.06));
        wallG.appendChild(S('rect', { x: gx * PITCH, y: gy * PITCH, width: TS, height: TS, fill: shade, opacity: lerp(0.96, 0.66, t) }));
      }
    }
  }

  // ===================== the fresh-tile lay strip (what the clamp builds) =====================
  // wall-local: a row of slots near the coping; the clamp lights one per cycle, bright zima
  // tiles against the old teal wall, on an endless treadmill so the band always grows.
  const LAY_PITCH = 60, LAY_TS = 54, LAY_Y = 30, LAY_COUNT = 30, CLAMP_X = 150;
  const laySpan = LAY_COUNT * LAY_PITCH;
  const slots = [];
  let layOffset = 0;
  if (layG) {
    for (let i = 0; i < LAY_COUNT; i++) {
      const g = S('g', { transform: `translate(${i * LAY_PITCH},0)` });
      const lit = S('rect', { x: 0, y: LAY_Y, width: LAY_TS, height: LAY_TS, rx: 1, fill: 'url(#uw-fresh)', opacity: 0 });
      g.appendChild(lit); layG.appendChild(g);
      slots.push({ g, lit, x: i * LAY_PITCH, on: false });
    }
    slots.forEach((s) => { if (s.x < CLAMP_X) { s.on = true; s.lit.setAttribute('opacity', 1); } });
  }
  function seatFrontier() {
    let best = null, bd = 1e9;
    for (const s of slots) {
      if (s.on) continue;
      const sx = s.x + layOffset, d = Math.abs(sx - CLAMP_X);
      if (sx >= CLAMP_X - LAY_PITCH * 0.6 && d < bd) { bd = d; best = s; }
    }
    if (best) { best.on = true; gsap.fromTo(best.lit, { opacity: 1, scaleY: 0, transformOrigin: '50% 0%' }, { scaleY: 1, duration: 0.32, ease: 'power3.out' }); }
  }
  function recycleLay() {
    for (const s of slots) {
      if (s.x + layOffset < -LAY_PITCH * 2) { s.x += laySpan; s.on = false; s.g.setAttribute('transform', `translate(${s.x},0)`); s.lit.setAttribute('opacity', 0); }
    }
  }

  // ===================== god-rays =====================
  if (raysG) {
    const apex = { x: 660, y: -90 };
    for (let i = 0; i < 6; i++) {
      const a = -0.5 + i * 0.2 + (Math.random() * 0.06);
      const len = 760, half = 26 + Math.random() * 26;
      const tipx = apex.x + Math.sin(a) * len, tipy = apex.y + Math.cos(a) * len;
      const px = Math.cos(a) * half, py = -Math.sin(a) * half;
      const ray = S('polygon', { points: `${apex.x - px},${apex.y - py} ${apex.x + px},${apex.y + py} ${tipx + px * 1.8},${tipy + py * 1.8} ${tipx - px * 1.8},${tipy - py * 1.8}`, fill: '#CFF3EC', opacity: 0.08 + Math.random() * 0.07 });
      ray.setAttribute('data-ray', '');
      raysG.appendChild(ray);
    }
    raysG.style.mixBlendMode = 'screen';
  }

  // ===================== the robot (a clamp that lays glowing tiles) + reflection =====================
  const BOT_X = 210, BOT_Y = 120;
  let armEl = null, clampEl = null, heldEl = null, lensEl = null, botInner = null;
  function botShape(parent, ghost) {
    const inner = S('g', ghost ? {} : { 'data-bot-inner': '' });
    const col = ghost ? '#0a2a30' : '#08130f';
    inner.appendChild(S('rect', { x: -34, y: 22, width: 68, height: 9, rx: 3, fill: col }));        // tread bar
    for (const cx of [-24, -2, 20]) inner.appendChild(S('circle', { cx, cy: 30, r: 7, fill: ghost ? '#0c3038' : '#0a1614' }));
    inner.appendChild(S('polygon', { points: '-36,-8 -22,-30 26,-30 42,-4 34,24 -32,24', fill: col, stroke: ghost ? 'none' : '#3FB8B0', 'stroke-width': 1.2, 'stroke-opacity': 0.5 })); // body
    inner.appendChild(S('rect', { x: 8, y: -28, width: 16, height: 11, rx: 2, fill: ghost ? '#0a2a30' : '#05100e' })); // sensor housing
    const lens = S('g', ghost ? {} : { 'data-bot-lens': '' });
    lens.appendChild(S('circle', { cx: 16, cy: -22, r: 3.4, fill: ghost ? '#1c5a60' : '#7FD9CF' }));
    inner.appendChild(S('circle', { cx: -18, cy: -14, r: 8, fill: ghost ? '#0c3038' : '#0a1614', stroke: ghost ? 'none' : '#2E7E80', 'stroke-width': 1, 'stroke-opacity': 0.5 })); // rotary shoulder joint
    // arm reaching up the wall (toward -y), ending in a clamp gripping ONE glowing tile
    const arm = S('g', ghost ? {} : { 'data-arm': '' });
    arm.appendChild(S('polygon', { points: '-24,-12 -14,-18 -46,-66 -56,-60', fill: ghost ? '#0c3038' : '#0a1614' })); // forearm
    const clamp = S('g', ghost ? {} : { 'data-clamp': '' });
    clamp.appendChild(S('rect', { x: -68, y: -82, width: 22, height: 5, rx: 1.5, fill: col })); // upper jaw
    clamp.appendChild(S('rect', { x: -68, y: -60, width: 22, height: 5, rx: 1.5, fill: col })); // lower jaw
    const held = S('rect', { x: -66, y: -77, width: 18, height: 16, rx: 1, fill: 'url(#uw-fresh)', opacity: 0, 'data-held': '' });
    clamp.appendChild(held);
    arm.appendChild(clamp);
    inner.appendChild(arm); inner.appendChild(lens);
    parent.appendChild(inner);
    return { inner, arm, clamp, held, lens };
  }
  if (botRefG) {
    botRefG.setAttribute('transform', `translate(${BOT_X + 14},${BOT_Y + 168}) scale(1,-0.86)`);
    botRefG.setAttribute('opacity', '0.16');
    botShape(botRefG, true);
  }
  if (botG) {
    botG.setAttribute('transform', `translate(${BOT_X},${BOT_Y})`);
    const r = botShape(botG, false);
    botInner = r.inner; armEl = r.arm; clampEl = r.clamp; heldEl = r.held; lensEl = r.lens;
  }

  // ===================== caustics canvas: bubbles + mouse ripples =====================
  if (caustics && !reduce) {
    const c = caustics.getContext('2d');
    let W = 0, H = 0, dpr = 1; const rings = [], bubbles = [];
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = stage.clientWidth; H = stage.clientHeight;
      caustics.width = W * dpr; caustics.height = H * dpr;
      caustics.style.width = W + 'px'; caustics.style.height = H + 'px';
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize(); window.addEventListener('resize', resize);
    const ring = (x, y, strong) => rings.push({ x, y, r: 3, max: strong ? 150 : 64 + Math.random() * 54, w: strong ? 2.3 : 1.1 });
    const botCenter = () => { const b = botG.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; };
    let bub = 0;
    (function loop(t) {
      c.clearRect(0, 0, W, H);
      // bubbles rise from the robot
      if (t - bub > 360) { bub = t; const p0 = botCenter(); bubbles.push({ x: p0.x + (Math.random() * 26 - 13), y: p0.y, r: 1.4 + Math.random() * 3.4, vy: 0.5 + Math.random() * 0.7, ph: Math.random() * 6.28, life: 1 }); }
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i]; b.y -= b.vy; b.x += Math.sin((H - b.y) * 0.03 + b.ph) * 0.5; b.life = b.y / H;
        c.beginPath(); c.arc(b.x, b.y, b.r, 0, 6.283);
        c.strokeStyle = `rgba(207,243,236,${0.5 * b.life})`; c.lineWidth = 1; c.stroke();
        if (b.y < H * 0.08) bubbles.splice(i, 1);
      }
      // ripples
      for (let i = rings.length - 1; i >= 0; i--) {
        const rp = rings[i]; rp.r += 1.5; const a = Math.max(0, 1 - rp.r / rp.max);
        c.beginPath(); c.arc(rp.x, rp.y, rp.r, 0, 6.283);
        c.strokeStyle = `rgba(127,217,207,${a * 0.45})`; c.lineWidth = rp.w; c.stroke();
        if (a <= 0) rings.splice(i, 1);
      }
      requestAnimationFrame(loop);
    })(0);

    let lastSpawn = 0, lastStartle = 0;
    function startle() {
      if (!gsap) return;
      if (botInner) gsap.to(botInner, { keyframes: [{ scale: 1.12, duration: 0.12, ease: 'power2.out' }, { scale: 1, duration: 0.6, ease: 'elastic.out(1,0.4)' }], transformOrigin: '50% 80%' });
      if (lensEl) gsap.to(lensEl, { keyframes: [{ scale: 1.6, duration: 0.12 }, { scale: 1, duration: 0.45, ease: 'power2.out' }], transformOrigin: '50% 50%' });
    }
    stage.addEventListener('pointermove', (e) => {
      const t = e.timeStamp || 0;
      if (t - lastSpawn > 48) { lastSpawn = t; ring(e.clientX, e.clientY); }
      if (botG) {
        const p0 = botCenter();
        if (Math.hypot(e.clientX - p0.x, e.clientY - p0.y) < 150 && t - lastStartle > 1600) { lastStartle = t; startle(); ring(e.clientX, e.clientY, true); }
      }
    });
    caustics.style.mixBlendMode = 'screen';
  }

  // ===================== starfield =====================
  if (starsCv) { try { buildStarfield(starsCv, stage, reduce); } catch (e) { /* non-fatal */ } }

  // ===================== reduced-motion / no-gsap fallback =====================
  if (reduce || !gsap || !ScrollTrigger) {
    if (cosmos) cosmos.style.opacity = 0;
    if (pool) pool.style.opacity = 1;
    if (sigLayer) sigLayer.style.display = 'none';
    if (resolve) resolve.style.display = 'none';
    return;
  }

  // ===================== ambient life: caustics shimmer, god-rays, scrub =====================
  if (turb) gsap.to(turb, { attr: { baseFrequency: '0.015 0.032' }, duration: 9, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  if (raysG) gsap.to(raysG.querySelectorAll('[data-ray]'), { opacity: '+=0.05', duration: 'random(4,7)', yoyo: true, repeat: -1, ease: 'sine.inOut', stagger: { each: 0.6, from: 'random' } });

  // the clamp tile-laying cycle: grip a glowing tile → swing it down → press it flat onto
  // the wall (a 2.5D flip) → release → lift → translate along the wall. Endless.
  if (armEl) {
    gsap.set(armEl, { transformOrigin: '50% 100%', rotation: -13 });
    gsap.set(heldEl, { opacity: 0 });
    gsap.timeline({ repeat: -1 })
      .to({}, { duration: 0.4 })                                                        // 1 rest, arm lifted
      .set(heldEl, { opacity: 1, scaleY: 1, transformOrigin: '50% 0%' })                // 2 a fresh tile in the clamp
      .to(armEl, { rotation: 14, duration: 0.5, ease: 'power2.inOut' })                 // 3 swing the tile down to the wall
      .to(heldEl, { scaleY: 0.08, duration: 0.18, ease: 'power2.in' })                  // 4 press: tile flips toward the wall
      .add(seatFrontier)                                                                //   ...lights flat on the wall
      .to(heldEl, { opacity: 0, duration: 0.1 })                                        // 5 clamp releases
      .to(armEl, { rotation: -13, duration: 0.5, ease: 'power2.inOut' })                // 6 lift away
      .to(layG, { x: () => layOffset - LAY_PITCH, duration: 0.5, ease: 'power1.inOut',  // 7 translate along the wall
        onComplete() { layOffset -= LAY_PITCH; recycleLay(); } });
  }

  // ===================== float to the surface (pinned, scrubbed) → cosmos =====================
  gsap.set(cosmos, { opacity: 0 });
  gsap.set([lead, ...lineEls].filter(Boolean), { opacity: 0, yPercent: 60 });

  const tl = gsap.timeline({
    scrollTrigger: { trigger: stage, start: 'top top', end: '+=3000', pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true },
    defaults: { ease: 'none' },
  });
  tl.to(pool, { scale: 1.7, yPercent: -10, opacity: 0, duration: 1 }, 0)          // rise & break the surface
    .to(heroCopy, { opacity: 0, yPercent: -14, ease: 'power2.in', duration: 0.45 }, 0)
    .to(cue, { opacity: 0, duration: 0.16 }, 0)
    .fromTo(cosmos, { opacity: 0.2, scale: 1.18 }, { opacity: 1, scale: 1, duration: 1 }, 0)
    .to(sigMain, { strokeDashoffset: 0, duration: 0.62 }, 0)
    .to(sigFlo, { strokeDashoffset: 0, duration: 0.62 }, 0)
    .to(sigLayer, { autoAlpha: 0, duration: 0.16 }, 0.74)
    .to(lead, { opacity: 1, yPercent: 0, ease: 'power3.out', duration: 0.4 }, 0.82)
    .to(lineEls, { opacity: 1, yPercent: 0, ease: 'power3.out', stagger: 0.1, duration: 0.5 }, 0.9);

  ctx.heroIntro = () => {
    if (heroCopy) gsap.from(heroCopy.children, { opacity: 0, y: 18, duration: 0.9, stagger: 0.08, ease: 'power3.out', delay: 0.1 });
  };
}
