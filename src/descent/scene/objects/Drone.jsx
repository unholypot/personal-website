import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { DRONE } from '../layout.js'
import { TONES } from '../palette.js'
import { createBuilder } from '../build.js'
import { createSceneMaterial, motion, shared } from '../sceneMaterial.js'

const ARMS = [
  [1.8, 1.8],
  [-1.8, 1.8],
  [-1.8, -1.8],
  [1.8, -1.8],
]

// A survey quadrotor with its payload slung underneath: the UAV project, flying alongside.
export default function Drone() {
  const group = useRef(null)
  const rotors = useRef([])
  const body = useMemo(() => {
    const b = createBuilder()
    b.box([0, 0, 0], [2.2, 0.7, 1.6], TONES.drone)
    b.box([0, 0, 0], [5.4, 0.2, 0.3], TONES.drone, Math.PI / 4)
    b.box([0, 0, 0], [5.4, 0.2, 0.3], TONES.drone, -Math.PI / 4)
    for (const [x, z] of ARMS) b.box([x, 0.25, z], [0.35, 0.5, 0.35], TONES.drone)
    // the payload, the brightest thing on it
    b.box([0, -0.8, 0], [1.1, 0.9, 1.1], TONES.payload)
    b.box([0, -1.4, 0.3], [0.3, 0.3, 0.5], TONES.silhouette)
    // skids
    for (const x of [-0.9, 0.9]) b.box([x, -1.5, 0], [0.12, 0.12, 2], TONES.silhouette)
    return b.toGeometry()
  }, [])
  const blade = useMemo(() => {
    const b = createBuilder()
    b.box([0, 0, 0], [2.4, 0.06, 0.26], TONES.silhouette)
    return b.toGeometry()
  }, [])
  const material = useMemo(() => createSceneMaterial({ fogNear: 400, fogFar: 3000 }), [])

  useFrame((_, delta) => {
    if (!motion.on) return
    const t = shared.uTime.value
    if (group.current) {
      group.current.position.y = DRONE[1] + Math.sin((t * Math.PI * 2) / 3) * 0.6
      group.current.position.x = DRONE[0] + Math.sin((t * Math.PI * 2) / 9) * 2
      group.current.rotation.z = Math.cos((t * Math.PI * 2) / 9) * 0.08
    }
    rotors.current.forEach((r, i) => {
      if (r) r.rotation.y += delta * (i % 2 ? -38 : 38)
    })
  })

  return (
    <group ref={group} position={DRONE} scale={2}>
      <mesh geometry={body} material={material} />
      {ARMS.map(([x, z], i) => (
        <mesh
          key={i}
          ref={(el) => {
            rotors.current[i] = el
          }}
          geometry={blade}
          material={material}
          position={[x, 0.55, z]}
          rotation={[0, i * 0.8, 0]}
        />
      ))}
    </group>
  )
}
