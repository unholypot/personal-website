// A very slight sway of the view with the pointer, so the scene feels like a place you are in.
// The pointer's position is smoothed here and turned into two small turns of the camera.
import { damp } from './progress.js'

// The most the camera turns, in radians (about 1.1 and 0.7 degrees).
export const MAX_YAW = 0.02
export const MAX_PITCH = 0.012

export const createPointer = () => ({ x: 0, y: 0, tx: 0, ty: 0, on: false })
// The one the page uses. `on` is only set where there is a fine pointer and motion is welcome.
export const pointer = createPointer()

const clamp1 = (v) => Math.max(-1, Math.min(1, v))

// Aim at a position in the window: the middle is 0, the edges are -1 and 1.
export function aim(p, clientX, clientY, width, height) {
  if (!(width > 0) || !(height > 0)) {
    p.tx = 0
    p.ty = 0
    return
  }
  p.tx = clamp1((clientX / width) * 2 - 1)
  p.ty = clamp1((clientY / height) * 2 - 1)
}

export function step(p, dt) {
  p.x = damp(p.x, p.tx, dt, 0.35)
  p.y = damp(p.y, p.ty, dt, 0.35)
}

// [turn about the vertical, turn about the horizontal]: the view leans toward the pointer.
export const parallaxAngles = (p) => [0 - p.x * MAX_YAW, 0 - p.y * MAX_PITCH]
