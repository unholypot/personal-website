import { describe, it, expect } from 'vitest'
import { SKILLS } from '../../content/skills.js'
import { CHARTS } from '../content/starCharts.js'
import { sampleCamera } from './cameraPath.js'
import {
  ANCHORS,
  TALL_ANCHORS,
  EXPLORE_UNTIL,
  buildConstellations,
  canExplore,
  directionFromScreen,
  nearestFigure,
  projectDirection,
  projectToOpening,
  screenRadius,
  starSize,
  viewDirection,
} from './constellations.js'

const figures = buildConstellations()
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const angle = (a, b) => Math.acos(Math.min(1, Math.max(-1, dot(a, b))))

describe('the skills', () => {
  it('are five groups, each with a real constellation, a name, a tagline and a list, with no em dashes', () => {
    expect(SKILLS.length).toBe(5)
    expect(new Set(SKILLS.map((s) => s.id)).size).toBe(SKILLS.length)
    for (const s of SKILLS) {
      expect(CHARTS[s.constellation]).toBeDefined()
      expect(s.name.length).toBeGreaterThan(2)
      expect(s.tagline.length).toBeGreaterThan(8)
      expect(s.items.length).toBeGreaterThanOrEqual(5)
      expect(new Set(s.items).size).toBe(s.items.length)
      expect(`${s.name}${s.tagline}${s.items.join('')}`).not.toContain('—')
    }
  })

  it('give each group its own constellation', () => {
    expect(new Set(SKILLS.map((s) => s.constellation)).size).toBe(SKILLS.length)
  })

  it('name the languages and the tools that were asked for', () => {
    const items = (id) => SKILLS.find((s) => s.id === id).items.join(' | ')
    for (const word of ['Python', 'C#', 'JavaScript']) expect(items('languages')).toContain(word)
    for (const word of ['AWS', 'Docker']) expect(items('coding-tools')).toContain(word)
    for (const word of ['PyTorch', 'TensorFlow']) expect(items('ml')).toContain(word)
    for (const word of ['AutoCAD', 'LTspice', 'MATLAB', 'Simulink']) expect(items('design')).toContain(word)
  })
})

describe('buildConstellations', () => {
  it('makes one figure for each skill group, in the same order, with the constellation its chart names', () => {
    expect(figures.map((f) => f.id)).toEqual(SKILLS.map((s) => s.id))
    expect(figures.map((f) => f.name)).toEqual(['Orion', 'Scorpius', 'The Southern Cross', 'The Big Dipper', 'Cassiopeia'])
    expect(ANCHORS.length).toBe(SKILLS.length)
  })

  it('keeps every real star, on the unit sphere, with valid lines between them', () => {
    figures.forEach((f, i) => {
      const chart = CHARTS[SKILLS[i].constellation]
      expect(f.stars.length).toBe(chart.stars.length)
      expect(f.sizes.length).toBe(f.stars.length)
      expect(f.tints.length).toBe(f.stars.length)
      for (const s of f.stars) expect(Math.hypot(...s)).toBeCloseTo(1, 9)
      expect(f.links.length).toBe(chart.links.length)
      for (const [a, b] of f.links) {
        expect(a).toBeGreaterThanOrEqual(0)
        expect(b).toBeGreaterThanOrEqual(0)
        expect(a).not.toBe(b)
      }
    })
  })

  it('makes brighter stars look bigger, and tints the red giants and the blue-white ones', () => {
    expect(starSize(0.1)).toBeGreaterThan(starSize(3.5))
    expect(starSize(9)).toBe(3)
    const orion = figures[0]
    const names = CHARTS.orion.stars.map((s) => s.name)
    expect(orion.sizes[names.indexOf('Rigel')]).toBeGreaterThan(orion.sizes[names.indexOf('Meissa')])
    expect(orion.tints[names.indexOf('Betelgeuse')]).toBe('orange')
    expect(orion.tints[names.indexOf('Rigel')]).toBe('blue')
    expect(orion.tints[names.indexOf('Meissa')]).toBeNull()
  })

  it('is the same every time', () => {
    expect(buildConstellations()).toEqual(figures)
  })

  it('puts each figure at its anchor in the opening view, at the size set for it', () => {
    figures.forEach((f, i) => {
      const [ax, ay, size] = ANCHORS[i]
      const where = projectToOpening(f.centre)
      expect(where.x).toBeCloseTo(ax, 6)
      expect(where.y).toBeCloseTo(ay, 6)
      for (const s of f.stars) expect(angle(s, f.centre)).toBeLessThanOrEqual(f.radius + 1e-9)
      expect(f.radius / size).toBeGreaterThan(0.97)
      expect(f.radius / size).toBeLessThan(1.03)
    })
  })

  it('all fit on the opening screen, clear of the planet and of one another', () => {
    for (const f of figures) {
      for (const s of f.stars) {
        const p = projectToOpening(s)
        expect(Math.abs(p.x)).toBeLessThan(0.97)
        expect(Math.abs(p.y)).toBeLessThan(0.97)
        // the planet and its rings take the middle of the opening view
        expect(Math.abs(p.x) < 0.55 && p.y > -0.5 && p.y < 0.3).toBe(false)
      }
    }
    for (let i = 0; i < figures.length; i++)
      for (let j = i + 1; j < figures.length; j++)
        expect(angle(figures[i].centre, figures[j].centre)).toBeGreaterThan(figures[i].radius + figures[j].radius + 0.02)
  })
})

