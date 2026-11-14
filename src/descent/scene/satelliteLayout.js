// Shared dimensions prevent ring styling changes from silently invalidating orbits.
export const RING_SCALE = 1.28
export const RING_INNER_UNSCALED = 1630
export const RING_OUTER_UNSCALED = 2568
export const RING_OUTER_RADIUS = RING_OUTER_UNSCALED * RING_SCALE
export const SATELLITES = [
  { orbit: 3700, radius: 145, tilt: [-0.1, 4.48, 0], speed: 1 }, // starts a few seconds short of crossing the planet's face, so the opening shows it
  { orbit: 4400, radius: 100, tilt: [-0.15, 2.4, 0.1], speed: -0.6 },
  // One more, far out and slow, like the distant outer moons of a real giant. It starts where the closing view
  // shows it (upper left) and drifts so little that it is still there a minute or two later.
  { orbit: 5300, radius: 100, tilt: [0.1, 2.78, 0.4], speed: 0.06 },
]
