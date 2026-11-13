import { describe, it, expect } from 'vitest'
import { scrollToProgress, damp, nearestStop, captionVisibility } from './progress.js'

describe('scrollToProgress', () => {
  it('maps top, middle and bottom', () => {
    expect(scrollToProgress(0, 6000, 1000)).toBe(0)
    expect(scrollToProgress(2500, 6000, 1000)).toBe(0.5)
    expect(scrollToProgress(5000, 6000, 1000)).toBe(1)
  })
  it('clamps overscroll', () => {
    expect(scrollToProgress(-80, 6000, 1000)).toBe(0)
    expect(scrollToProgress(5300, 6000, 1000)).toBe(1)
  })
  it('returns 0 when there is nothing to scroll', () => {
    expect(scrollToProgress(0, 1000, 1000)).toBe(0)
    expect(scrollToProgress(0, 0, 0)).toBe(0)
  })
})

describe('damp', () => {
  it('is frame-rate independent', () => {
    const one = damp(0, 1, 0.032)
    const two = damp(damp(0, 1, 0.016), 1, 0.016)
    expect(one).toBeCloseTo(two, 10)
  })
  it('does not move when dt is 0', () => expect(damp(0.3, 1, 0)).toBe(0.3))
  it('never overshoots on a long gap', () => {
    const v = damp(0, 1, 10)
    expect(v).toBeLessThanOrEqual(1)
    expect(v).toBeGreaterThan(0.999)
  })
  it('jumps straight to target when tau is 0', () => expect(damp(0, 1, 0.016, 0)).toBe(1))
})

describe('nearestStop', () => {
  it('picks the closest of five', () => {
    expect(nearestStop(0)).toBe(0)
    expect(nearestStop(0.124)).toBe(0)
    expect(nearestStop(0.126)).toBe(1)
    expect(nearestStop(1)).toBe(4)
    expect(nearestStop(7)).toBe(4)
    expect(nearestStop(NaN)).toBe(0)
  })
})

describe('captionVisibility', () => {
  const window = [0.2, 0.23, 0.27, 0.3]
  it('is hidden before and after its window', () => {
    expect(captionVisibility(0.1, window)).toBe(0)
    expect(captionVisibility(0.2, window)).toBe(0)
    expect(captionVisibility(0.3, window)).toBe(0)
    expect(captionVisibility(0.9, window)).toBe(0)
  })
  it('is fully shown through the middle of its window', () => {
    expect(captionVisibility(0.23, window)).toBe(1)
    expect(captionVisibility(0.25, window)).toBe(1)
    expect(captionVisibility(0.27, window)).toBe(1)
  })
  it('fades in and out at the ends', () => {
    expect(captionVisibility(0.215, window)).toBeCloseTo(0.5, 6)
    expect(captionVisibility(0.285, window)).toBeCloseTo(0.5, 6)
  })
  it('can start shown at the top and stay shown at the bottom', () => {
    expect(captionVisibility(0, [0, 0, 0.05, 0.09])).toBe(1)
    expect(captionVisibility(1, [0.93, 0.97, 1, 1])).toBe(1)
    expect(captionVisibility(NaN, window)).toBe(0)
  })
})