describe('canExplore', () => {
  it('lets the constellations be explored only in the opening view, before any real scrolling', () => {
    expect(canExplore(0)).toBe(true)
    expect(canExplore(EXPLORE_UNTIL / 2)).toBe(true)
    expect(canExplore(EXPLORE_UNTIL)).toBe(false)
    expect(canExplore(0.05)).toBe(false)
    expect(canExplore(0.5)).toBe(false)
    expect(canExplore(1)).toBe(false)
  })
  it('stays within the first sliver of the scroll, and is off for bad values', () => {
    expect(EXPLORE_UNTIL).toBeGreaterThan(0)
    expect(EXPLORE_UNTIL).toBeLessThanOrEqual(0.02)
    expect(canExplore(NaN)).toBe(false)
    expect(canExplore(-1)).toBe(false)
  })
})

describe('on a phone-shaped screen', () => {
  const tall = buildConstellations(0.46)

  it('has a layout of its own for each of the five, in the same order', () => {
    expect(TALL_ANCHORS.length).toBe(SKILLS.length)
    expect(tall.map((f) => f.id)).toEqual(SKILLS.map((s) => s.id))
    expect(tall).not.toEqual(figures)
  })

  it('puts every star on screen, in the open sky above the planet and its rings, and the figures apart', () => {
    for (const f of tall) {
      for (const s of f.stars) {
        const p = projectToOpening(s, 0.46)
        expect(Math.abs(p.x)).toBeLessThan(0.95)
        expect(p.y).toBeLessThan(0.93)
        // on a tall screen the rings run the full width: keep clear of the whole band from the
        // top of the planet down to the moon
        expect(p.y).toBeGreaterThan(0.3)
      }
    }
    for (let i = 0; i < tall.length; i++)
      for (let j = i + 1; j < tall.length; j++)
        expect(angle(tall[i].centre, tall[j].centre)).toBeGreaterThan(tall[i].radius + tall[j].radius + 0.015)
  })
})

describe('directionFromScreen and projectDirection', () => {
  it('round-trip: a direction aimed at a point on screen projects back to that point', () => {
    const cam = sampleCamera(0, 1.6)
    const f = cam.target.map((v, i) => v - cam.position[i])
    const len = Math.hypot(...f)
    const forward = f.map((v) => v / len)
    for (const [x, y] of [[0, 0], [0.5, 0.3], [-0.7, 0.8], [0.9, -0.4]]) {
      const d = directionFromScreen(x, y)
      // into camera space: build the same basis the camera has
      const right = [forward[1] * 0 - forward[2] * 1, forward[2] * 0 - forward[0] * 0, forward[0] * 1 - forward[1] * 0]
      const rl = Math.hypot(...right)
      const r = right.map((v) => v / rl)
      const u = [r[1] * forward[2] - r[2] * forward[1], r[2] * forward[0] - r[0] * forward[2], r[0] * forward[1] - r[1] * forward[0]]
      const view = [dot(d, r), dot(d, u), -dot(d, forward)]
      const p = projectDirection(view, cam.fov, 1.6)
      expect(p.visible).toBe(true)
      expect(p.x).toBeCloseTo(x, 6)
      expect(p.y).toBeCloseTo(y, 6)
    }
  })
  it('straight ahead is the middle, the edge of the view is 1, and behind is not visible', () => {
    expect(projectDirection([0, 0, -1], 50, 1.6)).toEqual({ x: 0, y: 0, visible: true })
    const a = (50 / 2) * (Math.PI / 180)
    expect(projectDirection([0, Math.sin(a), -Math.cos(a)], 50, 1.6).y).toBeCloseTo(1, 9)
    expect(projectDirection([0, 0, 1], 50, 1.6).visible).toBe(false)
    expect(projectDirection([1, 0, 0], 50, 1.6).visible).toBe(false)
  })
})

describe('projectToOpening', () => {
  it('is the reverse of directionFromScreen', () => {
    for (const [x, y] of [[0, 0], [0.5, 0.3], [-0.7, 0.8], [0.9, -0.4]]) {
      const p = projectToOpening(directionFromScreen(x, y))
      expect(p.x).toBeCloseTo(x, 9)
      expect(p.y).toBeCloseTo(y, 9)
    }
  })
})

describe('viewDirection', () => {
  it('turns a world direction into camera space with the camera matrix', () => {
    const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    expect(viewDirection(identity, [0.2, 0.3, -0.9])).toEqual([0.2, 0.3, -0.9])
    // a quarter turn about y, column-major: x -> -z, z -> x
    const quarter = [0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1]
    expect(viewDirection(quarter, [1, 0, 0])).toEqual([0, 0, -1])
  })
})

describe('screenRadius', () => {
  it('is half the screen for half the field of view', () => {
    expect(screenRadius((50 / 2) * (Math.PI / 180), 50, 800)).toBeCloseTo(400, 6)
    expect(screenRadius(0, 50, 800)).toBe(0)
  })
})

describe('nearestFigure', () => {
  const screens = [
    { x: 100, y: 100, r: 40, visible: true },
    { x: 300, y: 120, r: 40, visible: true },
    { x: 500, y: 100, r: 40, visible: false },
  ]
  it('picks the closest figure the pointer is on or close to', () => {
    expect(nearestFigure(screens, 110, 95, 30)).toBe(0)
    expect(nearestFigure(screens, 290, 150, 30)).toBe(1)
    expect(nearestFigure(screens, 160, 100, 30)).toBe(0) // 60px away: within r + slack of the first only
  })
  it('ignores figures that are off screen, and gives -1 when nothing is near', () => {
    expect(nearestFigure(screens, 500, 100, 30)).toBe(-1)
    expect(nearestFigure(screens, 700, 700, 30)).toBe(-1)
    expect(nearestFigure([], 0, 0, 30)).toBe(-1)
  })
})
