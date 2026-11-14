import { describe, it, expect } from 'vitest'
import { terrainBlocked } from './terrainLayout.js'
import { BASE, LANDING_PAD, RIDGE } from './layout.js'
import { RING_OUTER_RADIUS, SATELLITES } from './satelliteLayout.js'

describe('terrain clearance', () => {
  it('protects the full pad and habitat area, including overlapping mountain edges', () => {
    expect(terrainBlocked(LANDING_PAD[0], LANDING_PAD[1], 1)).toBe(true)
    expect(terrainBlocked(LANDING_PAD[0] + 65, LANDING_PAD[1], 45)).toBe(true)
    expect(terrainBlocked(BASE[0] + 75, BASE[2], 40)).toBe(true)
    expect(terrainBlocked(RIDGE[0], RIDGE[2], 1)).toBe(true)
  })
  it('leaves an approach corridor and permits distant mountain ranges', () => {
    expect(terrainBlocked(20, 10, 14)).toBe(true)
    expect(terrainBlocked(230, -250, 35)).toBe(false)
    expect(terrainBlocked(-230, -250, 35)).toBe(false)
  })
})

describe('satellite clearance', () => {
  it('keeps the whole sphere outside the rings for every orbital phase', () => {
    for (const moon of SATELLITES) {
      for (let i = 0; i < 720; i++) {
        const angle = i * Math.PI / 360
        const centreDistance = Math.hypot(Math.cos(angle) * moon.orbit, Math.sin(angle) * moon.orbit)
        expect(centreDistance - moon.radius - RING_OUTER_RADIUS).toBeGreaterThanOrEqual(200)
      }
    }
  })
})
