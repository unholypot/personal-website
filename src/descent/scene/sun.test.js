import { describe, it, expect } from 'vitest'
import { LIGHT } from './build.js'
import { GIANT, SUN } from './layout.js'

describe('the sun', () => {
  it('is one direction for the whole scene: LIGHT is just SUN made a unit vector', () => {
    const length = Math.hypot(...SUN)
    LIGHT.forEach((v, i) => expect(v).toBeCloseTo(SUN[i] / length, 9))
    expect(Math.hypot(...LIGHT)).toBeCloseTo(1, 9)
  })

  it('comes from above, to one side and in front, so planets show a lit face with the shadow low and to the far side', () => {
    expect(SUN[1]).toBeGreaterThan(0.5)
    expect(SUN[0]).toBeLessThan(0)
    expect(SUN[2]).toBeGreaterThan(0)
  })

  it('leaves no planet a light of its own', () => {
    expect(GIANT.light).toBeUndefined()
  })
})
