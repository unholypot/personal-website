// How the little rocket flies, by scroll progress p. Pure timing and shape; Craft.jsx and TrailRibbon.jsx draw it.
//
// 1. Until the thesis shot it follows its line nose first, trailing the striped ribbon.
// 2. Then the ribbon is reeled in, and the rocket turns itself over on its side jets until its engine points down.
// 3. It comes down slowly on its engine, straight onto the landing pad, and stands there.
import { hermite } from './layout.js'

export const CRAFT_LEAD = 0.04 // how far along its line it is ahead of the camera's progress, until the thesis shot

export const TURN_START = 0.57 // it begins to turn over
export const TURN_END = 0.66 // and is upright, engine down
export const TOUCHDOWN = 0.85 // it settles on the pad

export const TRAIL_OFF_START = 0.55 // the ribbon begins to be taken in, from its tail
export const TRAIL_OFF_END = 0.64 // and is gone

const HAND_OVER = TURN_START - 0.01 // from here the line is followed at its own pace, not the camera's

const clamp01 = (v) => (v > 0 ? (v < 1 ? v : 1) : 0)
const smooth = (v) => {
  const x = clamp01(v)
  return x * x * (3 - 2 * x)
}

// How far along its line the rocket is (0 to 1), for scroll progress p. Until HAND_OVER it keeps its lead on the
// camera; after that it slows steadily and settles on the pad at TOUCHDOWN, with no speed at all at the moment of touching.
export function craftT(p) {
  const q = Number.isFinite(p) ? p : 0
  const from = HAND_OVER + CRAFT_LEAD
  if (q <= HAND_OVER) return Math.max(0, q + CRAFT_LEAD)
  if (q >= TOUCHDOWN) return 1
  const x = (q - HAND_OVER) / (TOUCHDOWN - HAND_OVER)
  // the speed it had on the way in, so there is no jolt at the hand-over, easing to a stop at the pad
  const entering = (TOUCHDOWN - HAND_OVER) / (1 - from)
  return from + (1 - from) * hermite(0, 1, entering, 0, x)
}

// 0 while it flies nose first, 1 once it is upright and engine down, and smooth between.
export const turnAmount = (p) => smooth((p - TURN_START) / (TURN_END - TURN_START))

// How much of the ribbon's tail has been taken in, 0 to 1 of what has been drawn.
export const trailReeled = (p) => smooth((p - TRAIL_OFF_START) / (TRAIL_OFF_END - TRAIL_OFF_START))

// The main engine: a quiet burn while it flies in, off while it turns over, then a full burn once it is upright
// that dies away as it touches down. 0 to 1.
export function engineAmount(p) {
  const cruise = 0.6 * (1 - smooth((p - (TURN_START - 0.03)) / 0.03))
  const retro = smooth((p - (TURN_END - 0.01)) / 0.02) * (1 - smooth((p - (TOUCHDOWN - 0.04)) / 0.035))
  return Math.max(cruise, retro)
}

// The small side jets that turn it over: puffing while it turns, still otherwise. 0 to 1.
export const jetAmount = (p) => {
  if (p <= TURN_START || p >= TURN_END) return 0
  const x = (p - TURN_START) / (TURN_END - TURN_START)
  return Math.sin(x * Math.PI)
}
