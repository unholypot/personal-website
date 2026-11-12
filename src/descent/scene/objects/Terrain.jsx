import { useMemo } from 'react'
import { RIDGE, RIDGE_TOP } from '../layout.js'
import { PALETTE, TONES, mix, rgb } from '../palette.js'
import { createBuilder, rng } from '../build.js'
import { createSceneMaterial } from '../sceneMaterial.js'

const ink = rgb(PALETTE.ink)
const navy = rgb(PALETTE.navy)
const teal = rgb(PALETTE.teal)

// Upright cut-out ridgelines, nearest first: [z, width, tallest peak, colour].
const LAYERS = [
  [-20, 300, 6, ink],
  [-60, 500, 14, mix(ink, navy, 0.6)],
  [-140, 800, 18, navy],
  [-320, 1400, 40, mix(navy, teal, 0.45)],
]

function ridgeline(b, [z, width, peak, color], rand) {
  const steps = 64
  const heights = []
  let h = 0.5
  for (let i = 0; i <= steps; i++) {
    // a wandering height with the odd sharp peak
    h = Math.min(1, Math.max(0.15, h + (rand() - 0.5) * 0.45))
    heights.push(peak * (rand() < 0.12 ? Math.min(1, h + 0.35) : h))
  }
  const base = -140 // deep enough to stay below the moon's curve at the far edges
  for (let i = 0; i < steps; i++) {
    const x0 = -width / 2 + (width * i) / steps
    const x1 = -width / 2 + (width * (i + 1)) / steps
    b.flat([[x0, base, z], [x1, base, z], [x1, heights[i + 1], z], [x0, heights[i], z]], [color])
  }
}

// The landing ground: a level plain, layered silhouette ridges behind it, and the rocky rise the astronaut stands on.
export default function Terrain() {
  const geometry = useMemo(() => {
    const b = createBuilder()
    const rand = rng(42)
    b.annulus([0, 0.3, 0], 0, 420, 48, PALETTE.mustard)
    for (const layer of LAYERS) ridgeline(b, layer, rand)
    // the ridge: a stepped rise with a flat top, and rubble to either side (never toward the viewer)
    const [rx, , rz] = RIDGE
    b.box([rx, RIDGE_TOP * 0.21, rz], [14, RIDGE_TOP * 0.42, 9], TONES.rock, 0.2)
    b.box([rx, RIDGE_TOP * 0.6, rz], [9, RIDGE_TOP * 0.36, 6], TONES.rock, -0.15)
    b.box([rx, RIDGE_TOP * 0.89, rz], [4.5, RIDGE_TOP * 0.22, 3.5], TONES.rock, 0.3)
    for (let i = 0; i < 9; i++) {
      const side = i % 2 ? 1 : -1
      const s = 1.2 + rand() * 3
      const height = 0.8 + rand() * 2.2
      b.box([rx + side * (8 + rand() * 9), height / 2, rz - 6 + rand() * 9], [s, height, s * 0.8], TONES.rock, rand() * 3)
    }
    return b.toGeometry()
  }, [])
  const material = useMemo(() => createSceneMaterial({ fogNear: 2500, fogFar: 14000, doubleSided: true }), [])
  return <mesh geometry={geometry} material={material} />
}
