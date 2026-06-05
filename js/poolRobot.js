// poolRobot.js — the climax image: a little robot tiling the pool floor in Zima blue,
// one tile at a time, forever. (Zima reduced to a simple machine, finding its peace.)
export function initPoolRobot(ctx) {
  const { gsap, reduce } = ctx;
  const floor = document.querySelector('[data-pool-floor]');
  if (!floor) return;
  const host = floor.querySelector('[data-floor-tiles]');
  const bot = floor.querySelector('[data-bot]');
  if (!host || !bot) return;

  const N = 14;
  const tiles = [];
  for (let i = 0; i < N; i++) { const t = document.createElement('span'); t.className = 'floor-tile'; host.append(t); tiles.push(t); }

  if (reduce || !gsap) { tiles.forEach((t) => t.classList.add('laid')); return; }

  gsap.to(bot, { y: -4, duration: 0.7, ease: 'sine.inOut', repeat: -1, yoyo: true }); // idle bob

  let tl;
  const build = () => {
    if (tl) tl.kill();
    const w = host.clientWidth || 600;
    const step = w / N;
    gsap.set(bot, { x: 0 });
    tiles.forEach((t) => t.classList.remove('laid'));
    tl = gsap.timeline({ repeat: -1, repeatDelay: 2, onRepeat: () => tiles.forEach((t) => t.classList.remove('laid')) });
    tiles.forEach((t, i) => {
      tl.to(bot, { x: i * step, duration: 0.45, ease: 'power1.inOut' }, i * 0.5);
      tl.add(() => t.classList.add('laid'), i * 0.5 + 0.3);
    });
  };
  build();

  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 200); });
}
