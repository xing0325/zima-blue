// changelog.js — the 航行日志 drawer.
import { $$, el, escapeHtml } from './lib/util.js';

function renderEntry(e) {
  const items = (e.items || []).map((i) => el('li', { html: escapeHtml(i) }));
  const stats = [];
  if (e.tokens != null) stats.push(`${e.tokens} tok`);
  if (e.sessionMinutes != null) stats.push(`${e.sessionMinutes} min`);
  if (e.commits != null) stats.push(`${e.commits} commits`);
  return el('div', { class: 'cl-entry' },
    el('div', { class: 'cl-date', text: e.date || '' }),
    el('div', { class: 'cl-title', text: e.title || '' }),
    el('ul', { class: 'cl-items' }, ...items),
    stats.length ? el('div', { class: 'cl-stats', text: stats.join(' · ') }) : null,
  );
}

export function initChangelog(ctx) {
  const cl = ctx.data.changelog;
  const body = document.querySelector('[data-changelog]');
  const foot = document.querySelector('[data-changelog-foot]');
  const drawer = document.getElementById('logDrawer');
  const scrim = document.querySelector('.drawer-scrim');

  if (body && cl?.entries) { body.innerHTML = ''; cl.entries.forEach((e) => body.append(renderEntry(e))); }
  if (foot && cl?.generatedAt) foot.textContent = '自动生成于 ' + cl.generatedAt;

  const open = () => { drawer?.classList.add('is-open'); scrim?.classList.add('is-open'); drawer?.setAttribute('aria-hidden', 'false'); };
  const close = () => { drawer?.classList.remove('is-open'); scrim?.classList.remove('is-open'); drawer?.setAttribute('aria-hidden', 'true'); };

  $$('[data-open-log]').forEach((b) => b.addEventListener('click', open));
  $$('[data-close-log]').forEach((b) => b.addEventListener('click', close));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}
