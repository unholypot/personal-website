import { describe, it, expect } from 'vitest'
import { PATH_POINTS, pathPoint } from './layout.js'
import { TOUCHDOWN, TRAIL_OFF_END, TRAIL_OFF_START, TURN_END, TURN_START, craftT, engineAmount, jetAmount, trailReeled, turnAmount } from './craftFlight.js'

describe('craftT', () => {
  it('only ever moves forward, never jumps, and is on the pad from touchdown on', () => {
    let last = -1
    for (let p = 0; p <= 1.0001; p += 0.001) {
      const t = craftT(p)
      expect(t).toBeGreaterThanOrEqual(last - 1e-9)
      if (last >= 0) expect(t - last).toBeLessThan(0.006)
      last = t
    }
    expect(craftT(TOUCHDOWN)).toBe(1)
    expect(craftT(1)).toBe(1)
  })
  it('has no jolt where it hands over from the camera\'s pace to its own', () => {
    const e = 0.0005
    const before = (craftT(0.56) - craftT(0.56 - e)) / e
    const after = (craftT(0.56 + e) - craftT(0.56)) / e
    expect(Math.abs(after - before)).toBeLessThan(0.15)
  })
  it('comes to rest on the pad with no speed at the touch', () => {
    const speed = (craftT(TOUCHDOWN) - craftT(TOUCHDOWN - 0.0005)) / 0.0005
    expect(speed).toBeLessThan(0.1)
  })
  it('survives bad numbers', () => {
    expect(craftT(NaN)).toBeGreaterThanOrEqual(0)
  })
})

describe('the landing', () => {
  it('ends on the landing pad, and comes straight down onto it', () => {
    const end = pathPoint(1)
    const above = pathPoint(craftT(TURN_END + 0.04))
    expect(Math.hypot(end[0] - PATH_POINTS[PATH_POINTS.length - 1][0], end[2] - PATH_POINTS[PATH_POINTS.length - 1][2])).toBeLessThan(1e-6)
    // from the end of the turn on, it is nearly over the pad
    expect(Math.hypot(above[0] - end[0], above[2] - end[2])).toBeLessThan(15)
    expect(above[1]).toBeGreaterThan(end[1])
  })
  it('stays above the ground until it touches', () => {
    for (let p = 0; p <= TOUCHDOWN; p += 0.005) expect(pathPoint(craftT(p))[1]).toBeGreaterThan(1)
  })
})

describe('the turn, the trail and the engine', () => {
  it('turns over between its start and end, and is still before and after', () => {
    expect(turnAmount(TURN_START - 0.01)).toBe(0)
    expect(turnAmount(TURN_END + 0.01)).toBe(1)
    expect(turnAmount((TURN_START + TURN_END) / 2)).toBeCloseTo(0.5, 5)
  })
  it('takes the trail in only after the thesis shot, and finishes before the turn is done', () => {
    expect(trailReeled(TRAIL_OFF_START - 0.01)).toBe(0)
    expect(trailReeled(TRAIL_OFF_END + 0.01)).toBe(1)
    expect(TRAIL_OFF_END).toBeLessThanOrEqual(TURN_END)
    expect(TRAIL_OFF_START).toBeLessThan(TURN_START)
  })
  it('burns at the start, is off while it turns, burns again upright, and is out at the pad', () => {
    expect(engineAmount(0.3)).toBeGreaterThan(0.4)
    expect(engineAmount((TURN_START + TURN_END) / 2 - 0.01)).toBeLessThan(0.1)
    expect(engineAmount(0.75)).toBeGreaterThan(0.9)
    expect(engineAmount(TOUCHDOWN + 0.01)).toBe(0)
  })
  it('puffs its side jets only while it turns', () => {
    expect(jetAmount(TURN_START - 0.01)).toBe(0)
    expect(jetAmount((TURN_START + TURN_END) / 2)).toBeGreaterThan(0.9)
    expect(jetAmount(TURN_END + 0.01)).toBe(0)
  })
})
