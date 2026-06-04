# Zima Blue — GSAP / ScrollTrigger / Lenis Technique Playbook

A code-level build guide for a moody, minimal, cosmic "Zima Blue" scroll site in **vanilla JS + GSAP**. Every snippet is copy-pasteable. Where the research could only infer something (e.g. from a minified production bundle), it is flagged **[inference]** and the honest limits are stated.

The centerpiece is a **hero → about transition built as ONE pinned, scrubbed timeline** where the first screen shrinks, the background blooms from near-black to bright Zima blue `#1FA2D6`, and a handwritten SVG signature draws itself — **all progressing simultaneously over the same scroll range**.

---

## 0. What the reference site (landonorris.com) actually does — and what we copy

We reverse-engineered the official **Lando Norris** site (built by studio **OFF+BRAND**, `itsoffbrand.com`) as the north star for this effect. Honest summary of confirmed vs. inferred:

**Confirmed stack** (from raw HTML + grepping the `~1.46 MB` `lando-by-OFF+BRAND.js` rspack bundle, and corroborated by Awwwards/landing.love/the studio case study):

- **Webflow** site shell + **jQuery 3.5.1** (Webflow's dependency).
- **GSAP** core + **ScrollTrigger** (`scrub:true`, `pin`, `ScrollTrigger.scrollerProxy`) + **SplitText** + **DrawSVGPlugin 3.13.0** (registered).
- **Lenis** is the actual smooth-scroll driver — `window.lenis`, `window.lenis.on("scroll", ...)` wired to `ScrollTrigger.update`, `gsap.ticker` pumping `lenis.raf`. **ScrollSmoother is bundled but never `.create()`d** (dead dependency).
- **Three.js** + **ogl** — two WebGL stacks; the hero "head scene" (`window.landoGL`) is a custom shader renderer with `REVEAL_SIZE` and `COLOR_BACKGROUND` uniforms.
- **Rive** — pervasive (signature, helmet, circuits, hamburger, page transitions). The signature is a Rive artboard `data-rive-file="signature"` with `signature_play` (intro) and `signature_scroll` (scroll-scrubbed) state machines. There is also a static SVG fallback (`..._ln4-hw-signature2.svg`) and DrawSVG is registered.
- **Not present:** Locomotive, Barba, Swiper, Lottie.

**How the hero → screen-2 transition is built** [confirmed mechanism, inferred shader math]: multiple `scrub:true` ScrollTriggers all keyed to the **same trigger** `[data-gl-track="head"]`, with `start`/`end` computed from the WebGL viewport height (`start:"top top", end:"top+=" + gl.sizes.height`). On that single screen-height of scroll, **simultaneously**: the hero "shrinks/reveals" via the shader `REVEAL_SIZE` uniform (a WebGL reveal, **not** a CSS `scale:` on the DOM hero), `document.body.style.backgroundColor` crossfades through a palette while the WebGL `COLOR_BACKGROUND` uniform also crossfades, the nav theme flips light→dark, and the Rive `signature_scroll` draws. They are **separate ScrollTrigger instances sharing one trigger**, not one literal `gsap.timeline()` — but the perceived effect is a single synchronized scroll transition.

**Preloader** [confirmed gating, inferred visual]: a **Rive-gated** preloader counts Rive files, logs `"<n> Rive files to preload"`, and sets `window.loadingComplete = true` on completion. Hero animations are hard-gated behind it. The exact visual (counter vs. bar vs. curtain) is **not determinable from the minified bundle**.

**Honest limitations:** the bundle is minified (single-letter identifiers), so the exact "shrink" shader math, whether DrawSVG strokes a second signature, and the preloader's visual style are inferred, not certain. OFF+BRAND has **not** published a code-level breakdown; the deepest third-party detail lives in YouTube breakdowns whose transcripts were not machine-fetchable.

**Our adaptation:** we cannot ship a custom WebGL shader pipeline + Rive for a vanilla starter, and we don't need to. We reproduce the *perceived* effect with pure GSAP/CSS/SVG: **CSS `scale` on an inner wrapper** for the shrink, a **`backgroundColor` tween** for the bloom, and **DrawSVG (or native dashoffset)** for the signature — all on **one `gsap.timeline()`** at position `0` so they are genuinely simultaneous. Swap in Rive/WebGL later if desired.

Sources: `https://www.itsoffbrand.com/our-work/lando-norris` · `https://www.awwwards.com/sites/lando-norris` · `https://www.landing.love/sites/landonorris/` · `https://landonorris.com/` · live bundle `https://assets.itsoffbrand.io/lando/dev-js/lando-by-OFF+BRAND.js`.

---

## 1. The hero → about transition — ONE pinned, scrubbed timeline (the core)

### Why it works (two GSAP facts that drive the whole design)

1. **With `scrub`, tween durations are proportions, not seconds.** When a timeline is controlled by a scrubbed ScrollTrigger, GSAP ignores wall-clock time. The timeline's *total* duration is mapped linearly onto the scroll distance between `start` and `end`. Each child tween's `duration` is its **share of that scroll distance**; its **position parameter** decides *when* it plays. Two tweens added at position `0`, each `duration: 1`, run **fully in parallel** across 100% of the scroll. This is the entire secret to "simultaneous, not phased."
2. **`pin: true` wraps the element in a `pin-spacer`.** ScrollTrigger immediately wraps the pinned element in a `div.pin-spacer` of matching width/height that props open the layout, while the real element is held via `position: fixed`. This is exactly why a transformed ancestor breaks pinning (see §2).

**The mistake that causes "phased / mechanical scroll":** using three *separate* ScrollTriggers, or different `duration`/position values, or leaving an easing on scrubbed tweens. Put **all three effects on ONE timeline, at position `0`, with equal `duration`, `ease:"none"`.** One playhead, driven by scroll, advances them together.

### HTML

```html
<!-- Pin/trigger element is .hero. The SCALING target is an INNER wrapper, never the
     pinned node itself — ScrollTrigger applies its own transforms to the pinned node,
     and a competing scale on it makes the pin jump. -->
<section class="hero" id="hero">
  <div class="hero__inner">
    <h1 class="hero__title">ZIMA</h1>

    <!-- fill="none" + real stroke is mandatory for a "draw" effect -->
    <svg class="sig" viewBox="0 0 600 200" fill="none" aria-hidden="true">
      <path class="sig__path"
            d="M20 120 C 80 20, 160 200, 240 100 S 420 0, 580 120"
            stroke="#ffffff" stroke-width="4"
            stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>
</section>

<section class="about" id="about">
  <p>…the second screen…</p>
</section>
```

### CSS

```css
:root {
  --zima:   #1FA2D6;   /* bright Zima blue — bloom END color  */
  --void:   #07080a;   /* near-black       — bloom START color */
  --ink:    #ffffff;
}

/* Do NOT put height:100% or overflow on html/body — it creates a second scroll
   context and the pin will not engage (see §2, failure #2). */
html, body { margin: 0; }
body { background: var(--void); color: var(--ink); }

.hero {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background-color: var(--void);   /* this is what we bloom to --zima */
  /* No transform / will-change / filter / perspective on .hero or ANY ancestor.
     Any of those breaks position:fixed pinning. */
}

.hero__inner {
  transform-origin: center center;
  will-change: transform;          /* will-change goes on the ANIMATED CHILD only */
  text-align: center;
}

.hero__title { font-size: clamp(4rem, 18vw, 16rem); margin: 0 0 2rem; }
.sig { width: min(70vw, 600px); height: auto; }

.about { min-height: 100vh; display: grid; place-items: center; background: var(--zima); }

@media (prefers-reduced-motion: reduce) {
  .hero__inner { will-change: auto; }
}
```

### JS — the single timeline

```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin"; // free since Apr 30 2025

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

function buildHeroTransition() {
  // ONE timeline, ONE ScrollTrigger.
  const tl = gsap.timeline({
    defaults: { ease: "none" },          // linear => scrub feels 1:1 with scroll
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "+=1200",                     // scroll distance the pin lasts (px) — tune freely
      scrub: 1,                          // 1 = ~1s inertial catch-up; `true` = hard lock
      pin: true,                         // pins .hero, wraps it in .pin-spacer
      anticipatePin: 1,                  // kills a 1-frame jump on fast scroll
      invalidateOnRefresh: true,         // recompute values on refresh/resize
      // markers: true,                  // DEV ONLY — turn on to see start/end
    },
  });

  // ALL THREE at position 0, EQUAL duration => genuinely simultaneous over 0%→100%.
  tl.to(".hero__inner", { scale: 0.6, duration: 1 }, 0)                       // 1) SHRINK
    .to(".hero",        { backgroundColor: "#1FA2D6", duration: 1 }, 0)       // 2) BLOOM
    .fromTo(".sig__path", { drawSVG: "0%" },                                  // 3) SIGNATURE
                          { drawSVG: "100%", duration: 1 }, 0);

  return tl;
}
```

> **Why this is simultaneous and not phased:** identical `duration: 1`, identical position `0`, `ease:"none"`. The shrink, the color bloom, and the draw all start at scroll-progress 0 and finish at scroll-progress 1, locked to the same playhead. If yours currently "feels phased," it is almost always because the three effects live on different triggers, or have different durations/positions, or carry an ease. (See the summary fixes.)

### Tuning relative timing (only if you deliberately want offset beats)

Durations/positions are proportions, so to make the signature finish in the **first 60 %** while the shrink runs the **whole** time:

```js
tl.to(".hero__inner", { scale: 0.6, duration: 1 }, 0)                  // 0% → 100%
  .to(".hero",        { backgroundColor: "#1FA2D6", duration: 1 }, 0)  // 0% → 100%
  .fromTo(".sig__path", { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.6 }, 0); // 0% → 60%
```

### No-DrawSVG fallback (identical visual, zero plugins)

DrawSVG is now free, but if you want zero plugins, drive `stroke-dashoffset` and keep it on the same timeline (see §6 for the math):

```js
const path = document.querySelector(".sig__path");
const len  = path.getTotalLength();                 // call ONCE, after fonts/layout settle
gsap.set(path, { strokeDasharray: `${len} ${len}`, strokeDashoffset: len });

tl.to(".hero__inner", { scale: 0.6, duration: 1 }, 0)
  .to(".hero",        { backgroundColor: "#1FA2D6", duration: 1 }, 0)
  .to(path,           { strokeDashoffset: 0, duration: 1 }, 0);   // same range, same clock
```

Sources: [ScrollTrigger docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) · [Scrub on a timeline (forum)](https://gsap.com/community/forums/topic/25129-scrub-animations-using-scrolltrigger-on-a-timeline/) · [DrawSVG docs](https://gsap.com/docs/v3/Plugins/DrawSVGPlugin/).

---

## 2. Why ScrollTrigger pin FAILS to engage — checklist + prevention

The unifying cause of nearly every "pin scrolls away / doesn't stick / jumps" bug: **`position: fixed` is being broken by the DOM/CSS**, because pinning relies on fixed positioning. If your transition "mechanically scrolls to the 2nd screen" instead of pinning, you are almost certainly hitting #1 or #2 below.

| # | Failure | Why it breaks | Prevention |
|---|---------|---------------|------------|
| 1 | **Transformed (or `will-change`/`filter`/`perspective`) ancestor** | Any `transform`, `will-change: transform`, `filter`, or `perspective` on an **ancestor** of the pinned element creates a containing block, so `position: fixed` resolves against that ancestor instead of the viewport — the pin "shifts and scrolls away." This is a **browser CSS rule**, not a GSAP bug. | Remove transforms/`will-change`/`filter`/`perspective` from **all ancestors** of the pin element. Put `will-change` on the animated child (`.hero__inner`), never on the pin or its parents. Last resort: `pin: true` + `pinReparent: true` (docs warn it's expensive and breaks nesting-dependent CSS). |
| 2 | **`overflow` / `height: 100%` on `html`/`body`** (or a wrapper) | `overflow: hidden/auto/scroll` or a forced height on `html`/`body` creates a **different scroll context**; the scroll position ScrollTrigger reads never moves as expected, so the pin never engages or the end never fires. | Leave `html, body` at default overflow with no forced 100% height; let content height drive scroll. If you must scroll inside a div, set `scroller: ".container"` on every ScrollTrigger in it. |
| 3 | **Pinning inside an undeclared scroll/transform container** | If the pinned element lives in an `overflow: scroll/auto` (or transformed) container but ScrollTrigger defaults to the viewport scroller, start/end are computed against the wrong scroller and the trigger "stops moving." | Pass `scroller: yourContainer` to **every** ScrollTrigger in that container and `ScrollTrigger.refresh()` after layout. With a smooth-scroll lib, use `ScrollTrigger.scrollerProxy()` (see §3). |
| 4 | **No `ScrollTrigger.refresh()` after fonts/images load** | start/end and the pin-spacer size are measured **once** at creation. A late font swap or unsized image changes page height, so every start/end is wrong — pin engages at the wrong point or overlaps the next section. | `document.fonts.ready.then(() => ScrollTrigger.refresh())` **and** on `window` `load`. Give images explicit `width`/`height` (or `aspect-ratio`). Add `invalidateOnRefresh: true` so tween values recompute too. |
| 5 | **`position: fixed` conflicts** | Your own fixed overlays/headers, or pinning an element you pre-set to `fixed`, collide with the fixed positioning ScrollTrigger applies during the pin. | Don't pre-set the pin element to `fixed`; let ScrollTrigger manage it. Keep fixed overlays **outside** the pinned subtree. Offset a sticky header with `start: "top top+=80"` rather than CSS-fighting it. |
| 6 | **Wrong creation order with multiple pins** | Creating ScrollTriggers out of top→bottom order means earlier pin-spacers shift later measurements, misaligning start/end. | Create pinned ScrollTriggers in DOM/scroll order, or call `ScrollTrigger.sort()` / `refresh()` after creating all of them. |
| 7 | **Transforming the pinned node itself** | ScrollTrigger transforms the pinned element while pinning; if your tween also transforms that exact node (e.g. `scale` on `.hero`), they fight and the pin jumps. | Animate an **inner wrapper** (`.hero__inner`). Pin the outer, transform the inner. (Built into the §1 template.) |
| 8 | **Lenis in transform mode** | If your smooth-scroll lib moves the page by transforming a wrapper, that wrapper is a transformed ancestor of everything → failure #1 for every pin on the page. | Run Lenis in **non-transform mode** so pins stay valid (see §3). |

### The guard block (paste once, after creating triggers)

```js
// Recompute after async layout shifts so start/end + pin-spacer sizes are correct.
window.addEventListener("load", () => ScrollTrigger.refresh());
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}
```

### Reduced-motion via `gsap.matchMedia()` (auto-reverts the pin)

```js
const mm = gsap.matchMedia();

mm.add("(prefers-reduced-motion: no-preference)", () => {
  buildHeroTransition();   // full pinned/scrubbed timeline from §1
  // ScrollTriggers created here auto-revert when the query stops matching.
});

mm.add("(prefers-reduced-motion: reduce)", () => {
  // No pin, no scrub: jump to the END state so design intent survives without motion.
  gsap.set(".hero__inner", { scale: 0.6 });
  gsap.set(".hero",        { backgroundColor: "#1FA2D6" });
  gsap.set(".sig__path",   { drawSVG: "100%" });
});

// If a UI "reduce motion" toggle changes at runtime:
// gsap.matchMediaRefresh();
```

Sources: [ScrollTrigger docs (pin, pin-spacer, transformed-ancestor warning, scroller)](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) · [Pinning a transformed element (forum)](https://gsap.com/community/forums/topic/32421-scrolltrigger-pinning-a-transformed-element/) · [pin not working (forum)](https://gsap.com/community/forums/topic/37918-scrolltrigger-pin-not-working/) · [overflow:scroll (forum)](https://gsap.com/community/forums/topic/26729-scrolltrigger-not-working-with-overflow-scroll/) · [gsap.matchMedia() docs](https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/).

---

## 3. Lenis smooth scroll + ScrollTrigger integration (non-transform mode)

The reference site uses **Lenis**, not ScrollSmoother. We follow it. The critical detail for keeping pins valid: **run Lenis in non-transform mode**. By default Lenis can translate a wrapper (`transform`), which would make that wrapper a transformed ancestor of every pinned section → pin failure #1/#8. Non-transform mode scrolls the real document, so `position: fixed` (and therefore pinning) works normally.

### Recommendation: Lenis vs ScrollSmoother

- **Lenis** — free, tiny, framework-agnostic, what the reference build ships. **Use this** for a vanilla site. Requires the manual wiring below.
- **ScrollSmoother** — also free now, native-scroll based, gives declarative `data-speed`/`data-lag` parallax for free, but it *does* wrap/transform content. Fine, but you must let it own pinning. For this starter we use Lenis.

### Canonical wiring

```js
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis({
  duration: 1.1,              // inertia feel
  smoothWheel: true,
  // NON-TRANSFORM MODE: do NOT let Lenis translate a wrapper, or pins break.
  // Modern Lenis scrolls the real <html> scroller by default (no wrapper transform).
  // Do NOT pass `wrapper`/`content` pointing at an element you then transform.
});
window.lenis = lenis; // handy for debugging, mirrors the reference site

// 1) Tell ScrollTrigger to update on every Lenis scroll event.
lenis.on("scroll", ScrollTrigger.update);

// 2) Drive Lenis from GSAP's ticker (one rAF loop for everything = no desync, no jank).
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);    // gsap.ticker is in seconds, Lenis.raf wants ms
});
gsap.ticker.lagSmoothing(0); // let GSAP's clock stay authoritative

// 3) Refresh after async content (fonts/images) so pin math is correct.
window.addEventListener("load", () => ScrollTrigger.refresh());
document.fonts?.ready.then(() => ScrollTrigger.refresh());
```

This is exactly the pattern the reference bundle uses (`window.lenis.on("scroll", ...)` → `ScrollTrigger.update`, `gsap.ticker` pumping `lenis.raf`), just de-minified.

> If you ever DO need Lenis to scroll a custom container, add `ScrollTrigger.scrollerProxy(container, {...})` and set `scroller: container` on your triggers — but for a full-page site, default document scrolling + non-transform mode is simplest and keeps every pin valid.

Sources: forensic finding from the reference bundle (`window.lenis`, `lenis.on("scroll", ScrollTrigger.update)`, `gsap.ticker` → `lenis.raf`, `ScrollTrigger.scrollerProxy`) · [Scroll / GSAP](https://gsap.com/scroll/).

---

## 4. Ceremonial preloader pattern

A paused timeline that plays once on cold load, gates the hero, then hands off with a clip-path/scale reveal. Mirrors the reference site's *gating* idea (hero animations wait for `loadingComplete`) without Rive. Theme it as a **pool tile filling with Zima blue**.

```html
<div class="preloader" id="preloader">
  <div class="preloader__tile"></div>        <!-- the pool tile that fills with blue -->
  <div class="preloader__count">0</div>
</div>
```

```css
.preloader {
  position: fixed; inset: 0; z-index: 9999;
  display: grid; place-items: center; background: var(--void);
}
.preloader__tile {
  position: absolute; inset: 0;
  background: var(--zima);
  transform: scaleY(0);            /* fills upward as progress climbs */
  transform-origin: bottom;
}
.preloader__count {
  position: relative; font-size: clamp(3rem, 12vw, 9rem);
  mix-blend-mode: difference;       /* stays legible over the rising fill */
}
```

```js
function runPreloader(onDone) {
  const counter = { v: 0 };
  const tl = gsap.timeline({
    paused: true,
    onComplete: onDone,             // gate: only start the hero AFTER this
  });

  tl.to(".preloader__tile", { scaleY: 1, duration: 1.6, ease: "power2.inOut" }, 0)
    .to(counter, {
      v: 100, duration: 1.6, ease: "power2.inOut",
      onUpdate: () => {
        document.querySelector(".preloader__count").textContent = Math.round(counter.v);
      },
    }, 0)
    // hand-off: wipe the preloader away to reveal the hero
    .to(".preloader", { clipPath: "inset(0 0 100% 0)", duration: 0.8, ease: "power3.inOut" }, ">")
    .set(".preloader", { display: "none" });

  // Play when the document + fonts are actually ready (buys time honestly).
  Promise.all([
    new Promise((r) => (document.readyState === "complete" ? r() : window.addEventListener("load", r))),
    document.fonts?.ready ?? Promise.resolve(),
  ]).then(() => tl.play());
}

// Gate the hero behind the preloader, then refresh ScrollTrigger.
runPreloader(() => {
  buildHeroTransition();
  ScrollTrigger.refresh();
});
```

Keep it under ~2.5 s and skip for returning visitors (e.g. `sessionStorage` flag). Sources: [Sleek preloader with GSAP timeline](https://dev.to/israelmitolu/how-to-create-a-sleek-preloader-animation-using-gsap-timeline-41ob) · [Page loading animation (Tuts+)](https://webdesign.tutsplus.com/simple-page-loading-animation-with-gsap--cms-36814t) · reference-site gating mechanism (`window.loadingComplete`).

---

## 5. Section pinning + parallax depth (the rest of the journey)

### Pinned narrative section (nested timeline)

Use sparingly (1–3 pins total) to keep the page minimal. Same engine as §1 — pin the outer, choreograph an inner timeline.

```js
const story = gsap.timeline({
  scrollTrigger: {
    trigger: ".chapter",
    start: "top top",
    end: "+=1500",
    scrub: 1,
    pin: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,
  },
  defaults: { ease: "none" },
});

story.from(".chapter__line", { yPercent: 100, opacity: 0, stagger: 0.2 }, 0)
     .to(".chapter__stars", { yPercent: -20 }, 0)        // slow far layer
     .to(".chapter__glyph", { yPercent: -60 }, 0);       // faster near layer
```

### Parallax depth layers (manual, vanilla — no ScrollSmoother needed)

Move distant star-fields slowly and foreground glyphs faster for cosmic depth. Keep displacement small for "moody," not theme-park.

```js
gsap.utils.toArray("[data-depth]").forEach((layer) => {
  const depth = parseFloat(layer.dataset.depth);        // e.g. 0.1 far … 0.6 near
  gsap.to(layer, {
    yPercent: -depth * 100,
    ease: "none",
    scrollTrigger: {
      trigger: layer.closest("section"),
      start: "top bottom",
      end: "bottom top",
      scrub: true,
    },
  });
});
```

```html
<div class="stars"  data-depth="0.1"></div>   <!-- drifts slowly -->
<div class="planet" data-depth="0.5"></div>   <!-- moves more -->
```

> If you switch to ScrollSmoother instead of Lenis, you get this declaratively: `data-speed="0.5"` (half speed) / `data-speed="2"` (double) and `data-lag="0.5"` (soft catch-up drift), with `effects: true` on `ScrollSmoother.create()`.

Sources: [ScrollTrigger docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) · [ScrollSmoother docs (`data-speed`/`data-lag`)](https://gsap.com/docs/v3/Plugins/ScrollSmoother/).

---

## 6. SVG signature draw — best practice + swapping in a real signature later

### The mechanism (true for both DrawSVG and the vanilla method)

A stroke "draws" when the dash pattern equals the full path length and you animate the dash **offset** from `length` (hidden) to `0` (drawn). Two hard requirements:

1. Real stroke, **no fill** while drawing: `fill: none; stroke: …; stroke-width: …; stroke-linecap: round; stroke-linejoin: round`.
2. Each `<path>` draws independently — there is no single length across multiple paths; sequence them on the timeline.

### Vanilla `stroke-dashoffset` (canonical form)

```js
const path = document.querySelector("#sig path");
const len  = path.getTotalLength();              // forces layout — call ONCE at setup
path.style.strokeDasharray  = `${len} ${len}`;   // dash AND gap = len => only one segment ever shows
path.style.strokeDashoffset = len;               // fully hidden

function draw(progress) {                          // progress 0..1
  path.style.strokeDashoffset = len * (1 - progress);
}
```

Why `"${len} ${len}"` and not just `len`: a single dash value repeats, so the next repetition can creep in from the far end. Equal dash+gap guarantees exactly one visible segment.

### Multi-stroke (real signatures are several strokes), distributed by length share

```js
const segs = [...document.querySelectorAll("#sig path")].map((p) => {
  const len = p.getTotalLength();
  p.style.strokeDasharray  = `${len} ${len}`;
  p.style.strokeDashoffset = len;
  return { p, len };
});
const total = segs.reduce((s, x) => s + x.len, 0);

function drawAll(progress) {                        // global 0..1 across all strokes
  let ink = progress * total;
  for (const { p, len } of segs) {
    const local = Math.min(Math.max(ink / len, 0), 1);
    p.style.strokeDashoffset = len * (1 - local);
    ink -= len;                                      // remainder spills to the next stroke
  }
}
```

Distributing by **length share** (not equal time per path) makes the pen move at constant visual speed — a long flourish gets proportionally more scroll than the dot on an `i`. Drive `drawAll` from a scrubbed ScrollTrigger via a proxy so it stays in lockstep with the shrink/bloom:

```js
const proxy = { p: 0 };
tl.to(proxy, { p: 1, duration: 1, onUpdate: () => drawAll(proxy.p) }, 0); // same timeline, position 0
```

### Or DrawSVGPlugin (free since Apr 30 2025)

```js
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
gsap.registerPlugin(DrawSVGPlugin);
// drawSVG: "0%" = hidden; "100%" = "0% 100%" = drawn; "20% 80%" = trimmed segment.
tl.fromTo("#sig path", { drawSVG: "0%" }, { drawSVG: "100%", duration: 1, stagger: 0.4 }, 0);
```

DrawSVG handles the dash math, normalizes Firefox/Safari `getTotalLength()` quirks, reverses cleanly, and supports percentages/middle-out draws. **Pitfall:** the old *trial* CDN logs `"Trial version of DrawSVGPlugin deployed"` and breaks off-domain — use the official npm package / standard gsap CDN.

### Swapping in a REAL traced signature later

The placeholder `d="…"` becomes a real signature via **raster → centerline trace → clean SVG**. The key word is **centerline**: ordinary "trace bitmap" outlines the *edges* of the ink (a filled blob you can't stroke). You want the skeleton down the middle so it's a single open path you stroke.

1. Scan/photograph on white paper, high contrast, crop tight.
2. **Inkscape** (best free centerline): `Path > Trace Bitmap` → **"Centerline tracing (autotrace)"** tab → `Path > Simplify` (Ctrl+L) → save **Optimized SVG**. (Illustrator: Image Trace with strokes/centerline, then `Object > Image Trace > Expand`, `Object > Path > Simplify`.)
3. `npx svgo sig.svg` to round coordinates / strip metadata.
4. Set `fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"`.
5. Keep **separate `<path>` per pen-stroke** for the most control (stagger, per-stroke timing). A single `<path>` may contain multiple `M…` subpaths — fine; both `getTotalLength()` and DrawSVG draw subpaths in `d` order.
6. If a stroke draws backwards, reverse it (Inkscape `Path > Reverse`, Shift+R). The path draws in the order points appear in `d`.

Then drop the new markup in place — the §1 timeline needs **no JS change** (DrawSVG) or just re-runs `getTotalLength()` (vanilla). Re-run `ScrollTrigger.refresh()` after swapping.

> **Reference-site note:** the Lando signature is actually a **Rive** artboard (`signature_scroll` state machine), not an SVG stroke. We use SVG/DrawSVG because it's vanilla and trivially swappable; migrate to Rive only if you need the richer Rive timeline.

Sources: [DrawSVG docs](https://gsap.com/docs/v3/Plugins/DrawSVGPlugin/) · [GSAP is now free (Webflow)](https://webflow.com/blog/gsap-becomes-free) · [GSAP free for commercial use (CSS-Tricks)](https://css-tricks.com/gsap-is-now-completely-free-even-for-commercial-use/) · [Trial-version warning](https://gsap.com/requires-membership/?plugin=DrawSVGPlugin).

---

## 7. 60fps performance rules

- **Transform & opacity only.** Animate `x/y/scale/rotation/autoAlpha` — never `top/left/width/height/margin/padding` (they trigger layout/paint). The shrink uses `scale`; the bloom's `backgroundColor` is a paint-only exception that's cheap for one element.
- **`will-change` sparingly.** Put it on the animated child only (`.hero__inner`), never on the pin or ancestors (it would also break the pin — §2 #1). Remove it when idle.
- **`getTotalLength()` / `getBBox()` once.** They force reflow — read at setup or on resize, never inside `onUpdate`/scroll. Don't animate `stroke-width` during a draw (repaints whole geometry).
- **One rAF loop.** Let `gsap.ticker` drive Lenis (§3); never add a separate scroll listener alongside ScrollTrigger — it already throttles to rAF.
- **Batch many elements.** Use `ScrollTrigger.batch()` (one trigger for N elements) instead of 50 individual triggers. Don't interleave DOM reads/writes.
- **`gsap.quickTo()` for high-frequency updates** (custom cursor, magnetic buttons, mouse-parallax) — it reuses one tween instead of creating a tween per event.
- **`ScrollTrigger.refresh()` only on real layout change** (fonts/images load), debounced — not on every resize. `invalidateOnRefresh: true` keeps scrubbed values correct across resize.
- **`gsap.matchMedia()`** to honor `prefers-reduced-motion` and disable heavy effects on mobile (§2). Cosmic looks lean on blur/blend-modes/parallax which are paint-heavy — disciplined transform-only work is what holds 60fps.

Sources: [gsap-performance skill](https://github.com/mxyhi/ok-skills/blob/main/gsap-skills/gsap-performance/SKILL.md) · [GSAP in practice — avoid the pitfalls](https://marmelab.com/blog/2024/05/30/gsap-in-practice-avoid-the-pitfalls.html) · [ScrollTrigger docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/).

---

## Appendix — honest confidence ledger

- **High confidence:** the GSAP/ScrollTrigger/Lenis/DrawSVG mechanics in §1–§7 (verified against official GSAP docs + forums); the reference site's confirmed stack (Webflow + jQuery + Lenis + GSAP/ScrollTrigger/SplitText/DrawSVG + Three.js/ogl + Rive); Lenis being the live smooth-scroll driver and ScrollSmoother being bundled-but-unused.
- **Medium / inferred:** the reference hero's exact "shrink" is a WebGL `REVEAL_SIZE` shader (math minified, not line-accurate); whether DrawSVG strokes a second signature; the preloader's exact visual form (gating mechanism confirmed, styling not).
- **Not determinable:** line-level logic inside the minified `lando-by-OFF+BRAND.js`; OFF+BRAND published no code-level breakdown; YouTube breakdown transcripts were not machine-fetchable. Our vanilla GSAP recreation reproduces the *perceived* effect, not the reference's WebGL/Rive internals.
