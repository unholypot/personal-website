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
      altitude: 340 + rand() * 85,
      radius: 90 + rand() * 100,
      heading: rand() * Math.PI * 2,
    }
  })
}
