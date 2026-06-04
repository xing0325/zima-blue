/* =====================================================================
   zima-api — Cloudflare Worker (free tier) backing the live features.
   Routes:
     GET  /api/status     → latest heartbeat (online computed from freshness)
     POST /api/heartbeat  → daemon pushes status   (needs x-zima-secret)
     GET  /api/messages   → recent public messages
     POST /api/messages   → {text}  add a ripple
     POST /api/dudu       → {id,on} 蹲蹲 increment/decrement → {count}
     POST /api/waitlist   → {id,email} notify-me list
   Storage: one KV namespace bound as ZIMA. (Low-traffic personal site →
   KV's eventual consistency & read-modify-write on 'messages' is fine;
   upgrade to D1 if it ever gets busy.)
   ===================================================================== */
const JSONH = { 'content-type': 'application/json; charset=utf-8' };
const MAX_MSG_LEN = 80;
const MAX_MESSAGES = 200;

const cors = (env) => ({
  'access-control-allow-origin': env.ALLOW_ORIGIN || '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type,x-zima-secret',
  'access-control-max-age': '86400',
});
const json = (env, obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { ...JSONH, ...cors(env) } });

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors(env) });
    try {
      const { pathname } = url;
      if (pathname === '/api/status' && req.method === 'GET') return status(env);
      if (pathname === '/api/heartbeat' && req.method === 'POST') return heartbeat(req, env);
      if (pathname === '/api/messages' && req.method === 'GET') return getMessages(env);
      if (pathname === '/api/messages' && req.method === 'POST') return postMessage(req, env);
      if (pathname === '/api/dudu' && req.method === 'POST') return dudu(req, env);
      if (pathname === '/api/waitlist' && req.method === 'POST') return waitlist(req, env);
      return json(env, { error: 'not found' }, 404);
    } catch (e) {
      return json(env, { error: String(e?.message || e) }, 500);
    }
  },
};

async function status(env) {
  const raw = await env.ZIMA.get('status');
  const s = raw ? JSON.parse(raw) : { online: false, lastSeen: null, today: { date: '', tokens: 0, sessionMinutes: 0, commits: 0 } };
  const fresh = s.lastSeen && (Date.now() - new Date(s.lastSeen).getTime() < 4 * 60 * 1000);
  s.online = !!(s.online && fresh);
  return json(env, s);
}

async function heartbeat(req, env) {
  if ((req.headers.get('x-zima-secret') || '') !== (env.HEARTBEAT_SECRET || '\0')) return json(env, { error: 'unauthorized' }, 401);
  const body = await req.json();
  await env.ZIMA.put('status', JSON.stringify(body));
  return json(env, { ok: true });
}

async function getMessages(env) {
  const raw = await env.ZIMA.get('messages');
  const list = raw ? JSON.parse(raw) : [];
  return json(env, { messages: list.slice(-50) });
}

async function postMessage(req, env) {
  const { text } = await req.json().catch(() => ({}));
  const t = (text || '').toString().trim().slice(0, MAX_MSG_LEN);
  if (!t) return json(env, { error: 'empty' }, 400);
  const raw = await env.ZIMA.get('messages');
  const list = raw ? JSON.parse(raw) : [];
  list.push({ text: t, ts: Date.now() });
  while (list.length > MAX_MESSAGES) list.shift();
  await env.ZIMA.put('messages', JSON.stringify(list));
  return json(env, { ok: true });
}

async function dudu(req, env) {
  const { id, on } = await req.json().catch(() => ({}));
  if (!id) return json(env, { error: 'no id' }, 400);
  const key = 'dudu:' + String(id).slice(0, 64);
  let n = parseInt((await env.ZIMA.get(key)) || '0', 10) || 0;
  n = Math.max(0, n + (on ? 1 : -1));
  await env.ZIMA.put(key, String(n));
  return json(env, { ok: true, count: n });
}

async function waitlist(req, env) {
  const { id, email } = await req.json().catch(() => ({}));
  if (!id || !/.+@.+\..+/.test(email || '')) return json(env, { error: 'bad request' }, 400);
  await env.ZIMA.put(`wait:${String(id).slice(0, 64)}:${email.slice(0, 120)}`, JSON.stringify({ ts: Date.now() }));
  return json(env, { ok: true });
}
