import { describe, it, expect } from 'vitest'
import { MAX_PITCH, MAX_YAW, aim, createPointer, parallaxAngles, step } from './parallax.js'

describe('aim', () => {
  it('turns a position in the window into -1..1 on each axis', () => {
    const p = createPointer()
    aim(p, 400, 300, 800, 600)
    expect([p.tx, p.ty]).toEqual([0, 0])
    aim(p, 800, 0, 800, 600)
    expect([p.tx, p.ty]).toEqual([1, -1])
    aim(p, 0, 600, 800, 600)
    expect([p.tx, p.ty]).toEqual([-1, 1])
  })
  it('clamps a pointer that has left the window, and survives a zero-sized one', () => {
    const p = createPointer()
    aim(p, 5000, -900, 800, 600)
    expect([p.tx, p.ty]).toEqual([1, -1])
    aim(p, 10, 10, 0, 0)
    expect([p.tx, p.ty]).toEqual([0, 0])
  })
})

describe('step', () => {
  it('eases toward the target without overshooting', () => {
    const p = createPointer()
    aim(p, 800, 300, 800, 600)
    step(p, 0.1)
    expect(p.x).toBeGreaterThan(0)
    expect(p.x).toBeLessThan(1)
    for (let i = 0; i < 100; i++) step(p, 0.1)
    expect(p.x).toBeCloseTo(1, 3)
    expect(p.x).toBeLessThanOrEqual(1)
  })
  it('is the same at any frame rate, and does not move without time passing', () => {
    const a = createPointer()
    const b = createPointer()
    aim(a, 800, 600, 800, 600)
    aim(b, 800, 600, 800, 600)
    step(a, 0.032)
    step(b, 0.016)
    step(b, 0.016)
    expect(a.x).toBeCloseTo(b.x, 9)
    const c = createPointer()
    aim(c, 800, 600, 800, 600)
    step(c, 0)
    expect(c.x).toBe(0)
  })
})

describe('parallaxAngles', () => {
  it('is level when the pointer is in the middle, small at the edges, and mirrored', () => {
    const p = createPointer()
    expect(parallaxAngles(p)).toEqual([0, 0])
    p.x = 1
    p.y = 1
    const [yaw, pitch] = parallaxAngles(p)
    expect(Math.abs(yaw)).toBeCloseTo(MAX_YAW, 9)
    expect(Math.abs(pitch)).toBeCloseTo(MAX_PITCH, 9)
    expect(MAX_YAW).toBeLessThan(0.03)
    expect(MAX_PITCH).toBeLessThan(0.02)
    p.x = -1
    p.y = -1
    const [yaw2, pitch2] = parallaxAngles(p)
    expect(yaw2).toBeCloseTo(-yaw, 9)
    expect(pitch2).toBeCloseTo(-pitch, 9)
  })
})
