// parallax.js — generic scroll parallax for [data-depth] layers (cosmic depth).
// depth 0.1 = far/slow … 0.6 = near/fast. Transform-only; honours reduced motion.
export function initParallax(ctx) {
  const { gsap, ScrollTrigger, reduce } = ctx;
  if (reduce || !gsap || !ScrollTrigger) return;
  gsap.utils.toArray('[data-depth]').forEach((layer) => {
    const depth = parseFloat(layer.dataset.depth) || 0.2;
    gsap.to(layer, {
      yPercent: -depth * 100, ease: 'none',
      scrollTrigger: { trigger: layer.closest('section') || layer, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}
