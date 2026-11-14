# Space Descent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A scroll-driven 3D descent from deep space to a moon landing, in a retro space-travel poster style, served at `/descent/` on localhost.

**Architecture:** A second Vite HTML entry mounts a React app with a fixed react-three-fiber canvas behind a tall scroll track. Scroll progress `p` (0 to 1) is damped in one place and read each frame by the camera and the HTML captions. All geometry is generated in code with three-tone flat shading; pure logic (progress, camera path, layout, builder, quality, grain tile) is unit tested.

**Tech Stack:** React 19, Vite 7, three, @react-three/fiber, vitest, @fontsource/bebas-neue, @fontsource/josefin-sans.

**Spec:** `docs/superpowers/specs/2026-11-12-space-descent-design.md`. Read it before starting any task.

## Global Constraints

- Work only on branch `space-descent`. Never push. Never switch to or modify `main`.
- Do not edit any existing file except `vite.config.js`, `package.json`, `package-lock.json` and (only if lint requires it) `eslint.config.js`. Nothing under `src/components/`, `src/App.jsx`, `src/main.jsx`, `src/style.css` or `index.html` changes.
- All new code lives under `src/descent/` and `descent/`. three.js must be imported only from files under `src/descent/`.
- Colours: only these six. Cream `#F2E6CE`, burnt orange `#D9532B`, mustard `#E3A72F`, teal `#2F8F8B`, navy `#14213D`, ink `#0B1220`. Mixes of two of them are allowed for sky and fade.
- No code copied from 0z5a.github.io. The techniques in the spec's "Techniques taken from the reference site" section are reimplemented.
- No em dashes in any user-visible copy.
- Tests import `describe`, `it`, `expect` from `vitest` explicitly (no globals).
- Every task ends with `npm run lint` and `npm test` passing, then a commit ending with the line `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>`.
- Visual checks use `npm run dev` and `http://localhost:5173/descent/`.

## Review Focus

Conditions the spec implies that are most likely to bite a real visitor. Each has a test or check in the task named.

1. **Page loaded already scrolled** (refresh mid-page, browser scroll restoration): the scene must open at that `p`, with the right caption and no arrival animation from the top. Task 12, manual check; `scrollToProgress` test in Task 2.
2. **Long frame gaps** (tab hidden then shown, a stall): damping must not overshoot or produce NaN. Task 2, `damp` tests with `dt = 0` and `dt = 10`.
3. **Resize or phone rotation mid-scroll**: `p` is recomputed from the new scroll height and the camera stays on the path. Task 6, manual check; zero-height guard tested in Task 2.
4. **Extreme aspect ratios** (tall phone 9:21, ultrawide 32:9): field of view stays within bounds and captions stay inside the border. Task 3, `sampleCamera` aspect tests; Task 13, manual check.
5. **WebGL missing or context lost**: the fallback page appears instead of a blank canvas. Task 12, manual check by forcing `hasWebGL` false and by dispatching `webglcontextlost`.

---

### Task 1: Scaffold the second page

**Files:**
- Modify: `package.json`, `vite.config.js`
- Create: `descent/index.html`, `src/descent/main.jsx`, `src/descent/DescentApp.jsx`, `src/descent/descent.css`

**Interfaces:**
- Produces: `DescentApp` (default export, no props). `npm test` script. Page at `/descent/`.

- [ ] **Step 1:** Run `npm install three @react-three/fiber @fontsource/bebas-neue @fontsource/josefin-sans` and `npm install -D vitest`. Add script `"test": "vitest run --passWithNoTests"` to `package.json`.
- [ ] **Step 2:** In `vite.config.js` add `build.rollupOptions.input = { main: resolve(import.meta.dirname, 'index.html'), descent: resolve(import.meta.dirname, 'descent/index.html') }` with `resolve` from `node:path`.
- [ ] **Step 3:** Create `descent/index.html`: `lang="en"`, title `Descent | Allen Saji`, viewport meta with `viewport-fit=cover`, `<div id="root">`, script `/src/descent/main.jsx`. No theme script, no analytics.
- [ ] **Step 4:** `main.jsx` imports `@fontsource/bebas-neue/400.css`, `@fontsource/josefin-sans/400.css`, `@fontsource/josefin-sans/600.css`, `./descent.css`, and renders `<DescentApp />` in `StrictMode`. `DescentApp` renders `<main className="descent">Descent</main>` for now. `descent.css` sets `html, body { margin: 0; background: #14213D; color: #F2E6CE; }`.
- [ ] **Step 5: Verify.** `npm run build` succeeds and `dist/descent/index.html` exists. `npm run lint` passes. `npm run dev`: `/descent/` shows "Descent" on navy; `/` looks exactly as before.
- [ ] **Step 6:** Commit: `Scaffold the descent page as a second Vite entry`.

---

### Task 2: Scroll progress maths

**Files:**
- Create: `src/descent/scroll/progress.js`, `src/descent/scroll/progress.test.js`

