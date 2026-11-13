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
  it('annulus is one flat colour, in the given arc', () => {
    const b = createBuilder()
    b.annulus([0, 5, 0], 2, 4, 12, PALETTE.mustard, 0, Math.PI)
    expect(b.positions.length).toBe(12 * 6 * 3)
    const c = rgb(PALETTE.mustard)
    for (let i = 0; i < b.colors.length; i += 3) c.forEach((v, k) => expect(b.colors[i + k]).toBeCloseTo(v, 6))
    for (let i = 0; i < b.positions.length; i += 3) {
      expect(b.positions[i + 1]).toBe(5)
      expect(b.positions[i + 2]).toBeGreaterThanOrEqual(-1e-9)
      const r = Math.hypot(b.positions[i], b.positions[i + 2])
      expect(r).toBeGreaterThan(1.99)
      expect(r).toBeLessThan(4.01)
    }
  })
  it('rgb passes an rgb triple through', () => {
    expect(rgb([0.1, 0.2, 0.3])).toEqual([0.1, 0.2, 0.3])
  })
  it('mountain is a solid faceted peak, shaded face by face', () => {
    const b = createBuilder()
    const tones = ['#ffffff', '#808080', '#000000']
    b.mountain([10, -2, 5], 8, 12, tones, { seed: 3 })
    const n = b.positions.length / 3
    expect(n % 3).toBe(0)
    expect(n).toBeGreaterThan(60)
    let top = -Infinity
    const seen = new Set()
    for (let i = 0; i < n; i++) {
      const y = b.positions[i * 3 + 1]
      expect(y).toBeGreaterThanOrEqual(-2 - 1e-9)
      expect(y).toBeLessThanOrEqual(10 + 1e-9)
      top = Math.max(top, y)
      // it stays within reach of its footprint
      expect(Math.hypot(b.positions[i * 3] - 10, b.positions[i * 3 + 2] - 5)).toBeLessThan(8 * 1.3)
      seen.add(b.colors[i * 3].toFixed(3))
    }
    expect(top).toBeCloseTo(10, 6)
    // lit, mid and shadow faces all appear: it has form from any side
    expect(seen.size).toBe(3)
    for (let t = 0; t < n / 3; t++)
      for (let k = 0; k < 3; k++) {
        expect(b.colors[t * 9 + k]).toBe(b.colors[t * 9 + 3 + k])
        expect(b.colors[t * 9 + k]).toBe(b.colors[t * 9 + 6 + k])
      }
  })
  it('mountain is the same for the same seed and differs for another', () => {
    const make = (seed) => {
      const b = createBuilder()
      b.mountain([0, 0, 0], 5, 6, TONES.rock, { seed })
      return b.positions
    }
    expect(make(1)).toEqual(make(1))
    expect(make(1)).not.toEqual(make(2))
  })
  it('mountain with a plateau has a level top wide enough to stand on', () => {
    const b = createBuilder()
    b.mountain([0, 0, 0], 8, 7, TONES.rock, { seed: 4, plateau: 1.4 })
    let widest = 0
    for (let i = 0; i < b.positions.length; i += 3)
      if (Math.abs(b.positions[i + 1] - 7) < 1e-9) widest = Math.max(widest, Math.hypot(b.positions[i], b.positions[i + 2]))
    expect(widest).toBeGreaterThan(1)
    expect(widest).toBeLessThan(2)
  })
  it('mountain texture varies the shade from face to face, between its own tones', () => {
    const b = createBuilder()
    b.mountain([0, 0, 0], 8, 10, ['#ffffff', '#808080', '#000000'], { seed: 3, texture: 0.4 })
    const shades = new Set()
    for (let i = 0; i < b.colors.length; i += 9) {
      shades.add(b.colors[i].toFixed(3))
      expect(b.colors[i]).toBeGreaterThanOrEqual(0)
      expect(b.colors[i]).toBeLessThanOrEqual(1)
      // still one flat colour per face
      expect(b.colors[i + 3]).toBe(b.colors[i])
      expect(b.colors[i + 6]).toBe(b.colors[i])
    }
    expect(shades.size).toBeGreaterThan(6)
  })
  it('mountain can stand along any up direction, for a curved world', () => {
    const b = createBuilder()
    b.mountain([100, 50, 0], 6, 10, TONES.rock, { seed: 2, up: [1, 0, 0] })
    let far = -Infinity
    for (let i = 0; i < b.positions.length; i += 3) {
      const along = b.positions[i] - 100
      expect(along).toBeGreaterThanOrEqual(-1e-9)
      expect(along).toBeLessThanOrEqual(10 + 1e-9)
      far = Math.max(far, along)
      // its foot spreads across the other two directions
      expect(Math.hypot(b.positions[i + 1] - 50, b.positions[i + 2])).toBeLessThan(6 * 1.3)
    }
    expect(far).toBeCloseTo(10, 6)
  })
  it('ridged terrain stays within its clearance footprint and has lit and shaded faces', () => {
    for (let seed = 0; seed < 25; seed++) {
      const b = createBuilder()
      b.mountain([0, 0, 0], 30, 40, ['#ffffff', '#808080', '#000000'],
        { seed, ridged: true, segments: 12, tiers: 5 })
      const tones = new Set()
      for (let i = 0; i < b.positions.length; i += 3) {
        const [x, y, z] = b.positions.slice(i, i + 3)
        expect(Number.isFinite(x + y + z)).toBe(true)
        expect(y).toBeGreaterThanOrEqual(0)
        expect(y).toBeLessThanOrEqual(40)
        expect(Math.hypot(x, z)).toBeLessThan(30 * 1.35)
        tones.add(b.colors[i])
      }
      expect(tones.size).toBe(3)
    }
  })
  it('rock is a lumpy faceted lump, shaded face by face', () => {
    const b = createBuilder()
    const tones = ['#ffffff', '#808080', '#202020']
    b.rock([10, 20, 30], 50, tones, { seed: 3 })
    expect(b.positions.length).toBe(80 * 9)
    const distances = []
    for (let i = 0; i < b.positions.length; i += 3) {
      distances.push(Math.hypot(b.positions[i] - 10, b.positions[i + 1] - 20, b.positions[i + 2] - 30))
    }
    expect(Math.min(...distances)).toBeGreaterThan(50 * 0.6)
    expect(Math.max(...distances)).toBeLessThan(50 * 1.4)
    // lumpy, not a ball
    const mean = distances.reduce((a, v) => a + v, 0) / distances.length
    const spread = Math.sqrt(distances.reduce((a, v) => a + (v - mean) ** 2, 0) / distances.length)
    expect(spread).toBeGreaterThan(50 * 0.03)
    // lit, mid and shadow faces all appear, one colour to a face
    const shades = new Set()
    for (let t = 0; t < 80; t++) {
      expect(b.colors[t * 9]).toBe(b.colors[t * 9 + 3])
      expect(b.colors[t * 9]).toBe(b.colors[t * 9 + 6])
      shades.add(b.colors[t * 9].toFixed(3))
    }
    expect(shades.size).toBeGreaterThanOrEqual(2)
  })
  it('rock is the same for the same seed, differs for another, and can be squashed and turned', () => {
    const make = (options) => {
      const b = createBuilder()
      b.rock([0, 0, 0], 40, TONES.rock, options)
      return b.positions
    }
    expect(make({ seed: 1 })).toEqual(make({ seed: 1 }))
    expect(make({ seed: 1 })).not.toEqual(make({ seed: 2 }))
    const flat = make({ seed: 1, squash: 0.5 })
    const round = make({ seed: 1, squash: 1 })
    const height = (p) => Math.max(...p.filter((_, i) => i % 3 === 1)) - Math.min(...p.filter((_, i) => i % 3 === 1))
    expect(height(flat)).toBeLessThan(height(round) * 0.7)
    expect(make({ seed: 1, turn: [0.7, 0.3, 0.2] })).not.toEqual(round)
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
