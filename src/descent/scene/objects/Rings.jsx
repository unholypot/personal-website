import { useMemo } from 'react'
import { Euler, Vector3 } from 'three'
import { GIANT } from '../layout.js'
import { RING_SCALE, RING_OUTER_UNSCALED } from '../satelliteLayout.js'
import { PALETTE, mix, rgb } from '../palette.js'
import { LIGHT, createBuilder } from '../build.js'
import { createSceneMaterial } from '../sceneMaterial.js'

// Ringlets from the inside out: [inner radius, outer radius, colour]. Broad bands, hair-thin
// ones and dark gaps between, so the system reads as many rings and not one flat disc.
const RINGLETS = [
  [1630, 1650, PALETTE.cream],
  [1675, 1700, PALETTE.mustard],
  [1740, 1955, PALETTE.mustard],
  [1970, 1990, PALETTE.orange],
  [2005, 2090, PALETTE.cream],
  [2140, 2215, PALETTE.mustard],
  [2222, 2236, PALETTE.cream],
  [2243, 2330, PALETTE.mustard],
  [2350, 2368, PALETTE.teal],
  [2395, 2445, PALETTE.mustard],
  [2500, 2512, PALETTE.cream],
  [2560, RING_OUTER_UNSCALED, PALETTE.mustard],
]

const SEGMENTS = 240

// How much larger the rings are drawn than the radii listed above. They are true circles;
// they look long and tapered because they are seen nearly edge-on (see GIANT.tilt).
const SIZE = RING_SCALE
const navy = rgb(PALETTE.navy)

// The ringed giant's rings, seen nearly edge-on, with the planet's own shadow falling across them.
export default function Rings() {
  const geometry = useMemo(() => {
    const b = createBuilder()
    const tilt = new Euler(...GIANT.tilt)
    const light = new Vector3(...LIGHT)
    const p = new Vector3()
    // Is this point of the ring plane in the planet's shadow? It is if the planet lies between
    // it and the light: behind the planet, and within the planet's width of the line through it.
    const shadowed = (x, z) => {
      p.set(x, 0, z).applyEuler(tilt)
      const along = p.dot(light)
      if (along > 0) return false
      return p.addScaledVector(light, -along).length() < GIANT.radius
    }
    for (const [inner, outer, color] of RINGLETS) {
      const lit = rgb(color)
      const dim = mix(lit, navy, 0.62)
      for (let i = 0; i < SEGMENTS; i++) {
        const a0 = (i / SEGMENTS) * Math.PI * 2
        const a1 = ((i + 1) / SEGMENTS) * Math.PI * 2
        const mid = (a0 + a1) / 2
        const r = (inner + outer) / 2
        const at = (radius, a) => [Math.cos(a) * radius * SIZE, 0, Math.sin(a) * radius * SIZE]
        const centre = at(r, mid)
        b.flat([at(inner, a0), at(outer, a0), at(outer, a1), at(inner, a1)], [shadowed(centre[0], centre[2]) ? dim : lit])
      }
    }
    return b.toGeometry()
  }, [])
  // Never faded: the giant is always far away and must stay crisp.
  const material = useMemo(() => createSceneMaterial({ fogNear: 1e9, fogFar: 2e9, doubleSided: true }), [])
  return <mesh geometry={geometry} material={material} position={GIANT.center} rotation={GIANT.tilt} />
}