**Interfaces:**
- Produces:
  - `STOP_COUNT = 5`
  - `scrollToProgress(scrollY: number, scrollHeight: number, viewportHeight: number): number` returns 0 to 1.
  - `damp(current: number, target: number, dt: number, tau = 0.18): number`
  - `nearestStop(p: number, count = STOP_COUNT): number` returns an index.
  - `stopVisibility(p: number, index: number, count = STOP_COUNT): number` returns 0 to 1.

- [ ] **Step 1: Write the failing tests.**

```js
describe('scrollToProgress', () => {
  it('maps top, middle and bottom', () => {
    expect(scrollToProgress(0, 6000, 1000)).toBe(0)
    expect(scrollToProgress(2500, 6000, 1000)).toBe(0.5)
    expect(scrollToProgress(5000, 6000, 1000)).toBe(1)
  })
  it('clamps overscroll', () => {
    expect(scrollToProgress(-80, 6000, 1000)).toBe(0)
    expect(scrollToProgress(5300, 6000, 1000)).toBe(1)
  })
  it('returns 0 when there is nothing to scroll', () => {
    expect(scrollToProgress(0, 1000, 1000)).toBe(0)
    expect(scrollToProgress(0, 0, 0)).toBe(0)
  })
})
describe('damp', () => {
  it('is frame-rate independent', () => {
    const one = damp(0, 1, 0.032)
    const two = damp(damp(0, 1, 0.016), 1, 0.016)
    expect(one).toBeCloseTo(two, 10)
  })
  it('does not move when dt is 0', () => expect(damp(0.3, 1, 0)).toBe(0.3))
  it('never overshoots on a long gap', () => {
    const v = damp(0, 1, 10)
    expect(v).toBeLessThanOrEqual(1)
    expect(v).toBeGreaterThan(0.999)
  })
  it('jumps straight to target when tau is 0', () => expect(damp(0, 1, 0.016, 0)).toBe(1))
})
describe('nearestStop', () => {
  it('picks the closest of five', () => {
    expect(nearestStop(0)).toBe(0)
    expect(nearestStop(0.124)).toBe(0)
    expect(nearestStop(0.126)).toBe(1)
    expect(nearestStop(1)).toBe(4)
    expect(nearestStop(7)).toBe(4)
    expect(nearestStop(NaN)).toBe(0)
  })
})
describe('stopVisibility', () => {
  it('is 1 at and near the stop, 0 far away', () => {
    expect(stopVisibility(0.25, 1)).toBe(1)
    expect(stopVisibility(0.30, 1)).toBe(1)
    expect(stopVisibility(0.37, 1)).toBe(0)
    expect(stopVisibility(0.25, 2)).toBe(0)
  })
  it('fades between', () => {
    const v = stopVisibility(0.335, 1)
    expect(v).toBeGreaterThan(0)
    expect(v).toBeLessThan(1)
  })
})
```

- [ ] **Step 2:** Run `npm test`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement.** `damp` is `current + (target - current) * (1 - Math.exp(-dt / tau))`, with `tau <= 0` returning `target`. `stopVisibility` is 1 while `|p - index / (count - 1)| <= 0.06`, falls linearly to 0 at `0.11`.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: `Add scroll progress maths`.

---

### Task 3: World layout and camera path

**Files:**
- Create: `src/descent/scene/layout.js`, `src/descent/scene/cameraPath.js`, `src/descent/scene/cameraPath.test.js`

**Interfaces:**
- Produces from `layout.js` (all positions are `[x, y, z]`, y up, the landing site is the origin):

```js
export const GIANT = { center: [-1500, 900, -6000], radius: 1400 }
export const MOON = { center: [0, -1500, 0], radius: 1500 }   // its top is the landing ground at y = 0
export const STATION = [140, 1250, -260]
export const CLOUDS = { yMin: 260, yMax: 520 }
export const DRONE = [-12, 52, 95]
export const BASE = [30, 0, -40]
export const RIDGE = [-14, 0, 10]
export const PATH_POINTS = [[700, 2500, 4400], [260, 1350, 500], [60, 620, 160], [-40, 90, 120], [-10, 6, 34]]
export function pathPoint(t)    // Catmull-Rom through PATH_POINTS, t clamped to 0..1, returns [x, y, z]
export function pathTangent(t)  // unit vector along the path at t
```

- Produces from `cameraPath.js`:

```js
export const KEYFRAMES = [
  { p: 0.00, position: [600, 2600, 5000], target: GIANT.center,      fov: 50 },
  { p: 0.25, position: [320, 1330, 120],  target: [0, 1150, -900],   fov: 42 },
  { p: 0.40, position: [120, 800, 260],   target: [0, 300, 0],       fov: 55 },
  { p: 0.50, position: [70, 400, 200],    target: [0, 250, -200],    fov: 60 },
  { p: 0.75, position: [-30, 60, 130],    target: [10, 40, -80],     fov: 55 },
  { p: 0.90, position: [-16, 14, 48],     target: [-14, 10, 0],      fov: 48 },
  { p: 1.00, position: [-12, 4.2, 30],    target: [-300, 150, -1000], fov: 40 },
]
export function sampleCamera(p, aspect)  // returns { position: [x,y,z], target: [x,y,z], fov }
```

