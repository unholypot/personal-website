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
  it('keeps zoom velocity continuous across camera stops', () => {
    const e = 0.00001
    for (const { p } of KEYFRAMES.slice(1, -1)) {
      const mid = sampleCamera(p, 1.6).fov
      const before = (mid - sampleCamera(p - e, 1.6).fov) / e
      const after = (sampleCamera(p + e, 1.6).fov - mid) / e
      expect(Math.abs(after - before)).toBeLessThan(0.5)
    }
  })
  const direction = (from, to) => {
    const d = to.map((v, i) => v - from[i])
    const len = Math.hypot(...d)
    return d.map((v) => v / len)
  }
  it('at each keyframe it stands where the keyframe says and looks the way it says', () => {
    for (const k of KEYFRAMES) {
      const c = sampleCamera(k.p, 16 / 9)
      k.position.forEach((v, i) => expect(c.position[i]).toBeCloseTo(v, 6))
      const want = direction(k.position, k.target)
      direction(c.position, c.target).forEach((v, i) => expect(v).toBeCloseTo(want[i], 6))
      expect(c.fov).toBeCloseTo(k.fov, 6)
    }
  })
  it('turns smoothly: the view never swings more than a degree or so between small steps', () => {
    let last = null
    for (let i = 0; i <= 1000; i++) {
      const c = sampleCamera(i / 1000, 1.6)
      const d = direction(c.position, c.target)
      if (last) {
        const dot = Math.min(1, d[0] * last[0] + d[1] * last[1] + d[2] * last[2])
        expect((Math.acos(dot) * 180) / Math.PI).toBeLessThan(1.5)
      }
      last = d
    }
  })
  it('from the drone to the landing the view turns steadily left and up, never dipping to the ground first', () => {
    let lastAzimuth = Infinity
    let lowest = Infinity
    for (let i = 0; i <= 100; i++) {
      const c = sampleCamera(0.75 + (0.25 * i) / 100, 1.6)
      const d = direction(c.position, c.target)
      const azimuth = Math.atan2(d[0], -d[2]) // positive is to the right
      expect(azimuth).toBeLessThanOrEqual(lastAzimuth + 0.004)
      lastAzimuth = azimuth
      lowest = Math.min(lowest, Math.asin(d[1]))
    }
    const start = sampleCamera(0.75, 1.6)
    const startPitch = Math.asin(direction(start.position, start.target)[1])
    expect(lowest).toBeGreaterThan(startPitch - 0.035) // no more than 2 degrees below where it began
  })
  it('only ever descends: the camera never bobs back up on the way down', () => {
    let last = Infinity
    for (let i = 0; i <= 1000; i++) {
      const y = sampleCamera(i / 1000, 1.6).position[1]
      expect(y).toBeLessThanOrEqual(last + 1e-6)
      last = y
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
