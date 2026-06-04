// contact.js — the final tile, contacts, and the water-ripple message board.
import { el } from './lib/util.js';
import { getMessages, postMessage } from './lib/api.js';

export function initContact(ctx) {
  renderContacts(ctx);
  initRipples(ctx);
}

function renderContacts(ctx) {
  const host = document.querySelector('[data-contacts]');
  const p = ctx.data.profile;
  if (!host || !p?.contacts) return;
  host.innerHTML = '';
  p.contacts.forEach((cn) => {
    const label = `${cn.label}${cn.handle ? ' · ' + cn.handle : ''}`;
    const valid = cn.url && cn.url !== 'mailto:';
    host.append(el('li', {},
      valid
        ? el('a', { href: cn.url, target: '_blank', rel: 'noopener', text: label })
        : el('a', { href: '#', title: '链接待补', text: label, onClick: (e) => e.preventDefault() }),
    ));
  });
}

function initRipples(ctx) {
  const canvas = document.querySelector('[data-ripples]');
  if (!canvas) return;
  const stage = canvas.closest('.tile-stage') || canvas.parentElement;
  const c = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = stage.clientWidth; H = stage.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize(); window.addEventListener('resize', resize);

  const ripples = [];
  const spawn = (x, y, text) => ripples.push({ x, y, r: 6, max: 130 + Math.random() * 80, text: text || null });

  let last = 0;
  (function loop(t) {
    c.clearRect(0, 0, W, H);
    if (!ctx.reduce && t - last > 2400) { last = t; spawn(Math.random() * W, H * 0.34 + Math.random() * H * 0.42); }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rp = ripples[i]; rp.r += 1.35;
      const a = Math.max(0, 1 - rp.r / rp.max);
      c.beginPath(); c.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
      c.strokeStyle = `rgba(160,224,255,${a * 0.5})`; c.lineWidth = 1.4; c.stroke();
      if (rp.text) {
        c.font = '14px "Space Grotesk", sans-serif';
        c.fillStyle = `rgba(230,246,255,${a})`; c.textAlign = 'center';
        c.fillText(rp.text, rp.x, rp.y - rp.r - 8);
      }
      if (a <= 0) ripples.splice(i, 1);
    }
    requestAnimationFrame(loop);
  })(0);

  getMessages().then((msgs) => {
    (msgs || []).slice(-12).forEach((m, i) =>
      setTimeout(() => spawn(W * (0.2 + Math.random() * 0.6), H * (0.3 + Math.random() * 0.4), m.text), i * 300));
  });

  const form = document.querySelector('[data-msg-form]');
  const input = document.querySelector('[data-msg-input]');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = (input.value || '').trim();
    if (!text) return;
    spawn(W / 2, H * 0.55, text);
    input.value = '';
    await postMessage(text); // persists when backend present; local-echo otherwise
  });
}
