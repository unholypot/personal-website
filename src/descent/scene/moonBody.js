// A small moon with real craters: a faceted sphere whose surface is pushed in to make bowls and
// out to make raised rims, so its outline is lumpy and every facet catches the light differently.
// Pure maths; GiantPlanet.jsx turns the result into meshes.
import { rng } from './random.js'

const SIZE_MIN = 0.1 // crater radii in radians of arc, as seen from the moon's centre
const SIZE_MAX = 0.38
const COUNT = 10
const DEPTH = 0.36 // bowl depth as a fraction of the crater's size
const RIM = 0.1 // rim height likewise
const BOWL_EDGE = 0.9 // the bowl reaches this far out (in crater radii); the rim lies beyond it
const RIM_EDGE = 1.25

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

// A scatter of craters on the unit sphere: { dir, size }, the same for the same seed, none overlapping.
export function moonCraters(seed) {
  const rand = rng(seed * 97 + 13)
  const out = []
  // bigger ones first, so they find room
  const sizes = Array.from({ length: COUNT }, (_, i) => SIZE_MAX - ((SIZE_MAX - SIZE_MIN) * i) / (COUNT - 1) + (rand() - 0.5) * 0.03)
  for (const raw of sizes) {
    const size = Math.min(SIZE_MAX, Math.max(SIZE_MIN, raw))
    for (let attempt = 0; attempt < 300; attempt++) {
      const y = rand() * 2 - 1
      const a = rand() * Math.PI * 2
      const ring = Math.sqrt(1 - y * y)
      const dir = [Math.cos(a) * ring, y, Math.sin(a) * ring]
      const clear = out.every((c) => Math.acos(Math.min(1, Math.max(-1, dot(c.dir, dir)))) >= (c.size + size) * 0.75)
      if (clear) {
        out.push({ dir, size })
        break
      }
    }
  }
  return out
}

// How far the surface at unit direction d is raised (+) or sunk (-), as a fraction of the radius.
export function craterHeight(d, craters) {
  let h = 0
  for (const c of craters) {
    const t = Math.acos(Math.min(1, Math.max(-1, dot(d, c.dir)))) / c.size
    if (t < BOWL_EDGE) {
      const u = t / BOWL_EDGE
      h -= DEPTH * c.size * (1 - u * u)
    } else if (t < RIM_EDGE) {
      h += RIM * c.size * Math.sin((Math.PI * (t - BOWL_EDGE)) / (RIM_EDGE - BOWL_EDGE))
    }
  }
  return h
}

// The 12 corners and 20 faces of an icosahedron.
const PHI = (1 + Math.sqrt(5)) / 2
const CORNERS = [
  [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
  [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
  [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1],
]
const FACES = [
  [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
  [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
  [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
  [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
]

// Flat triangles (three numbers a corner, nine a triangle) of a cratered sphere of radius `radius`.
// `detail` splits each icosahedron edge into detail + 1 parts.
export function moonPositions(radius, seed, detail) {
  const craters = moonCraters(seed)
  const n = detail + 1
  const out = new Float32Array(FACES.length * n * n * 9)
  let k = 0
  const push = (p) => {
    const l = Math.hypot(p[0], p[1], p[2])
    const d = [p[0] / l, p[1] / l, p[2] / l]
    const r = radius * (1 + craterHeight(d, craters))
    out[k++] = d[0] * r
    out[k++] = d[1] * r
    out[k++] = d[2] * r
  }
  for (const [ia, ib, ic] of FACES) {
    const A = CORNERS[ia]
    const B = CORNERS[ib]
    const C = CORNERS[ic]
    // a point on the face at barycentric (i, j) of n steps
    const at = (i, j) => [0, 1, 2].map((m) => A[m] + ((B[m] - A[m]) * i) / n + ((C[m] - A[m]) * j) / n)
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n - i; j++) {
        push(at(i, j))
        push(at(i + 1, j))
        push(at(i, j + 1))
        if (j < n - i - 1) {
          push(at(i + 1, j))
          push(at(i + 1, j + 1))
          push(at(i, j + 1))
        }
      }
  }
  return out
}
