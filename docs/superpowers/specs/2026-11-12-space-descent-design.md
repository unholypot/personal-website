# Space Descent: design spec

Date: 2026-11-12
Branch: `space-descent`
Status: awaiting review

## Purpose

A standalone, scroll-driven 3D showpiece in the style of retro space-travel posters. The viewer descends from deep space to a landing on the moon of a ringed giant planet. It lives at its own URL and is listed as a project on the portfolio. If it turns out well it may later become the site's landing page.

It is a highlights reel, not a copy of the portfolio: name, a one-line intro, four projects, contact, and a link to the full site.

## Constraints

- The existing site must not change. No existing component, style or route is edited. The only shared files touched are `vite.config.js` (to register a second page) and `package.json` (new dependencies).
- All compositions are original. The retro poster genre is the reference, not any single poster. No code is taken from 0z5a.github.io, which has no licence; only general techniques are borrowed.
- three.js must load only on the descent page, so the main site's bundle does not grow.

## Success criteria

1. Scrolling from top to bottom plays one continuous descent with no cuts, on desktop and on a phone.
2. A still frame taken at any of the five stops reads as a finished poster: border, title, caption, clear focal object.
3. Scrolling stays smooth on a mid-range phone. When it cannot, resolution drops; frames are not skipped.
4. With reduced motion enabled, the page is fully readable as five static posters.
5. `npm run build` and `npm run lint` pass, and the main site at `/` looks and behaves exactly as before.

## Approach

three.js with react-three-fiber, as a second HTML entry in the existing Vite project.

Rejected alternatives:
- Raw WebGL in a single file (how the reference site is built): the same result for several times the work.
- A separate repository in plain three.js: clean isolation, but harder to promote to the landing page later.

New dependencies: `three`, `@react-three/fiber`. Dev dependency: `vitest` (the repo has no test runner; it is used only for the pure logic described under Testing). No helper library such as drei; the scene needs only custom geometry and two small shaders.

## Page structure

- `descent/index.html` is a second Vite entry, served at `/descent/`. `vite.config.js` gains `build.rollupOptions.input` listing both `index.html` and `descent/index.html`.
- The page is one tall scroll track (about six viewport heights). A full-viewport canvas is fixed behind it. Poster text is ordinary HTML fixed over the canvas, so it stays selectable and readable by screen readers.

## The journey

Scroll progress `p` runs from 0 at the top to 1 at the bottom. Five stops sit at evenly spaced values of `p`. The destination is a moon of a ringed giant, so the giant fills the sky in the final shot.

| Stop | p | Scene | Poster title | Content |
|---|---|---|---|---|
| 1. Deep space | 0.00 | Stars; the ringed giant small and far off; the craft enters trailing its ribbon | Name | One-line intro |
| 2. Approach | 0.25 | The giant fills half the frame, cropped by the edge; an orbital station with large solar arrays passes close | Solar Inverter Analysis | One or two lines, year |
| 3. Entry | 0.50 | The camera tips down toward the moon and drops through its banded cloud layers | Cloud Background Removal System | One or two lines, year |
| 4. Low flight | 0.75 | Layered terrain silhouettes slide past; a survey drone flies alongside | UAV Air Quality & Target Detection Payload | One or two lines, year |
| 5. Landing | 1.00 | A base of glass dome habitats; a small astronaut silhouette on a rocky ridge; the giant and its other moons fill the sky | Honours Thesis: Bubble Analysis | One or two lines, then contact links and a link to the full portfolio |

Project copy is shortened from `src/components/Project_timeline.jsx` and kept in its own data file, so the existing component is not imported or changed.

## Visual language

Palette (the only colours used):

| Name | Hex | Use |
|---|---|---|
| Cream | `#F2E6CE` | Paper border, light faces, text on dark |
| Burnt orange | `#D9532B` | The giant, ribbon stripe, accents |
| Mustard | `#E3A72F` | Sun-side highlights, rings, ribbon stripe |
| Teal | `#2F8F8B` | Atmosphere bands, domes, ribbon stripe |
| Navy | `#14213D` | Space, shadow faces |
| Ink | `#0B1220` | Foreground silhouettes, text on light |

