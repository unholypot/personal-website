import { useMemo } from 'react'
import { GIANT, MOON } from '../layout.js'
import { PALETTE } from '../palette.js'
import { createStippleMaterial } from '../shaders/stipple.js'

// The way to the ringed giant, whose light faintly warms the moon's night side (as earthshine does ours).
const GLOW_DIRECTION = GIANT.center.map((v, i) => v - MOON.center[i])

// The destination: a warm moon whose top is the landing ground.
export default function Moon() {
  const material = useMemo(() => createStippleMaterial({ lit: PALETTE.mustard, shadow: PALETTE.ink, cell: 3, spread: 0.22, lift: 0.1, glow: { direction: GLOW_DIRECTION, color: PALETTE.orange } }), [])
  return (
    <mesh material={material} position={MOON.center}>
      <sphereGeometry args={[MOON.radius, 96, 64]} />
    </mesh>
  )
}
