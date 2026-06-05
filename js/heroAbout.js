// heroAbout.js — Hero = a deep tiled shaft seen top-down, a little robot tiling its
// wall with a slow mechanical arm. Mouse peers around (orbital parallax). Scrolling
// FALLS down the shaft, rings rushing past, breaking into the cosmos at the bottom;
// the signature draws on the way down and dissolves before the About text lands.
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

  const cosmos = stage.querySelector('[data-cosmos]');
  const starsHost = stage.querySelector('[data-stars]');
  const shaft = stage.querySelector('[data-shaft]');
  const ringsHost = stage.querySelector('[data-rings]');
  const arm = stage.querySelector('[data-arm]');
  const botTile = stage.querySelector('.pbot-tile');
  const lens = stage.querySelector('[data-bot-lens]');
  const heroCopy = stage.querySelector('[data-hero-copy]');
  const sigLayer = stage.querySelector('[data-sig-layer]');
  const sigMain = stage.querySelector('.sig-main');
  const sigFlo = stage.querySelector('.sig-flourish');
  const resolve = stage.querySelector('[data-scene="resolve"]');
  const cue = stage.querySelector('[data-scroll-cue]');

  if (starsHost) buildStars(starsHost, 120);

  // bio
  const p = ctx.data.profile;
  const lead = stage.querySelector('[data-bio-lead]');
  if (lead && p?.bioLead) lead.textContent = p.bioLead;
  const bioHost = stage.querySelector('[data-bio]');
  const lineEls = (bioHost && p?.bio) ? maskLines(bioHost, p.bio) : [];

  // signature dash setup
  const armPath = (path) => { if (!path) return; const L = path.getTotalLength(); path.style.strokeDasharray = L; path.style.strokeDashoffset = L; };
  armPath(sigMain); armPath(sigFlo);

  // ---- build the concentric tiled rings (responsive) ----
  const N = 6;
  const COLORS = ['#1aa0d4', '#1685b3', '#0f6690', '#0b526f', '#08384f', '#062a3a']; // tiled-blue (top) → dark (deep)
  function buildShaft() {
    if (!ringsHost) return;
    ringsHost.innerHTML = '';
    const vmax = Math.max(window.innerWidth, window.innerHeight);
    const vmin = Math.min(window.innerWidth, window.innerHeight);
    const base = vmax * 1.06, centerGap = vmin * 0.22;
    const T = (base - centerGap) / (2 * N);
    for (let i = 0; i < N; i++) {
      const size = base - i * 2 * T;
      const Tp = (T / size) * 100;
      const r = document.createElement('div');
      r.className = 'ring';
      r.style.width = size + 'px'; r.style.height = size + 'px';
      r.style.zIndex = String(10 + i);
      r.style.backgroundColor = COLORS[i];
      r.style.setProperty('--cell', (T * 0.55).toFixed(1) + 'px');
      const a = Tp.toFixed(2), b = (100 - Tp).toFixed(2);
      r.style.clipPath = `polygon(0 0,100% 0,100% 100%,0 100%,0 0,${a}% ${a}%,${a}% ${b}%,${b}% ${b}%,${b}% ${a}%,${a}% ${a}%)`;
      ringsHost.append(r);
    }
  }
  buildShaft();

  // ---- fallback ----
  if (reduce || !gsap || !ScrollTrigger) {
    if (sigMain) sigMain.style.strokeDashoffset = 0;
    if (sigFlo) sigFlo.style.strokeDashoffset = 0;
    if (cosmos) cosmos.style.opacity = 1;
    if (resolve) resolve.style.opacity = 1;
    if (shaft) shaft.style.opacity = 0;
    return;
  }

  gsap.set(cosmos, { opacity: 0 });
  gsap.set([lead, ...lineEls].filter(Boolean), { opacity: 0, yPercent: 60 });

  // ---- robot arm: slowly reach, place a tile, retract ----
  if (arm) {
    gsap.set(arm, { transformOrigin: '40px 34px' });
    gsap.timeline({ repeat: -1, repeatDelay: 0.8, defaults: { ease: 'power2.inOut' } })
      .set(botTile, { opacity: 0 })
      .to(arm, { rotation: 16, duration: 1.2 })                 // reach down to the wall
      .to(botTile, { opacity: 1, duration: 0.25 }, '>-0.25')    // a tile appears
      .to(botTile, { opacity: 0, duration: 0.35 }, '+=0.35')    // it melds into the wall
      .to(arm, { rotation: 0, duration: 1.1 }, '<');            // retract (slow)
  }

  // ---- lens follows the cursor ----
  if (lens) {
    const lx = gsap.quickTo(lens, 'x', { duration: 0.5, ease: 'power3' });
    const ly = gsap.quickTo(lens, 'y', { duration: 0.5, ease: 'power3' });
    stage.addEventListener('pointermove', (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1, ny = (e.clientY / window.innerHeight) * 2 - 1;
      lx(nx * 2.2); ly(ny * 1.6);
    });
  }

  // ---- mouse orbital parallax (peer around the shaft) ----
  if (shaft) {
    const sx = gsap.quickTo(shaft, 'x', { duration: 0.8, ease: 'power3' });
    const sy = gsap.quickTo(shaft, 'y', { duration: 0.8, ease: 'power3' });
    const cx = gsap.quickTo(cosmos, 'x', { duration: 1.1, ease: 'power3' });
    const cy = gsap.quickTo(cosmos, 'y', { duration: 1.1, ease: 'power3' });
    stage.addEventListener('pointermove', (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1, ny = (e.clientY / window.innerHeight) * 2 - 1;
      sx(nx * -26); sy(ny * -26);   // near walls shift opposite the cursor
      cx(nx * 16); cy(ny * 16);     // the deep bottom shifts with it → parallax depth
    });
  }

  // ---- the FALL (pinned, scrubbed) ----
  const tl = gsap.timeline({
    scrollTrigger: { trigger: stage, start: 'top top', end: '+=3000', pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true },
    defaults: { ease: 'none' },
  });
  tl.to(shaft, { scale: 6, opacity: 0, duration: 1 }, 0)                              // fall — rings rush past + fade
    .to(heroCopy, { opacity: 0, yPercent: -12, ease: 'power2.in', duration: 0.45 }, 0)
    .to(cue, { opacity: 0, duration: 0.16 }, 0)
    .fromTo(cosmos, { opacity: 0.3, scale: 1.25 }, { opacity: 1, scale: 1, duration: 1 }, 0)   // cosmos rises to fill
    .to(sigMain, { strokeDashoffset: 0, duration: 0.62 }, 0)                          // signature draws
    .to(sigFlo, { strokeDashoffset: 0, duration: 0.62 }, 0)
    .to(sigLayer, { autoAlpha: 0, duration: 0.16 }, 0.74)                             // …then dissolves (no overlap)
    .to(lead, { opacity: 1, yPercent: 0, ease: 'power3.out', duration: 0.4 }, 0.82)   // About lands
    .to(lineEls, { opacity: 1, yPercent: 0, ease: 'power3.out', stagger: 0.1, duration: 0.5 }, 0.9);

  ctx.heroIntro = () => {
    if (heroCopy) gsap.from(heroCopy.children, { opacity: 0, y: 18, duration: 0.9, stagger: 0.08, ease: 'power3.out', delay: 0.1 });
  };

  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(buildShaft, 220); });
}
