import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferGeometry, Float32BufferAttribute, LineBasicMaterial } from 'three'
import { GIANT } from '../layout.js'
import { PALETTE, TONES } from '../palette.js'
import { createBuilder } from '../build.js'
import { createSceneMaterial, motion } from '../sceneMaterial.js'

// A small survey probe on a long orbit round the giant, with its path drawn as a thin dashed
// line. It swings in front of the planet and behind it, which gives the sky some depth.
const ORBIT = {
  radius: 4300, // beyond the rings
  tilt: [1.0, 0.35, 0.15], // far steeper than the rings, so the two cross
  period: 140, // seconds for a full circuit
}
const DASHES = 150

// The orbit as short dashes with gaps between, in one draw of lines (always one pixel thin).
function orbitLine() {
  const points = []
  for (let i = 0; i < DASHES; i++) {
    const a0 = (i / DASHES) * Math.PI * 2
    const a1 = a0 + (0.55 * Math.PI * 2) / DASHES
    points.push(Math.cos(a0) * ORBIT.radius, 0, Math.sin(a0) * ORBIT.radius)
    points.push(Math.cos(a1) * ORBIT.radius, 0, Math.sin(a1) * ORBIT.radius)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(points, 3))
  return g
}

export default function ProbeOrbit() {
  const spin = useRef(null)
  const line = useMemo(() => orbitLine(), [])
  const lineMaterial = useMemo(() => new LineBasicMaterial({ color: PALETTE.cream, transparent: true, opacity: 0.34, depthWrite: false }), [])
  const probe = useMemo(() => {
    const b = createBuilder()
    b.box([0, 0, 0], [30, 22, 22], TONES.station) // the body
    b.box([0, 0, 13], [12, 12, 5], TONES.silhouette) // an instrument bay
    for (const side of [-1, 1]) {
      b.box([side * 21, 0, 0], [12, 2, 2], TONES.station) // the arm
      b.box([side * 44, 0, 0], [30, 2, 24], TONES.solar) // the panel
    }
    b.lathe([[0, 0.5], [6, 8], [10, 12]], 8, TONES.station, [0, 14, 0]) // the dish
    b.box([0, 27, 0], [1.4, 12, 1.4], TONES.silhouette) // its aerial
    return b.toGeometry()
  }, [])
  // never faded by distance: it is always far away and should stay crisp
  const material = useMemo(() => createSceneMaterial({ fogNear: 1e9, fogFar: 2e9 }), [])

  useFrame((_, delta) => {
    if (motion.on && spin.current) spin.current.rotation.y -= (Math.min(delta, 0.1) * Math.PI * 2) / ORBIT.period
  })

  return (
    <group position={GIANT.center} rotation={ORBIT.tilt}>
      <lineSegments geometry={line} material={lineMaterial} frustumCulled={false} />
      <group ref={spin} rotation={[0, 1.9, 0]}>
        <mesh geometry={probe} material={material} position={[ORBIT.radius, 0, 0]} scale={2.4} />
      </group>
    </group>
  )
}