These numbers are starting values. Task 13 may tune positions, targets and fields of view. The `p` values of the five stops (0, 0.25, 0.5, 0.75, 1) are fixed.

- [ ] **Step 1: Write the failing tests.**

```js
describe('pathPoint', () => {
  it('starts and ends on the control points', () => {
    expect(pathPoint(0)).toEqual(PATH_POINTS[0])
    expect(pathPoint(1)).toEqual(PATH_POINTS[PATH_POINTS.length - 1])
    expect(pathPoint(-3)).toEqual(PATH_POINTS[0])
  })
  it('never goes below the ground', () => {
    for (let i = 0; i <= 200; i++) expect(pathPoint(i / 200)[1]).toBeGreaterThanOrEqual(0)
  })
  it('tangent is unit length', () => {
    const [x, y, z] = pathTangent(0.4)
    expect(Math.hypot(x, y, z)).toBeCloseTo(1, 6)
  })
})
describe('sampleCamera', () => {
  it('returns each keyframe exactly at its p (landscape)', () => {
    for (const k of KEYFRAMES) {
      const c = sampleCamera(k.p, 16 / 9)
      k.position.forEach((v, i) => expect(c.position[i]).toBeCloseTo(v, 6))
      k.target.forEach((v, i) => expect(c.target[i]).toBeCloseTo(v, 6))
      expect(c.fov).toBeCloseTo(k.fov, 6)
    }
  })
  it('is continuous between keyframes', () => {
    for (let i = 0; i < 400; i++) {
      const a = sampleCamera(i / 400, 1.6), b = sampleCamera((i + 1) / 400, 1.6)
      expect(Math.hypot(...a.position.map((v, j) => v - b.position[j]))).toBeLessThan(150)
    }
  })
  it('clamps p and tolerates NaN', () => {
    expect(sampleCamera(-1, 1.6)).toEqual(sampleCamera(0, 1.6))
    expect(sampleCamera(9, 1.6)).toEqual(sampleCamera(1, 1.6))
    expect(sampleCamera(NaN, 1.6)).toEqual(sampleCamera(0, 1.6))
  })
  it('widens the view on portrait screens, within bounds', () => {
    expect(sampleCamera(0, 9 / 16).fov).toBeCloseTo(70, 6)   // 50 * 1.4
    expect(sampleCamera(0.5, 9 / 21).fov).toBeLessThanOrEqual(85)
    expect(sampleCamera(0.5, 32 / 9).fov).toBeCloseTo(60, 6)
  })
})
```

- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement.** Find the segment containing `p`, take local `t` within it, and interpolate position and target with Catmull-Rom using the neighbouring keyframes (clamped at the ends); interpolate `fov` linearly. When `aspect < 1`, `fov = Math.min(85, fov * 1.4)`.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: `Add world layout and camera path`.

---

### Task 4: Palette and three-tone geometry builder

**Files:**
- Create: `src/descent/scene/palette.js`, `src/descent/scene/build.js`, `src/descent/scene/build.test.js`

**Interfaces:**
- Produces from `palette.js`:
  - `PALETTE = { cream, orange, mustard, teal, navy, ink }` (hex strings from Global Constraints).
  - `rgb(hex): [r, g, b]` in 0 to 1.
  - `TONES`: each value is `[lit, mid, shadow]` hex. `station: [cream, mustard, navy]`, `solar: [mustard, orange, navy]`, `craft: [cream, orange, navy]`, `dome: [cream, teal, navy]`, `drone: [cream, mustard, ink]`, `payload: [orange, orange, ink]`, `rock: [teal, navy, ink]`, `silhouette: [ink, ink, ink]`.
  - `skyColor(p): [r, g, b]`: navy for `p <= 0.45`, then a linear mix reaching 60% teal and 40% navy at `p >= 0.8`.
- Produces from `build.js`:
  - `LIGHT`: unit vector of `[-0.45, 0.75, 0.5]`.
  - `pickTone(normal: [x,y,z], tones: [a,b,c])`: `dot(normal, LIGHT) > 0.4` returns `tones[0]`; `> -0.1` returns `tones[1]`; otherwise `tones[2]`.
  - `rng(seed: number): () => number` deterministic, values in `[0, 1)`.
  - `createBuilder()` returns an object with `positions: number[]`, `colors: number[]`, and methods:
    - `quad(a, b, c, d, tones, awayFrom?)` two triangles, one tone for the whole face; if `awayFrom` is given the normal is flipped to face away from that point.
    - `box(center, size, tones, rotY = 0)` six quads, normals outward.
    - `lathe(rings, segments, tones)` where `rings` is `[[y, radius], ...]`; flat faces between consecutive rings, capped at both ends.
    - `flat(points, tones)` a fan of triangles over a planar outline, single colour `tones[0]` (for silhouettes).
    - `toGeometry()` returns a non-indexed `THREE.BufferGeometry` with `position` and `color` attributes.

