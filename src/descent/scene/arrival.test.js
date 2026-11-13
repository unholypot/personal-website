import { describe, it, expect } from 'vitest'
import { arrivalLift } from './arrival.js'

describe('arrivalLift', () => {
  it('cancels an in-progress arrival when reduced motion is enabled', () => {
    const run = { arriving: true, arrivalStart: 0 }
    expect(arrivalLift(run, { enabled: false, ready: true, atTop: true, time: 0.4 })).toBe(0)
    expect(run.arriving).toBe(false)
    expect(arrivalLift(run, { enabled: true, ready: true, atTop: false, time: 0.5 })).toBe(0)
  })
  it('settles a top-of-page arrival and never lifts a restored scroll position', () => {
    const run = { arriving: null, arrivalStart: 0 }
    expect(arrivalLift(run, { enabled: true, ready: true, atTop: true, time: 5 })).toBe(300)
    expect(arrivalLift(run, { enabled: true, ready: true, atTop: true, time: 5.8 })).toBeCloseTo(150)
    expect(arrivalLift(run, { enabled: true, ready: true, atTop: true, time: 6.6 })).toBeCloseTo(0)
    expect(arrivalLift({ arriving: null }, { enabled: true, ready: true, atTop: false, time: 0 })).toBe(0)
  })
})
