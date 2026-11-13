import { describe, it, expect } from 'vitest'
import { CHARTS } from '../content/starCharts.js'
import { angularSeparation, chartOffsets } from './starChart.js'

const find = (chart, name) => chart.stars.findIndex((s) => s.name === name)

describe('the star charts', () => {
  it('each name real constellations and keep to real stars: coordinates in range, links between stars that exist', () => {
    expect(Object.keys(CHARTS).sort()).toEqual(['cassiopeia', 'crux', 'orion', 'scorpius', 'ursa-major'])
    for (const chart of Object.values(CHARTS)) {
      const names = chart.stars.map((s) => s.name)
      expect(new Set(names).size).toBe(names.length)
      for (const s of chart.stars) {
        expect(s.ra).toBeGreaterThanOrEqual(0)
        expect(s.ra).toBeLessThan(24)
        expect(Math.abs(s.dec)).toBeLessThan(90)
        expect(s.mag).toBeGreaterThan(-2)
        expect(s.mag).toBeLessThan(5)
      }
      for (const [a, b] of chart.links) {
        expect(names).toContain(a)
        expect(names).toContain(b)
      }
      // every star is joined to the figure, bar those marked faint
      const joined = new Set(chart.links.flat())
      for (const s of chart.stars) expect(joined.has(s.name) || s.faint === true).toBe(true)
    }
  })

  it('have the right number of stars for each figure', () => {
    expect(CHARTS.orion.stars.length).toBe(8)
    expect(CHARTS.scorpius.stars.length).toBe(15)
    expect(CHARTS.crux.stars.length).toBe(5)
    expect(CHARTS['ursa-major'].stars.length).toBe(7)
    expect(CHARTS.cassiopeia.stars.length).toBe(5)
  })
})

describe('chartOffsets', () => {
  it('keeps the shape true: the distances between stars are in proportion to the real angles between them', () => {
    for (const [key, chart] of Object.entries(CHARTS)) {
      const pts = chartOffsets(chart.stars)
      const flat = (i, j) => Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y)
      const real = (i, j) => angularSeparation(chart.stars[i], chart.stars[j])
      // scale the flat chart to the real one using its longest pair
      let longest = [0, 1]
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) if (flat(i, j) > flat(...longest)) longest = [i, j]
      const scale = real(...longest) / flat(...longest)
      const tolerance = key === 'scorpius' ? 0.12 : 0.07
      for (let i = 0; i < pts.length; i++)
        for (let j = i + 1; j < pts.length; j++) expect(Math.abs(flat(i, j) * scale - real(i, j)) / real(i, j)).toBeLessThan(tolerance)
    }
  })

  it('is centred on the middle of the figure', () => {
    for (const chart of Object.values(CHARTS)) {
      const pts = chartOffsets(chart.stars)
      expect((Math.max(...pts.map((p) => p.x)) + Math.min(...pts.map((p) => p.x))) / 2).toBeCloseTo(0, 9)
      expect((Math.max(...pts.map((p) => p.y)) + Math.min(...pts.map((p) => p.y))) / 2).toBeCloseTo(0, 9)
    }
  })

  it('draws them the way the sky looks, with east on the left and north up', () => {
    const at = (key, name) => {
      const chart = CHARTS[key]
      return chartOffsets(chart.stars)[find(chart, name)]
    }
    // Orion: Betelgeuse is the red shoulder, up and to the left of blue Rigel at the foot
    expect(at('orion', 'Betelgeuse').x).toBeLessThan(at('orion', 'Rigel').x)
    expect(at('orion', 'Betelgeuse').y).toBeGreaterThan(at('orion', 'Rigel').y)
    // and the belt runs diagonally between them, Alnitak at its left
    expect(at('orion', 'Alnitak').x).toBeLessThan(at('orion', 'Mintaka').x)
    // the Southern Cross stands upright, Gacrux at the top and Acrux at the foot, Mimosa to the left
    expect(at('crux', 'Gacrux').y).toBeGreaterThan(at('crux', 'Acrux').y)
    expect(at('crux', 'Mimosa').x).toBeLessThan(at('crux', 'Imai').x)
    // the Big Dipper's handle (Alkaid) is on the left and its bowl (Dubhe) on the right
    expect(at('ursa-major', 'Alkaid').x).toBeLessThan(at('ursa-major', 'Dubhe').x)
    // Scorpius: the tail (Shaula) curls down and to the left of Antares
    expect(at('scorpius', 'Shaula').x).toBeLessThan(at('scorpius', 'Antares').x)
    expect(at('scorpius', 'Shaula').y).toBeLessThan(at('scorpius', 'Antares').y)
    // Cassiopeia: Caph at the right end of the W, Segin at the left
    expect(at('cassiopeia', 'Segin').x).toBeLessThan(at('cassiopeia', 'Caph').x)
  })

  it("puts Orion's three belt stars in a nearly even line", () => {
    const chart = CHARTS.orion
    const p = chartOffsets(chart.stars)
    const [a, b, c] = ['Alnitak', 'Alnilam', 'Mintaka'].map((n) => p[find(chart, n)])
    const d1 = Math.hypot(a.x - b.x, a.y - b.y)
    const d2 = Math.hypot(b.x - c.x, b.y - c.y)
    expect(d1 / d2).toBeGreaterThan(0.85)
    expect(d1 / d2).toBeLessThan(1.15)
    // collinear: the middle star lies close to the line between the outer two
    const cross = Math.abs((c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x)) / Math.hypot(c.x - a.x, c.y - a.y)
    expect(cross / Math.hypot(c.x - a.x, c.y - a.y)).toBeLessThan(0.05)
  })
})

describe('angularSeparation', () => {
  it('measures the real angle between two stars', () => {
    const chart = CHARTS.orion
    const betelgeuse = chart.stars[find(chart, 'Betelgeuse')]
    const rigel = chart.stars[find(chart, 'Rigel')]
    // about 18.6 degrees apart
    expect((angularSeparation(betelgeuse, rigel) * 180) / Math.PI).toBeGreaterThan(18)
    expect((angularSeparation(betelgeuse, rigel) * 180) / Math.PI).toBeLessThan(19.2)
    expect(angularSeparation(rigel, rigel)).toBe(0)
  })
})
