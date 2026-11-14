import { describe, it, expect } from 'vitest'
import { CHARTS } from './starCharts.js'
import { starInfo, starNotes } from './starInfo.js'
import { nearestStar } from '../scene/constellations.js'

describe('starInfo', () => {
  it('names a star, its constellation and, for a famous one, a line about it', () => {
    const index = CHARTS.orion.stars.findIndex((s) => s.name === 'Betelgeuse')
    expect(starInfo('orion', index)).toEqual({ name: 'Betelgeuse', constellation: 'Orion', note: expect.stringContaining('red supergiant') })
  })

  it('gives a star with only a Greek letter its constellation after it, as astronomers do', () => {
    const index = CHARTS.scorpius.stars.findIndex((s) => s.name === 'Sigma')
    expect(starInfo('scorpius', index).name).toBe('Sigma Scorpii')
    expect(starInfo('scorpius', index).note).toBe('')
  })

  it('says nothing for a star that is not there', () => {
    expect(starInfo('orion', 99)).toBeNull()
    expect(starInfo('nowhere', 0)).toBeNull()
  })

  it('has a note only for stars that are really in the charts', () => {
    for (const key of Object.keys(starNotes)) {
      const [chart, name] = key.split(':')
      expect(CHARTS[chart]?.stars.some((s) => s.name === name), key).toBe(true)
    }
  })

  it('has the genitive for every constellation', () => {
    for (const chart of Object.values(CHARTS)) expect(chart.of).toBeTruthy()
  })
})

describe('nearestStar', () => {
  const screens = [
    { visible: true, stars: [{ x: 100, y: 100 }, { x: 140, y: 100 }] },
    { visible: false, stars: [{ x: 300, y: 300 }] },
    { visible: true, stars: [{ x: 300, y: 300 }] },
  ]

  it('finds the nearest star within the slack', () => {
    expect(nearestStar(screens, 104, 101, 12)).toEqual({ figure: 0, star: 0 })
    expect(nearestStar(screens, 138, 100, 12)).toEqual({ figure: 0, star: 1 })
  })

  it('finds nothing when no star is close, and ignores figures that are off screen', () => {
    expect(nearestStar(screens, 200, 200, 12)).toBeNull()
    expect(nearestStar(screens, 300, 300, 5)).toEqual({ figure: 2, star: 0 })
  })
})
