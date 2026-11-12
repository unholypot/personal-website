// Three-tone geometry builder. Every flat face gets one of its material's three tones,
// chosen by which way it faces a single fixed light, and stored as a vertex colour.
import { BufferGeometry, Float32BufferAttribute } from 'three'
import { rgb } from './palette.js'

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const unit = (a) => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1
  return [a[0] / l, a[1] / l, a[2] / l]
}

export const LIGHT = unit([-0.45, 0.75, 0.5])

export function pickTone(normal, tones) {
  const d = dot(normal, LIGHT)
  return d > 0.4 ? tones[0] : d > -0.1 ? tones[1] : tones[2]
}

// Small seeded random source, so generated shapes are the same on every load.
export function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Normal of a (possibly degenerate) quad, by Newell's method.
function faceNormal(pts) {
  const n = [0, 0, 0]
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    n[0] += (a[1] - b[1]) * (a[2] + b[2])
    n[1] += (a[2] - b[2]) * (a[0] + b[0])
    n[2] += (a[0] - b[0]) * (a[1] + b[1])
  }
  return unit(n)
}

export function createBuilder() {
  const positions = []
  const colors = []

  const push = (p, c) => {
    positions.push(p[0], p[1], p[2])
    colors.push(c[0], c[1], c[2])
  }

  // Two triangles, one tone. With awayFrom, the face is turned to look away from that point.
  function quad(a, b, c, d, tones, awayFrom) {
    let n = faceNormal([a, b, c, d])
    let order = [a, b, c, a, c, d]
    if (awayFrom) {
      const centre = [(a[0] + b[0] + c[0] + d[0]) / 4, (a[1] + b[1] + c[1] + d[1]) / 4, (a[2] + b[2] + c[2] + d[2]) / 4]
      if (dot(n, sub(centre, awayFrom)) < 0) {
        n = [-n[0], -n[1], -n[2]]
        order = [a, c, b, a, d, c]
      }
    }
    const col = rgb(pickTone(n, tones))
    order.forEach((p) => push(p, col))
  }

  function box(center, size, tones, rotY = 0) {
    const [x, y, z] = center
    const [w, h, d] = size
    const cs = Math.cos(rotY)
    const sn = Math.sin(rotY)
    const P = (a, b, e) => [x + (a * w * cs) / 2 + (e * d * sn) / 2, y + (b * h) / 2, z - (a * w * sn) / 2 + (e * d * cs) / 2]
    const lo = [P(-1, -1, -1), P(1, -1, -1), P(1, -1, 1), P(-1, -1, 1)]
    const hi = [P(-1, 1, -1), P(1, 1, -1), P(1, 1, 1), P(-1, 1, 1)]
    quad(lo[0], lo[1], lo[2], lo[3], tones, center)
    quad(hi[0], hi[1], hi[2], hi[3], tones, center)
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4
      quad(lo[i], lo[j], hi[j], hi[i], tones, center)
    }
  }

  // A faceted body turned about the y axis. rings: [[y, radius], ...] from bottom to top.
  function lathe(rings, segments, tones, offset = [0, 0, 0]) {
    const ring = ([y, r]) =>
      Array.from({ length: segments }, (_, i) => {
        const a = (i / segments) * Math.PI * 2
        return [offset[0] + Math.cos(a) * r, offset[1] + y, offset[2] + Math.sin(a) * r]
      })
    const loops = rings.map(ring)
    for (let k = 0; k < rings.length - 1; k++) {
      const axis = [offset[0], offset[1] + (rings[k][0] + rings[k + 1][0]) / 2, offset[2]]
      for (let i = 0; i < segments; i++) {
        const j = (i + 1) % segments
        quad(loops[k][i], loops[k][j], loops[k + 1][j], loops[k + 1][i], tones, axis)
      }
    }
    const cap = (k, dir) => {
      const [y, r] = rings[k]
      if (!(r > 0)) return
      const c = [offset[0], offset[1] + y, offset[2]]
      const col = rgb(pickTone([0, dir, 0], tones))
      for (let i = 0; i < segments; i++) {
        const j = (i + 1) % segments
        const tri = dir > 0 ? [c, loops[k][j], loops[k][i]] : [c, loops[k][i], loops[k][j]]
        tri.forEach((p) => push(p, col))
      }
    }
    cap(0, -1)
    cap(rings.length - 1, 1)
  }

  // A flat outline filled with one colour: for silhouettes. points must be planar and convex-ish from points[0].
  function flat(points, tones) {
    const col = rgb(tones[0])
    for (let i = 1; i < points.length - 1; i++) [points[0], points[i], points[i + 1]].forEach((p) => push(p, col))
  }

  // A flat ring (or arc of one, or a disc when inner is 0) lying level, in one colour.
  function annulus(center, inner, outer, segments, color, start = 0, sweep = Math.PI * 2) {
    const col = rgb(color)
    const at = (r, a) => [center[0] + Math.cos(a) * r, center[1], center[2] + Math.sin(a) * r]
    for (let i = 0; i < segments; i++) {
      const a0 = start + (sweep * i) / segments
      const a1 = start + (sweep * (i + 1)) / segments
      const q = [at(inner, a0), at(outer, a0), at(outer, a1), at(inner, a1)]
      ;[q[0], q[2], q[1], q[0], q[3], q[2]].forEach((p) => push(p, col))
    }
  }

  function toGeometry() {
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(positions, 3))
    g.setAttribute('color', new Float32BufferAttribute(colors, 3))
    g.computeBoundingSphere()
    return g
  }

  return { positions, colors, quad, box, lathe, flat, annulus, toGeometry }
}
