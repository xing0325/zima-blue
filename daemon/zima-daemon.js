#!/usr/bin/env node
/* =====================================================================
   zima-daemon.js — chichu 的「电子大脑」桥
   一个常驻在你电脑上的小脚本，干三件事：
     1) 心跳        → 每分钟更新在线状态（写 data/status.json，并可 POST 给后端）
     2) Claude 用量 → 读 ~/.claude 里今天的 token 与时长
     3) 自动日志    → 每天凌晨 2 点(北京)汇总当天 git 提交 + 用量，写入 changelog
   全部「尽力而为」，格式对不上时安静降级。

   运行：  node daemon/zima-daemon.js
   手动出日志： node daemon/zima-daemon.js --changelog
   只刷状态：   node daemon/zima-daemon.js --status

   可配置的环境变量（都可不填）：
     ZIMA_API     后端 Worker 地址，如 https://zima-api.xing0325.workers.dev
     ZIMA_SECRET  心跳密钥（与 Worker 的 HEARTBEAT_SECRET 一致）
     ZIMA_REPOS   要统计提交的仓库路径，多个用 ; (win) / : (unix) 分隔；默认本仓库
     ZIMA_PUSH    设为 1 时，出完日志自动 git commit+push（更新 GitHub Pages）
     CLAUDE_CONFIG_DIR  Claude 配置目录，默认 ~/.claude
   ===================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data');

const CFG = {
  apiBase: (process.env.ZIMA_API || '').replace(/\/$/, ''),
  secret: process.env.ZIMA_SECRET || '',
  claudeDir: process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude'),
  repos: (process.env.ZIMA_REPOS || ROOT).split(path.delimiter).filter(Boolean),
  pushChangelog: process.env.ZIMA_PUSH === '1',
  tz: 'Asia/Shanghai',
  heartbeatMs: 60_000,
};

const dayOf = (d) => new Date(d).toLocaleDateString('en-CA', { timeZone: CFG.tz }); // YYYY-MM-DD
const today = () => dayOf(Date.now());

// ---------- Claude usage ----------
function readClaudeUsage() {
  const out = { tokens: 0, sessionMinutes: 0, sessions: 0, messages: 0 };
  const root = path.join(CFG.claudeDir, 'projects');
  if (!fs.existsSync(root)) return out;
  const t = today();
  const sessions = new Set();
  let minTs = Infinity, maxTs = -Infinity;

  const scan = (fp) => {
    let txt; try { txt = fs.readFileSync(fp, 'utf8'); } catch { return; }
    for (const line of txt.split('\n')) {
      if (!line.trim()) continue;
      let o; try { o = JSON.parse(line); } catch { continue; }
      const ts = o.timestamp || o.time || o.ts;
      if (!ts || dayOf(ts) !== t) continue;
      const u = o.message?.usage || o.usage;
      if (u) out.tokens += (u.input_tokens || 0) + (u.output_tokens || 0);
      out.messages++;
      sessions.add(o.sessionId || o.session_id || fp);
      const ms = new Date(ts).getTime();
      if (ms < minTs) minTs = ms; if (ms > maxTs) maxTs = ms;
    }
  };
  const walk = (dir) => {
    let ents; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      const fp = path.join(dir, e.name);
      if (e.isDirectory()) walk(fp);
      else if (e.name.endsWith('.jsonl')) scan(fp);
    }
  };
  walk(root);
  out.sessions = sessions.size;
  out.sessionMinutes = maxTs > minTs ? Math.round((maxTs - minTs) / 60000) : 0;
  return out;
}

// ---------- git ----------
function gitToday(repo) {
  try {
    const since = `${today()}T00:00:00`;
    const out = execSync(`git -C "${repo}" log --since="${since}" --pretty=format:%s`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return out.split('\n').map((s) => s.trim()).filter(Boolean);
  } catch { return []; }
}
const commitsToday = () => CFG.repos.reduce((n, r) => n + gitToday(r).length, 0);

// ---------- status ----------
function readPrev() { try { return JSON.parse(fs.readFileSync(path.join(DATA, 'status.json'), 'utf8')); } catch { return {}; } }

function writeStatus(online) {
  const usage = readClaudeUsage();
  const prev = readPrev();
  const status = {
    _note: '由本地 daemon 更新；未运行时前端按 lastSeen 判定为离线。',
    online,
    lastSeen: new Date().toISOString(),
    today: { date: today(), tokens: usage.tokens, sessionMinutes: usage.sessionMinutes, commits: commitsToday() },
    streakDays: prev.streakDays || 0,
  };
  try { fs.writeFileSync(path.join(DATA, 'status.json'), JSON.stringify(status, null, 2) + '\n'); } catch (e) { console.error('write status failed', e.message); }
  return status;
}

async function postHeartbeat(status) {
  if (!CFG.apiBase) return;
  try {
    await fetch(CFG.apiBase + '/api/heartbeat', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-zima-secret': CFG.secret },
      body: JSON.stringify(status),
    });
  } catch { /* offline — fine */ }
}

