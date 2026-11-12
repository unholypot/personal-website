import { describe, it, expect } from 'vitest'
import { rng } from '../scene/build.js'
import { grainPixels } from './grainTile.js'

describe('grainPixels', () => {
  it('is sparse and faint', () => {
    const px = grainPixels(160, rng(3))
    expect(px.length).toBe(160 * 160 * 4)
    let on = 0
    let maxA = 0
    for (let i = 3; i < px.length; i += 4) {
      if (px[i] > 0) on++
      maxA = Math.max(maxA, px[i])
    }
    const share = on / (160 * 160)
    expect(share).toBeGreaterThan(0.15)
    expect(share).toBeLessThan(0.25)
    expect(maxA).toBeLessThanOrEqual(32)
  })
})
