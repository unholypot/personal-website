import { describe, it, expect } from 'vitest'
import { STOPS } from '../descent/content/stops.js'
import { CHARTS } from '../descent/content/starCharts.js'
import { PROJECTS } from './projects.js'
import { SKILLS } from './skills.js'
import { PROFILE, ROUTES } from './site.js'

describe('projects', () => {
  it('have unique ids and every field the portfolio page shows', () => {
    expect(new Set(PROJECTS.map((p) => p.id)).size).toBe(PROJECTS.length)
    for (const p of PROJECTS) {
      for (const key of ['id', 'year', 'title', 'summary', 'stack', 'overview', 'role', 'outcome']) expect(p[key], `${p.id}.${key}`).toBeTruthy()
      expect(p.highlights.length).toBeGreaterThan(0)
    }
  })
})

describe('the descent links into the portfolio', () => {
  it('only to projects that exist', () => {
    const ids = new Set(PROJECTS.map((p) => p.id))
    for (const stop of STOPS)
      for (const link of stop.links ?? []) {
        if (!link.href.startsWith(`${ROUTES.portfolio}#`)) continue
        expect(ids.has(link.href.split('#')[1]), link.href).toBe(true)
      }
  })

  it('ends with the full portfolio, the CV and the contact links', () => {
    const labels = STOPS.at(-1).links.map((l) => l.label)
    expect(labels).toEqual(expect.arrayContaining(['Full portfolio', 'Download CV', 'Email', 'LinkedIn', 'GitHub']))
    expect(STOPS.at(-1).links.find((l) => l.label === 'Download CV').href).toBe(PROFILE.cv)
  })
})

describe('skills', () => {
  it('each name a real star chart', () => {
    for (const s of SKILLS) expect(CHARTS[s.constellation], s.id).toBeTruthy()
  })
})