- [ ] **Step 1: Write the failing tests.**

```js
it('pickTone uses the two thresholds', () => {
  const t = ['a', 'b', 'c']
  expect(pickTone(LIGHT, t)).toBe('a')
  expect(pickTone(LIGHT.map(v => -v), t)).toBe('c')
  expect(pickTone([LIGHT[2], 0, -LIGHT[0]].map((v, _, a) => v / Math.hypot(...a)), t)).toBe('b') // perpendicular to LIGHT
})
it('rng is deterministic and in range', () => {
  const a = rng(7), b = rng(7)
  for (let i = 0; i < 100; i++) { const v = a(); expect(v).toBe(b()); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1) }
})
it('box emits 36 vertices and lights its top face', () => {
  const b = createBuilder()
  b.box([0, 0, 0], [2, 2, 2], TONES.station)
  expect(b.positions.length).toBe(36 * 3)
  expect(b.colors.length).toBe(36 * 3)
  // every vertex with y === 1 on the top face carries the lit tone
  const lit = rgb(TONES.station[0])
  const tops = []
  for (let i = 0; i < 36; i += 3) {
    const ys = [0, 1, 2].map(k => b.positions[(i + k) * 3 + 1])
    if (ys.every(y => y === 1)) tops.push(i)
  }
  expect(tops.length).toBe(2)
  tops.forEach(i => lit.forEach((v, k) => expect(b.colors[i * 3 + k]).toBeCloseTo(v, 6)))
})
it('every triangle has one colour across its three vertices', () => {
  const b = createBuilder()
  b.lathe([[0, 1], [2, 1.5], [3, 0.5]], 8, TONES.dome)
  for (let i = 0; i < b.positions.length / 9; i++)
    for (let k = 0; k < 3; k++) {
      expect(b.colors[i * 9 + k]).toBe(b.colors[i * 9 + 3 + k])
      expect(b.colors[i * 9 + k]).toBe(b.colors[i * 9 + 6 + k])
    }
})
it('skyColor is navy in space and bluer near the ground', () => {
  expect(skyColor(0)).toEqual(rgb(PALETTE.navy))
  expect(skyColor(0.45)).toEqual(rgb(PALETTE.navy))
  expect(skyColor(1)[1]).toBeGreaterThan(skyColor(0)[1])
  expect(skyColor(1)).toEqual(skyColor(0.8))
})
```

- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement** both modules to the interfaces above.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: `Add palette and three-tone geometry builder`.

---

### Task 5: Adaptive quality and grain tile

**Files:**
- Create: `src/descent/quality.js`, `src/descent/quality.test.js`, `src/descent/ui/grainTile.js`, `src/descent/ui/grainTile.test.js`

**Interfaces:**
- Produces:
  - `createQuality({ maxDpr: number, levels = [2, 1.5, 1], slowMs = 20, window = 45 })` returns `{ level(): number, sample(frameMs: number, moving: boolean): number }`. Usable levels are those `<= maxDpr`, or `[1]` if none. `sample` returns the current level. It steps to the next lower level when the mean of the last `window` samples taken while `moving` exceeds `slowMs`, then clears its samples. It never steps up.
  - `grainPixels(size = 160, rand = Math.random): Uint8ClampedArray` of length `size * size * 4`. About 9% of pixels are cream at alpha 12 to 28, about 11% are ink at alpha 14 to 32, the rest fully transparent.

- [ ] **Step 1: Write the failing tests.**

```js
it('steps down after sustained slow frames while moving', () => {
  const q = createQuality({ maxDpr: 2 })
  for (let i = 0; i < 45; i++) q.sample(30, true)
  expect(q.level()).toBe(1.5)
  for (let i = 0; i < 45; i++) q.sample(30, true)
  expect(q.level()).toBe(1)
  for (let i = 0; i < 200; i++) q.sample(30, true)
  expect(q.level()).toBe(1)
})
it('ignores one slow frame and frames at rest', () => {
  const q = createQuality({ maxDpr: 2 })
  for (let i = 0; i < 44; i++) q.sample(8, true)
  q.sample(200, true)
  expect(q.level()).toBe(2)
  for (let i = 0; i < 200; i++) q.sample(60, false)
  expect(q.level()).toBe(2)
})
it('never steps up', () => {
  const q = createQuality({ maxDpr: 2 })
  for (let i = 0; i < 45; i++) q.sample(30, true)
  for (let i = 0; i < 500; i++) q.sample(4, true)
  expect(q.level()).toBe(1.5)
})
it('respects the device limit', () => {
  expect(createQuality({ maxDpr: 1 }).level()).toBe(1)
  expect(createQuality({ maxDpr: 1.5 }).level()).toBe(1.5)
  expect(createQuality({ maxDpr: 3 }).level()).toBe(2)
})
it('grain is sparse and faint', () => {
  const px = grainPixels(160, rng(3))
  expect(px.length).toBe(160 * 160 * 4)
  let on = 0, maxA = 0
  for (let i = 3; i < px.length; i += 4) { if (px[i] > 0) on++; maxA = Math.max(maxA, px[i]) }
  const share = on / (160 * 160)
  expect(share).toBeGreaterThan(0.15)
  expect(share).toBeLessThan(0.25)
  expect(maxA).toBeLessThanOrEqual(32)
})
```

