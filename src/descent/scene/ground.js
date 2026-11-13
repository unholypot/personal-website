// Where the ground is, and flat shapes that lie on it: shadows and surface markings.
import { MOON } from './layout.js'
import { LIGHT } from './build.js'

// Around the landing site the ground is a level plain; beyond it the moon curves away.
export const PLAIN_RADIUS = 420
export const PLAIN_Y = 0.3
export const PLAIN_BLEND_RADIUS = 600

export function groundAt(x, z) {
  const r = Math.hypot(x, z)
  if (r <= PLAIN_RADIUS) return PLAIN_Y
  const sphere = Math.sqrt(Math.max(0, MOON.radius * MOON.radius - r * r)) - MOON.radius
  const t = Math.min(1, (r - PLAIN_RADIUS) / (PLAIN_BLEND_RADIUS - PLAIN_RADIUS))
  const blend = t * t * (3 - 2 * t)
  return PLAIN_Y + (sphere - PLAIN_Y) * blend
}

// True when every [x, z] point is on the plain, or every one is on the slope. A flat shape
// that straddles the plain's edge would hang in the air, so such shapes are left out.
export function sameGround(points) {
  const first = Math.hypot(points[0][0], points[0][1]) < PLAIN_RADIUS
  return points.every(([x, z]) => Math.hypot(x, z) < PLAIN_RADIUS === first)
}

const across = Math.hypot(LIGHT[0], LIGHT[2])
// The level direction shadows fall in, as [x, z], and how long they are per unit of height.
export const SHADOW_DIR = [-LIGHT[0] / across, -LIGHT[2] / across]
export const SHADOW_REACH = across / LIGHT[1]

const drape = ([x, z], lift) => [x, groundAt(x, z) + lift, z]

// A poster shadow: one flat wedge from the foot of something to where its top's shadow lands.
export function addShadow(b, x, z, radius, height, color, lift = 0.25) {
  const [dx, dz] = SHADOW_DIR
  const reach = radius + height * SHADOW_REACH
  const points = [
    [x - dz * radius, z + dx * radius],
    [x + dx * reach, z + dz * reach],
    [x + dz * radius, z - dx * radius],
  ]
  // A single flat shadow triangle cannot follow the curved transition apron.
  // Keep these inexpensive silhouettes on the plain or beyond the apron.
  const radii = points.map(([px, pz]) => Math.hypot(px, pz))
  if (Math.min(...radii) < PLAIN_BLEND_RADIUS && Math.max(...radii) > PLAIN_RADIUS) return
  if (!sameGround(points)) return
  b.flat(points.map((p) => drape(p, lift)), [color])
}

// A flat patch that hugs the ground: a disc, a ring (with `inner`), or an uneven blot when
// radiusAt varies with the angle. With `start` and `sweep` it covers only part of the turn.
// It is built in rows outward so it follows the moon's curve.
export function addPatch(b, cx, cz, radiusAt, color, lift, { inner = 0, segments = 18, step = 45, start = 0, sweep = Math.PI * 2 } = {}) {
  const angles = Array.from({ length: segments + 1 }, (_, i) => start + (i / segments) * sweep)
  const outer = angles.map(radiusAt)
  const reach = Math.max(...outer)
  const centre = Math.hypot(cx, cz)
  // Only the apron needs fine radial tessellation to keep markings above it.
  const nearApron = centre + reach > PLAIN_RADIUS && centre - reach < PLAIN_BLEND_RADIUS
  const spacing = nearApron ? Math.min(step, 10) : step
  const rows = Math.max(1, Math.ceil((reach - inner) / spacing))
  const at = (i, k) => {
    const r = inner + ((outer[i] - inner) * k) / rows
    return [cx + Math.cos(angles[i]) * r, cz + Math.sin(angles[i]) * r]
  }
  for (let k = 0; k < rows; k++) {
    for (let i = 0; i < segments; i++) {
      const quad = [at(i, k), at(i, k + 1), at(i + 1, k + 1), at(i + 1, k)]
      b.flat(quad.map((p) => drape(p, lift)), [color])
    }
  }
}
