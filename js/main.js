// main.js — orchestrator. Loads data, wires Lenis↔ScrollTrigger (non-transform,
// so pins stay valid), boots every section behind the preloader, then reveals.
import { loadData, needsServer } from './lib/data.js';
import { isReducedMotion } from './lib/util.js';
import { initPreloader } from './preloader.js';
import { initStatus } from './status.js';
import { initChangelog } from './changelog.js';
import { initWorkflow } from './workflow.js';
import { initResearch } from './research.js';
import { initGallery } from './gallery.js';
import { initContact } from './contact.js';
import { initRail } from './rail.js';
import { initReveals } from './reveal.js';
import { initHeroAbout } from './heroAbout.js';
import { initCursor } from './cursor.js';

const gsap = window.gsap, ScrollTrigger = window.ScrollTrigger, Flip = window.Flip;
if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger, ...(Flip ? [Flip] : []));
const reduce = isReducedMotion();

let lenis;
function initSmooth() {
  if (reduce || !window.Lenis || !gsap || !ScrollTrigger) return;
  // default Lenis scrolls the real document (NO wrapper transform) → pins stay valid
  lenis = new Lenis({ duration: 1.1, smoothWheel: true, touchMultiplier: 1.4 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

function showServerHint() {
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;inset:auto 0 0 0;z-index:200;background:#0b1422;color:#bcd2e2;font:13px/1.5 ui-monospace,monospace;padding:14px 18px;border-top:1px solid #1f3a52;text-align:center';
  d.innerHTML = '⚠ 直接双击打开会被浏览器拦截本地 JSON。请用本地服务器打开（见 README 的「本地预览」），或访问已部署的网址。';
  document.body.appendChild(d);
}

async function boot(pl) {
  const data = await loadData();
  if (needsServer() && !data.profile) showServerHint();

  const ctx = { data, gsap, ScrollTrigger, Flip, reduce, get lenis() { return lenis; } };

  // 1) render content first so ScrollTrigger measures correct heights.
  //    Each init is isolated — one section throwing can never cascade and halt
  //    the rest (critical on file:// where every data/*.json is null).
  const safe = (name, fn) => {
    try { const r = fn(); if (r && typeof r.then === 'function') r.catch((e) => console.error(`[zima] ${name}:`, e)); }
    catch (e) { console.error(`[zima] ${name}:`, e); }
  };
  safe('status', () => initStatus(ctx));
  safe('changelog', () => initChangelog(ctx));
  safe('workflow', () => initWorkflow(ctx));
  safe('research', () => initResearch(ctx));
  safe('gallery', () => initGallery(ctx));
  safe('contact', () => initContact(ctx));
  safe('heroAbout', () => initHeroAbout(ctx));
  safe('rail', () => initRail(ctx));

  // 2) smooth scroll + reveals
  safe('smooth', () => initSmooth());
  safe('reveals', () => initReveals(ctx));
  safe('cursor', () => initCursor(ctx));

  // 3) refresh once fonts are in (layout shifts otherwise mis-measure pins)
  try { await document.fonts.ready; } catch {}
  ScrollTrigger && ScrollTrigger.refresh();

  // 4) dissolve preloader, then play the hero intro
  await pl.done();
  ctx.heroIntro && ctx.heroIntro();
  ScrollTrigger && ScrollTrigger.refresh();
}

const pl = initPreloader();
// belt-and-suspenders: re-measure pins after every asset has loaded
window.addEventListener('load', () => { ScrollTrigger && ScrollTrigger.refresh(); });
boot(pl);
