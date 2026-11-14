// Craters that read as chunks taken out of the moon, not circles painted on it.
//
// Each crater is worked out as a real bowl: a flat floor, walls that climb to a raised rim,
// ejecta thrown out beyond it, and for the big ones terraced walls and a peak in the middle.
// Every facet of that bowl is then shaded by which way it faces the light, in a handful of flat
// poster tones. The facets are laid on the ground as decals (see createSceneMaterial's
// `decal`), so the shapes need no holes cut in the moon: from above they read as deep bowls.
import { LIGHT } from './build.js'
import { PALETTE, mix, rgb } from './palette.js'
import { PLAIN_BLEND_RADIUS, PLAIN_RADIUS, groundAt } from './ground.js'

const mustard = rgb(PALETTE.mustard)
const cream = rgb(PALETTE.cream)
const navy = rgb(PALETTE.navy)
const ink = rgb(PALETTE.ink)

// From the facets that face the light to those that turn from it. `ground` is level ground.
const TONE = {
  bright: mix(mustard, cream, 0.66),
  ground: mustard,
  mid: mix(mustard, navy, 0.26),
  shadow: mix(mustard, navy, 0.52),
  deep: mix(mustard, navy, 0.74),
}
// Pale streaks of dust thrown out of a young crater.
const RAY = mix(mustard, cream, 0.3)

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const unit = (v) => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / l, v[1] / l, v[2] / l]
}
const smooth = (t) => t * t * (3 - 2 * t)

// The shape of a crater of radius r, in units of that radius.
export function craterShape(r) {
  const complex = r > 28
  return {
    complex,
    depth: complex ? 0.15 : r > 5 ? 0.22 : 0.26,
    rim: complex ? 0.05 : 0.07,
    floor: complex ? 0.5 : 0.42, // the flat floor reaches out to this radius
    peak: complex ? 0.09 : 0, // height of the peak in the middle
    terraces: r > 18, // walls that step down in benches
    reach: 1.38, // where the thrown-out rim settles back to the ground
  }
}

// Height of the crater above the ground at radius rho (1 is the rim), in units of its radius.
export function craterProfile(rho, shape) {
  if (rho >= shape.reach) return 0
  if (rho > 1) return shape.rim * (1 - smooth((rho - 1) / (shape.reach - 1)))
  if (rho >= shape.floor) {
    let t = (rho - shape.floor) / (1 - shape.floor)
    if (shape.terraces) {
      const k = t * 3
      t = (Math.floor(k) + smooth(k - Math.floor(k))) / 3
    }
    return -shape.depth + (shape.depth + shape.rim) * t
  }
  const peakWidth = 0.2
  return -shape.depth + (shape.peak > 0 ? shape.peak * Math.max(0, 1 - rho / peakWidth) : 0)
}

// Which way is up on the ground at (x, z), and two directions along it.
function frameAt(x, z) {
  const e = 3
  const dx = (groundAt(x + e, z) - groundAt(x - e, z)) / (2 * e)
  const dz = (groundAt(x, z + e) - groundAt(x, z - e)) / (2 * e)
  const up = unit([-dx, 1, -dz])
  const e1 = unit(cross([0, 0, 1], up))
  return { up, e1, e2: cross(up, e1) }
}

// How much light the ground here gets: 1 in full light, 0 on the unlit side of the moon.
const lightOn = (up) => smooth(Math.min(1, Math.max(0, (dot(up, LIGHT) + 0.35) / 0.7)))
// Ground turned from the light is darkened toward the ink of the moon's own shadow side.
const dimmed = (color, light) => mix(mix(color, ink, 0.75), color, light)

function ringRadii(shape, r) {
  const list = [0]
  if (shape.peak > 0) list.push(0.1, 0.2)
  list.push(shape.floor)
  const steps = shape.terraces ? 5 : r > 8 ? 2 : 1
  for (let k = 1; k <= steps; k++) list.push(shape.floor + ((1 - shape.floor) * k) / (steps + 1))
  list.push(1, 1.14, shape.reach)
  return list
}

const segmentsFor = (r) => (r < 4 ? 6 : r < 10 ? 8 : r < 22 ? 12 : r < 40 ? 16 : 22)

