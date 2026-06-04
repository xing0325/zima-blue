// research.js — render the research-topic cards.
import { el, escapeHtml } from './lib/util.js';

export function initResearch(ctx) {
  const host = document.querySelector('[data-research]');
  const list = ctx.data.research;
  if (!host || !list) return;
  host.innerHTML = '';
  list.forEach((r, i) => {
    const open = r.demo
      ? el('a', { class: 'rs-open', href: r.demo, target: '_blank', rel: 'noopener', text: '打开 demo' })
      : el('span', { class: 'rs-open', text: 'demo 制作中' });
    host.append(el('article', { class: 'rs-card', 'data-reveal': true },
      el('span', { class: 'rs-idx', text: String(i + 1).padStart(2, '0') }),
      el('h3', { text: r.title }),
      el('p', { class: 'rs-q', html: escapeHtml(r.question) }),
      open,
    ));
  });
}
