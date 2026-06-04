// preloader.js — a pool tile fills with Zima blue, then dissolves.
import { isReducedMotion } from './lib/util.js';

export function initPreloader() {
  const gsap = window.gsap;
  const root = document.getElementById('preloader');
  if (!root) return { done: () => Promise.resolve() };

  const fill = root.querySelector('.pl-fill');
  const pct  = root.querySelector('.pl-pct');
  const reduce = isReducedMotion();
  const prog = { v: 0 };
  const render = () => { const v = Math.round(prog.v); if (fill) fill.style.height = v + '%'; if (pct) pct.textContent = v + '%'; };

  if (reduce || !gsap) { if (fill) fill.style.height = '100%'; if (pct) pct.textContent = '100%'; }
  else gsap.to(prog, { v: 88, duration: 1.3, ease: 'power1.inOut', onUpdate: render });

  return {
    done() {
      return new Promise((resolve) => {
        if (reduce || !gsap) { root.classList.add('is-done'); root.style.display = 'none'; return resolve(); }
        gsap.killTweensOf(prog);
        gsap.to(prog, {
          v: 100, duration: 0.45, ease: 'power2.out', onUpdate: render,
          onComplete() {
            gsap.to(root, {
              autoAlpha: 0, duration: 0.6, ease: 'power2.inOut',
              onComplete() { root.classList.add('is-done'); root.style.display = 'none'; resolve(); },
            });
          },
        });
      });
    },
  };
}
