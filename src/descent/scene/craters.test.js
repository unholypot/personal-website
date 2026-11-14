import { describe, it, expect } from 'vitest'
import { LIGHT, createBuilder, rng } from './build.js'
import { groundAt } from './ground.js'
import { addCrater, addRays, craterProfile, craterShape } from './craters.js'

// Every triangle of a builder as { centre: [x, z], shade: mean of its colour channels }.
function triangles(b) {
  const out = []
  for (let t = 0; t < b.positions.length / 9; t++) {
    const p = (k) => b.positions.slice(t * 9 + k * 3, t * 9 + k * 3 + 3)
    out.push({
      centre: [(p(0)[0] + p(1)[0] + p(2)[0]) / 3, (p(0)[2] + p(1)[2] + p(2)[2]) / 3],
      shade: (b.colors[t * 9] + b.colors[t * 9 + 1] + b.colors[t * 9 + 2]) / 3,
    })
  }
  return out
}
const mean = (list) => list.reduce((a, v) => a + v, 0) / list.length

describe('craterShape', () => {
  it('big craters are broad and shallow with a central peak; small ones are deep bowls', () => {
    const big = craterShape(40)
    const small = craterShape(8)
    expect(big.peak).toBeGreaterThan(0)
    expect(big.terraces).toBe(true)
    expect(small.peak).toBe(0)
    expect(small.depth).toBeGreaterThan(big.depth)
  })
})

describe('craterProfile', () => {
  const big = craterShape(40)
  it('has a flat floor lower than the rim, and a raised rim', () => {
    expect(craterProfile(0.4, big)).toBeCloseTo(-big.depth, 9)
    expect(craterProfile(1, big)).toBeCloseTo(big.rim, 9)
    expect(big.rim).toBeGreaterThan(0)
  })
  it('climbs steadily from the floor to the rim', () => {
    let last = -Infinity
    for (let i = 0; i <= 100; i++) {
      const h = craterProfile(big.floor + ((1 - big.floor) * i) / 100, big)
      expect(h).toBeGreaterThanOrEqual(last - 1e-9)
      last = h
    }
  })
  it('settles back to the ground beyond the thrown-out rim', () => {
    expect(craterProfile(big.reach, big)).toBe(0)
    expect(craterProfile(9, big)).toBe(0)
    expect(craterProfile(1.1, big)).toBeGreaterThan(0)
  })
  it('stands a peak in the middle of a big crater only', () => {
    expect(craterProfile(0, big)).toBeGreaterThan(craterProfile(0.4, big))
    const small = craterShape(8)
    expect(craterProfile(0, small)).toBe(craterProfile(0.1, small))
  })
})

describe('addCrater', () => {
  it('builds whole triangles, for every size', () => {
    for (const r of [2, 6, 14, 30, 60]) {
      const b = createBuilder()
      addCrater(b, 200, -300, r, rng(5), 0.5)
      expect(b.positions.length).toBeGreaterThan(0)
      expect(b.positions.length % 9).toBe(0)
      expect(b.colors.length).toBe(b.positions.length)
      expect(b.positions.every(Number.isFinite)).toBe(true)
    }
  })

  it('stays within the thrown-out rim, lying on the ground at the lift given', () => {
    const b = createBuilder()
    addCrater(b, 700, 400, 30, rng(9), 0.9)
    for (let i = 0; i < b.positions.length; i += 3) {
      const [x, y, z] = b.positions.slice(i, i + 3)
      expect(Math.hypot(x - 700, z - 400)).toBeLessThan(30 * 1.65)
      expect(y).toBeCloseTo(groundAt(x, z) + 0.9, 6)
    }
  })

  it('looks the same every time for the same seed, and different for another', () => {
    const make = (seed) => {
      const b = createBuilder()
      addCrater(b, 100, 100, 20, rng(seed), 0.2)
      return [b.positions, b.colors]
    }
    expect(make(1)).toEqual(make(1))
    expect(make(1)).not.toEqual(make(2))
  })

  it('catches the light on the wall that faces it and shades the wall that turns from it', () => {
    // The light comes from the -x, +z side, so the wall on the +x, -z side of the crater faces
    // it (and is bright), while the wall on the -x, +z side turns away (and is dark).
    const centre = [150, -150]
    const b = createBuilder()
    addCrater(b, centre[0], centre[1], 40, rng(3), 0.12)
    const toLight = [LIGHT[0], LIGHT[2]]
    const wall = triangles(b).filter((t) => {
      const d = Math.hypot(t.centre[0] - centre[0], t.centre[1] - centre[1])
      return d > 0.62 * 40 && d < 0.95 * 40
    })
    const side = (t) => (t.centre[0] - centre[0]) * toLight[0] + (t.centre[1] - centre[1]) * toLight[1]
    const facing = wall.filter((t) => side(t) < 0)
    const turned = wall.filter((t) => side(t) > 0)
    expect(facing.length).toBeGreaterThan(4)
    expect(turned.length).toBeGreaterThan(4)
    expect(mean(facing.map((t) => t.shade))).toBeGreaterThan(mean(turned.map((t) => t.shade)) + 0.1)
  })

  it('uses several tones, so a big crater has real form', () => {
    const b = createBuilder()
    addCrater(b, 150, -150, 50, rng(4), 0.12)
    const tones = new Set(triangles(b).map((t) => t.shade.toFixed(3)))
    expect(tones.size).toBeGreaterThanOrEqual(5)
  })

  it('is darker on the part of the moon turned from the light', () => {
    const lit = createBuilder()
    const dark = createBuilder()
    addCrater(lit, -600, 600, 30, rng(6), 0.9)
    addCrater(dark, 900, -900, 30, rng(6), 0.9)
    expect(mean(triangles(lit).map((t) => t.shade))).toBeGreaterThan(mean(triangles(dark).map((t) => t.shade)) * 1.3)
  })
})

describe('addRays', () => {
  it('lays pale streaks outward from the crater, never over its bowl', () => {
    const b = createBuilder()
    addRays(b, -500, 300, 50, rng(8), 12, 0.9)
    expect(b.positions.length).toBeGreaterThan(0)
    expect(b.positions.length % 9).toBe(0)
    for (let i = 0; i < b.positions.length; i += 3) {
      const d = Math.hypot(b.positions[i] + 500, b.positions[i + 2] - 300)
      expect(d).toBeGreaterThan(50 * 1.25)
      expect(d).toBeLessThan(50 * 9)
    }
  })
})
