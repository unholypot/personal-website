// Where the clouds are. They are spread over the whole moon (not only the part facing the
// descent) and the whole shell of cloud turns slowly about the moon's spin axis, so over a few
// minutes the weather drifts right across the globe.
import { rng } from './build.js'
import { MOON_TILT } from './layout.js'

// The spin axis the wind blows round: the same one the moon's ring lies about.
export const CLOUD_TILT = MOON_TILT
// Seconds for the clouds to go once right round the moon.
export const CLOUD_SPIN_SECONDS = 540

const BANK_COUNT = 72

// One bank of clouds per place, spaced evenly over the sphere (a Fibonacci spiral, each point
// nudged a little so it does not look laid out). Directions are in the moon's own frame, y up its
// spin axis; altitude is above the surface and radius is how wide the bank reaches.
export function cloudBanks() {
  const rand = rng(51)
  const golden = Math.PI * (3 - Math.sqrt(5))
  return Array.from({ length: BANK_COUNT }, (_, i) => {
    const y = 1 - ((i + 0.5) / BANK_COUNT) * 2
    const ring = Math.sqrt(1 - y * y)
    const turn = i * golden + (rand() - 0.5) * 0.35
    // nudge toward a neighbour's side without leaving the sphere
    const nudge = (rand() - 0.5) * 0.08
    const v = [Math.cos(turn) * ring + nudge, y + (rand() - 0.5) * 0.04, Math.sin(turn) * ring + nudge * 0.5]
    const length = Math.hypot(...v)
    return {
      direction: v.map((c) => c / length),
      altitude: 255 + rand() * 70,
      radius: 115 + rand() * 125,
      heading: rand() * Math.PI * 2,
    }
  })
}

// How far the shell of cloud has turned, in radians about its own axis. The cloud meshes and their
// shadows both read this, so the shadows stay under the clouds as the weather moves.
export const cloudSpin = { angle: 0 }

const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const unit = (v) => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / l, v[1] / l, v[2] / l]
}

// The patches of shadow each bank throws: three rectangles per bank, in the moon's own frame like the
// banks themselves. Each is { direction, altitude, width, depth, heading }, the sizes in world units.
export function cloudLobes() {
  const rand = rng(88)
  const lobes = []
  for (const bank of cloudBanks()) {
    const shell = 1500 + bank.altitude
    const reference = Math.abs(bank.direction[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]
    const e1 = unit(cross(bank.direction, reference))
    const e2 = cross(bank.direction, e1)
    for (let k = 0; k < 3; k++) {
      const a = rand() * Math.PI * 2
      const spread = k === 0 ? 0 : Math.sqrt(rand()) * bank.radius * 0.7
      const direction = unit([0, 1, 2].map((i) => bank.direction[i] + (e1[i] * Math.cos(a) + e2[i] * Math.sin(a)) * (spread / shell)))
      lobes.push({
        direction,
        altitude: bank.altitude,
        width: bank.radius * (0.9 + rand() * 0.7),
        depth: bank.radius * (0.4 + rand() * 0.3),
        heading: bank.heading + (rand() - 0.5) * 0.4,
      })
    }
  }
  return lobes
}

// Where a point in the air throws its shadow on a sphere: follow the light away from the sun until the
// sphere is met. `p` and `centre` are [x, y, z], `light` the unit direction toward the sun, `radius` the
// sphere's. Null when the line misses the sphere.
export function shadowPoint(p, light, centre, radius) {
  const o = [p[0] - centre[0], p[1] - centre[1], p[2] - centre[2]]
  const b = o[0] * light[0] + o[1] * light[1] + o[2] * light[2]
  const c = o[0] * o[0] + o[1] * o[1] + o[2] * o[2] - radius * radius
  const disc = b * b - c
  if (disc < 0) return null
  const t = b - Math.sqrt(disc)
  if (t < 0) return null
  return [p[0] - light[0] * t, p[1] - light[1] * t, p[2] - light[2] * t]
}