// ---------- changelog ----------
function generateChangelog() {
  const date = today();
  const usage = readClaudeUsage();
  const items = [];
  for (const r of CFG.repos) for (const s of gitToday(r)) if (!items.includes(s)) items.push(s);
  const entry = {
    date,
    title: `${date} 的进展`,
    items: items.length ? items : ['(今天还没有 git 提交记录)'],
    tokens: usage.tokens || null,
    sessionMinutes: usage.sessionMinutes || null,
    commits: items.length,
  };
  const file = path.join(DATA, 'changelog.json');
  let cl; try { cl = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { cl = { entries: [] }; }
  cl.entries = (cl.entries || []).filter((e) => e.date !== date);
  cl.entries.unshift(entry);
  cl.generatedAt = new Date().toISOString();
  try { fs.writeFileSync(file, JSON.stringify(cl, null, 2) + '\n'); } catch (e) { console.error('write changelog failed', e.message); }
  if (CFG.pushChangelog) pushRepo(`chore(changelog): ${date}`);
  return entry;
}
function pushRepo(msg) {
  try {
    execSync(`git -C "${ROOT}" add data/changelog.json data/status.json`, { stdio: 'ignore' });
    execSync(`git -C "${ROOT}" commit -m "${msg}"`, { stdio: 'ignore' });
    execSync(`git -C "${ROOT}" push`, { stdio: 'ignore' });
    console.log('[zima] pushed changelog');
  } catch (e) { console.error('[zima] push failed:', e.message); }
}

// ---------- 2am scheduler ----------
function msUntilNext2am() {
  // current wall-clock in Beijing
  const now = new Date();
  const bj = new Date(now.toLocaleString('en-US', { timeZone: CFG.tz }));
  const next = new Date(bj);
  next.setHours(2, 0, 0, 0);
  if (next <= bj) next.setDate(next.getDate() + 1);
  return next.getTime() - bj.getTime();
}
function scheduleDaily() {
  const wait = msUntilNext2am();
  console.log(`[zima] next changelog in ${(wait / 3600000).toFixed(1)}h (02:00 ${CFG.tz})`);
  setTimeout(() => { console.log('[zima] auto changelog…', generateChangelog().title); scheduleDaily(); }, wait);
}

// ---------- entry ----------
const arg = process.argv[2];
if (arg === '--changelog') { console.log(JSON.stringify(generateChangelog(), null, 2)); process.exit(0); }
if (arg === '--status') { console.log(JSON.stringify(writeStatus(true), null, 2)); process.exit(0); }

console.log('[zima] daemon up. heartbeat every', CFG.heartbeatMs / 1000, 's. api:', CFG.apiBase || '(none — local only)');
postHeartbeat(writeStatus(true));
setInterval(() => postHeartbeat(writeStatus(true)), CFG.heartbeatMs);
scheduleDaily();

const bye = () => { console.log('\n[zima] going offline…'); postHeartbeat(writeStatus(false)).finally(() => process.exit(0)); setTimeout(() => process.exit(0), 800); };
process.on('SIGINT', bye);
process.on('SIGTERM', bye);
