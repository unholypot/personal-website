import { describe, it, expect } from 'vitest'
import { DRAW_TIME, DRIFT, LEAN, REVEAL_END, REVEAL_ORDER, figureShift, revealAmount } from './skyReveal.js'

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
