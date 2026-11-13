// The debris ring round the destination moon, drawn as a belt of rocks and fine dust.
//
// A true asteroid belt circles a star; a body that circles a moon is a ring. Rings are stable in
// a zone close to their body: near enough that tides stop the debris clumping into a moon (about
// 2.4 body radii for rubble of the same density), and far inside the moon's Hill sphere, where its
// gravity beats the planet's (prograde orbits last out to about 0.4 of the Hill radius). This one
// sits at 2.33 moon radii. Real rings are mostly fine particles in a sheet far thinner than it is
// wide, with a few large chunks and gaps cleared by passing moonlets, so that is what this is:
// a thin sheet in the moon's equator, mostly dust, a scatter of modest rocks, and one clear gap.
// This file holds the layout and the promise that the camera, on its way down, never goes near it.
import { Euler, Quaternion, Vector3 } from 'three'
import { MOON, MOON_TILT } from './layout.js'
import { rng } from './build.js'

// How far the moon's Hill sphere reaches, in moon radii, for a large moon of a giant planet
// (a Titan-like moon's is about 20).
export const HILL_RADIUS_IN_MOON_RADII = 20

export const BELT = {
  centre: MOON.center,
  radius: 3500, // distance from the moon's centre to the middle of the band
  halfWidth: 380, // the band reaches this far to either side of that
  halfThickness: 110, // and this far above and below its plane
  tilt: MOON_TILT, // the moon's equatorial plane
  count: 170, // rocks, at most
  maxRock: 160, // the largest rock's radius
  gap: { at: 95, halfWidth: 50 }, // a clear lane, this far outside the middle of the band
}

const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
const inGap = (ring, margin = 0) => Math.abs(ring - (BELT.radius + BELT.gap.at)) <= BELT.gap.halfWidth + margin

// The rocks, in the belt's own frame (its plane is x and z, and y is up through it). There are
// many small ones and a few big ones, none touch, and none lie in the gap.
export function beltRocks() {
  const rand = rng(404)
  const rocks = []
  for (let attempt = 0; attempt < BELT.count * 12 && rocks.length < BELT.count; attempt++) {
    const angle = rand() * Math.PI * 2
    const ring = BELT.radius + (rand() * 2 - 1) * BELT.halfWidth
    const position = [Math.cos(angle) * ring, (rand() * 2 - 1) * BELT.halfThickness, Math.sin(angle) * ring]
    const radius = 40 + (BELT.maxRock - 40) * Math.pow(rand(), 2.6)
    const squash = 0.65 + rand() * 0.35
    const turn = [rand() * 6.28, rand() * 6.28, rand() * 6.28]
    if (inGap(ring, radius * 0.5)) continue
    if (rocks.some((r) => distance(r.position, position) < 0.7 * (r.radius + radius))) continue
    rocks.push({ position, radius, seed: rocks.length + 1, squash, turn })
  }
  return rocks
}

// The dust: thousands of fine grains in the thin sheet, thickest toward the middle of the band and
// absent from the gap. Positions only, three numbers to a grain.
export function beltDust(count = 3600) {
  const rand = rng(909)
  const out = new Float32Array(count * 3)
  let n = 0
  while (n < count) {
    const angle = rand() * Math.PI * 2
    // the sum of two draws crowds the grains toward the middle of the band
    const ring = BELT.radius + (rand() + rand() - 1) * BELT.halfWidth
    if (inGap(ring)) continue
    out[n * 3] = Math.cos(angle) * ring
    out[n * 3 + 1] = (rand() * 2 - 1) * (BELT.halfThickness / 2)
    out[n * 3 + 2] = Math.sin(angle) * ring
    n++
  }
  return out
}

const inverseTilt = new Quaternion().setFromEuler(new Euler(...BELT.tilt)).invert()

// How far a point in the world is from the nearest place any rock could ever be, whatever the
// belt's spin: the distance to the band's whole volume, less the biggest rock's reach. Negative
// means inside the belt.
export function beltClearance(point) {
  const local = new Vector3(point[0] - BELT.centre[0], point[1] - BELT.centre[1], point[2] - BELT.centre[2]).applyQuaternion(inverseTilt)
  const across = Math.max(0, Math.abs(Math.hypot(local.x, local.z) - BELT.radius) - BELT.halfWidth)
  const through = Math.max(0, Math.abs(local.y) - BELT.halfThickness)
  return Math.hypot(across, through) - BELT.maxRock
}
