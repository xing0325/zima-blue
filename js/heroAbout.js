// heroAbout.js — Hero = a top-down rectangular pool well a little robot is tiling
// (slow mechanical arm, CSS-driven). The mouse disturbs the water (ripples), and a
// ripple near the robot STARTLES it (a flinch). Scroll FALLS down the well, breaking
// through the floor into the cosmos; the signature draws, then dissolves before About.
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
  const well = stage.querySelector('[data-well]');
  const water = stage.querySelector('[data-water]');
  const bot = stage.querySelector('[data-bot]');
  const botInner = stage.querySelector('[data-bot-inner]');
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

  // ---- robot flinch ----
  function startle() {
    if (!gsap) return;
    if (botInner) gsap.to(botInner, { keyframes: [{ scale: 1.16, duration: 0.12, ease: 'power2.out' }, { scale: 1, duration: 0.6, ease: 'elastic.out(1,0.4)' }] });
    if (lens) gsap.to(lens, { keyframes: [{ scale: 1.5, duration: 0.12 }, { scale: 1, duration: 0.45, ease: 'power2.out' }] });
  }

  // ---- water ripples (the mouse disturbs the surface; a ripple near the bot startles it) ----
  if (water && !reduce) {
    const c = water.getContext('2d');
    let W = 0, H = 0, dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = stage.clientWidth; H = stage.clientHeight;
      water.width = W * dpr; water.height = H * dpr; water.style.width = W + 'px'; water.style.height = H + 'px';
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize(); window.addEventListener('resize', resize);
    const ripples = [];
    const spawn = (x, y, strong) => ripples.push({ x, y, r: 4, max: strong ? 160 : 92 + Math.random() * 50, w: strong ? 2.2 : 1.3 });
    let lastT = 0, lastStartle = 0;
    stage.addEventListener('pointermove', (e) => {
      const t = e.timeStamp || 0;
      if (t - lastT > 45) { lastT = t; spawn(e.clientX, e.clientY); }
      if (bot && botInner) {
        const r = bot.getBoundingClientRect();
        const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
        if (d < 150 && t - lastStartle > 1700) { lastStartle = t; startle(); spawn(e.clientX, e.clientY, true); }
      }
    });
    let amb = 0;
    (function loop(t) {
      c.clearRect(0, 0, W, H);
      if (t - amb > 2600) { amb = t; spawn(Math.random() * W, H * 0.3 + Math.random() * H * 0.4); }
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i]; rp.r += 1.5; const a = Math.max(0, 1 - rp.r / rp.max);
        c.beginPath(); c.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        c.strokeStyle = `rgba(150,220,255,${a * 0.45})`; c.lineWidth = rp.w; c.stroke();
        if (a <= 0) ripples.splice(i, 1);
      }
      requestAnimationFrame(loop);
    })(0);
  }

  // ---- fallback ----
  if (reduce || !gsap || !ScrollTrigger) {
    if (sigMain) sigMain.style.strokeDashoffset = 0;
    if (sigFlo) sigFlo.style.strokeDashoffset = 0;
    if (cosmos) cosmos.style.opacity = 1;
    if (resolve) resolve.style.opacity = 1;
    if (well) well.style.opacity = 0;
    return;
  }

  gsap.set(cosmos, { opacity: 0 });
  gsap.set([lead, ...lineEls].filter(Boolean), { opacity: 0, yPercent: 60 });

  // ---- the FALL (pinned, scrubbed) ----
  const tl = gsap.timeline({
    scrollTrigger: { trigger: stage, start: 'top top', end: '+=3000', pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true },
    defaults: { ease: 'none' },
  });
  tl.to(well, { scale: 5.5, opacity: 0, duration: 1 }, 0)                            // fall through the floor
    .to(water, { opacity: 0, duration: 0.6 }, 0)
    .to(heroCopy, { opacity: 0, yPercent: -12, ease: 'power2.in', duration: 0.45 }, 0)
    .to(cue, { opacity: 0, duration: 0.16 }, 0)
    .fromTo(cosmos, { opacity: 0.3, scale: 1.25 }, { opacity: 1, scale: 1, duration: 1 }, 0)
    .to(sigMain, { strokeDashoffset: 0, duration: 0.62 }, 0)
    .to(sigFlo, { strokeDashoffset: 0, duration: 0.62 }, 0)
    .to(sigLayer, { autoAlpha: 0, duration: 0.16 }, 0.74)
    .to(lead, { opacity: 1, yPercent: 0, ease: 'power3.out', duration: 0.4 }, 0.82)
    .to(lineEls, { opacity: 1, yPercent: 0, ease: 'power3.out', stagger: 0.1, duration: 0.5 }, 0.9);

  ctx.heroIntro = () => {
    if (heroCopy) gsap.from(heroCopy.children, { opacity: 0, y: 18, duration: 0.9, stagger: 0.08, ease: 'power3.out', delay: 0.1 });
  };
}
