import { useMemo } from 'react'
import { CLOUDS } from '../layout.js'
import { PALETTE, mix, rgb } from '../palette.js'
import { createBuilder, rng } from '../build.js'
import { createSceneMaterial } from '../sceneMaterial.js'

const COLORS = [PALETTE.cream, PALETTE.teal, PALETTE.orange]
const COUNT = 6
const THICKNESS = 14
const SEGMENTS = 72

// Banded cloud layers: thick level rings stacked over the landing site. The descent runs down
// through the hole in the middle, so colour passes on every side and nothing crosses the lens.
export default function CloudBands() {
  const geometry = useMemo(() => {
    const b = createBuilder()
    const rand = rng(5)
    for (let i = 0; i < COUNT; i++) {
      const y = CLOUDS.yMin + (i * (CLOUDS.yMax - CLOUDS.yMin)) / (COUNT - 1)
      const inner = 320 + rand() * 80
      // kept narrow enough that no band shows in the sky from the landing site
      const outer = y * (1 + rand() * 0.25)
      const color = COLORS[i % COLORS.length]
      const wall = mix(rgb(color), rgb(PALETTE.navy), 0.35)
      b.annulus([0, y, 0], inner, outer, SEGMENTS, color)
      b.annulus([0, y + THICKNESS, 0], inner, outer, SEGMENTS, color)
      // the inner and outer walls, a shade darker, give each band its depth
      for (const r of [inner, outer]) {
        for (let k = 0; k < SEGMENTS; k++) {
          const a0 = (k / SEGMENTS) * Math.PI * 2
          const a1 = ((k + 1) / SEGMENTS) * Math.PI * 2
          const p = (a, h) => [Math.cos(a) * r, y + h, Math.sin(a) * r]
          b.flat([p(a0, 0), p(a1, 0), p(a1, THICKNESS), p(a0, THICKNESS)], [wall])
        }
      }
    }
    return b.toGeometry()
  }, [])
  const material = useMemo(() => createSceneMaterial({ fogNear: 2500, fogFar: 14000, doubleSided: true }), [])
  return <mesh geometry={geometry} material={material} />
}
