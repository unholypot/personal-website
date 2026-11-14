import { describe, it, expect } from 'vitest'
import { Euler, Quaternion, Vector3 } from 'three'
import { MOON, MOON_TILT, STATION } from './layout.js'
import { sampleCamera } from './cameraPath.js'
import { BELT, HILL_RADIUS_IN_MOON_RADII, beltClearance, beltDust, beltRocks } from './belt.js'

const rocks = beltRocks()
const dust = beltDust()
const ringRadius = (x, z) => Math.hypot(x, z)

describe('beltRocks', () => {
  it('is a good scatter of rocks, the same every time', () => {
    expect(rocks.length).toBeGreaterThanOrEqual(120)
    expect(rocks.length).toBeLessThanOrEqual(BELT.count)
    expect(beltRocks()).toEqual(rocks)
  })

  it('keeps every rock inside the band and its thickness, and a believable size', () => {
    for (const r of rocks) {
      const [x, y, z] = r.position
      expect(Math.abs(Math.hypot(x, z) - BELT.radius)).toBeLessThanOrEqual(BELT.halfWidth + 1e-6)
      expect(Math.abs(y)).toBeLessThanOrEqual(BELT.halfThickness + 1e-6)
      expect(r.radius).toBeGreaterThanOrEqual(40)
      expect(r.radius).toBeLessThanOrEqual(BELT.maxRock)
    }
  })

  it('has many small rocks and a few big ones', () => {
    const sizes = rocks.map((r) => r.radius).sort((a, b) => a - b)
    const median = sizes[Math.floor(sizes.length / 2)]
    expect(median).toBeLessThan(90)
    expect(sizes[sizes.length - 1]).toBeGreaterThan(120)
  })

  it('never lets two rocks run into each other', () => {
    for (let i = 0; i < rocks.length; i++)
      for (let j = i + 1; j < rocks.length; j++) {
        const d = Math.hypot(...rocks[i].position.map((v, k) => v - rocks[j].position[k]))
        expect(d).toBeGreaterThanOrEqual(0.7 * (rocks[i].radius + rocks[j].radius) - 1e-6)
      }
  })
})

describe('the belt as physics allows it', () => {
  it('is a ring in the moon equator, so it turns with the moon', () => {
    expect(BELT.tilt).toEqual(MOON_TILT)
  })

  it('sits where a ring is stable: close in (a couple of moon radii, where debris cannot clump into a moon) and far inside the Hill sphere', () => {
    const inMoonRadii = BELT.radius / MOON.radius
    expect(inMoonRadii).toBeGreaterThan(2)
    expect(inMoonRadii).toBeLessThan(2.6)
    // stable orbits reach out to about 0.4 of the Hill radius; the whole belt is well inside that
    expect((BELT.radius + BELT.halfWidth) / MOON.radius).toBeLessThan(0.4 * HILL_RADIUS_IN_MOON_RADII)
  })

  it('is a thin sheet, much thinner than it is wide, with the biggest rocks small beside the moon', () => {
    expect(BELT.halfThickness).toBeLessThanOrEqual(BELT.halfWidth / 3)
    expect(BELT.maxRock / MOON.radius).toBeLessThan(0.12)
  })

  it('has a clear gap in it, like the Cassini Division, with no rock or dust in it', () => {
    const gapCentre = BELT.radius + BELT.gap.at
    for (const r of rocks) expect(Math.abs(ringRadius(r.position[0], r.position[2]) - gapCentre)).toBeGreaterThan(BELT.gap.halfWidth)
    for (let i = 0; i < dust.length; i += 3) expect(Math.abs(ringRadius(dust[i], dust[i + 2]) - gapCentre)).toBeGreaterThan(BELT.gap.halfWidth)
  })
})

describe('beltDust', () => {
  it('is a great many fine grains, the same every time', () => {
    expect(dust.length / 3).toBeGreaterThanOrEqual(2500)
    expect(dust.length % 3).toBe(0)
    expect(beltDust()).toEqual(dust)
  })

  it('lies in the band and its thin sheet, denser toward the middle', () => {
    let near = 0
    for (let i = 0; i < dust.length; i += 3) {
      const offset = Math.abs(ringRadius(dust[i], dust[i + 2]) - BELT.radius)
      expect(offset).toBeLessThanOrEqual(BELT.halfWidth + 1e-6)
      expect(Math.abs(dust[i + 1])).toBeLessThanOrEqual(BELT.halfThickness / 2 + 1e-6)
      if (offset < BELT.halfWidth / 2) near++
    }
    expect(near / (dust.length / 3)).toBeGreaterThan(0.55)
  })
})

describe('beltClearance', () => {
  it('is large well away from the belt, and small inside it', () => {
    const centre = BELT.centre
    expect(beltClearance(centre)).toBeGreaterThan(2000)
    // a point in the belt plane, mid-band: clearance is negative (inside, less a rock's reach)
    const q = new Quaternion().setFromEuler(new Euler(...BELT.tilt))
    const inside = new Vector3(BELT.radius, 0, 0).applyQuaternion(q).add(new Vector3(...centre)).toArray()
    expect(beltClearance(inside)).toBeLessThan(0)
  })

  it('keeps the camera well clear of every possible rock, all the way down', () => {
    for (let i = 0; i <= 400; i++) {
      const { position } = sampleCamera(i / 400, 1.6)
      expect(beltClearance(position)).toBeGreaterThan(150)
    }
  })

  it('keeps the station and the rocket clear of it too', () => {
    expect(beltClearance(STATION)).toBeGreaterThan(300)
  })
})
