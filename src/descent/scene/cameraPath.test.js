import { describe, it, expect } from 'vitest'
import { PATH_POINTS, pathPoint, pathTangent } from './layout.js'
import { KEYFRAMES, sampleCamera } from './cameraPath.js'

describe('pathPoint', () => {
  it('starts and ends on the control points', () => {
    expect(pathPoint(0)).toEqual(PATH_POINTS[0])
    expect(pathPoint(1)).toEqual(PATH_POINTS[PATH_POINTS.length - 1])
    expect(pathPoint(-3)).toEqual(PATH_POINTS[0])
  })
  it('never goes below the ground', () => {
    for (let i = 0; i <= 200; i++) expect(pathPoint(i / 200)[1]).toBeGreaterThanOrEqual(0)
  })
  it('tangent is unit length', () => {
    const [x, y, z] = pathTangent(0.4)
    expect(Math.hypot(x, y, z)).toBeCloseTo(1, 6)
  })
})

describe('sampleCamera', () => {
  it('returns each keyframe exactly at its p (landscape)', () => {
    for (const k of KEYFRAMES) {
      const c = sampleCamera(k.p, 16 / 9)
      k.position.forEach((v, i) => expect(c.position[i]).toBeCloseTo(v, 6))
      k.target.forEach((v, i) => expect(c.target[i]).toBeCloseTo(v, 6))
      expect(c.fov).toBeCloseTo(k.fov, 6)
    }
  })
  it('has a keyframe on each of the five stops', () => {
    for (const p of [0, 0.25, 0.5, 0.75, 1]) expect(KEYFRAMES.some((k) => k.p === p)).toBe(true)
  })
  it('is continuous between keyframes', () => {
    for (let i = 0; i < 400; i++) {
      const a = sampleCamera(i / 400, 1.6)
      const b = sampleCamera((i + 1) / 400, 1.6)
      expect(Math.hypot(...a.position.map((v, j) => v - b.position[j]))).toBeLessThan(150)
    }
  })
  it('clamps p and tolerates NaN', () => {
    expect(sampleCamera(-1, 1.6)).toEqual(sampleCamera(0, 1.6))
    expect(sampleCamera(9, 1.6)).toEqual(sampleCamera(1, 1.6))
    expect(sampleCamera(NaN, 1.6)).toEqual(sampleCamera(0, 1.6))
  })
  it('widens the view on portrait screens, within bounds', () => {
    const first = KEYFRAMES[0].fov
    expect(sampleCamera(0, 9 / 16).fov).toBeCloseTo(Math.min(85, first * 1.4), 6)
    expect(sampleCamera(0.5, 9 / 21).fov).toBeLessThanOrEqual(85)
    expect(sampleCamera(0, 32 / 9).fov).toBeCloseTo(first, 6)
  })
})
