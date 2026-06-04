// util.js — tiny DOM + format helpers
export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function el(tag, props = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (v !== null && v !== undefined && v !== false) node.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) {
    if (kid == null) continue;
    node.append(kid.nodeType ? kid : document.createTextNode(kid));
  }
  return node;
}

export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const lerp  = (a, b, t) => a + (b - a) * t;

export function fmtNum(n) {
  if (n == null) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(n >= 10_000 ? 0 : 1) + 'k';
  return String(n);
}

export function escapeHtml(s = '') {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// wrap each line of text in <span class="line-mask"><span class="ln">…</span></span>
export function maskLines(host, lines) {
  host.innerHTML = '';
  for (const line of lines) {
    const mask = el('div', { class: 'line-mask' });
    const ln = el('div', { class: 'ln', html: line });
    mask.append(ln);
    host.append(mask);
  }
  return $$('.ln', host);
}

export const isReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