// Adds one crater of radius r centred at (x, z), lying `lift` above the ground.
export function addCrater(b, x, z, r, rand, lift) {
  const shape = craterShape(r)
  const { up, e1, e2 } = frameAt(x, z)
  const light = lightOn(up)
  const baseLight = dot(up, LIGHT)
  const n = segmentsFor(r)
  const radii = ringRadii(shape, r)

  // The outline is an irregular polygon, not a circle: each of its sides is a little off.
  const angle = Array.from({ length: n }, (_, i) => ((i + (rand() - 0.5) * 0.3) / n) * Math.PI * 2)
  const wobble = Array.from({ length: n }, () => 1 + (rand() - 0.5) * 0.24)

  const rings = radii.map((rho, k) => {
    if (rho === 0) return [{ a: 0, b: 0, h: r * craterProfile(0, shape) }]
    const settled = k === radii.length - 1
    return angle.map((ang, i) => {
      const grow = rho * r * (1 + (wobble[i] - 1) * Math.min(1, Math.max(0, (rho - 0.3) / 0.7)))
      const bumps = settled ? 0 : (rand() - 0.5) * 0.025 * r
      return { a: Math.cos(ang) * grow, b: Math.sin(ang) * grow, h: r * craterProfile(rho, shape) + bumps }
    })
  })

  const flat = (v) => {
    const px = x + e1[0] * v.a + e2[0] * v.b
    const pz = z + e1[2] * v.a + e2[2] * v.b
    return [px, groundAt(px, pz) + lift, pz]
  }
  const virtual = (v) => [e1[0] * v.a + e2[0] * v.b + up[0] * v.h, e1[1] * v.a + e2[1] * v.b + up[1] * v.h, e1[2] * v.a + e2[2] * v.b + up[2] * v.h]

  const facet = (u, v, w) => {
    const [p, q, s] = [virtual(u), virtual(v), virtual(w)]
    let normal = unit(cross([q[0] - p[0], q[1] - p[1], q[2] - p[2]], [s[0] - p[0], s[1] - p[1], s[2] - p[2]]))
    if (dot(normal, up) < 0) normal = [-normal[0], -normal[1], -normal[2]]
    // Facets turned toward the light are bright, those turned away fall into shadow.
    const turn = dot(normal, LIGHT) - baseLight
    const tone = turn > 0.12 ? TONE.bright : turn > -0.1 ? TONE.ground : turn > -0.3 ? TONE.mid : turn > -0.55 ? TONE.shadow : TONE.deep
    // Low ground inside the bowl is also darker, as if shut in by its walls.
    const low = Math.min(1, Math.max(0, -(u.h + v.h + w.h) / 3 / (shape.depth * r)))
    b.flat([flat(u), flat(v), flat(w)], [dimmed(mix(tone, TONE.shadow, low * 0.45), light)])
  }

  const centre = rings[0][0]
  for (let i = 0; i < n; i++) facet(centre, rings[1][i], rings[1][(i + 1) % n])
  for (let k = 1; k < rings.length - 1; k++) {
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      const [a, c, d, e] = [rings[k][i], rings[k][j], rings[k + 1][j], rings[k + 1][i]]
      facet(a, c, d)
      facet(a, d, e)
    }
  }
}

// Streaks of pale dust thrown out from a crater, thinning as they go. `skip(x, z)` can rule out
// places they must not cross.
export function addRays(b, x, z, r, rand, count, lift, skip = () => false) {
  for (let k = 0; k < count; k++) {
    const heading = ((k + rand() * 0.8) / count) * Math.PI * 2
    const start = r * 1.3
    const length = r * (2.2 + rand() * 4.5)
    const width = r * (0.05 + rand() * 0.07)
    const pieces = Math.max(2, Math.ceil((length - start) / 30))
    const side = [-Math.sin(heading), Math.cos(heading)]
    let before = null
    for (let p = 0; p <= pieces; p++) {
      const t = p / pieces
      const reach = start + (length - start) * t
      const w = width * (1 - t)
      const cx = x + Math.cos(heading) * reach
      const cz = z + Math.sin(heading) * reach
      const now = [[cx - side[0] * w, cz - side[1] * w], [cx + side[0] * w, cz + side[1] * w]]
      if (before) {
        const quad = [before[0], now[0], now[1], before[1]]
        const radiiOut = quad.map(([qx, qz]) => Math.hypot(qx, qz))
        const crossesApron = Math.min(...radiiOut) < PLAIN_BLEND_RADIUS && Math.max(...radiiOut) > PLAIN_RADIUS
        if (!crossesApron && !quad.some(([qx, qz]) => skip(qx, qz))) {
          const color = dimmed(RAY, lightOn(frameAt(cx, cz).up))
          b.flat(quad.map(([qx, qz]) => [qx, groundAt(qx, qz) + lift, qz]), [color])
        }
      }
      before = now
    }
  }
}
