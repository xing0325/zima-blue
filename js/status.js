// status.js — online dot + today's Claude tokens/minutes in the HUD.
import { getStatus } from './lib/api.js';
import { config } from './lib/config.js';
import { fmtNum } from './lib/util.js';

function isOnline(s) {
  if (!s || !s.online || !s.lastSeen) return false;
  return (Date.now() - new Date(s.lastSeen).getTime()) < config.onlineStaleMs;
}

function apply(s) {
  if (!s) return;
  const dot = document.querySelector('[data-online-dot]');
  const label = document.querySelector('[data-online-label]');
  const online = isOnline(s);
  if (dot) dot.classList.toggle('is-online', online);
  if (label) label.textContent = online ? '在线' : '离线';
  const t = document.querySelector('[data-stat="tokens"]');
  const m = document.querySelector('[data-stat="minutes"]');
  if (t) t.textContent = fmtNum(s.today?.tokens || 0);
  if (m) m.textContent = fmtNum(s.today?.sessionMinutes || 0);
}

export async function initStatus(ctx) {
  apply(await getStatus(ctx.data.status));
  // refresh once a minute when a backend is configured
  setInterval(async () => apply(await getStatus(ctx.data.status)), 60_000);
}
