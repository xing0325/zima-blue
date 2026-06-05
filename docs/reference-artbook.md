# ZIMA BLUE — ARTBOOK
### Single source-of-truth for rebuilding the site. Vanilla JS + GSAP + ScrollTrigger + Lenis + SVG/canvas, no build step.

Read this top-to-bottom once, then build section by section. Every hex is final. Every number is a starting value you can trust. The whole site obeys one law: **exactly ONE saturated hue — Zima Blue — is allowed to dominate. Everything else stays muted navy / teal / dusty-nebula / smoldering-warm so the blue always reads as "the truth."**

---

## 1. Global palette tokens

Conflicts reconciled below. The five researchers each sampled the same blue under different lighting (performance #1FA8E0, mural #3BB3E0, sky/sea #2EB5EE/#2FB6D9, tile-glow #27C2F2). I lock **one canonical Zima Blue = `#3BB3E0`** (the mural/star value, confirmed twice by the hard palette extraction as the true all-blue mural), and keep the brighter `#27C2F2` strictly as the *emissive tile-glow* variant and `#1FA8E0` as the *night-reveal rim* variant. Navy base reconciled to `#0A1024` (cosmos) with `#070B18` for vignette corners; underwater void to `#0A3A3F`.

```css
:root{
  /* ——— ZIMA BLUE (the one saturated hue) ——— */
  --zima:            #3BB3E0; /* canonical core: mural, star, tile, all accents */
  --zima-hi:         #53CBF8; /* highlight / specular / hot upper-left of tile */
  --zima-deep:       #1B82A4; /* deep shaded blue, tile lower-right, shadow side */
  --zima-tile-glow:  #27C2F2; /* EMISSIVE tile fill only (hero pool) */
  --zima-rim:        #1FA8E0; /* night-reveal glowing rim / coping (perf pool) */
  --zima-sky:        #9FE4F2; /* sky-side blue (horizon thesis) */
  --zima-sea:        #2FB6D9; /* sea-side blue (horizon thesis) */

  /* ——— COSMOS NAVY (never #000) ——— */
  --cosmos:          #0A1024; /* dominant deep-navy void base */
  --cosmos-vignette: #070B18; /* darkest corner navy */
  --cosmos-core-glow:#102A44; /* galactic-core radial inner */
  --horizon-navy:    #102A44; /* horizon teal-navy band */

  /* ——— NEBULA MULTICOLOR ACCENTS ——— */
  --neb-maroon:      #7A1F2B; /* deep crimson nebula shadow / wine */
  --neb-ember:       #C2412E; /* ember-red dust mid */
  --neb-orange:      #E0623F; /* warm orange ember filament */
  --neb-purple:      #594E66; /* dusk / muted plum */
  --neb-violet:      #8E7FC4; /* lavender nebula veil */
  --neb-magenta:     #C77FD6; /* magenta-violet nebula mid */
  --neb-violet-hot:  #E9D6F2; /* near-white violet hotspot */
  --neb-teal:        #2E5C6B; /* teal counter-dust (cool side of red) */
  --neb-gold:        #E8B04B; /* golden sunset / supernova rim */
  --neb-gold-pale:   #F4D9A0; /* pale gold flare core */

  /* ——— WARM GALLERY PLANET ——— */
  --warm-core:       #F4D9A0; /* supernova/planet core */
  --warm-amber:      #E8A24B; /* warm amber glow */
  --warm-burnt:      #B5391C; /* burnt-orange asteroid cloud */
  --warm-ember-red:  #7A1518; /* dying ember-red nebula (mural 10) */
  --warm-rose:       #9C3A5E; /* dusty magenta-rose */
  --warm-rust:       #C24A2E; /* rusted-iron asteroid rock */
  --warm-void:       #1A0E14; /* near-black warm cosmic void */

  /* ——— TEAL UNDERWATER ——— */
  --uw-void:         #0A3A3F; /* deep teal void (dominant edges/vignette) */
  --uw-mid:          #10565C; /* mid teal water body */
  --uw-glow:         #1E8C8C; /* cyan-teal mid glow */
  --uw-ray:          #3FB8B0; /* bright aqua god-ray core */
  --uw-caustic:      #7FD9CF; /* pale cyan caustic highlight */
  --uw-bloom:        #BFEFE6; /* near-white surface bloom / hotspot */
  --uw-shadow:       #0E2A30; /* lower water mass shadow */
  --uw-caustic-line: #5AC8E0; /* caustic ripple line on tiles */
  --water-hero:      #0E2A33; /* dark teal-black hero water well */

  /* ——— DARK / STRUCTURE ——— */
  --grout:           #101820; /* tile grout / bezel / mullion */
  --machine:         #0E1418; /* robot silhouette near-black */
  --scaffold:        #05080A; /* steel lattice / crowd silhouette black */
  --letterbox:       #020608; /* film bars (use everywhere) */
  --rail-grey:       #9C9189; /* gantry pipe lit grey */
  --rail-shadow:     #5E6B72; /* pipe underside */
  --concrete:        #5B6168; /* drained construction basin grey */
  --star-white:      #F2F2F0; /* starfield + subtitle text */

  /* ——— SINGLE WARM ACCENT (use sparingly, CTA / origin) ——— */
  --robe-red:        #B11C1F; /* Zima's robe / one hot accent */
  --sunset-crimson:  #C8202A; /* old-pool construction sky */
}
```

**Rule of weight:** in any cool scene (hero, cosmos, underwater, mural background) warm hues may only appear as a *single deliberate accent* — never at equal visual weight to the blue. In the one warm scene (gallery background, villa memory) the blue squares are the only cool element and stay perfectly flat.

---

## 2. Hero — the glowing pool

A full-screen rectangular pool at a 3/4 high angle, coping rim ablaze in Zima Blue against near-black, the crude rail-riding robot endlessly laying glowing tiles, with underwater caustics + god-rays as a second mode. Cinemascope 2.39:1, letterbox `--letterbox` bars top/bottom.

### 2.1 Scene geometry (inline SVG, `viewBox="0 0 1100 600"`)

- **Letterbox:** two fixed black bars, each ~8% viewport height, `--letterbox`.
- **Sky opening (upper-right ~28%):** clipped `linear-gradient(180deg,#15243A 0%,#1FA8E0 70%,#9FE4F2 100%)`; behind it flat sea horizon at ~32% height and low `--scaffold` city-tower path.
- **Rail/gantry:** one long rounded-cap bar on a `-18°` diagonal, from upper-left (~12% height) descending to right (~55% height). Fill vertical gradient `linear-gradient(#B4A99F,#9C9189 55%,#5E6B72)`; 1–2px near-white specular streak on the top edge; faint `#6A5F58` seam rings every ~180px. A thinner blue-grey track rides just below it — the carriage runs on this.
- **Pool basin:** `<polygon>` trapezoid, near-left `209,360` / near-right `891,360` / far-right `770,192` / far-left `330,192` (in viewBox units; near edge ~62% width @60% height, far edge ~30% width @32% height). Water fill = `radial-gradient(circle, #0E2A33, #0A1014)`.
- **Glowing coping rim:** a slightly larger polygon stroked `--zima-rim` width 5, blurred via `feGaussianBlur stdDeviation="6"` + `feMerge` bloom; on top a crisp 1.5px `#7FE9E6` inner stroke (no blur) for the hot edge. Brightest on the two long sides.
- **Tile band:** along the wall plane parallel to and just below the rail, an SVG grid of rects, aspect 1:1.1, separated by 2–3px `--grout` gaps. Right-side tiles get lower opacity + cooler tint for perspective falloff (skewX/scaleX to the right).
- **Crowd (optional night-reveal mode):** one full-width `<path>` along bottom ~18%, bumpy bezier head skyline, fill `--scaffold`, with a blurred `--neb-teal`→`#0B3A4A` ellipse behind it for under-rim teal lighting.

### 2.2 Tile look

Each tile is an SVG/CSS rect with:
```css
background: radial-gradient(circle at 38% 30%, #4FD8FF 0%, var(--zima-tile-glow) 55%, var(--zima-deep) 100%);
box-shadow: 0 0 14px 2px rgba(39,194,242,.55);
```
Heavier black mullion bars (`--grout`, ~4px) group tiles. Overlay thin irregular branching crack polylines (`stroke:var(--zima-deep)` / `#0A2A33`, 1px, low opacity) on *some* panes only — a few Z/Y forks per several tiles, not every tile. Occasionally leave a tile dark/missing or float a small detached cyan rhombus shard just below the band.

### 2.3 Robot anatomy (flat near-black `--machine`, contrast silhouette, hard/angular/faceted)

1. **Carriage** — chunky angular box (irregular hexagon/wedge ~110×70px) clamping the rail.
2. **Shoulder** — round ball-and-socket hub (`<circle>` ~26px with a darker inner ring) hanging below the carriage. **This is the pivot — set `transformOrigin` here.**
3. **Arm** — two short tapered quad segments (upper arm + forearm) with a small elbow notch; forearm telescopes slightly.
4. **End-effector** — flat clamshell tray/plate (two thin parallel plates forming an open "C") holding exactly ONE tile.
5. **Hoses/cables** — 2–3 thin black bezier curves drooping between carriage and arm for the "crude machine" feel.

### 2.4 Arm-motion keyframes — `gsap.timeline({repeat:-1})`

Single repeating arm. Pivot at shoulder circle. Tile-fill is progressive: keep a JS array of tile elements and an index that advances on each ADVANCE beat so the lit band literally grows one tile per cycle.

| # | Beat | Motion | Timing / ease |
|---|------|--------|---------------|
| 1 | **REST / ADVANCE-IN** | arm fully retracted, tucked against body; small dark wedge under the pipe | hold 0.40s |
| 2 | **PICK TILE** | clamshell opens & grips a fresh tile (fade tile to bright cyan); shoulder rotor lifts loaded tray clear | 0.30s `power1.in` |
| 3 | **SWING DOWN & OUT** | arm group `rotation` from tucked ~`-15°` to reaching ~`+55°`, swinging tile down+out to the dark slot; forearm telescopes a touch | 0.50s `power2.inOut`, tiny overshoot |
| 4 | **PRESS / SEAT** | end-effector presses tile flush; tween target wall-slot tile from dark `--grout` → full cyan + a quick `keyframes` box-shadow brightness pop then settle; arm at full extension | 0.35s `power3.out` (a "click") |
| 5 | **RELEASE & RETRACT** | clamshell opens (tile stays lit on wall); arm swings back up+in to tuck; rotor counter-rotates; tray empties | 0.50s `power2.inOut` (reverse of beat 3) |
| 6 | **ADVANCE ALONG RAIL** | translate the ENTIRE robot group +`oneTileWidth` along the `-18°` rail vector (x AND y together to stay on the line); faint settle at the stop; advance tile index; loop to beat 1 | 0.45s `power1.inOut` |

```js
const tl = gsap.timeline({repeat:-1, defaults:{transformOrigin:'var(--shoulderX) var(--shoulderY)'}});
tl.to({}, {duration:0.4})                                            // 1 REST
  .to('#tray', {scale:1.05, duration:0.3, ease:'power1.in'})        // 2 PICK
  .to('#held-tile', {opacity:1, fill:'#4FD8FF', duration:0.3}, '<')
  .to('#arm', {rotation:55, duration:0.5, ease:'power2.inOut'})     // 3 SWING
  .to('#arm', {rotation:60, duration:0.1, ease:'power1.out', yoyo:true, repeat:1}, '>-0.1')
  .to('#arm', {rotation:62, duration:0.35, ease:'power3.out'})      // 4 PRESS
  .call(seatTile)                                                   //   light next slot + shadow pop
  .to('#arm', {rotation:-15, duration:0.5, ease:'power2.inOut'})    // 5 RETRACT
  .to('#robot', {x:'+=44', y:'+=14', duration:0.45, ease:'power1.inOut'}) // 6 ADVANCE
  .call(advanceTileIndex);
```

### 2.5 Underwater mode (池底视角)

Crossfade to teal. Same 6 beats, **slowed ~1.6×, softer eases.** Robot becomes flat black `#06100F`.
- **Water body:** `radial-gradient(ellipse at 60% 18%, #9FD9CF 0%, #2C7E80 45%, #0C3A40 100%)`.
- **God-rays:** 4–6 long thin white-cyan triangles fanning from the bright spot, `mix-blend-mode:screen`, opacity .12–.2, drifting slowly (GSAP rotate/translate, 8–15s yoyo).
- **Caustics:** SVG `feTurbulence`(`baseFrequency 0.012 0.02`)+`feDisplacementMap` overlay in `--uw-caustic`, low opacity, `mix-blend-mode:screen`, crawling across the tiles. Tiles dim to `#3FA9C9`→`--zima-deep`, gain glossy sheen.
- **Bubble streams:** 2–3 vertical wavering trails of small `rgba(207,243,238,.7)` circles rising from the end-effector with a sine-x wiggle, blur 1px, `screen`, fading near the surface. GSAP `repeat:-1` with random delays.

### 2.6 Mouse-follow water-disturbance interaction (tasteful)

On the pool water quad, follow the cursor with a soft radial ripple, NOT a literal cursor cube:
- A single `<radialGradient>` "disturbance" node whose `cx/cy` track the pointer via `gsap.quickTo('#ripple','cx',{duration:0.6,ease:'power3'})` (and `cy`). Fill a faint `--zima-tile-glow` at ~12% alpha over the dark water — a gentle glow that lags the cursor.
- On move, emit a one-shot expanding ring (`<circle>` scale 0→1.4, opacity .5→0, 0.8s `power2.out`) at the pointer to read as a touch on the surface.
- Above-water: rays of the disturbance subtly brighten the nearest 2–3 tiles' `box-shadow` (raise blur 14→20px) as the cursor passes — the pool "notices" you. Throttle to rAF; wrap in `gsap.matchMedia()` and disable on `prefers-reduced-motion` / touch.

---

## 3. Cosmos / nebula upgrade

The void is **never pure black** — deep navy carrying multicolor dust. This is the base layer for the 悟道 journey and the body-reveal beats.

### 3.1 Layered base (back-to-front)

```css
/* base navy stack — keep visible behind everything */
background:
  radial-gradient(120% 80% at 50% 60%, var(--cosmos-core-glow) 0%, var(--cosmos) 45%, var(--cosmos-vignette) 100%);
```
- **Galactic dust band (Milky Way):** a horizontal blurred ellipse at the horizon —
  `background: radial-gradient(60% 18% at 50% 50%, rgba(199,127,214,.35), rgba(43,180,201,.18) 40%, transparent 70%); filter: blur(8px);`
  Embed a faint noise texture for dust speckle; tint lavender/rose (`--neb-magenta`/`--neb-violet`).
- **Glowing core:** a fixed bright point at horizontal center —
  `radial-gradient(circle, var(--neb-violet-hot) 0%, var(--zima) 30%, transparent 70%)`, brightening as the journey approaches.

### 3.2 Parallax star layers (two `<canvas>`)

- **Back layer:** ~250 stars, `--star-white`, radius 0.5–1px, opacity 0.3–0.7, scroll-parallax `0.2×`.
- **Front layer:** ~150 stars, radius 1–2px, opacity 0.5–1.0, scroll-parallax `0.5×`.
- **Colored stars:** sprinkle ~8% in `--zima` (cyan), `--neb-gold` (warm), `--neb-magenta` (rose) so the field isn't monochrome.
- **Sparkle stars:** 6–8 brighter 4-point crosses via CSS `box-shadow` cross, slow `@keyframes twinkle` opacity 0.3→1.
- Throttle twinkle/parallax via a single rAF loop; pause when offscreen.

---

## 4. 悟道 — scroll-driven journey

A scroll-pinned camera dive through space. Build as **one pinned `ScrollTrigger` master timeline, `scrub:true`, total scroll height ~700vh**, Lenis driving smooth scroll. Camera = CSS transforms (`scale`, `translate`) on absolutely-positioned layered divs. **A single bright point ALWAYS lives at horizontal center** (pier-star → core-star → nebula-hotspot → blue tile) — this is the spine of the whole sequence.

Scenes mapped to scroll progress `p` (0→1), one labeled segment per beat cluster:

| `p` | Scene | What animates |
|-----|-------|---------------|
| **0.00–0.06** | **Meditation, closest (f2)** | Black SVG triangular pier from bottom-center to horizon-center; Zima lotus silhouette, white 1px rim; behind him a `conic-gradient` god-ray fan + `radial-gradient(circle,#BFE9F2,#3BB3E0 30%,transparent)` core glow. Flat teal sea (`--zima-deep` ripple lines), navy sky, Milky Way at horizon. |
| **0.06–0.18** | **Dolly-back + crane-up (f3–6)** | `gsap.to(figure+pier,{scale:1→0.05, y:upward})`; core glow shrinks to a 6px star; aura collapses to a discrete blue-white STAR on the horizon throwing a vertical god-ray fan. Zima dissolves into the pier point. |
| **0.18–0.26** | **Last seascape (f7–9)** | Star sinks to waterline, sky darkens, Milky Way becomes obvious lavender/rose dust; sea begins to feel curved. Narration swap: *"the cosmos was already speaking its own truth."* |
| **0.26–0.30** | **SCALE FLIP (f10)** | `rotateX` the teal sea plane from ~80° into a Saturn-like cyan ring arc sweeping from a corner (SVG ellipse, stroke `--zima-sea`, `feGaussianBlur` glow). Large dark planet `radial-gradient(circle at 35% 35%,#2E5C6B,#0A1024 70%)` with a cyan rim crescent fills a corner. |
| **0.30–0.50** | **Planet-field fly-through (f11–14)** | 4–6 planet divs as radial-gradient circles, sizes 40→520px, mostly near-black `--cosmos-vignette` with a thin cyan rim crescent. Parallax/drift them past with `x/y/scale` on scrub; keep the central blue-white core star fixed at center, brightening as planets pass and eclipse it. |
| **0.50–0.70** | **Nebula dive — violet→crimson→teal (f15–20)** | Stack 3–4 large blurred cloud layers (Perlin PNG or multi `radial-gradient`); animate `scale 1→3` + opacity to fly through. Color-shift: violet (`--neb-violet`/`--neb-magenta`/`--neb-violet-hot`) → crimson (`--neb-maroon`/`--neb-ember`/`--neb-orange` with `--neb-violet-hot` core star) → cool rim to `--neb-teal`. Radial motion-blur streak overlay from center. Persistent bright hotspot at center. Narration swap at f19: *"far better than he ever could."* |
| **0.70–0.74** | **COLLAPSE TO BLUE (f21)** | Full-viewport `background:var(--zima)` scaled up from the nebula hotspot to fill 100%. **Hold flat ~0.04 scroll units — resist any gradient. The signature Zima-Blue moment.** |
| **0.74–0.90** | **Body reveal (f22–24)** | The flat blue morphs (clip-path / scaling child square) into a SQUARE tile on Zima's back. Layer the hex-textured robot head-and-shoulders silhouette (black, white rim) over a bright `radial-gradient(50% 60% at 50% 50%,#2BB4C9,#102A44 70%)` core backlight; `scale` the group down (camera pulling back) so the tile shrinks to a small square at the nape. |
| **0.90–1.00** | **Memory cross-dissolve (f25–26)** | Cross-fade to the warm villa matte (Art-Deco staircase, dusk-violet building silhouettes, `linear-gradient(#5B3A6E,#C2412E 50%,#E8B04B 80%,#D98A5B)` sky, calm sea lower-left, tiny red-suited girl). Fade Zima's silhouette to opacity ~0.4 (`mix-blend-mode:screen` so starfield bleeds through), warm matte fades in beneath. End warm — blue "returned home." |

Subtitle: bottom-center two-line caption, Chinese larger + English italic below, `--star-white` with soft dark text-shadow, scroll-synced text swaps at the marked beats.

---

## 5. 解体 — poetic interlude

A pinned `ScrollTrigger` section (`pin:true, scrub:1`) where Zima's cybernetic shell gently separates and drifts in teal water lit by god-rays, ending serene. Cinemascope `--letterbox` bars. The emotional arc: dark/ominous → luminous/serene.

### 5.1 Water & light
```css
/* dissolution beats */
background: linear-gradient(180deg,#BFEFE6 0%,#3FB8B0 22%,#1E8C8C 48%,#10565C 72%,#0A3A3F 100%);
```
Overlay surface bloom `radial-gradient(ellipse at 70% 8%, var(--uw-bloom) 0%, transparent 55%)`, `mix-blend-mode:screen`. Aftermath beats shift lighter (`#D8F2EC`/`--uw-caustic`/`--uw-glow`).

### 5.2 God-rays
Stack 5–7 absolutely-positioned `<div>` shafts, each `linear-gradient(180deg, rgba(191,239,230,0) 0%, rgba(127,217,207,.28) 30%, rgba(63,184,176,.10) 70%, transparent)`, 6–14% width, `transform:rotate(16deg)` (transform-origin top — a consistent 15–20° from vertical), `blur(8–14px)`, `mix-blend-mode:screen`. Breathe with `gsap.to(opacity:0.4↔0.9, stagger:1.2, yoyo:true, ease:'sine.inOut')`. Behind fragments, above base.

### 5.3 Fragment separation (the core technique)
Author the body as inline SVG: ~30–40 separate shards — convex armor scoops (`<polygon>` 3–6 sided), thin curved cable ribbons (`<path>` stroke), lens/joint rings (`<circle>`), a few small spheres. Fill `#06181C` + thin `#13242B` inner shadow; put a 1px `--zima` stroke on 2–3 "lit" pieces.

```js
tl.to(shards, {
  x:'random(-260,260)', y:'random(-120,200)', rotation:'random(-180,180)',
  duration:'random(4,7)', ease:'power1.out',
  stagger:{each:0.04, from:'center'}      // radial burst from the body core
});
// continuous float so parts never freeze:
gsap.to(shards, {y:'+=12', rotation:'+=6', duration:'random(3,5)',
  yoyo:true, repeat:-1, ease:'sine.inOut', stagger:0.03});
```
Left-side shards get larger negative `x` (left-heavy fan, gravity drift downward). Cables animate slower (gentle sine skew) than rigid shards so they read as soft. Bubbles: `--uw-bloom` circles, radius 1.5–5px, tween `y -200→-400`, sine-x wobble, opacity→0, scale 0.6→1.1, continuous emitter, blur 0.5px.

### 5.4 Inner robot reveal
A separate SVG group (pale wedge + triangular fin + circular brush-drum, `--uw-caustic-line` lit, `#9CC9CE`/`#D6E6E6` fills) hidden inside the body, revealed via `opacity 0→1 + scale 0.9→1` as surrounding shards clear, lit by a co-located bright radial glow.

### 5.5 Scroll choreography (scrub the dissolution)
`0–30%` body breaks → `30–50%` inner robot revealed → `50–65%` gallery-context crossfade (planetarium audience, *"I'm going home."*) → `65–100%` aftermath crossfades 5→9, ending on the dark glowing-pool wide (pale-cyan rectangle in near-black `--letterbox`, thin `--zima` tile rim, dispersing ink-cloud, tiny robot + bubble trail). **Crossfade with overlapping opacity tweens, never hard cuts.** Reduced-motion fallback: static crossfade Beat 1 ↔ Beat 8.

---

## 6. Gallery — Zima mural exhibition

Warm cosmic background; project cards = **flat, sharp-cornered, off-center, NO-gradient, NO-text, NO-rounded Zima-Blue squares**, scattered like the murals. The incongruity (soft turbulent cosmos behind, mathematically perfect flat blue in front) IS the concept.

### 6.1 Warm background stage
```css
body{ background:#0A0608; }
/* giant planet / supernova glow */
.stage{ background:
  radial-gradient(circle at 38% 42%, #F4D9A0 0%, #E8A24B 9%, #B5391C 26%, #7A1518 48%, #1A0E14 78%, #0A0608 100%); }
/* magenta nebula variation, screen-blended */
.neb{ background: radial-gradient(circle at 72% 65%, #9C3A5E 0%, transparent 45%); mix-blend-mode:screen; }
```
- **Turbulence:** SVG `feTurbulence type=fractalNoise baseFrequency='0.012 0.018' numOctaves=4`, warm-tinted via `feColorMatrix`, opacity 0.35, `mix-blend-mode:soft-light`; drift it: `gsap.to(turb,{attr:{baseFrequency:'0.014 0.02'},duration:30,yoyo:true,repeat:-1,ease:'sine.inOut'})`.
- **Starfield:** canvas ~400 stars `#E0E6EC`, a few warm `--neb-gold` sparks, slow sine twinkle, 1–3px parallax opposite scroll.
- **Vignette + letterbox:** `radial-gradient(ellipse at center, transparent 55%, #0A0608 100%)` over all; thin 8–10vh `#0A0608` bars.

### 6.2 The cards (flat blue squares)
```css
.card{
  background: var(--zima);
  border-radius: 0;            /* sharp 90° corners — mandatory */
  box-shadow: none;
  background-image: none;      /* NO gradient ever */
}
```
Scatter asymmetrically over the warm space (never a tidy grid): e.g. center-right 58%/46%, upper-left, low-center, with generous empty warm space around each — mirroring how the square sits incongruously off-center in murals 2/3/5. Vary silhouettes across the set in *identical* `--zima`: square, tall bar, wide rect, a circle hero, an upward triangle — referencing murals 4/6/7. No text on the fill while idle.

### 6.3 Entry — grand crowd-silhouette unveiling (发布会)
On gallery enter, recreate the performance reveal:
- Two dark wedge `<div>`s (clip-path polygons) slide in from bottom-left & bottom-right, meeting at center — `gsap.to({x:0,y:0}, 0.6s, 'power3.inOut')`.
- A central spotlight column `linear-gradient(180deg, rgba(234,246,255,0) 0%, rgba(234,246,255,.85) 50%, rgba(234,246,255,0) 100%)`, ~80px wide, `scaleY 0→1` from top (origin top), 0.8s.
- A low crowd silhouette path (`--scaffold`) rises 30px into place with a teal under-glow ellipse behind.
- Then warm nebula fades up (`scale 1→1.04`, 2s) and the flat blue squares pop in mechanically: `from:{scale:0,transformOrigin:'center'}, ease:'power4.out', duration:0.4, stagger:0.12` — snappy/geometric to contrast the soft background. No bounce; blue is precise.

### 6.4 Reveal — hover preview AND scroll-to-bottom mass materialize
- **Hover/focus:** card scales up toward the canvas edges `gsap.to(card,{scale:1.18,duration:0.5,ease:'power3.out'})` (echoes blue growing to dominate the mural). Project title slides out from the square's hard edge, or a flat darker-blue `#2BA8DB` inset panel appears — **never a gradient scrim.**
- **Scroll-to-bottom mass materialize (GSAP Flip):** as the user reaches the gallery bottom, all scattered squares **Flip** from their incongruous mural positions into a tidy info-card grid. Capture `Flip.getState(cards)` before reparenting/reflow into the grid container, then `Flip.from(state,{duration:0.8, ease:'power3.inOut', stagger:0.04, absolute:true})`. On arrival, each square gains its text/metadata (project info fades in). This literally moves from "art" to "information."
- **Consumption scroll-beat (optional):** pin a hero square scrubbing `scale 14%→85%` of viewport while mural detail desaturates (`filter:saturate(1→0.3)`) — recreating murals 8→10→全蓝 where flat blue swallows the warm cosmos. End on a near-full `--zima` panel.

### 6.5 Knowledge-graph — star-map isomorph (constellation)
Treat the scattered squares as stars in a constellation:
- An SVG `<line>` layer underneath the cards draws thin `--zima` lines (opacity ~0.4, 1px) between related projects — the edges of the knowledge graph.
- On load (or on a "graph" toggle), animate each line with `strokeDashoffset length→0`, `power1.inOut`, staggered, so constellations *draw themselves* between the blue squares.
- Hovering a square brightens its incident edges (`stroke-width 1→2`, opacity→0.9) and pulses connected squares (subtle `scale 1→1.06`) — the graph lights up like a star map. Nodes that aren't connected stay dim, guiding the eye along relationships.

### 6.6 Accessibility / perf
Wrap all looping/scrub work in `gsap.matchMedia()` honoring `prefers-reduced-motion` (static warm gradient + static flat squares, constellation drawn instantly, no Flip animation). Animate only transform/opacity on cards; throttle turbulence/starfield rAF and pause offscreen for 60fps.

---

## 7. Motion + mouse-follow principles

Form serves content. Every interaction is tied to its scene's meaning; nothing moves for decoration.

**Global motion law**
- **One smooth-scroll spine:** Lenis drives all `ScrollTrigger` scrubs. Pin the four big sequences (hero, 悟道, 解体, gallery consumption); never let two pinned sections fight.
- **Two motion vocabularies, deliberately opposed:** the *cosmos/water* moves with soft `sine`/`power1-2.inOut` eases (organic, weightless); the *blue geometry* (tiles, squares, the arm's press) snaps with `power3/power4.out` and zero bounce (mechanical, precise). The contrast is the whole thesis — soft truth vs. hard machine.
- **The center-point spine:** across hero, cosmos, and 悟道, one luminous focal point stays at horizontal center (tile glow → core star → nebula hotspot → blue square). Cursor and scroll both orbit it; never let the eye lose it.
- **Single accent discipline:** hover/focus accents, progress indicator, and links all use `--zima`. Warm `--robe-red` is reserved for one CTA / the origin section only.

**Mouse-follow, scene by scene**
- **Hero pool:** cursor = a soft `--zima-tile-glow` water-disturbance glow lagging the pointer (`gsap.quickTo`, 0.6s `power3`), emitting expanding surface rings; nearby tile glows intensify as you pass. The pool "notices" you. (See §2.6.)
- **Cosmos / 悟道:** subtle pointer parallax — front star layer and nebula hotspot shift `±8px` toward the cursor via `quickTo`, deepening the 3D void. Reduce to zero on touch.
- **解体:** cursor near a drifting shard gives it a gentle repulsion nudge (`quickTo x/y` away from pointer) then it eases back — you can stir the dissolving body without controlling it. God-rays brighten slightly under the cursor.
- **Gallery:** hover scales the square 1.18× and lights its constellation edges; the cursor casts a faint warm `--neb-gold` glow on the painterly background (a soft `radial-gradient` follow) so the *warm world* reacts to you while the *blue squares stay flat and unmoved* — reinforcing that the blue is incorruptible.
- **Horizon thesis moment (optional closer):** sky-half and sea-half hues (`--zima-sky` / `--zima-sea`) converge toward a single `--zima` as the user scrolls, enacting *"I couldn't tell sky from sea."*

**Performance/accessibility (site-wide)**
- Animate only `transform` & `opacity`; `will-change:transform` on drifting shards/parallax layers; batch bubbles & stars into single canvases; pause offscreen rAF.
- Everything inside `gsap.matchMedia()` with a `prefers-reduced-motion` branch: kill rim flicker, caustics pan, splash, parallax, Flip, and scrubs — keep only fade-ins and static final compositions. The site must be legible and beautiful frozen.

---

**North star:** soft, warm, turbulent cosmos and gentle teal water everywhere — and against all of it, one flat, sharp, incorruptible Zima Blue. Build every scene so that when the blue appears, it reads as the only true thing in the frame.