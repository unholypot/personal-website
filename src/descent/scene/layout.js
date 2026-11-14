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

// The line the craft flies and the ribbon is drawn along. The first point is up and off to the right of the opening
// view, so the craft comes in from beyond the frame and heads down it; the next two keep it in frame ahead of the
// camera. The fourth is straight above the landing pad: the craft comes down from there, tail first.
// A tall phone screen sees a much narrower slice of the sky, so it has its own first three points.
const LANDING = [
  [24, 110, -50],
  [LANDING_PAD[0], 1.4, LANDING_PAD[1]],
]
export const PATH_POINTS_WIDE = [[1538, 3069, 3051], [537, 1434, 272], [125, 413, -30], ...LANDING]
export const PATH_POINTS_TALL = [[599, 4002, 2032], [472, 1371, -314], [56, 520, -83], ...LANDING]
const tall = typeof window !== 'undefined' && window.innerWidth / window.innerHeight < 1
export const PATH_POINTS = tall ? PATH_POINTS_TALL : PATH_POINTS_WIDE

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

// A smooth curve through the points, with no loops or kinks where the points are spaced unevenly: at each
// point the curve heads the way from the point before to the point after, and each stretch takes its
// tangents at its own length, so a short stretch is never thrown into a hook by its long neighbour.
export function pathPoint(t) {
  const [i, u] = segment(t)
  const a = at(i - 1)
  const b = at(i)
  const c = at(i + 1)
  const d = at(i + 2)
  const heading = (from, to) => {
    const v = [to[0] - from[0], to[1] - from[1], to[2] - from[2]]
    const len = Math.hypot(v[0], v[1], v[2]) || 1
    return [v[0] / len, v[1] / len, v[2] / len]
  }
  const hb = heading(a, c)
  const hc = heading(b, d)
  const length = Math.hypot(c[0] - b[0], c[1] - b[1], c[2] - b[2])
  return [0, 1, 2].map((k) => hermite(b[k], c[k], hb[k] * length, hc[k] * length, u))
}

export function pathTangent(t) {
  const e = 0.002
  const a = pathPoint(Math.max(0, t - e))
  const b = pathPoint(Math.min(1, t + e))
  const v = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
  const len = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / len, v[1] / len, v[2] / len]
}
