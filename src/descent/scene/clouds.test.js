import { describe, it, expect } from 'vitest'
import { MOON_TILT } from './layout.js'
import { BELT } from './belt.js'
import { CLOUD_SPIN_SECONDS, CLOUD_TILT, cloudBanks } from './clouds.js'

const banks = cloudBanks()
const angle = (a, b) => Math.acos(Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])))

describe('cloudBanks', () => {
  it('is a good number of banks, the same every time', () => {
    expect(banks.length).toBeGreaterThanOrEqual(50)
    expect(banks.length).toBeLessThanOrEqual(90)
    expect(cloudBanks()).toEqual(banks)
  })

  it('has every direction a unit vector, at a believable height and size', () => {
    for (const b of banks) {
      expect(Math.hypot(...b.direction)).toBeCloseTo(1, 9)
      expect(b.altitude).toBeGreaterThanOrEqual(340)
      expect(b.altitude).toBeLessThanOrEqual(425)
      expect(b.radius).toBeGreaterThanOrEqual(90)
      expect(b.radius).toBeLessThanOrEqual(190)
    }
  })

  it('covers the whole globe, not just the top: every octant, both poles and the equator', () => {
    const octants = new Set(banks.map((b) => b.direction.map((v) => (v >= 0 ? 1 : 0)).join('')))
    expect(octants.size).toBe(8)
    expect(banks.some((b) => b.direction[1] > 0.85)).toBe(true)
    expect(banks.some((b) => b.direction[1] < -0.85)).toBe(true)
    expect(banks.some((b) => Math.abs(b.direction[1]) < 0.2)).toBe(true)
    // evenly spread: no side is favoured
    const mean = [0, 1, 2].map((k) => banks.reduce((s, b) => s + b.direction[k], 0) / banks.length)
    expect(Math.hypot(...mean)).toBeLessThan(0.15)
  })

  it('keeps the banks apart, so no two run into each other', () => {
    const globe = 1500
    for (let i = 0; i < banks.length; i++)
      for (let j = i + 1; j < banks.length; j++) {
        const apart = angle(banks[i].direction, banks[j].direction) * globe
        expect(apart).toBeGreaterThan(0.8 * (banks[i].radius + banks[j].radius) * 0.5)
      }
  })
})

describe('the wind', () => {
  it('blows round the moon\'s own spin axis, the one its ring lies about', () => {
    expect(CLOUD_TILT).toEqual(MOON_TILT)
    expect(CLOUD_TILT).toEqual(BELT.tilt)
  })

  it('is slow: a full circuit takes minutes', () => {
    expect(CLOUD_SPIN_SECONDS).toBeGreaterThanOrEqual(300)
    expect(CLOUD_SPIN_SECONDS).toBeLessThanOrEqual(900)
  })
})
