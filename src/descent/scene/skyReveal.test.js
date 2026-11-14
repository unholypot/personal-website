import { describe, it, expect } from 'vitest'
import { DRAW_TIME, DRIFT, LEAN, LINES_END, LINE_FADE_TIME, LINE_PULSE, REVEAL_END, REVEAL_ORDER, figureShift, lineFade, linePulse, revealAmount } from './skyReveal.js'

describe('revealAmount', () => {
  it('is nothing before the scene is ready and everything once the last one is drawn', () => {
    for (let i = 0; i < 5; i++) {
      expect(revealAmount(0, i)).toBe(0)
      expect(revealAmount(REVEAL_END + 0.01, i)).toBe(1)
    }
  })

  it('brings the figures in one after another, in the set order', () => {
    const times = REVEAL_ORDER.map((figure) => {
      let t = 0
      while (revealAmount(t, figure) === 0) t += 0.01
      return t
    })
    for (let k = 1; k < times.length; k++) expect(times[k]).toBeGreaterThan(times[k - 1])
  })

  it('only ever rises, and stays between 0 and 1', () => {
    let last = 0
    for (let t = 0; t <= REVEAL_END + 1; t += 0.05) {
      const v = revealAmount(t, 3)
      expect(v).toBeGreaterThanOrEqual(last)
      expect(v).toBeLessThanOrEqual(1)
      last = v
    }
  })

  it('takes a moment to draw each one, and is over within a few seconds', () => {
    expect(DRAW_TIME).toBeGreaterThan(1)
    expect(REVEAL_END).toBeLessThan(6)
  })

  it('survives bad numbers', () => {
    expect(revealAmount(NaN, 0)).toBe(0)
    expect(revealAmount(-5, 2)).toBe(0)
  })
})

describe('figureShift', () => {
  const still = { x: 0, y: 0 }

  it('stays small, so a figure never wanders far from where it was set', () => {
    for (let i = 0; i < 5; i++)
      for (let t = 0; t < 600; t += 7) {
        const [x, y] = figureShift(i, t, { x: 1, y: -1 })
        expect(Math.hypot(x, y)).toBeLessThan(0.025)
      }
  })

  it('moves each figure differently, so they slide against each other', () => {
    const p = { x: 1, y: 0.5 }
    const shifts = [0, 1, 2, 3, 4].map((i) => figureShift(i, 12, p).map((v) => v.toFixed(5)).join())
    expect(new Set(shifts).size).toBe(5)
  })

  it('drifts on its own with no pointer, and leans with the pointer', () => {
    expect(figureShift(0, 5, still)).not.toEqual(figureShift(0, 9, still))
    expect(figureShift(0, 5, { x: 1, y: 0 })[0]).toBeGreaterThan(figureShift(0, 5, still)[0])
    expect(Math.max(...LEAN)).toBeGreaterThan(DRIFT)
  })
})

describe('lineFade', () => {
  it('starts from nothing and rises slowly and smoothly to full', () => {
    expect(lineFade(0, 0)).toBe(0)
    expect(lineFade(LINES_END + 1, 4)).toBe(1)
    let last = 0
    for (let t = 0; t <= LINES_END + 1; t += 0.1) {
      const v = lineFade(t, 2)
      expect(v).toBeGreaterThanOrEqual(last)
      last = v
    }
  })

  it('is quick enough to be seen in the first couple of seconds, but still comes up gently', () => {
    expect(LINE_FADE_TIME).toBeLessThanOrEqual(3)
    expect(LINE_FADE_TIME).toBeGreaterThanOrEqual(1.5)
    // the first figure's lines are up in about two and a half seconds, and the last by about three and a half
    expect(lineFade(2.6, 0)).toBeGreaterThan(0.95)
    expect(LINES_END).toBeLessThan(4)
    // and at the very start they are barely there
    expect(lineFade(0.4, 0)).toBeLessThan(0.05)
  })

  it('survives bad numbers', () => {
    expect(lineFade(NaN, 0)).toBe(0)
  })
})

describe('linePulse', () => {
  it('is never dimmer than resting and never brighter than the pulse allows', () => {
    for (let t = 0; t < 300; t += 0.5)
      for (let i = 0; i < 5; i++) {
        const v = linePulse(t, i)
        expect(v).toBeGreaterThanOrEqual(1)
        expect(v).toBeLessThanOrEqual(1 + LINE_PULSE + 1e-9)
      }
  })

  it('is at rest most of the time, and does swell now and then', () => {
    let resting = 0
    let swelled = 0
    for (let t = 0; t < 600; t += 0.5) {
      const v = linePulse(t, 1)
      if (v === 1) resting++
      if (v > 1 + LINE_PULSE * 0.5) swelled++
    }
    expect(resting).toBeGreaterThan(400)
    expect(swelled).toBeGreaterThan(0)
  })
})
