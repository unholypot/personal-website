import { describe, it, expect } from 'vitest'
import { COMPANION, companionOffset } from './companion.js'
import { LANDING_PAD } from './layout.js'

describe('companionOffset', () => {
  it('starts well to one side and ends right beside the pad', () => {
    expect(Math.hypot(...companionOffset(0))).toBeGreaterThan(150)
    const end = companionOffset(1)
    expect(Math.hypot(end[0], end[2])).toBeLessThan(30)
    // landing beside the pad, not on it
    expect(Math.hypot(LANDING_PAD[0] + end[0] - LANDING_PAD[0], LANDING_PAD[1] + end[2] - LANDING_PAD[1])).toBeGreaterThan(8)
  })

  it('closes in smoothly and never jumps', () => {
    let last = companionOffset(0)
    for (let t = 0.01; t <= 1; t += 0.01) {
      const o = companionOffset(t)
      expect(Math.hypot(o[0] - last[0], o[1] - last[1], o[2] - last[2])).toBeLessThan(12)
      last = o
    }
  })

  it('is smaller than the main craft, with a thinner trail', () => {
    expect(COMPANION.size).toBeLessThan(1)
    expect(COMPANION.widthScale).toBeLessThan(1)
  })

  it('survives bad numbers', () => {
    expect(companionOffset(NaN)).toEqual(companionOffset(0))
  })
})
