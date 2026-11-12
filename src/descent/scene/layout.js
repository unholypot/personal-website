// Where everything is. Positions are [x, y, z], y up. The landing site is the origin.

export const GIANT = { center: [-1500, 1700, -6000], radius: 1400 }
// The destination moon. Its top is the landing ground at y = 0.
export const MOON = { center: [0, -1500, 0], radius: 1500 }
export const STATION = [140, 1250, -260]
export const CLOUDS = { yMin: 420, yMax: 760 }
export const DRONE = [-15, 54, 91]
export const BASE = [-6, 0, -70]
// Height of the rise the astronaut stands on.
export const RIDGE_TOP = 7
export const RIDGE = [-19, 0, 10]

// The line the craft flies and the ribbon is drawn along.
// Each point sits ahead of where the camera is at that moment, so the craft leads the eye down.
export const PATH_POINTS = [
  [700, 2400, 4300],
  [300, 1200, -150],
  [40, 330, 60],
  [10, 44, 40],
  [6, 1, -56],
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