(`rng` comes from `scene/build.js`.)

- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement** both modules.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: `Add adaptive quality and grain tile`.

---

### Task 6: Scene shell, scroll hook and shared material

**Files:**
- Create: `src/descent/scroll/useScrollProgress.js`, `src/descent/scene/sceneMaterial.js`, `src/descent/scene/Scene.jsx`
- Modify: `src/descent/DescentApp.jsx`, `src/descent/descent.css`

**Interfaces:**
- Consumes: `scrollToProgress`, `damp` (Task 2); `sampleCamera` (Task 3); `skyColor`, `createBuilder`, `TONES` (Task 4).
- Produces:
  - `useScrollProgress({ reducedMotion: boolean })` returns a stable ref object `{ current: number, target: number }`. One `requestAnimationFrame` loop reads `window.scrollY`, sets `target` via `scrollToProgress(scrollY, document.documentElement.scrollHeight, window.innerHeight)`, and sets `current = damp(current, target, dt)` with `dt` clamped to 0.1 s. On mount `current` starts equal to `target` (no glide from 0). With `reducedMotion`, `current = nearestStop(target) / 4`.
  - `createSceneMaterial({ fogNear = 200, fogFar = 2500 } = {})` returns a `THREE.ShaderMaterial` with `vertexColors: true` and uniforms `uSky` (vec3), `uTime` (float), `uFogNear`, `uFogFar`. Vertex shader: mixes the vertex colour toward `uSky` by `smoothstep(uFogNear, uFogFar, distance to camera)`, at most 0.85. Fragment shader: adds `(hash(floor(gl_FragCoord.xy / 1.5)) - 0.5) * 0.04`; multiplies by 0.95 on every third row (`mod(floor(gl_FragCoord.y), 3.0) == 2.0`); adds 0.03 inside one band 6% of the screen tall that drifts upward over about 20 s.
  - `Scene` component, props `{ progress, quality, onWarm }`. For this task it renders one placeholder `box` (size 20, `TONES.station`) at each of `STATION`, `[0, 390, 0]`, `DRONE`, `BASE`, `RIDGE` using the shared material, and each frame sets the camera from `sampleCamera(progress.current, aspect)`, the clear colour and `uSky` from `skyColor(progress.current)`, and `uTime`.
- `DescentApp` renders: a fixed full-viewport `<Canvas>` (`camera={{ near: 0.5, far: 20000 }}`, `gl={{ antialias: true }}`, `dpr={1}` for now) containing `<Scene>`, and above it `<div className="track">` of height `600lvh`.
- CSS: canvas wrapper `position: fixed; inset: 0; width: 100%; height: 100lvh; pointer-events: none`.

- [ ] **Step 1:** Implement the hook, material, `Scene` and `DescentApp` to the interfaces above.
- [ ] **Step 2: Verify in the browser.** Scrolling top to bottom moves the camera smoothly past all five placeholder boxes in order; boxes show three distinct flat tones and visible blocky grain with faint scanlines; the background shifts from navy toward teal in the last third. Reload half way down: the view opens at that position without gliding from the top. Resize the window mid-scroll: the camera stays on the path with no jump to the start.
- [ ] **Step 3:** `npm run lint` and `npm test` pass.
- [ ] **Step 4:** Commit: `Add scene shell driven by scroll`.

---

### Task 7: Space: starfield, giant planet, rings, moons

**Files:**
- Create: `src/descent/scene/shaders/stipple.js`, `src/descent/scene/objects/Starfield.jsx`, `GiantPlanet.jsx`, `Rings.jsx`, `Moon.jsx` (same folder)
- Modify: `src/descent/scene/Scene.jsx`

