// reveal.js — generic scroll-in reveals for section heads + [data-reveal] items.
export function initReveals(ctx) {
  const { gsap, ScrollTrigger, reduce } = ctx;
  if (reduce || !gsap || !ScrollTrigger) return;

  // section headers: stagger label → title → sub
  document.querySelectorAll('.sec-head').forEach((head) => {
    gsap.from(head.children, {
      yPercent: 40, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08,
      scrollTrigger: { trigger: head, start: 'top 82%' },
    });
  });

  // generic items — set hidden via JS (so no-JS leaves them visible), reveal in batches
  const items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;
  gsap.set(items, { opacity: 0, y: 18 });
  ScrollTrigger.batch(items, {
    start: 'top 88%',
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08, overwrite: true }),
  });
}
