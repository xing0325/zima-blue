// api.js — backend client with graceful fallbacks.
// When config.apiBase is empty (no Worker yet) every call degrades gracefully:
//   status   → use local status.json
//   messages → local-echo only (your ripple shows, not persisted)
//   蹲蹲      → optimistic + localStorage so the count still moves
//   waitlist → reports offline
import { config } from './config.js';

const base = () => (config.apiBase || '').replace(/\/$/, '');

async function jget(path) {
  const r = await fetch(base() + path, { cache: 'no-store' });
  if (!r.ok) throw new Error(r.status);
  return r.json();
}
async function jpost(path, body) {
  const r = await fetch(base() + path, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(r.status);
  return r.json();
}

export async function getStatus(fallback) {
  if (base()) { try { return await jget('/api/status'); } catch {} }
  return fallback;
}

export async function getMessages() {
  if (base()) { try { return (await jget('/api/messages')).messages || []; } catch {} }
  return [];
}

export async function postMessage(text) {
  if (base()) { try { return await jpost('/api/messages', { text }); } catch {} }
  return { ok: false, offline: true };
}

// ---- 蹲蹲 (anticipate) — optimistic local state, backend authoritative when present ----
export function localDudu() {
  try { return JSON.parse(localStorage.getItem(config.duduStorageKey)) || {}; } catch { return {}; }
}
function saveLocalDudu(m) { try { localStorage.setItem(config.duduStorageKey, JSON.stringify(m)); } catch {} }

export function hasDudu(id) { return !!localDudu()[id]; }

export async function toggleDudu(id) {
  const mine = localDudu();
  const next = !mine[id];
  mine[id] = next; saveLocalDudu(mine);
  if (base()) { try { const r = await jpost('/api/dudu', { id, on: next }); return { ok: true, on: next, count: r.count }; } catch {} }
  return { ok: true, offline: true, on: next };
}

export async function joinWaitlist(id, email) {
  if (base()) { try { return await jpost('/api/waitlist', { id, email }); } catch {} }
  return { ok: false, offline: true };
}
