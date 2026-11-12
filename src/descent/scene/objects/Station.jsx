import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { STATION } from '../layout.js'
import { TONES } from '../palette.js'
import { createBuilder } from '../build.js'
import { createSceneMaterial, motion, shared } from '../sceneMaterial.js'

// An orbital station: a faceted hub, two wings of solar panels and a dish. It sways slowly about its hub.
export default function Station() {
  const spin = useRef(null)
  const geometry = useMemo(() => {
    const b = createBuilder()
    // hub, along local y
    b.lathe([[-20, 3], [-17, 6], [-4, 6], [-2, 8], [2, 8], [4, 6], [17, 6], [20, 3]], 8, TONES.station)
    // two wings of five panels each, along local x
    for (const side of [-1, 1]) {
      b.box([side * 12, 0, 0], [8, 1.2, 1.2], TONES.station)
      for (let i = 0; i < 5; i++) b.box([side * (27 + i * 24), 0, 0], [22, 18, 0.6], TONES.solar)
    }
    // dish on one end
    b.lathe([[0, 0.6], [3, 4], [4, 9]], 10, TONES.station, [0, 20, 0])
    b.box([0, 25, 0], [0.5, 5, 0.5], TONES.payload)
    return b.toGeometry()
  }, [])
  const material = useMemo(() => createSceneMaterial({ fogNear: 800, fogFar: 6000 }), [])

  useFrame(() => {
    if (motion.on && spin.current) spin.current.rotation.y = Math.sin(shared.uTime.value * 0.1) * 0.35
  })

  return (
    // hub upright, panels facing the approaching camera, the whole thing tipped a little
    <group position={STATION} rotation={[0.15, -0.3, 0.35]} scale={1.3}>
      <mesh ref={spin} geometry={geometry} material={material} />
    </group>
  )
}