Rules:
- No realistic lighting. Built objects use three-tone flat shading (see "Techniques taken from the reference site"); round bodies use stipple.
- The shadow side of the giant and its moons dissolves into dots through a dither pattern in the fragment shader.
- The craft trails a ribbon of three alternating stripes along the whole descent path. It is the visual thread through all five stops.
- Terrain is stacked flat silhouette layers at different depths, which part as the camera drops.
- Grain is applied in two layers, described in the next section.
- A cream paper border frames the viewport. The title sits in the lower third in a condensed display face (Bebas Neue); captions use a geometric sans (Josefin Sans). Both are SIL Open Font Licence and self-hosted as woff2.

## Techniques taken from the reference site

These were read from the source of 0z5a.github.io. Each is reimplemented here in our own code with our own values; the ideas are reused, the code is not.

1. **Three-tone faces (the blocky look).** Every material has exactly three tones: lit, mid and shadow. Each flat face takes one of them from the angle between its normal and a single fixed light direction (lit above roughly 0.4, shadow below roughly -0.1, mid between). There are no gradients across a face. The tone is worked out once when the geometry is built and stored as a vertex colour, so it costs nothing per frame.
2. **Distance fade to the sky colour.** Each vertex's colour is mixed toward the background colour by its distance from the camera. Far objects sink into the sky, which gives depth without lighting. The sky is not a textured skybox: it is one flat colour, plus the fade, plus particles.
3. **Motes.** A few hundred soft points (fewer on phones) fill a box that wraps around the camera, so the air is equally full wherever the camera is. Each drifts and twinkles slowly and fades before the box edge. In space they read as stars and dust; near the surface as drifting dust.
4. **In-scene grain.** The fragment shader adds a small random offset per block of about 1.5 screen pixels, darkens every third row slightly as a scanline, and passes one faint slow-moving band up the screen. The grain is therefore part of the picture, at a fixed blocky size on any screen.
5. **Overlay grain and vignette.** Above the whole page sits a small canvas-generated tile of sparse light and dark specks at low alpha, repeated, and shifted to a new offset about eight times a second in hard steps so it flickers like film. A radial vignette darkens the corners. Both use plain alpha with no blend modes or CSS filters, so they cost the compositor one layer and scrolling stays smooth.
6. **Camera stops.** Each stop is a camera position, a look-at target and a field of view. A Catmull-Rom spline runs through them by scroll progress. Portrait screens get a wider field of view. Smoothing is time-based so it feels identical at any refresh rate.
7. **Arrival.** On load the first view starts raised above its place and eases down onto it once the scene has warmed up.

For the poster palette, each material's three tones come from the six colours: for example the station is cream, mustard and navy; the terrain layers are teal, navy and ink.

## Architecture

Everything new lives under `src/descent/` and `descent/`. Each unit has one job.

| Unit | Job | Depends on |
|---|---|---|
| `descent/index.html` | Page shell, font preloads | none |
| `src/descent/main.jsx` | Mounts `DescentApp` | React |
| `src/descent/DescentApp.jsx` | Lays out scroll track, canvas, overlay; owns the opening sequence state | all below |
| `src/descent/content/stops.js` | The five stops' titles, captions and links, as data | none |
| `src/descent/scroll/progress.js` | Pure functions: raw scroll to `p`, time-based damping, nearest stop | none |
| `src/descent/scroll/useScrollProgress.js` | Hook that reads scroll, applies damping per frame, exposes `p` through a ref | `progress.js` |
| `src/descent/scene/palette.js` | The six colours | none |
| `src/descent/scene/cameraPath.js` | Pure: keyframes (position, target, field of view) and `sampleCamera(p, aspect)` | none |
| `src/descent/scene/layout.js` | Pure: where everything is in the world, and the descent path the craft and ribbon follow | none |
| `src/descent/scene/build.js` | Pure: three-tone geometry builder (quads, boxes, lathes) and a seeded random source | palette |
| `src/descent/scene/sceneMaterial.js` | The shared material: vertex colours, distance fade, in-scene grain | three |
| `src/descent/ui/grainTile.js` | Pure: pixel data for the overlay grain tile | none |
| `src/descent/webgl.js` | Detects whether WebGL is available | none |
| `src/descent/scene/Scene.jsx` | Composes the objects, drives the camera from `p` each frame | objects, `cameraPath.js` |
| `src/descent/scene/shaders/stipple.js` | Stipple-shaded sphere material | three |
| `src/descent/scene/objects/*.jsx` | One file each: `Starfield`, `GiantPlanet`, `Rings`, `Station`, `CloudBands`, `Terrain`, `Drone`, `DomeBase`, `Astronaut`, `TrailRibbon` | three, palette |
| `src/descent/ui/PosterFrame.jsx` | Paper border and grain overlay | none |
| `src/descent/ui/StopCaption.jsx` | Title and caption for one stop, shown by `p` | `stops.js` |
| `src/descent/ui/Opening.jsx` | Name flash while the scene warms up | none |
| `src/descent/quality.js` | Pure: decides the render resolution from recent frame times | none |
| `src/descent/descent.css` | Page styles | none |

