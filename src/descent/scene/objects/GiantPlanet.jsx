import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferGeometry, Euler, Float32BufferAttribute, Vector3 } from 'three'
import { moonPositions } from '../moonBody.js'
import { GIANT } from '../layout.js'
import { RING_INNER_UNSCALED, RING_OUTER_UNSCALED, RING_SCALE, SATELLITES } from '../satelliteLayout.js'
import { PALETTE, mix, rgb } from '../palette.js'
import { motion } from '../sceneMaterial.js'
import { createStippleMaterial } from '../shaders/stipple.js'

const TURN = (Math.PI * 2) / 180 // one orbit in three minutes
// The direction its rings' axis points, so the stripes run parallel to the rings.
const AXIS = new Vector3(0, 1, 0).applyEuler(new Euler(...GIANT.tilt)).toArray()
const STRIPE = mix(rgb(PALETTE.orange), rgb(PALETTE.mustard), 0.5)

// The ringed giant that hangs in the sky for the whole descent, with two small moons going round it.
export default function GiantPlanet() {
  const orbits = useRef([])
  const bodies = useRef([])
  // Less dither, and the shadow edge slid round to the dark side, so more of the body is in the light.
  const body = useMemo(() => createStippleMaterial({ lit: PALETTE.orange, shadow: PALETTE.navy, cell: 3, spread: 0.08,
        lift: 0.2,
        stripe: STRIPE,
        axis: AXIS,
        // the rings shade the globe below them, as the globe shades the rings
        ring: { axis: AXIS, inner: (RING_INNER_UNSCALED * RING_SCALE) / GIANT.radius, outer: (RING_OUTER_UNSCALED * RING_SCALE) / GIANT.radius },
      }), [])
  const moon = useMemo(() => createStippleMaterial({ lit: PALETTE.cream, shadow: PALETTE.navy, cell: 2, spread: 0.12, lift: 0.05, mid: 0.42, midEdge: 0.38 }), [])
  // Faceted, cratered moons, each its own pattern of craters.
  const geometries = useMemo(
    () =>
      SATELLITES.map((s, i) => {
        const g = new BufferGeometry()
        g.setAttribute('position', new Float32BufferAttribute(moonPositions(s.radius, i + 1, 12), 3))
        g.computeVertexNormals() // not indexed, so each facet is flat
        g.computeBoundingSphere()
        return g
      }),
    [],
  )
  const place = useMemo(() => new Vector3(), [])

  useFrame((_, delta) => {
    if (!motion.on) return
    const dt = Math.min(delta, 0.1)
    const step = dt * TURN
    SATELLITES.forEach((satellite, i) => {
      if (orbits.current[i]) orbits.current[i].rotation.y += step * satellite.speed
      // each moon turns on its own axis too, so its craters roll through the light
      if (bodies.current[i]) bodies.current[i].rotation.y += dt * (i % 2 ? -0.08 : 0.12)
      // tell the planet where the first two moons are, so it can show their shadows when one crosses its face
      if (i < 2 && bodies.current[i]) {
        bodies.current[i].getWorldPosition(place)
        const r = satellite.radius / GIANT.radius
        body.uniforms.uMoons.value[i].set((place.x - GIANT.center[0]) / GIANT.radius, (place.y - GIANT.center[1]) / GIANT.radius, (place.z - GIANT.center[2]) / GIANT.radius, r)
      }
    })
  })

  return (
    <group position={GIANT.center}>
      <mesh material={body}>
        <sphereGeometry args={[GIANT.radius, 64, 48]} />
      </mesh>
      {SATELLITES.map((satellite, i) => (
        <group
          key={i}
          ref={(el) => {
            orbits.current[i] = el
          }}
          rotation={satellite.tilt}
        >
          <mesh
            ref={(el) => {
              bodies.current[i] = el
            }}
            material={moon}
            geometry={geometries[i]}
            position={[satellite.orbit, 0, 0]}
          />
        </group>
      ))}
    </group>
  )
}
