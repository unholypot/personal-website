// Where everything is. Positions are [x, y, z], y up. The landing site is the origin.

// The one sun every body in the scene is lit by: the direction it shines FROM, so lit faces turn
// toward it. It is above, to the left and in front of the viewer, so each planet shows a bright
// face with its shadow falling low and to the right. Nothing may light itself differently.
export const SUN = [-0.45, 0.75, 0.5]

export const GIANT = {
  center: [-1500, 1700, -6000],
  radius: 1400,
  // How its rings (and its stripes) are tipped, as x, y, z turns in radians. Only a few degrees
  // toward the viewer, so the rings are seen nearly edge-on: a long flat ellipse tapering to each side.
  tilt: [(6 * Math.PI) / 180, 0, (5 * Math.PI) / 180],
}
// The destination moon. Its top is the landing ground at y = 0.
export const MOON = { center: [0, -1500, 0], radius: 1500 }
// How the moon's spin axis is tipped, as x, y, z turns in radians. Its ring lies in its equator
// and its winds blow round it, so both turn about this one axis.
export const MOON_TILT = [0.62, 0, 0.2]
export const STATION = [140, 1250, -260]
export const CLOUDS = { yMin: 420, yMax: 760 }
export const DRONE = [-31.5, 54, 88.5]
export const BASE = [-6, 0, -70]
// Height of the rise the astronaut stands on.
export const RIDGE_TOP = 7
export const RIDGE = [-19, 0, 10]

// The radio telescope array on the plain: the middle of its Y, [x, z].
export const RADIO_ARRAY = [150, -10]

// Where the craft sets down, beside the base: [x, z].
export const LANDING_PAD = [22, -50]

// The line the craft flies and the ribbon is drawn along.
// Each point sits ahead of where the camera is at that moment, and a little to its right, so the craft leads the
// eye down and stays in the frame (worked out from the camera's path; see CRAFT_LEAD in Craft.jsx).
export const PATH_POINTS = [
  [700, 2400, 4300],
  [625, 2177, 3391],
  [516, 1854, 2062],
  [400, 1505, 739],
  [278, 1409, -235],
  [190, 1087, -457],
  [145, 696, -268],
  [133, 497, -66],
  [150, 448, -28],
  [131, 348, -15],
  [60, 190, 15],
  [16, 68, 37],
  [10, 44, 40],
  [10, 15, 20],
  [14, 5, -6],
  [19, 3, -32],
  [LANDING_PAD[0], 1, LANDING_PAD[1]],
]

// Cubic Hermite between b and c, with tangents mb and mc already scaled to the segment.
export function hermite(b, c, mb, mc, t) {
  const t2 = t * t
  const t3 = t2 * t
  return (2 * t3 - 3 * t2 + 1) * b + (t3 - 2 * t2 + t) * mb + (-2 * t3 + 3 * t2) * c + (t3 - t2) * mc
}

function segment(t) {
  const n = PATH_POINTS.length - 1
  const x = Math.min(Math.max(t > 0 ? t : 0, 0), 1) * n
  const i = Math.min(n - 1, Math.floor(x))
  return [i, x - i]
}

const at = (i) => PATH_POINTS[Math.max(0, Math.min(PATH_POINTS.length - 1, i))]

export function pathPoint(t) {
  const [i, u] = segment(t)
  const a = at(i - 1)
  const b = at(i)
  const c = at(i + 1)
  const d = at(i + 2)
  return [0, 1, 2].map((k) => hermite(b[k], c[k], (c[k] - a[k]) / 2, (d[k] - b[k]) / 2, u))
}

export function pathTangent(t) {
  const e = 0.002
  const a = pathPoint(Math.max(0, t - e))
  const b = pathPoint(Math.min(1, t + e))
  const v = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
  const len = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / len, v[1] / len, v[2] / len]
}
