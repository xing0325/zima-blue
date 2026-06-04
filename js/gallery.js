// gallery.js — project constellation: canvas force-graph + 蹲蹲 board + detail overlay.
import { el, escapeHtml } from './lib/util.js';
import { toggleDudu, hasDudu, joinWaitlist } from './lib/api.js';

const hexA = (hex, a) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((x) => x + x).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

export function initGallery(ctx) {
  const data = ctx.data.projects;
  const canvas = document.querySelector('[data-graph]');
  if (!data || !canvas) return;
  const wrap = canvas.parentElement;
  const c = canvas.getContext('2d');
  const groups = data.groups || {};
  const reduce = ctx.reduce;

  const radius = (s) => (s >= 3 ? 26 : s >= 2 ? 17 : 11);
  const nodes = data.nodes.map((n, i) => ({
    ...n, r: radius(n.size || 1),
    x: Math.cos(i * 1.1) * 130 + (Math.random() * 30 - 15),
    y: Math.sin(i * 1.7) * 105 + (Math.random() * 30 - 15),
    vx: 0, vy: 0,
    color: groups[n.group]?.color || '#1FA2D6',
  }));
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const edges = (data.edges || []).map((e) => ({ a: byId[e.from], b: byId[e.to] })).filter((e) => e.a && e.b);
  nodes.forEach((n) => { if (n.parent && byId[n.parent]) edges.push({ a: byId[n.parent], b: n, soft: true }); });

  let W = 0, H = 0, dpr = 1;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = wrap.clientWidth; H = wrap.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize(); window.addEventListener('resize', resize);

  const view = { x: 0, y: 0 };
  let dragging = false, moved = false, last = null, downNode = null, hover = null;

  function step() {
    for (const n of nodes) { n.vx += (-n.x) * 0.0009; n.vy += (-n.y) * 0.0009; }
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      let dx = a.x - b.x, dy = a.y - b.y; const d2 = dx * dx + dy * dy || 0.01, d = Math.sqrt(d2);
      const min = a.r + b.r + 50, f = (min * min) / d2 * 0.02, ux = dx / d, uy = dy / d;
      a.vx += ux * f; a.vy += uy * f; b.vx -= ux * f; b.vy -= uy * f;
    }
    for (const e of edges) {
      let dx = e.b.x - e.a.x, dy = e.b.y - e.a.y; const d = Math.hypot(dx, dy) || 0.01;
      const rest = e.soft ? 72 : 132, f = (d - rest) * 0.012, ux = dx / d, uy = dy / d;
      e.a.vx += ux * f; e.a.vy += uy * f; e.b.vx -= ux * f; e.b.vy -= uy * f;
    }
    for (const n of nodes) { n.vx *= 0.85; n.vy *= 0.85; n.x += n.vx; n.y += n.vy; }
  }

  const nodeAt = (px, py) => {
    const mx = px - W / 2 - view.x, my = py - H / 2 - view.y;
    let best = null, bd = 1e9;
    for (const n of nodes) { const d = Math.hypot(mx - n.x, my - n.y); if (d < n.r + 8 && d < bd) { bd = d; best = n; } }
    return best;
  };

  function draw(t) {
    c.clearRect(0, 0, W, H);
    c.save(); c.translate(W / 2 + view.x, H / 2 + view.y);
    c.lineWidth = 1;
    for (const e of edges) {
      c.strokeStyle = e.soft ? 'rgba(127,180,220,.10)' : 'rgba(127,180,220,.18)';
      c.beginPath(); c.moveTo(e.a.x, e.a.y); c.lineTo(e.b.x, e.b.y); c.stroke();
    }
    for (const n of nodes) {
      const active = n.status === 'active' || n.status === 'wip';
      const pulse = active && !reduce ? 0.6 + 0.4 * Math.sin(t / 600 + n.x * 0.05) : 1;
      c.beginPath(); c.arc(n.x, n.y, n.r + (active ? 6 * pulse : 2), 0, Math.PI * 2);
      c.fillStyle = hexA(n.color, active ? 0.16 * pulse : 0.07); c.fill();
      c.beginPath(); c.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      c.fillStyle = n.status === 'planned' ? 'rgba(127,180,220,.16)' : hexA(n.color, 0.92); c.fill();
      if (n.status === 'planned') { c.lineWidth = 1.4; c.setLineDash([4, 4]); c.strokeStyle = hexA(n.color, 0.7); c.stroke(); c.setLineDash([]); }
      if (hover === n) { c.lineWidth = 2; c.strokeStyle = '#fff'; c.stroke(); }
      if (n.size >= 3 || hover === n) {
        c.font = '12px "Space Grotesk", sans-serif';
        c.fillStyle = hover === n ? '#fff' : 'rgba(220,238,250,.82)';
        c.textAlign = 'center'; c.fillText(n.label, n.x, n.y + n.r + 15);
      }
    }
    c.restore();
  }

  for (let i = 0; i < 130; i++) step();
  (function loop(t) { if (!reduce) step(); draw(t || 0); requestAnimationFrame(loop); })(0);

  canvas.addEventListener('pointerdown', (e) => {
    dragging = true; moved = false; last = { x: e.clientX, y: e.clientY };
    const rect = canvas.getBoundingClientRect();
    downNode = nodeAt(e.clientX - rect.left, e.clientY - rect.top);
    try { canvas.setPointerCapture(e.pointerId); } catch {}
  });
  canvas.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    hover = nodeAt(e.clientX - rect.left, e.clientY - rect.top);
    canvas.style.cursor = hover ? 'pointer' : 'grab';
    if (dragging && last) {
      const dx = e.clientX - last.x, dy = e.clientY - last.y;
      if (Math.hypot(dx, dy) > 3) moved = true;
      view.x += dx; view.y += dy; last = { x: e.clientX, y: e.clientY };
    }
  });
  canvas.addEventListener('pointerup', () => { dragging = false; if (!moved && downNode) openDetail(downNode); last = null; });
  canvas.addEventListener('pointerleave', () => { hover = null; });

  // ---- 蹲蹲 board ----
  const boardList = document.querySelector('[data-dudu-list]');
  const duduCount = (n) => (n.anticipate || 0) + (hasDudu(n.id) ? 1 : 0);
  function renderBoard() {
    if (!boardList) return; boardList.innerHTML = '';
    [...nodes].filter((n) => !n.parent).sort((a, b) => duduCount(b) - duduCount(a)).slice(0, 6)
      .forEach((n, i) => boardList.append(el('li', { class: 'dudu-item', onClick: () => openDetail(n) },
        el('span', { class: 'dudu-rank', text: String(i + 1).padStart(2, '0') }),
        el('span', { class: 'dudu-name', text: n.label }),
        el('span', { class: 'dudu-count', text: String(duduCount(n)) }),
      )));
  }
  renderBoard();

  // ---- detail overlay ----
  const overlay = document.querySelector('[data-project-detail]');
  const closeDetail = () => { overlay.classList.remove('is-open'); overlay.setAttribute('aria-hidden', 'true'); overlay.innerHTML = ''; };
  function buildActions(n) {
    const wrap = el('div', { class: 'pd-actions' });
    const heart = el('button', { class: 'btn btn-dudu' + (hasDudu(n.id) ? ' is-done' : ''), text: `蹲蹲 ♥ ${duduCount(n)}` });
    heart.addEventListener('click', async () => {
      await toggleDudu(n.id);
      heart.classList.toggle('is-done', hasDudu(n.id));
      heart.textContent = `蹲蹲 ♥ ${duduCount(n)}`; renderBoard();
    });
    wrap.append(heart);
    if (n.repo) wrap.append(el('a', { class: 'btn', href: n.repo, target: '_blank', rel: 'noopener', text: '看代码 ↗' }));
    if (n.status === 'planned' || n.status === 'wip') {
      const email = el('input', { class: 'msg-input', placeholder: '留邮箱，做完通知你', style: 'max-width:200px' });
      const join = el('button', { class: 'btn', text: '通知我' });
      join.addEventListener('click', async () => {
        const v = (email.value || '').trim();
        if (!/.+@.+\..+/.test(v)) { email.focus(); return; }
        const r = await joinWaitlist(n.id, v);
        join.textContent = r.offline ? '已记下(本地)' : '已加入 ✓'; email.disabled = true;
      });
      wrap.append(email, join);
    }
    return wrap;
  }
  function openDetail(n) {
    if (!overlay) return;
    const statusText = { active: '活跃更新', wip: '进行中', planned: '计划中', paused: '暂停' }[n.status] || n.status || '';
    const card = el('div', { class: 'pd-card' },
      el('button', { class: 'pd-close', onClick: closeDetail, 'aria-label': '关闭', text: '✕' }),
      el('div', { class: 'pd-top' },
        el('span', { class: 'pd-status ' + (n.status || ''), text: statusText }),
        el('span', { class: 'label', text: groups[n.group]?.label || '' }),
      ),
      el('h3', { class: 'pd-title', text: n.label }),
      el('p', { class: 'pd-summary', html: escapeHtml(n.summary || '') }),
      buildActions(n),
    );
    overlay.innerHTML = ''; overlay.append(card);
    overlay.classList.add('is-open'); overlay.setAttribute('aria-hidden', 'false');
    if (!ctx.reduce && ctx.gsap) ctx.gsap.from(card, { y: 24, opacity: 0, duration: 0.45, ease: 'power3.out' });
  }
  overlay?.addEventListener('click', (e) => { if (e.target === overlay) closeDetail(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDetail(); });
}
