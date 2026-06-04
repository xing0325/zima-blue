// heroAbout.js — the 01→02 dive.
// ONE pinned, scrubbed timeline. shrink + Zima-blue bloom + signature-draw all
// live at position 0 with equal duration & linear ease → genuinely simultaneous.
import { maskLines } from './lib/util.js';

function buildStars(host, count, min, max) {
  if (!host) return;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const s = document.createElement('i');
    const sz = min + Math.random() * (max - min);
    s.style.width = sz + 'px'; s.style.height = sz + 'px';
    s.style.left = (Math.random() * 180 - 40) + '%';
    s.style.top = (Math.random() * 180 - 40) + '%';
    s.style.opacity = (0.2 + Math.random() * 0.8).toFixed(2);
    if (Math.random() < 0.14) s.style.background = '#7fd6ff';
    frag.appendChild(s);
  }
  host.appendChild(frag);
}

export function initHeroAbout(ctx) {
  const { gsap, ScrollTrigger, reduce } = ctx;
  const stage = document.getElementById('hero-about');
  if (!stage) return;

  buildStars(stage.querySelector('[data-stars="far"]'), 95, 1, 2.3);
  buildStars(stage.querySelector('[data-stars="near"]'), 60, 1.6, 3.8);

  // bio text
  const p = ctx.data.profile;
  const lead = stage.querySelector('[data-bio-lead]');
  if (lead && p?.bioLead) lead.textContent = p.bioLead;
  const bioHost = stage.querySelector('[data-bio]');
  const lineEls = (bioHost && p?.bio) ? maskLines(bioHost, p.bio) : [];

  // signature stroke-draw setup
  const sigMain = stage.querySelector('.sig-main');
  const sigFlo = stage.querySelector('.sig-flourish');
  const armSig = (path) => { if (!path) return; const L = path.getTotalLength(); path.style.strokeDasharray = L; path.style.strokeDashoffset = L; };
  armSig(sigMain); armSig(sigFlo);

  const voidInner = stage.querySelector('[data-void-inner]');
  const bloom = stage.querySelector('[data-bloom]');
  const near = stage.querySelector('[data-stars="near"]');
  const far = stage.querySelector('[data-stars="far"]');
  const resolve = stage.querySelector('[data-scene="resolve"]');
  const cue = stage.querySelector('[data-scroll-cue]');

  // static fallback (reduced motion / no GSAP): just show the About state
  if (reduce || !gsap || !ScrollTrigger) {
    if (bloom) { bloom.style.opacity = 1; bloom.style.transform = 'scale(3.2)'; }
    if (sigMain) sigMain.style.strokeDashoffset = 0;
    if (sigFlo) sigFlo.style.strokeDashoffset = 0;
    if (voidInner) voidInner.style.opacity = 0;
    return;
  }

  // about text starts hidden (signature already hidden via dashoffset)
  gsap.set([lead, ...lineEls].filter(Boolean), { opacity: 0, yPercent: 60 });

  // hero intro — played once after the preloader dissolves
  ctx.heroIntro = () => {
    if (!voidInner) return;
    gsap.from(voidInner, { opacity: 0, scale: 1.12, duration: 1.1, ease: 'power3.out' });
    gsap.from(voidInner.children, { opacity: 0, y: 16, duration: 0.9, stagger: 0.08, ease: 'power3.out', delay: 0.1 });
  };

  // THE pinned, scrubbed, simultaneous timeline
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: stage, start: 'top top', end: '+=2600',
      pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true,
    },
  });

  // --- the synchronized trio (+ supporting recedes), all at position 0, dur 1, linear ---
  tl.to(voidInner, { scale: 0.45, ease: 'none', duration: 1 }, 0)
    .to(voidInner, { opacity: 0, ease: 'power2.in', duration: 1 }, 0)            // stays visible while it shrinks, fades late
    .to(near, { scale: 0.4, opacity: 0, ease: 'none', duration: 1 }, 0)
    .to(far,  { scale: 0.7, opacity: 0, ease: 'none', duration: 1 }, 0)
    .fromTo(bloom, { scale: 0.15, opacity: 0 }, { scale: 3.2, opacity: 1, ease: 'none', duration: 1 }, 0)   // Zima blue blooms
    .to(sigMain, { strokeDashoffset: 0, ease: 'none', duration: 1 }, 0)         // signature draws in lockstep
    .to(sigFlo,  { strokeDashoffset: 0, ease: 'none', duration: 1 }, 0)
    .to(cue, { opacity: 0, ease: 'power1.out', duration: 0.2 }, 0)
    // the About text lands as you complete the dive (the destination, not part of the trio)
    .to(lead, { opacity: 1, yPercent: 0, ease: 'power3.out', duration: 0.4 }, 0.62)
    .to(lineEls, { opacity: 1, yPercent: 0, ease: 'power3.out', stagger: 0.1, duration: 0.5 }, 0.72);

  ctx._heroTimeline = tl;
}
