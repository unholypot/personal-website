// The camera's journey: where it is, what it looks at and how wide it sees, by scroll progress.
import { GIANT, hermite } from './layout.js'

// The five stops sit at p = 0, 0.25, 0.5, 0.75 and 1. The others shape the travel between them.
// `target` only sets which way the camera looks from `position`; how far off it is does not matter.
export const KEYFRAMES = [
  // the opening looks a little below the giant, which lifts the moon into the frame
  { p: 0.0, position: [600, 2600, 5000], target: [GIANT.center[0], GIANT.center[1] - 650, GIANT.center[2]], fov: 50 },
  { p: 0.25, position: [300, 1500, 560], target: [263, 1137, -152], fov: 48 },
  { p: 0.4, position: [120, 800, 260], target: [103, 571, -67], fov: 55 },
  { p: 0.5, position: [70, 560, 200], target: [51, 397, -165], fov: 60 },
  // the drone stop: the camera arrives, drifts slowly past the drone, then leaves
  { p: 0.68, position: [-28, 78, 160], target: [-76, 15, -232], fov: 55 },
  { p: 0.75, position: [-30, 60, 130], target: [-85, 25, -265], fov: 55 },
  { p: 0.82, position: [-27, 50, 112], target: [-93, 43, -282], fov: 52 },
  { p: 0.9, position: [-14, 12, 62], target: [-97, 22, -329], fov: 46 },
  { p: 1.0, position: [-12, 3, 44], target: [-334, 159, -890], fov: 45 },
]

const K = (i) => KEYFRAMES[Math.max(0, Math.min(KEYFRAMES.length - 1, i))]

const unit = (v) => {
  const len = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / len, v[1] / len, v[2] / len]
}

const position = (k) => k.position
// The way each keyframe looks, as a unit vector. Blending these (not the target points, which
// lie at wildly different distances) is what makes the camera turn at an even rate.
const DIRECTIONS = new Map(KEYFRAMES.map((k) => [k, unit(k.target.map((v, i) => v - k.position[i]))]))
const direction = (k) => DIRECTIONS.get(k)
const zoom = (k) => [k.fov]

// Slope at keyframe i, per unit of p, chosen so the curve never overshoots its keyframes:
// flat where the values turn round, and never steeper than three times the gentler side.
function slope(i, get, k) {
  if (i <= 0 || i >= KEYFRAMES.length - 1) return 0
  const a = K(i - 1)
  const b = K(i)
  const c = K(i + 1)
  const before = (get(b)[k] - get(a)[k]) / (b.p - a.p)
  const after = (get(c)[k] - get(b)[k]) / (c.p - b.p)
  if (before * after <= 0) return 0
  const through = (get(c)[k] - get(a)[k]) / (c.p - a.p)
  const limit = 3 * Math.min(Math.abs(before), Math.abs(after))
  return Math.sign(through) * Math.min(Math.abs(through), limit)
}

function along(i, t, get) {
  const b = K(i)
  const c = K(i + 1)
  const dp = c.p - b.p
  return [0, 1, 2].map((k) =>
    hermite(get(b)[k], get(c)[k], slope(i, get, k) * dp, slope(i + 1, get, k) * dp, t),
  )
}

// How far ahead of the camera the returned target sits.
const LOOK_AHEAD = 100

export function sampleCamera(p, aspect) {
  const q = p > 0 ? (p < 1 ? p : 1) : 0
  let i = 0
  while (i < KEYFRAMES.length - 2 && q >= KEYFRAMES[i + 1].p) i++
  const b = KEYFRAMES[i]
  const c = KEYFRAMES[i + 1]
  const t = (q - b.p) / (c.p - b.p)
  const dp = c.p - b.p
  let fov = hermite(b.fov, c.fov, slope(i, zoom, 0) * dp, slope(i + 1, zoom, 0) * dp, t)
  if (aspect < 1) fov = Math.min(85, fov * 1.4)
  const at = along(i, t, position)
  const look = unit(along(i, t, direction))
  return { position: at, target: at.map((v, k) => v + look[k] * LOOK_AHEAD), fov }
}
