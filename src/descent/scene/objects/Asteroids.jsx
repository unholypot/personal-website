import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferGeometry, Float32BufferAttribute } from 'three'
import { rockPositions } from '../moonBody.js'
import { GIANT } from '../layout.js'
import { RING_OUTER_UNSCALED, RING_SCALE } from '../satelliteLayout.js'
import { PALETTE } from '../palette.js'
import { shared } from '../sceneMaterial.js'
import { createStippleMaterial } from '../shaders/stipple.js'

// A handful of larger rocks drifting just outside the rings' edge, each its own lumpy shard, lit
// and shaded like the moons and turning slowly as it goes round. [distance from the planet, lift off the
// ring plane, size, start angle, tumble speed]
const OUTER = RING_OUTER_UNSCALED * RING_SCALE
const ROCKS = [
  [OUTER + 90, 40, 105, 0.35, 0.22],
  [OUTER + 150, -55, 62, 0.62, -0.31],
  [OUTER + 215, 70, 125, 1.1, 0.14],
  [OUTER + 120, 20, 50, 1.5, 0.4],
  [OUTER + 260, -30, 78, 2.05, -0.18],
  [OUTER + 70, -70, 56, 2.6, 0.27],
  [OUTER + 190, 50, 95, 3.3, -0.24],
  [OUTER + 310, 10, 66, 3.9, 0.19],
  [OUTER + 140, -40, 115, 4.5, 0.12],
  [OUTER + 240, 60, 52, 5.2, -0.35],
  [OUTER + 100, 28, 72, 5.8, 0.25],
]

// The same slow law as the ring's own chunks: nearer in goes quicker.
const rate = (distance) => 0.016 * Math.pow(2400 / distance, 1.5)

export default function Asteroids() {
  const orbits = useRef([])
  const rocks = useRef([])
  const material = useMemo(() => createStippleMaterial({ lit: PALETTE.cream, shadow: PALETTE.navy, cell: 2, spread: 0.16, lift: 0.04, mid: 0.4, midEdge: 0.4 }), [])
  const geometries = useMemo(
    () =>
      ROCKS.map(([, , size], i) => {
        const g = new BufferGeometry()
        g.setAttribute('position', new Float32BufferAttribute(rockPositions(size, i + 3, 1), 3))
        g.computeVertexNormals() // not indexed, so each facet is flat
        g.computeBoundingSphere()
        return g
      }),
    [],
  )

  // the clock in `shared` stands still for reduced motion, so the rocks do too
  useFrame(() => {
    const t = shared.uTime.value
    ROCKS.forEach(([distance, , , start, spin], i) => {
      if (orbits.current[i]) orbits.current[i].rotation.y = -(start + t * rate(distance))
      if (rocks.current[i]) {
        rocks.current[i].rotation.set(t * spin * 0.8 + i, t * spin, t * spin * 0.5)
      }
    })
  })

  return (
    <group position={GIANT.center} rotation={GIANT.tilt}>
      {ROCKS.map(([distance, lift], i) => (
        <group
          key={i}
          ref={(el) => {
            orbits.current[i] = el
          }}
        >
          <mesh
            ref={(el) => {
              rocks.current[i] = el
            }}
            material={material}
            geometry={geometries[i]}
            position={[distance, lift, 0]}
          />
        </group>
      ))}
    </group>
  )
}
