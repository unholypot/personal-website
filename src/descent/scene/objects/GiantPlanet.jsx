import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { GIANT } from '../layout.js'
import { PALETTE } from '../palette.js'
import { motion } from '../sceneMaterial.js'
import { createStippleMaterial } from '../shaders/stipple.js'

const TURN = (Math.PI * 2) / 180 // one orbit in three minutes

// The ringed giant that hangs in the sky for the whole descent, with two small moons going round it.
export default function GiantPlanet() {
  const inner = useRef(null)
  const outer = useRef(null)
  const body = useMemo(() => createStippleMaterial({ lit: PALETTE.orange, shadow: PALETTE.navy, cell: 4 }), [])
  const moon = useMemo(() => createStippleMaterial({ lit: PALETTE.cream, shadow: PALETTE.navy, cell: 3 }), [])

  useFrame((_, delta) => {
    if (!motion.on) return
    if (inner.current) inner.current.rotation.y += delta * TURN
    if (outer.current) outer.current.rotation.y -= delta * TURN * 0.6
  })

  return (
    <group position={GIANT.center}>
      <mesh material={body}>
        <sphereGeometry args={[GIANT.radius, 64, 48]} />
      </mesh>
      <group ref={inner} rotation={[0.25, 0.6, 0]}>
        <mesh material={moon} position={[2900, 0, 0]}>
          <sphereGeometry args={[90, 24, 16]} />
        </mesh>
      </group>
      <group ref={outer} rotation={[-0.15, 2.4, 0.1]}>
        <mesh material={moon} position={[3600, 0, 0]}>
          <sphereGeometry args={[60, 24, 16]} />
        </mesh>
      </group>
    </group>
  )
}