Data flow: scroll position, to `useScrollProgress`, to a damped `p` held in a ref. `Scene` reads `p` every frame and sets the camera from `sampleCamera`. `StopCaption` reads the nearest stop and fades text in and out. `p` never goes through React state, so scrolling causes no re-renders.

### Camera

`cameraPath.js` holds one keyframe per stop plus a few in-between ones for the tip toward the moon and the final approach. `sampleCamera` interpolates position and target with a Catmull-Rom spline and field of view linearly. On tall (phone) aspect ratios it widens the field of view and shifts the target so the focal object stays in frame. Damping is time-based (`1 - exp(-dt / tau)`), so the feel is the same at 60 and 120 Hz.

### Models

All geometry is generated in code from boxes, cylinders, lathes and extruded outlines. There are no model files. Parts that spin (station, rings, moons, drone rotors) rotate through a per-object uniform or a simple per-frame transform; the scene is small enough that this needs no further optimisation.

The trail ribbon is a strip built along a fixed spline from deep space to the landing site, with the three stripes as vertex colours. A uniform reveals it up to the craft's current position.

### Opening

1. The page loads on a navy ground with the name in cream.
2. The scene renders hidden until three frames in a row take under 25 ms, or 1.5 s passes.
3. The canvas fades in and the first poster's caption appears.

### Performance and fallbacks

- Device pixel ratio is capped at 2. `quality.js` steps it down (2, 1.5, 1) when the average frame time while scrolling stays above 20 ms, and never steps back up within a visit.
- Rendering pauses when the tab is hidden.
- Reduced motion: no camera travel, no ribbon animation. Each stop shows its fixed poster frame, and the page snaps between them.
- No WebGL: the page shows the five captions on the navy ground with the paper border, plus the link to the full portfolio.

## Testing

Automated (vitest), for the pure logic only:
- `cameraPath.js`: `sampleCamera` returns each stop's keyframe exactly at its `p`; values are continuous between stops; `p` outside 0 to 1 is clamped.
- `progress.js`: scroll maps to `p` correctly at the top, bottom and middle; damping converges and gives the same result for one 32 ms step as for two 16 ms steps; nearest-stop selection is correct at the boundaries.
- `quality.js`: steps down after sustained slow frames, ignores a single slow frame, never steps up.

Manual, in the browser:
- Desktop and phone viewport sizes: every stop composes as a poster, text is readable, nothing clips.
- Scroll the full length both ways; no jumps or blank frames.
- Reduced motion and no-WebGL fallbacks.
- The main site at `/` is unchanged.

## Out of scope for this version

- Draggable panels, light and dark themes, multiple languages.
- Sound.
- Replacing the main landing page. If the showpiece is good enough, that is a separate decision and a separate change.
- A project card for it on the main site's timeline (added once it is worth showing).

## Open points

- Deployment is deferred. This version runs on localhost only (`npm run dev`, then `/descent/`). Nothing is pushed. Hosting on Vercel is decided once it looks and feels right.
