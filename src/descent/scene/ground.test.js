import { describe, it, expect } from 'vitest'
import { LIGHT, createBuilder } from './build.js'
import { MOON } from './layout.js'
import { PLAIN_RADIUS, PLAIN_Y, SHADOW_DIR, SHADOW_REACH, groundAt, sameGround, addShadow, addPatch } from './ground.js'

describe('groundAt', () => {
  it('joins the landing plain continuously to the moon without a cliff', () => {
    for (let r = PLAIN_RADIUS - 1; r <= 601; r += 0.25) {
      expect(Math.abs(groundAt(r, 0) - groundAt(r - 0.25, 0))).toBeLessThan(0.4)
    }
    expect(groundAt(PLAIN_RADIUS, 0)).toBeCloseTo(PLAIN_Y, 6)
  })
  it('is the level plain near the landing site', () => {
    expect(groundAt(0, 0)).toBe(PLAIN_Y)
    expect(groundAt(100, -200)).toBe(PLAIN_Y)
  })
  it('follows the curve of the moon beyond the plain', () => {
    const y = groundAt(600, 0)
    expect(y).toBeCloseTo(Math.sqrt(MOON.radius ** 2 - 600 ** 2) - MOON.radius, 6)
    expect(y).toBeLessThan(-100)
    expect(groundAt(0, -900)).toBeLessThan(groundAt(0, -600))
  })
})

describe('shadows', () => {
  it('fall directly away from the light', () => {
    expect(Math.hypot(SHADOW_DIR[0], SHADOW_DIR[1])).toBeCloseTo(1, 6)
    expect(SHADOW_DIR[0] * LIGHT[0] + SHADOW_DIR[1] * LIGHT[2]).toBeLessThan(0)
    expect(SHADOW_REACH).toBeGreaterThan(0.5)
    expect(SHADOW_REACH).toBeLessThan(1.5)
  })
  it('a shadow reaches as far as the object is tall, lying just above the ground', () => {
    const b = createBuilder()
    addShadow(b, 10, 20, 4, 10, '#000000')
    expect(b.positions.length).toBe(9)
    let far = 0
    for (let i = 0; i < 9; i += 3) {
      far = Math.max(far, Math.hypot(b.positions[i] - 10, b.positions[i + 2] - 20))
      expect(b.positions[i + 1]).toBeGreaterThan(PLAIN_Y)
      expect(b.positions[i + 1]).toBeLessThan(PLAIN_Y + 1)
    }
    expect(far).toBeCloseTo(4 + 10 * SHADOW_REACH, 6)
  })
  it('is left out where it would straddle the edge of the plain', () => {
    const b = createBuilder()
    addShadow(b, PLAIN_RADIUS - 2, 0, 4, 30, '#000000')
    expect(b.positions.length).toBe(0)
  })
})

describe('sameGround', () => {
  it('tells whether points share the plain or the slope', () => {
    expect(sameGround([[0, 0], [50, 50]])).toBe(true)
    expect(sameGround([[600, 0], [700, 50]])).toBe(true)
    expect(sameGround([[PLAIN_RADIUS - 5, 0], [PLAIN_RADIUS + 5, 0]])).toBe(false)
  })
})

describe('addPatch', () => {
  it('lays a round patch that hugs the curved ground all the way across', () => {
    const b = createBuilder()
    addPatch(b, 0, -800, () => 200, '#ffffff', 1)
    expect(b.positions.length).toBeGreaterThan(0)
    for (let i = 0; i < b.positions.length; i += 3) {
      const x = b.positions[i]
      const z = b.positions[i + 2]
      expect(Math.hypot(x, z + 800)).toBeLessThanOrEqual(200 + 1e-6)
      expect(b.positions[i + 1]).toBeCloseTo(groundAt(x, z) + 1, 6)
    }
    // subdivided outward, not one flat fan: more than two rows of triangles
    expect(b.positions.length / 9).toBeGreaterThan(60)
  })
  it('can be an arc of a ring, on one side only', () => {
    const b = createBuilder()
    // a quarter turn centred on +x
    addPatch(b, 0, 0, () => 10, '#ffffff', 0.2, { inner: 8, start: -Math.PI / 4, sweep: Math.PI / 2 })
    expect(b.positions.length).toBeGreaterThan(0)
    for (let i = 0; i < b.positions.length; i += 3) {
      expect(b.positions[i]).toBeGreaterThan(5)
      expect(Math.abs(b.positions[i + 2])).toBeLessThan(7.2)
    }
  })
  it('can be a ring', () => {
    const b = createBuilder()
    addPatch(b, 50, 50, () => 10, '#ffffff', 0.2, { inner: 8 })
    for (let i = 0; i < b.positions.length; i += 3)
      expect(Math.hypot(b.positions[i] - 50, b.positions[i + 2] - 50)).toBeGreaterThanOrEqual(8 - 1e-6)
  })
})
