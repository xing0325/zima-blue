// workflow.js — render the workflow-sharing tiles.
import { el, escapeHtml } from './lib/util.js';

export function initWorkflow(ctx) {
  const host = document.querySelector('[data-workflows]');
  const list = ctx.data.workflows;
  if (!host || !list) return;
  host.innerHTML = '';
  list.forEach((w) => {
    const issue = w.issueUrl
      ? el('a', { class: 'wf-issue', href: w.issueUrl, target: '_blank', rel: 'noopener', text: '给它提 issue ↗' })
      : el('span', { class: 'wf-issue', title: '仓库链接待补', text: '提 issue（待开仓）' });
    host.append(el('div', { class: 'wf-tile', 'data-reveal': true },
      el('span', { class: 'wf-status ' + (w.status === 'planned' ? 'planned' : ''), text: w.status === 'planned' ? '计划中' : '在用' }),
      el('h3', { text: w.title }),
      el('p', { html: escapeHtml(w.blurb) }),
      issue,
    ));
  });
}
