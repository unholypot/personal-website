import { useMemo } from 'react'
import { MOON } from '../layout.js'
import { PALETTE } from '../palette.js'
import { createStippleMaterial } from '../shaders/stipple.js'

// The destination: a warm moon whose top is the landing ground.
export default function Moon() {
  const material = useMemo(() => createStippleMaterial({ lit: PALETTE.mustard, shadow: PALETTE.ink, cell: 3 }), [])
  return (
    <mesh material={material} position={MOON.center}>
      <sphereGeometry args={[MOON.radius, 96, 64]} />
    </mesh>
  )
}