**Interfaces:**
- Consumes: `GIANT`, `MOON` (Task 3); `PALETTE`, `rgb` (Task 4).
- Produces:
  - `createStippleMaterial({ lit, shadow, cell = 3 })` (hex colours) returns a `THREE.ShaderMaterial`. Fragment: `d = dot(worldNormal, LIGHT)`, `t = smoothstep(-0.35, 0.35, d)`; the pixel is `lit` when `t > hash(floor(gl_FragCoord.xy / cell))`, otherwise `shadow`. No fog, no lighting.
  - `<Starfield progress />`: one `THREE.Points` draw. 700 points (350 when `window.innerWidth < 700`) with seeded positions in a 600 x 400 x 600 box that wraps around the camera in the vertex shader; each point drifts slowly, twinkles, and fades out in the outer 28% of the box; size 1.5 to 10 px by distance; cream; additive blending; `depthWrite: false`.
  - `<GiantPlanet />`: sphere at `GIANT.center`, radius `GIANT.radius`, 64 x 48 segments, stipple orange lit, navy shadow, `cell = 4`. Two small moons (radius 90 and 60, stipple cream and navy) orbiting it at radii 2300 and 3100, one turn per 180 s and 300 s.
  - `<Rings />`: three concentric flat annuli around the giant (inner to outer radius 1750 to 1950 mustard, 2000 to 2080 cream, 2130 to 2400 mustard), tilted 20 degrees about x and 8 about z, unlit flat colour, double sided.
  - `<Moon />`: the destination. Sphere at `MOON.center`, radius `MOON.radius`, stipple teal lit, ink shadow, `cell = 3`.

- [ ] **Step 1:** Implement the material and four components; mount them in `Scene`. Keep the placeholder boxes.
- [ ] **Step 2: Verify in the browser.** At the top the giant is small and far with its rings readable and its shadow side dissolving into dots. At 0.25 it fills roughly half the frame. Points fill the view evenly at every scroll position with no visible pop at the box edge. The destination moon is visible below from 0.25 to 0.5.
- [ ] **Step 3:** `npm run lint` and `npm test` pass.
- [ ] **Step 4:** Commit: `Add starfield, giant planet, rings and moon`.

---

### Task 8: Station, craft and trail ribbon

**Files:**
- Create: `src/descent/scene/objects/Station.jsx`, `Craft.jsx`, `TrailRibbon.jsx`
- Modify: `src/descent/scene/Scene.jsx` (remove the `STATION` placeholder)

**Interfaces:**
- Consumes: `STATION`, `pathPoint`, `pathTangent` (Task 3); `createBuilder`, `TONES` (Task 4); `createSceneMaterial` (Task 6).
- Produces:
  - `<Station />` at `STATION`: an 8-sided lathe hub about 40 long (`TONES.station`), two solar wings each of five 22 x 0.6 x 18 panels with 2-unit gaps (`TONES.solar`), one dish. The whole station turns at 0.05 rad/s about its long axis. Built once with `createBuilder`, drawn with `createSceneMaterial({ fogNear: 800, fogFar: 6000 })`.
  - `<Craft progress />`: a small rocket about 6 long (lathe body in `TONES.craft`, three fins), positioned every frame at `pathPoint(min(1, progress.current + 0.04))` and pointed along `pathTangent`. Hidden when `progress.current > 0.93` (it has landed out of shot).
  - `<TrailRibbon progress />`: three parallel strips, each 2 units wide, following `pathPoint` over 240 segments, coloured orange, cream and teal. A `uReveal` uniform set to `progress.current + 0.04` discards fragments whose path parameter is greater. Unlit flat colour, double sided, no fog.

- [ ] **Step 1:** Implement and mount the three components.
- [ ] **Step 2: Verify in the browser.** At 0.25 the station passes close with clearly three-toned faces and reads against the giant. The craft stays slightly ahead of the camera the whole way and the striped ribbon grows behind it without gaps or twisting.
- [ ] **Step 3:** `npm run lint` and `npm test` pass.
- [ ] **Step 4:** Commit: `Add station, craft and trail ribbon`.

---

### Task 9: Cloud bands and terrain

**Files:**
- Create: `src/descent/scene/objects/CloudBands.jsx`, `Terrain.jsx`
- Modify: `src/descent/scene/Scene.jsx` (remove the `[0, 390, 0]` placeholder)

**Interfaces:**
- Consumes: `CLOUDS` (Task 3); `createBuilder`, `rng`, `TONES`, `PALETTE` (Task 4); `createSceneMaterial` (Task 6).
- Produces:
  - `<CloudBands />`: six flat horizontal annuli centred on the y axis, evenly spaced from `CLOUDS.yMin` to `CLOUDS.yMax`, inner radius between 320 and 400, outer radius between 700 and 1400 (seeded), alternating cream, teal and mustard, each turning slowly at its own rate. The camera path passes through the central holes and never through a band.
  - `<Terrain />`: a ground disc of radius 400 at y = 0 in teal; four upright silhouette layers built with `flat()` at z = -20, -60, -140, -320, each a jagged ridgeline 800 wide whose peaks grow with distance (heights up to 6, 14, 30, 70), coloured from ink (nearest) through navy to a navy and teal mix (farthest), seeded so they never change between loads; a rocky ridge of 8 to 12 boxes in `TONES.rock` around `RIDGE`, topping out near y = 3.

