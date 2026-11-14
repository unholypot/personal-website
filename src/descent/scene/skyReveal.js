// How the constellations come in once the opening is over: one after another, each drawing itself
// line by line, with a short pause between them. Pure timing, in seconds.

export const FIRST_DELAY = 0.5 // after the scene is ready, before the first begins
export const STAGGER = 0.55 // between one figure starting and the next
export const DRAW_TIME = 1.7 // how long one takes to draw

// The order the figures appear in (indexes into the skills): a sweep across the sky rather than 1-2-3-4-5.
export const REVEAL_ORDER = [0, 3, 2, 4, 1]

const ease = (t) => 1 - (1 - t) * (1 - t)

// How much of figure `index` is drawn, from 0 to 1, `elapsed` seconds after the scene is ready.
export function revealAmount(elapsed, index) {
  const place = REVEAL_ORDER.indexOf(index)
  const start = FIRST_DELAY + (place < 0 ? REVEAL_ORDER.length : place) * STAGGER
  const t = (elapsed - start) / DRAW_TIME
  return ease(Math.min(1, Math.max(0, Number.isFinite(t) ? t : 0)))
}

// When everything is fully drawn.
export const REVEAL_END = FIRST_DELAY + (REVEAL_ORDER.length - 1) * STAGGER + DRAW_TIME

// Each figure's gentle drift across the sky, as [x, y] in the sky's own units (radians, nearly):
// a slow circle that differs from figure to figure, plus a lean with the pointer that also differs,
// so the figures slide against each other and against the stars behind them.
export const DRIFT = 0.0035
export const LEAN = [0.012, 0.006, 0.016, 0.004, 0.01]
export function figureShift(index, time, pointer) {
  const lean = LEAN[index % LEAN.length]
  const a = time * (0.11 + index * 0.017) + index * 1.9
  return [Math.cos(a) * DRIFT + pointer.x * lean, Math.sin(a * 0.8) * DRIFT * 0.7 - pointer.y * lean * 0.6]
}

// The same shift as a direction offset in the world: `e` is the camera's world matrix (column-major),
// whose first two columns are the screen's right and up. Zero when motion is off.
export function skyShift(index, time, pointer, e, motionOn) {
  if (!motionOn) return [0, 0, 0]
  const [sx, sy] = figureShift(index, time, pointer)
  return [e[0] * sx + e[4] * sy, e[1] * sx + e[5] * sy, e[2] * sx + e[6] * sy]
}

// The lines joining the stars do not draw themselves: they come up out of nothing, very slowly, once
// the stars are in, and then now and then swell a very little and settle again.
export const LINE_FADE_START = 1.2 // seconds after the scene is ready, for the first figure
export const LINE_FADE_STAGGER = 1.1
export const LINE_FADE_TIME = 12 // from almost nothing to resting brightness
export const LINE_PULSE = 0.45 // how much brighter, at the top of a pulse (a fraction of resting)

// How much of its resting brightness figure `index`'s lines have, 0 to 1, `elapsed` seconds in.
export function lineFade(elapsed, index) {
  const t = (elapsed - LINE_FADE_START - index * LINE_FADE_STAGGER) / LINE_FADE_TIME
  const x = Number.isFinite(t) ? Math.min(1, Math.max(0, t)) : 0
  return x * x * (3 - 2 * x) // eased at both ends, so it begins from a whisper
}

// The occasional swell, as a multiplier at or above 1. Each figure has its own slow rhythm (about a
// quarter of a minute to a swell), and only the top of the wave counts, so most of the time it is 1.
export function linePulse(time, index) {
  const wave = Math.sin(time * (0.21 + index * 0.023) + index * 2.3)
  const top = Math.max(0, wave - 0.45) / 0.55
  return 1 + LINE_PULSE * top * top
}

// When every figure's lines are fully up.
export const LINES_END = LINE_FADE_START + 4 * LINE_FADE_STAGGER + LINE_FADE_TIME
