import { BASE, LANDING_PAD, RADIO_ARRAY, RIDGE } from './layout.js'

// Clearance is measured against the entire (conservative) mountain footprint.
const CLEARINGS = [
  [BASE[0], BASE[2], 46],
  [LANDING_PAD[0], LANDING_PAD[1], 30],
  [RIDGE[0], RIDGE[2], 20],
  [RADIO_ARRAY[0], RADIO_ARRAY[1], 52],
]
export function terrainBlocked(x, z, footprint = 0) {
  if (CLEARINGS.some(([cx, cz, radius]) => Math.hypot(x - cx, z - cz) < radius + footprint)) return true
  // Capsule around the last, low part of the rocket's approach.
  const start = [10, 60]
  const end = LANDING_PAD
  const dx = end[0] - start[0]
  const dz = end[1] - start[1]
  const t = Math.max(0, Math.min(1, ((x - start[0]) * dx + (z - start[1]) * dz) / (dx * dx + dz * dz)))
  return Math.hypot(x - start[0] - dx * t, z - start[1] - dz * t) < 22 + footprint
}