- [ ] **Step 1:** Implement and mount both components.
- [ ] **Step 2: Verify in the browser.** At 0.5 the camera drops through the bands with colour passing on all sides and no band clipping through the lens. From 0.75 the silhouette layers slide against each other as the camera descends, nearest darkest. Reload twice: the terrain is identical each time.
- [ ] **Step 3:** `npm run lint` and `npm test` pass.
- [ ] **Step 4:** Commit: `Add cloud bands and terrain`.

---

### Task 10: Drone, dome base and astronaut

**Files:**
- Create: `src/descent/scene/objects/Drone.jsx`, `DomeBase.jsx`, `Astronaut.jsx`
- Modify: `src/descent/scene/Scene.jsx` (remove the last placeholders)

**Interfaces:**
- Consumes: `DRONE`, `BASE`, `RIDGE` (Task 3); `createBuilder`, `TONES` (Task 4); `createSceneMaterial` (Task 6).
- Produces:
  - `<Drone />` at `DRONE`: a quadrotor about 5 across. Body box and four arms in `TONES.drone`, four rotor discs that spin, and a payload box slung underneath in `TONES.payload`. It bobs 0.6 units over a 3 s cycle and drifts 4 units along x over 9 s.
  - `<DomeBase />` at `BASE`: four hemispherical domes (8-sided lathes, radii 9, 6, 6 and 4) in `TONES.dome`, joined by low box corridors, with one mast.
  - `<Astronaut />` at `RIDGE`, standing on the ridge top: a figure about 1.8 tall made of boxes in `TONES.silhouette`, facing the giant, with a backpack.

- [ ] **Step 1:** Implement and mount the three components.
- [ ] **Step 2: Verify in the browser.** At 0.75 the drone flies alongside and its orange payload is the brightest thing in frame. At 1.0 the astronaut stands in the lower third as a dark silhouette, the domes sit in the middle distance, and the giant fills the sky behind.
- [ ] **Step 3:** `npm run lint` and `npm test` pass.
- [ ] **Step 4:** Commit: `Add drone, dome base and astronaut`.

---

### Task 11: Poster frame, grain overlay and captions

**Files:**
- Create: `src/descent/content/stops.js`, `src/descent/ui/PosterFrame.jsx`, `src/descent/ui/StopCaption.jsx`
- Modify: `src/descent/DescentApp.jsx`, `src/descent/descent.css`

**Interfaces:**
- Consumes: `stopVisibility` (Task 2); `grainPixels` (Task 5); the progress ref (Task 6).
- Produces:
  - `STOPS`: an array of five `{ id, kicker, title, body, links? }`.
    - Stop 1: kicker `A descent in five parts`, title `Allen Saji`, body `Engineering student building across robotics, embedded systems and machine learning. Scroll to begin the descent.`
    - Stops 2 to 5: kicker is the entry's year, title is the entry's title, in this order: `Solar Inverter Analysis`, `Cloud Background Removal System`, `UAV Air Quality & Target Detection Payload`, `Honours Thesis: Bubble Analysis`. Body is that entry's `description` from `src/components/Project_timeline.jsx`, cut to at most 30 words, keeping its numbers. Copy the text into `stops.js`; do not import the component.
    - Stop 5 `links`: `Email` (the `mailto:` from `src/components/Contact.jsx`), `LinkedIn` and `GitHub` (the URLs in `src/components/Profile.jsx`), and `Full portfolio` pointing to `/`.
  - `<PosterFrame />`: a cream border fixed over the viewport, `clamp(10px, 2.2vw, 28px)` thick, as four fixed bars so the middle stays click-through; a vignette (`radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(11, 18, 32, 0.45) 100%)`); and the grain layer: a fixed div extending 120 px beyond the viewport on every side, whose background is a 160 px canvas tile made from `grainPixels`, moved between four offsets by a `0.48s steps(1) infinite` keyframe animation. All layers `pointer-events: none`, plain alpha, no `mix-blend-mode`, no `filter`.
  - `<StopCaption stop index progress />`: fixed in the lower third, inside the border. Kicker in Josefin Sans 600 uppercase with wide letter spacing; title in Bebas Neue at `clamp(2.6rem, 9vw, 7.5rem)`, line height 0.92; body in Josefin Sans 400, max width 34ch. Its own animation frame loop sets `opacity` to `stopVisibility(progress.current, index)` and a 16 px upward offset as it fades; `visibility: hidden` at opacity 0 so hidden links cannot be focused or clicked.
- All five captions are real HTML in document order, each an `<article>` with an `<h2>` (stop 1 uses `<h1>`).

