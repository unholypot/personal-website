import { describe, it, expect } from 'vitest'
import { createQuality } from './quality.js'

describe('createQuality', () => {
  it('steps down after sustained slow frames while moving', () => {
    const q = createQuality({ maxDpr: 2 })
    for (let i = 0; i < 45; i++) q.sample(30, true)
    expect(q.level()).toBe(1.5)
    for (let i = 0; i < 45; i++) q.sample(30, true)
    expect(q.level()).toBe(1)
    for (let i = 0; i < 200; i++) q.sample(30, true)
    expect(q.level()).toBe(1)
  })
  it('ignores one slow frame and frames at rest', () => {
    const q = createQuality({ maxDpr: 2 })
    for (let i = 0; i < 44; i++) q.sample(8, true)
    q.sample(200, true)
    expect(q.level()).toBe(2)
    for (let i = 0; i < 200; i++) q.sample(60, false)
    expect(q.level()).toBe(2)
  })
  it('never steps up', () => {
    const q = createQuality({ maxDpr: 2 })
    for (let i = 0; i < 45; i++) q.sample(30, true)
    for (let i = 0; i < 500; i++) q.sample(4, true)
    expect(q.level()).toBe(1.5)
  })
  it('respects the device limit', () => {
    expect(createQuality({ maxDpr: 1 }).level()).toBe(1)
    expect(createQuality({ maxDpr: 1.5 }).level()).toBe(1.5)
    expect(createQuality({ maxDpr: 3 }).level()).toBe(2)
  })
})
