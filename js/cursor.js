// cursor.js — a glowing Zima cursor: a fast dot + a trailing ring that grows on
// interactive elements, plus magnetic pull on [data-magnetic]. Fine-pointer only.
export function initCursor(ctx) {
  const { gsap, reduce } = ctx;
  if (reduce || !gsap || !gsap.quickTo) return;
  if (!window.matchMedia('(pointer:fine)').matches) return; // skip touch devices

  const dot = document.createElement('div'); dot.className = 'cursor-dot';
  const ring = document.createElement('div'); ring.className = 'cursor-ring';
  document.body.append(ring, dot);
  document.documentElement.style.cursor = 'none'; // set via JS so a failure leaves the native cursor

  const dx = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
  const dy = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
  const rx = gsap.quickTo(ring, 'x', { duration: 0.4, ease: 'power3' });
  const ry = gsap.quickTo(ring, 'y', { duration: 0.4, ease: 'power3' });

  window.addEventListener('pointermove', (e) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); }, { passive: true });
  window.addEventListener('pointerdown', () => ring.classList.add('is-press'));
  window.addEventListener('pointerup', () => ring.classList.remove('is-press'));

  const grow = () => ring.classList.add('is-grow');
  const shrink = () => ring.classList.remove('is-grow');
  document.querySelectorAll('a, button, canvas, input, [data-magnetic]').forEach((el) => {
    el.addEventListener('pointerenter', grow);
    el.addEventListener('pointerleave', shrink);
  });

  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      gsap.to(el, { x: (e.clientX - (r.left + r.width / 2)) * 0.3, y: (e.clientY - (r.top + r.height / 2)) * 0.5, duration: 0.4, ease: 'power3' });
    });
    el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,0.4)' }));
  });
}
