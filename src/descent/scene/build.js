// Three-tone geometry builder. Every flat face gets one of its material's three tones,
// chosen by which way it faces a single fixed light, and stored as a vertex colour.
import { BufferGeometry, Float32BufferAttribute, IcosahedronGeometry } from 'three'
import { SUN } from './layout.js'
import { rgb } from './palette.js'

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const unit = (a) => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1
  return [a[0] / l, a[1] / l, a[2] / l]
}

export const LIGHT = unit(SUN)

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

  // One triangle, one tone. With awayFrom, it is turned to look away from that point.
  // `blend` (0..1) slides its tone part of the way toward the next darker one.
  function tri(a, b, c, tones, awayFrom, blend = 0) {
    if (place) {
      a = place(a)
      b = place(b)
      c = place(c)
      if (awayFrom) awayFrom = place(awayFrom)
    }
    let n = faceNormal([a, b, c])
    let order = [a, b, c]
    if (awayFrom) {
      const centre = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3]
      if (dot(n, sub(centre, awayFrom)) < 0) {
        n = [-n[0], -n[1], -n[2]]
        order = [a, c, b]
      }
    }
    const tone = pickTone(n, tones)
    let col = rgb(tone)
    if (blend > 0) {
      const darker = rgb(tones[Math.min(2, tones.indexOf(tone) + 1)])
      col = col.map((v, i) => v + (darker[i] - v) * blend)
    }
    order.forEach((p) => push(p, col))
  }

  // A lumpy faceted rock: a twenty-sided ball cut finer, each corner pushed in or out by a hash of
  // where it is (so corners that meet move together and no cracks open), then squashed and turned.
  function rock(center, radius, tones, { seed = 1, squash = 1, turn = [0, 0, 0] } = {}) {
    const base = new IcosahedronGeometry(1, 1).getAttribute('position')
    const salt = seed * 17.3
    const lump = (x, y, z) => {
      const v = Math.sin(Math.round(x * 100) * 12.9898 + Math.round(y * 100) * 78.233 + Math.round(z * 100) * 37.719 + salt) * 43758.5453
      return v - Math.floor(v)
    }
    const [cx, cy, cz] = turn.map(Math.cos)
    const [sx, sy, sz] = turn.map(Math.sin)
    const point = (i) => {
      const k = 1 + (lump(base.getX(i), base.getY(i), base.getZ(i)) - 0.5) * 0.7
      let x = base.getX(i) * k * radius
      let y = base.getY(i) * k * radius * squash
      let z = base.getZ(i) * k * radius
      // turn about x, then y, then z
      let t = y * cx - z * sx
      z = y * sx + z * cx
      y = t
      t = x * cy + z * sy
      z = -x * sy + z * cy
      x = t
      t = x * cz - y * sz
      y = x * sz + y * cz
      x = t
      return [center[0] + x, center[1] + y, center[2] + z]
    }
    for (let i = 0; i < base.count; i += 3) tri(point(i), point(i + 1), point(i + 2), tones, center)
  }

  // Runs `draw` (which builds about the origin, y up) and stands the result at `center` with its
  // up along `up`. Tones are chosen after it is placed, so the light still falls from one side.
  let place = null
  function tilted(center, up, draw) {
    const u = unit(up)
    const side = unit(Math.abs(u[1]) > 0.99 ? [1, 0, 0] : [u[2], 0, -u[0]])
    const fore = [side[1] * u[2] - side[2] * u[1], side[2] * u[0] - side[0] * u[2], side[0] * u[1] - side[1] * u[0]]
    place = (p) => [
      center[0] + side[0] * p[0] + u[0] * p[1] + fore[0] * p[2],
      center[1] + side[1] * p[0] + u[1] * p[1] + fore[1] * p[2],
      center[2] + side[2] * p[0] + u[2] * p[1] + fore[2] * p[2],
    ]
    draw()
    place = null
  }

  // A faceted peak: uneven rings narrowing to a point (or to a small level top, with `plateau`).
  // Every triangle takes its own tone, so it reads as a solid mountain from any side or from above.
  // center is the middle of its foot; the summit is `height` above that. `texture` (0..1) is how
  // much the shade wanders from face to face, which gives the rock its grain.
  function mountain(center, radius, height, tones, { seed = 1, segments = 7, tiers = 3, plateau = 0, texture = 0, up = null, ridged = false } = {}) {
    if (up) return tilted(center, up, () => mountain([0, 0, 0], radius, height, tones, { seed, segments, tiers, plateau, texture, ridged }))
    const rand = rng(seed)
    const [cx, cy, cz] = center
    const turn = rand() * Math.PI * 2
    // Persistent radial ribs run from foot to summit. Alternating buttresses
    // and gullies produce real changes in face orientation, not painted noise.
    const ribs = ridged ? Array.from({ length: segments }, (_, i) => (i % 2 ? 0.58 : 1.08) + rand() * 0.1) : null
    const rings = []
    const last = plateau > 0 ? tiers : tiers - 1
    for (let k = 0; k <= last; k++) {
      const f = k / tiers
      const r = plateau + (radius - plateau) * Math.pow(1 - f, 1.15)
      const y = cy + height * Math.pow(f, 0.85)
      const top = plateau > 0 && k === tiers
      rings.push(
        Array.from({ length: segments }, (_, i) => {
          const a = turn + ((i + (top ? 0 : (rand() - 0.5) * (ridged ? 0.12 : 0.5))) / segments) * Math.PI * 2
          const jitter = top ? 0.9 + rand() * 0.2 : ridged ? ribs[i] : 0.8 + rand() * 0.35
          const lift = ridged && k > 0 && !top ? Math.sin(i * 2.1 + seed) * height * 0.065 * Math.sin(f * Math.PI) : 0
          const lean = ridged ? radius * f * 0.18 : 0
          return [cx + Math.cos(a) * r * jitter + lean, y + lift, cz + Math.sin(a) * r * jitter]
        }),
      )
    }
    for (let k = 0; k < rings.length - 1; k++) {
      const axis = [cx, (rings[k][0][1] + rings[k + 1][0][1]) / 2, cz]
      for (let i = 0; i < segments; i++) {
        const j = (i + 1) % segments
        tri(rings[k][i], rings[k][j], rings[k + 1][j], tones, axis, rand() * texture)
        tri(rings[k][i], rings[k + 1][j], rings[k + 1][i], tones, axis, rand() * texture)
      }
    }
    const crown = rings[rings.length - 1]
    const lean = plateau > 0 ? 0 : radius * 0.12
    const summit = [cx + (ridged ? radius * 0.18 : (rand() - 0.5) * lean), cy + height, cz + (rand() - 0.5) * lean]
    const inside = [cx, cy, cz]
    for (let i = 0; i < segments; i++) tri(crown[i], crown[(i + 1) % segments], summit, tones, inside, rand() * texture)
  }

  function toGeometry() {
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(positions, 3))
    g.setAttribute('color', new Float32BufferAttribute(colors, 3))
    g.computeBoundingSphere()
    return g
  }

  return { positions, colors, quad, tri, box, lathe, flat, annulus, mountain, rock, toGeometry }
}
