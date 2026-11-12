import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { pathPoint, pathTangent } from '../layout.js'
import { TONES } from '../palette.js'
import { createBuilder } from '../build.js'
import { createSceneMaterial } from '../sceneMaterial.js'

const UP = new Vector3(0, 1, 0)
const dir = new Vector3()

// How far ahead of the camera's progress the craft flies.
export const CRAFT_LEAD = 0.04

// The little rocket that leads the way down. It is drawn larger the farther off it is,
// so it stays readable against a planet as well as close to the ground.
export default function Craft({ progress }) {
  const mesh = useRef(null)
  const geometry = useMemo(() => {
    const b = createBuilder()
    b.lathe([[0, 0.9], [1, 1.3], [4, 1.3], [5.2, 0.8], [6.2, 0]], 8, TONES.craft)
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2
      b.box([Math.cos(a) * 1.5, 0.6, Math.sin(a) * 1.5], [1.4, 1.6, 0.3], TONES.payload, -a)
    }
    return b.toGeometry()
  }, [])
  const material = useMemo(() => createSceneMaterial({ fogNear: 1e9, fogFar: 2e9 }), [])

  useFrame(({ camera }) => {
    const m = mesh.current
    if (!m) return
    const p = progress.current
    m.visible = p <= 0.93
    if (!m.visible) return
    const t = Math.min(1, p + CRAFT_LEAD)
    const at = pathPoint(t)
    const tan = pathTangent(t)
    m.position.set(at[0], at[1], at[2])
    m.quaternion.setFromUnitVectors(UP, dir.set(tan[0], tan[1], tan[2]))
    m.scale.setScalar(Math.max(1, camera.position.distanceTo(m.position) * 0.012))
  })

  return <mesh ref={mesh} geometry={geometry} material={material} />
}
