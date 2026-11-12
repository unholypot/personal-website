import { describe, it, expect } from 'vitest'
import { PALETTE, TONES, rgb, skyColor } from './palette.js'
import { LIGHT, pickTone, rng, createBuilder } from './build.js'

describe('pickTone', () => {
  it('uses the two thresholds', () => {
    const t = ['a', 'b', 'c']
    const side = [LIGHT[2], 0, -LIGHT[0]]
    const len = Math.hypot(...side)
    expect(pickTone(LIGHT, t)).toBe('a')
    expect(pickTone(LIGHT.map((v) => -v), t)).toBe('c')
    expect(pickTone(side.map((v) => v / len), t)).toBe('b')
  })
})

describe('rng', () => {
  it('is deterministic and in range', () => {
    const a = rng(7)
    const b = rng(7)
    for (let i = 0; i < 100; i++) {
      const v = a()
      expect(v).toBe(b())
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('createBuilder', () => {
  it('box emits 36 vertices and lights its top face', () => {
    const b = createBuilder()
    b.box([0, 0, 0], [2, 2, 2], TONES.station)
    expect(b.positions.length).toBe(36 * 3)
    expect(b.colors.length).toBe(36 * 3)
    const lit = rgb(TONES.station[0])
    const tops = []
    for (let i = 0; i < 36; i += 3) {
      const ys = [0, 1, 2].map((k) => b.positions[(i + k) * 3 + 1])
      if (ys.every((y) => y === 1)) tops.push(i)
    }
    expect(tops.length).toBe(2)
    tops.forEach((i) => lit.forEach((v, k) => expect(b.colors[i * 3 + k]).toBeCloseTo(v, 6)))
  })
  it('every triangle has one colour across its three vertices', () => {
    const b = createBuilder()
    b.lathe([[0, 1], [2, 1.5], [3, 0.5]], 8, TONES.dome)
    expect(b.positions.length).toBeGreaterThan(0)
    for (let i = 0; i < b.positions.length / 9; i++)
      for (let k = 0; k < 3; k++) {
        expect(b.colors[i * 9 + k]).toBe(b.colors[i * 9 + 3 + k])
        expect(b.colors[i * 9 + k]).toBe(b.colors[i * 9 + 6 + k])
      }
  })
  it('lathe faces point outward, so the side facing the light is brighter', () => {
    const b = createBuilder()
    b.lathe([[0, 1], [2, 1]], 4, ['#ffffff', '#808080', '#000000'])
    let plusX = null
    let minusX = null
    for (let i = 0; i < b.positions.length / 9; i++) {
      const xs = [0, 1, 2].map((k) => b.positions[i * 9 + k * 3])
      const ys = [0, 1, 2].map((k) => b.positions[i * 9 + k * 3 + 1])
      if (ys.every((y) => y === ys[0])) continue
      const cx = (xs[0] + xs[1] + xs[2]) / 3
      if (cx > 0.3 && plusX === null) plusX = b.colors[i * 9]
      if (cx < -0.3 && minusX === null) minusX = b.colors[i * 9]
    }
    expect(minusX).toBeGreaterThan(plusX)
  })
  it('toGeometry carries position and color', () => {
    const b = createBuilder()
    b.box([0, 0, 0], [1, 1, 1], TONES.rock)
    const g = b.toGeometry()
    expect(g.getAttribute('position').count).toBe(36)
    expect(g.getAttribute('color').count).toBe(36)
  })
})

describe('skyColor', () => {
  it('is navy in space and bluer near the ground', () => {
    expect(skyColor(0)).toEqual(rgb(PALETTE.navy))
    expect(skyColor(0.45)).toEqual(rgb(PALETTE.navy))
    expect(skyColor(1)[1]).toBeGreaterThan(skyColor(0)[1])
    expect(skyColor(1)).toEqual(skyColor(0.8))
  })
})