- [ ] **Step 1:** Implement the data file and two components; mount them in `DescentApp`.
- [ ] **Step 2: Verify in the browser.** Each stop shows exactly one caption, readable against its scene, inside the cream border. The grain flickers gently and the corners darken. Stop 5 links work; `Full portfolio` opens the main site. Tab through the page: focus only reaches links in the visible caption.
- [ ] **Step 3:** `npm run lint` and `npm test` pass.
- [ ] **Step 4:** Commit: `Add poster frame, grain overlay and captions`.

---

### Task 12: Opening, quality wiring and fallbacks

**Files:**
- Create: `src/descent/webgl.js`, `src/descent/ui/Opening.jsx`
- Modify: `src/descent/DescentApp.jsx`, `src/descent/scene/Scene.jsx`, `src/descent/descent.css`

**Interfaces:**
- Consumes: `createQuality` (Task 5); everything from Tasks 6 and 11.
- Produces:
  - `hasWebGL(): boolean`: true if a throwaway canvas returns a `webgl2` or `webgl` context.
  - `<Opening done />`: full-screen navy with `Allen Saji` in cream Bebas Neue; fades out over 0.6 s when `done` is true, then unmounts.
  - Warm-up in `Scene`: calls `onWarm()` once, after three consecutive frames under 25 ms or after 1.5 s, whichever is first. Until then the canvas wrapper has `opacity: 0`; afterwards it fades in over 0.6 s.
  - Arrival: after warm-up, if `progress.target < 0.02` and motion is allowed, the camera position and target are both raised by 300 units and eased down to zero offset over 1.6 s with a quintic smootherstep.
  - Quality: `createQuality({ maxDpr: window.devicePixelRatio })`; each frame `sample(frameMs, moving)` where `moving` is `|progress.target - progress.current| > 0.0005`; when the level changes, call the renderer's `setPixelRatio`.
  - Hidden tab: no rendering while `document.hidden` (set the canvas `frameloop` to `never`, back to `always` on return).
  - Reduced motion (`prefers-reduced-motion: reduce`): `useScrollProgress` runs in its snapping mode; the track becomes five `100lvh` sections with `scroll-snap-type: y mandatory`; no arrival; grain animation, starfield drift, rotations and drone motion are frozen.
  - No WebGL: if `hasWebGL()` is false, or the canvas fires `webglcontextlost`, the canvas is not rendered and `DescentApp` adds class `no-gl`, under which the five captions are laid out as a normal vertical page (static position, full opacity) on navy inside the border.

- [ ] **Step 1:** Implement all of the above.
- [ ] **Step 2: Verify in the browser.**
  - Fresh load at the top: the name shows first, then the scene fades in and settles down onto its first view.
  - Reload half way down: no arrival drop; the correct caption is showing.
  - DevTools rendering panel, emulate `prefers-reduced-motion: reduce`: scrolling snaps between five still frames, nothing animates, all five captions are reachable.
  - Temporarily make `hasWebGL` return false: the five captions and the portfolio link are readable as a plain page. Restore it. Then in the console run `document.querySelector('canvas').dispatchEvent(new Event('webglcontextlost'))`: the same fallback appears.
  - DevTools CPU throttling 6x, scroll continuously for several seconds: the picture gets softer, scrolling does not stutter more over time.
  - Switch to another tab for 10 s and back: no jump.
- [ ] **Step 3:** `npm run lint` and `npm test` pass.
- [ ] **Step 4:** Commit: `Add opening, adaptive quality and fallbacks`.

---

### Task 13: Composition pass and final verification

**Files:**
- Modify: `src/descent/scene/cameraPath.js` (keyframe values only), `src/descent/scene/layout.js` (positions only), `src/descent/scene/cameraPath.test.js` if a pinned field of view changes, `src/descent/descent.css`

**Interfaces:**
- Consumes: everything. Produces nothing new.

- [ ] **Step 1: Compose each stop as a poster.** At each of p = 0, 0.25, 0.5, 0.75, 1, at 1440 x 900 and at 390 x 844, adjust that stop's keyframe (and object positions if needed) until: the focal object sits on or near a third line and is not cut by the border; the caption does not cover it; no more than four palette colours dominate the frame; nothing clips through the camera in the travel between stops. Keep the five stop `p` values and all exports unchanged.
- [ ] **Step 2: Check the extremes.** At 360 x 780 and at 2560 x 720 every caption stays inside the border and every focal object stays in frame.
- [ ] **Step 3: Check the travel.** Scroll the full length down and back up at normal speed, then press End and Home. No blank frames, no pops, no visible jump at any keyframe.
- [ ] **Step 4: Check the main site.** `npm run build` succeeds. `npm run preview`: `/` is visually identical to `main`. The built main entry's JavaScript does not include three.js (the `descent` chunk does; the `main` chunk's size is within a few KB of what `main` builds).
- [ ] **Step 5:** `git diff main --stat -- src/components src/App.jsx src/main.jsx src/style.css index.html` prints nothing.
- [ ] **Step 6:** `npm run lint` and `npm test` pass.
- [ ] **Step 7:** Commit: `Tune poster compositions for each stop`.
