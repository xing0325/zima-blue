// heroAbout.js — Hero = an angled (3/4) pool a little robot is tiling in Zima blue.
// Mouse tilts the pool & turns the robot's lens; click drops a ripple. Scrolling
// DIVES through the water into the cosmos as the signature draws → lands on About.
import { maskLines } from './lib/util.js';

function buildStars(host, count) {
  const f = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const s = document.createElement('i');
    const sz = 1 + Math.random() * 2.2;
    s.style.width = sz + 'px'; s.style.height = sz + 'px';
    s.style.left = (Math.random() * 100) + '%';
    s.style.top = (Math.random() * 100) + '%';
    s.style.opacity = (0.25 + Math.random() * 0.75).toFixed(2);
    if (Math.random() < 0.16) s.style.background = '#9fc6ff';
    f.appendChild(s);
  }
  host.appendChild(f);
}

export function initHeroAbout(ctx) {
  const { gsap, ScrollTrigger, reduce } = ctx;
  const stage = document.getElementById('hero-about');
  if (!stage) return;

  const scene = stage.querySelector('[data-pool-scene]');
  const floor = stage.querySelector('[data-pool-floor]');
  const grid = stage.querySelector('[data-pool-grid]');
  const bot = stage.querySelector('[data-bot]');
  const lens = stage.querySelector('[data-bot-lens]');
  const cosmos = stage.querySelector('[data-cosmos]');
  const starsHost = stage.querySelector('[data-stars]');
  const heroCopy = stage.querySelector('[data-hero-copy]');
  const sigMain = stage.querySelector('.sig-main');
  const sigFlo = stage.querySelector('.sig-flourish');
  const resolve = stage.querySelector('[data-scene="resolve"]');
  const cue = stage.querySelector('[data-scroll-cue]');

  if (starsHost) buildStars(starsHost, 110);

  // pool tiles
  const COLS = 12, ROWS = 7;
  const tiles = [];
  if (grid) {
    grid.style.setProperty('--cols', COLS);
    grid.style.setProperty('--rows', ROWS);
    for (let i = 0; i < COLS * ROWS; i++) { const t = document.createElement('span'); t.className = 'ptile'; grid.append(t); tiles.push(t); }
  }

  // bio
  const p = ctx.data.profile;
  const lead = stage.querySelector('[data-bio-lead]');
  if (lead && p?.bioLead) lead.textContent = p.bioLead;
  const bioHost = stage.querySelector('[data-bio]');
  const lineEls = (bioHost && p?.bio) ? maskLines(bioHost, p.bio) : [];

  // signature dash setup
  const arm = (path) => { if (!path) return; const L = path.getTotalLength(); path.style.strokeDasharray = L; path.style.strokeDashoffset = L; };
  arm(sigMain); arm(sigFlo);

  // ---- fallback: reduced motion / no GSAP ----
  if (reduce || !gsap || !ScrollTrigger) {
    tiles.forEach((t) => t.classList.add('laid'));
    if (sigMain) sigMain.style.strokeDashoffset = 0;
    if (sigFlo) sigFlo.style.strokeDashoffset = 0;
    if (cosmos) cosmos.style.opacity = 1;
    if (resolve) resolve.style.opacity = 1;
    if (scene) scene.style.opacity = 0;
    return;
  }

  // base poses
  if (floor) gsap.set(floor, { rotationX: 56, transformPerspective: 1100, transformOrigin: '50% 50%' });
  if (cosmos) gsap.set(cosmos, { opacity: 0 });
  gsap.set([lead, ...lineEls].filter(Boolean), { opacity: 0, yPercent: 60 });
  if (bot) gsap.set(bot, { rotationX: -56, transformOrigin: 'bottom center' }); // stand the robot up on the tilted floor

  // ---- robot patrol + tile sweep (ambient loop) ----
  let sweepTl, patrolTl;
  function tileSweep() {
    if (sweepTl) sweepTl.kill();
    tiles.forEach((t) => t.classList.remove('laid'));
    sweepTl = gsap.timeline({ repeat: -1, repeatDelay: 1.4, onRepeat: () => tiles.forEach((t) => t.classList.remove('laid')) });
    for (let cc = 0; cc < COLS; cc++) {
      const col = cc;
      sweepTl.add(() => { for (let r = 0; r < ROWS; r++) tiles[r * COLS + col]?.classList.add('laid'); }, col * 0.3);
    }
  }
  function patrol() {
    if (!bot || !floor) return;
    if (patrolTl) patrolTl.kill();
    const W = floor.clientWidth || 700;
    gsap.set(bot, { x: W * 0.08 });
    patrolTl = gsap.to(bot, { x: W * 0.9, duration: COLS * 0.3, ease: 'none', repeat: -1, yoyo: true });
  }
  tileSweep();
  patrol();
  if (bot) gsap.to(bot, { y: -5, duration: 0.6, ease: 'sine.inOut', repeat: -1, yoyo: true });

  // ---- mouse: tilt pool + turn lens; click = ripple ----
  if (floor) {
    const rx = gsap.quickTo(floor, 'rotationX', { duration: 0.6, ease: 'power3' });
    const ry = gsap.quickTo(floor, 'rotationY', { duration: 0.6, ease: 'power3' });
    const lx = lens ? gsap.quickTo(lens, 'x', { duration: 0.5, ease: 'power3' }) : null;
    const ly = lens ? gsap.quickTo(lens, 'y', { duration: 0.5, ease: 'power3' }) : null;
    stage.addEventListener('pointermove', (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      rx(56 - ny * 5); ry(nx * 7);
      if (lx) { lx(nx * 2.4); ly(ny * 2.4); }
    });
  }
  stage.addEventListener('pointerdown', (e) => {
    const d = document.createElement('div'); d.className = 'pool-ripple';
    d.style.left = e.clientX + 'px'; d.style.top = e.clientY + 'px';
    stage.appendChild(d);
    gsap.fromTo(d, { scale: 0, opacity: 0.8 }, { scale: 9, opacity: 0, duration: 0.9, ease: 'power2.out', onComplete: () => d.remove() });
  });

  // ---- the DIVE (pinned, scrubbed) ----
  const tl = gsap.timeline({
    scrollTrigger: { trigger: stage, start: 'top top', end: '+=2600', pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true },
    defaults: { ease: 'none' },
  });
  tl.to(scene, { yPercent: 22, scale: 1.7, opacity: 0, duration: 1 }, 0)              // sink through the pool
    .to(heroCopy, { opacity: 0, yPercent: -12, ease: 'power2.in', duration: 0.5 }, 0)
    .to(cue, { opacity: 0, duration: 0.18 }, 0)
    .fromTo(cosmos, { opacity: 0, scale: 1.18 }, { opacity: 1, scale: 1, duration: 1 }, 0)  // cosmos rises
    .to(sigMain, { strokeDashoffset: 0, duration: 1 }, 0)                              // signature draws
    .to(sigFlo, { strokeDashoffset: 0, duration: 1 }, 0)
    .to(lead, { opacity: 1, yPercent: 0, ease: 'power3.out', duration: 0.4 }, 0.62)    // About lands
    .to(lineEls, { opacity: 1, yPercent: 0, ease: 'power3.out', stagger: 0.1, duration: 0.5 }, 0.72);

  // hero intro after the preloader
  ctx.heroIntro = () => {
    if (heroCopy) gsap.from(heroCopy.children, { opacity: 0, y: 18, duration: 0.9, stagger: 0.08, ease: 'power3.out', delay: 0.1 });
  };

  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(patrol, 220); });
}
