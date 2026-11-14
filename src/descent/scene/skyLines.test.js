import { describe, it, expect } from 'vitest'
import { VERTICES_PER_SEGMENT, fillRibbons, ribbonSides, segmentFraction } from './skyLines.js'

const segments = [
  [[1, 0, 0], [0, 1, 0]],
  [[0, 1, 0], [0, 0, 1]],
]
const width = 0.001

describe('segmentFraction', () => {
  it('draws the segments one after another', () => {
    expect(segmentFraction(0, 0, 2)).toBe(0)
    expect(segmentFraction(0.25, 0, 2)).toBeCloseTo(0.5)
    expect(segmentFraction(0.25, 1, 2)).toBe(0)
    expect(segmentFraction(0.75, 0, 2)).toBe(1)
    expect(segmentFraction(0.75, 1, 2)).toBeCloseTo(0.5)
    expect(segmentFraction(1, 1, 2)).toBe(1)
  })
})

describe('ribbonSides', () => {
  it('alternates across the line, six vertices a segment', () => {
    const s = ribbonSides(2)
    expect(s.length).toBe(2 * VERTICES_PER_SEGMENT)
    expect([...s.slice(0, 6)]).toEqual([-1, 1, 1, -1, 1, -1])
    expect([...s.slice(0, 6)]).toEqual([...s.slice(6)])
  })
})

describe('fillRibbons', () => {
  const buffer = () => new Float32Array(segments.length * VERTICES_PER_SEGMENT * 3)

  it('has the ribbon run from the start of its line to the end, thinly', () => {
    const out = fillRibbons(buffer(), segments, 1, width)
    const [ax, ay, az] = [out[0], out[1], out[2]] // first corner, beside the start
    expect(Math.hypot(ax - 1, ay, az)).toBeLessThan(width * 1.01)
    const end = [out[6], out[7], out[8]] // third vertex, beside the end
    expect(Math.hypot(end[0], end[1] - 1, end[2])).toBeLessThan(width * 1.2)
  })

  it('stops partway along the line when only part is drawn', () => {
    const half = fillRibbons(buffer(), segments, 0.25, width) // first segment half drawn
    const tip = [half[6], half[7], half[8]]
    expect(tip[0]).toBeGreaterThan(0.5)
    expect(tip[1]).toBeGreaterThan(0.5)
    expect(tip[1]).toBeLessThan(0.9)
  })

  it('collapses a segment that has not been reached', () => {
    const out = fillRibbons(buffer(), segments, 0.25, width)
    const second = out.slice(18, 36)
    for (let v = 0; v < 6; v++) {
      const [x, y, z] = [second[v * 3], second[v * 3 + 1], second[v * 3 + 2]]
      // all six corners sit on the start of segment two
      expect(Math.hypot(x, y - 1, z)).toBeLessThan(1e-6)
    }
  })
})
