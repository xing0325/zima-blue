// paintings.js — "齐马的画作" interludes: a cosmic field with a jarring blue square
// that GROWS with scroll (Zima's art arc), narrating the theme between sections.
function buildStars(host, count) {
  const f = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const s = document.createElement('i');
    const sz = 1 + Math.random() * 2;
    s.style.width = sz + 'px'; s.style.height = sz + 'px';
    s.style.left = (Math.random() * 100) + '%';
    s.style.top = (Math.random() * 100) + '%';
    s.style.opacity = (0.2 + Math.random() * 0.7).toFixed(2);
    if (Math.random() < 0.12) s.style.background = '#7fd6ff';
    f.appendChild(s);
  }
  host.appendChild(f);
}

export function initPaintings(ctx) {
  const { gsap, ScrollTrigger, reduce } = ctx;
  document.querySelectorAll('[data-painting]').forEach((sec) => {
    const starsHost = sec.querySelector('[data-stars-depth]');
    if (starsHost) buildStars(starsHost, 70);
    const square = sec.querySelector('[data-art-square]');
    const plaque = sec.querySelector('.art-plaque');
    const grow = parseFloat(sec.dataset.grow || '0.5');
    if (!square) return;

    if (reduce || !gsap || !ScrollTrigger) { square.style.transform = `scale(${grow})`; return; }

    gsap.set(square, { scale: 0.08, opacity: 0.92, transformOrigin: 'center center' });
    gsap.timeline({
      scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: 1 },
      defaults: { ease: 'none' },
    }).to(square, { scale: grow }, 0);   // transform-only growth (no layout thrash)

    if (plaque) gsap.from(plaque.children, {
      yPercent: 40, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.12,
      scrollTrigger: { trigger: sec, start: 'top 62%' },
    });
  });
}
