// The camera's journey: where it is, what it looks at and how wide it sees, by scroll progress.
import { GIANT, hermite } from './layout.js'

// The five stops sit at p = 0, 0.25, 0.5, 0.75 and 1. The others shape the travel between them.
export const KEYFRAMES = [
  { p: 0.0, position: [600, 2600, 5000], target: GIANT.center, fov: 50 },
  { p: 0.25, position: [320, 1330, 120], target: [36, 1293, -519], fov: 42 },
  { p: 0.4, position: [120, 800, 260], target: [0, 300, 0], fov: 55 },
  { p: 0.5, position: [70, 560, 200], target: [0, 380, -200], fov: 60 },
  { p: 0.75, position: [-30, 60, 130], target: [10, 40, -80], fov: 55 },
  { p: 0.9, position: [-14, 12, 62], target: [-19, 8, 10], fov: 46 },
  { p: 1.0, position: [-12, 3, 44], target: [-334, 159, -890], fov: 36 },
]

const K = (i) => KEYFRAMES[Math.max(0, Math.min(KEYFRAMES.length - 1, i))]

// Slope at keyframe i, from its neighbours, per unit of p (0 at the two ends).
function slope(i, get, k) {
  const a = K(i - 1)
  const c = K(i + 1)
  const dp = c.p - a.p
  return dp > 0 ? (get(c)[k] - get(a)[k]) / dp : 0
}

function along(i, t, get) {
  const b = K(i)
  const c = K(i + 1)
  const dp = c.p - b.p
  return [0, 1, 2].map((k) =>
    hermite(get(b)[k], get(c)[k], slope(i, get, k) * dp, slope(i + 1, get, k) * dp, t),
  )
}

const position = (k) => k.position
const target = (k) => k.target

export function sampleCamera(p, aspect) {
  const q = p > 0 ? (p < 1 ? p : 1) : 0
  let i = 0
  while (i < KEYFRAMES.length - 2 && q >= KEYFRAMES[i + 1].p) i++
  const b = KEYFRAMES[i]
  const c = KEYFRAMES[i + 1]
  const t = (q - b.p) / (c.p - b.p)
  let fov = b.fov + (c.fov - b.fov) * t
  if (aspect < 1) fov = Math.min(85, fov * 1.4)
  return { position: along(i, t, position), target: along(i, t, target), fov }
}
