import { describe, it, expect } from 'vitest'
import { craterHeight, moonCraters, moonPositions } from './moonBody.js'

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const angle = (a, b) => Math.acos(Math.min(1, Math.max(-1, dot(a, b))))

describe('moonCraters', () => {
  const craters = moonCraters(1)

  it('is a good scatter of craters, the same every time and different for another moon', () => {
    expect(craters.length).toBeGreaterThanOrEqual(8)
    expect(craters.length).toBeLessThanOrEqual(11)
    expect(moonCraters(1)).toEqual(craters)
    expect(moonCraters(2)).not.toEqual(craters)
  })

  it('keeps each on the sphere, a fair size, and clear of the others', () => {
    for (const c of craters) {
      expect(Math.hypot(...c.dir)).toBeCloseTo(1, 9)
      expect(c.size).toBeGreaterThanOrEqual(0.1)
      expect(c.size).toBeLessThanOrEqual(0.38)
    }
    for (let i = 0; i < craters.length; i++)
      for (let j = i + 1; j < craters.length; j++)
        expect(angle(craters[i].dir, craters[j].dir)).toBeGreaterThanOrEqual((craters[i].size + craters[j].size) * 0.75 - 1e-9)
  })
})

describe('craterHeight', () => {
  const craters = moonCraters(1)

  it('is a hollow in the middle of a crater, a raised rim round it, and level ground far from any', () => {
    const c = craters[0]
    expect(craterHeight(c.dir, [c])).toBeLessThan(0)
    // a point on the rim: step the crater's own angular radius away from its centre
    const side = Math.abs(c.dir[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]
    const tangent = [c.dir[1] * side[2] - c.dir[2] * side[1], c.dir[2] * side[0] - c.dir[0] * side[2], c.dir[0] * side[1] - c.dir[1] * side[0]]
    const len = Math.hypot(...tangent)
    const rim = [0, 1, 2].map((k) => Math.cos(c.size) * c.dir[k] + (Math.sin(c.size) * tangent[k]) / len)
    expect(craterHeight(rim, [c])).toBeGreaterThan(0)
    const far = c.dir.map((v) => -v)
    expect(craterHeight(far, [c])).toBe(0)
  })
})

describe('moonPositions', () => {
  const R = 100
  const detail = 6
  const positions = moonPositions(R, 1, detail)

  it('is a faceted sphere of separate triangles, the same every time', () => {
    expect(positions.length).toBe(20 * (detail + 1) ** 2 * 9)
    expect(moonPositions(R, 1, detail)).toEqual(positions)
    expect(moonPositions(R, 2, detail)).not.toEqual(positions)
  })

  it('has hollows below the surface and rims above it, within a believable range', () => {
    const radii = []
    for (let i = 0; i < positions.length; i += 3) radii.push(Math.hypot(positions[i], positions[i + 1], positions[i + 2]))
    expect(Math.min(...radii)).toBeLessThan(R * 0.97)
    expect(Math.min(...radii)).toBeGreaterThan(R * 0.85)
    expect(Math.max(...radii)).toBeGreaterThan(R * 1.005)
    expect(Math.max(...radii)).toBeLessThan(R * 1.08)
  })

  it('is not a circle: its outline wanders by more than a little', () => {
    const radii = []
    for (let i = 0; i < positions.length; i += 3) radii.push(Math.hypot(positions[i], positions[i + 1], positions[i + 2]))
    const mean = radii.reduce((a, v) => a + v, 0) / radii.length
    const spread = Math.sqrt(radii.reduce((a, v) => a + (v - mean) ** 2, 0) / radii.length)
    expect(spread / R).toBeGreaterThan(0.01)
  })
})
