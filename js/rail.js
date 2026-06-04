// rail.js — right-side section dots + scrollspy + smooth anchor scroll.
export function initRail(ctx) {
  const rail = document.querySelector('[data-rail]');
  if (!rail) return;
  const sections = [
    ['hero-about', '宇宙'], ['gallery', '星图'], ['workflow', '工作流'], ['research', '课题'], ['contact', '瓷砖'],
  ];
  rail.innerHTML = '';
  sections.forEach(([id, label]) => {
    const a = document.createElement('a');
    a.href = '#' + id; a.title = label; a.dataset.target = id;
    rail.append(a);
  });

  const { ScrollTrigger } = ctx;
  sections.forEach(([id]) => {
    const sec = document.getElementById(id);
    if (!sec || !ScrollTrigger) return;
    ScrollTrigger.create({
      trigger: sec, start: 'top center', end: 'bottom center',
      onToggle: (self) => {
        const dot = rail.querySelector(`[data-target="${id}"]`);
        if (dot) dot.classList.toggle('is-active', self.isActive);
      },
    });
  });

  rail.addEventListener('click', (e) => {
    const a = e.target.closest('a'); if (!a) return;
    e.preventDefault();
    const sec = document.getElementById(a.dataset.target); if (!sec) return;
    if (ctx.lenis) ctx.lenis.scrollTo(sec); else sec.scrollIntoView({ behavior: 'smooth' });
  });
}
