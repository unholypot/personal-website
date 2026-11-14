import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { pathPoint, pathTangent } from '../layout.js'
import { PALETTE, TONES, mix, rgb } from '../palette.js'
import { createBuilder } from '../build.js'
import { createSceneMaterial, motion, shared } from '../sceneMaterial.js'
import { COMPANION, companionOffset } from '../companion.js'

const UP = new Vector3(0, 1, 0)
const dir = new Vector3()

// How far ahead of the camera's progress the craft flies.
export const CRAFT_LEAD = 0.04

// A white hull whichever way it faces: its shaded side is a cool grey, never the moon's mustard,
// so the rocket stays white and orange against planet and ground alike.
const HULL = [PALETTE.cream, PALETTE.cream, mix(rgb(PALETTE.cream), rgb(PALETTE.navy), 0.22)]
// Orange trim that stays orange in shade (a deeper orange, not black).
const TRIM = [PALETTE.orange, PALETTE.orange, mix(rgb(PALETTE.orange), rgb(PALETTE.navy), 0.3)]
const FLAME = [PALETTE.orange, PALETTE.orange, PALETTE.orange]

// The little rocket that leads the way down, nose first, its engine burning behind it. It is
// drawn larger the farther off it is, so it stays readable from orbit as well as near the ground.
// With `companion` it is the second, smaller craft that comes down alongside, on its own path.
export default function Craft({ progress, companion = false }) {
  const group = useRef(null)
  const flame = useRef(null)
  const body = useMemo(() => {
    const b = createBuilder()
    b.lathe([[0, 0.95], [0.5, 1.3], [3.6, 1.3], [4.0, 1.25]], 8, HULL)
    b.lathe([[4.0, 1.25], [5.2, 0.8], [6.3, 0]], 8, TRIM) // nose cone
    b.lathe([[2.3, 1.34], [2.75, 1.34]], 8, TRIM) // a band round the middle
    b.box([0, 3.2, 1.28], [0.7, 0.7, 0.12], TONES.silhouette) // porthole
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2
      b.box([Math.cos(a) * 1.7, 0.7, Math.sin(a) * 1.7], [1.7, 1.9, 0.3], TRIM, -a)
    }
    b.lathe([[-0.5, 0.6], [0, 0.9]], 8, TRIM) // engine bell
    return b.toGeometry()
  }, [])
  const fire = useMemo(() => {
    const b = createBuilder()
    b.lathe([[-3.4, 0], [-1.6, 0.55], [0, 0.8]], 6, FLAME)
    b.lathe([[-1.9, 0], [-0.8, 0.3], [0, 0.42]], 6, [PALETTE.cream, PALETTE.cream, PALETTE.cream])
    return b.toGeometry()
  }, [])
  const material = useMemo(() => createSceneMaterial({ fogNear: 1e9, fogFar: 2e9 }), [])

  useFrame(({ camera }) => {
    const g = group.current
    if (!g) return
    const p = progress.current
    g.visible = p <= 0.93
    if (!g.visible) return
    const t = Math.min(1, p + (companion ? COMPANION.lead : CRAFT_LEAD))
    const at = pathPoint(t)
    if (companion) {
      const o = companionOffset(t)
      at[0] += o[0]
      at[1] += o[1]
      at[2] += o[2]
    }
    const tan = pathTangent(t)
    g.position.set(at[0], at[1], at[2])
    g.quaternion.setFromUnitVectors(UP, dir.set(tan[0], tan[1], tan[2]))
    g.scale.setScalar(Math.max(1.5, camera.position.distanceTo(g.position) * 0.019) * (companion ? COMPANION.size : 1))
    // the flame flutters in length
    if (flame.current && motion.on) {
      const time = shared.uTime.value
      flame.current.scale.y = 0.85 + 0.25 * Math.sin(time * 23) * Math.sin(time * 7.3)
    }
  })

  return (
    <group ref={group}>
      <mesh geometry={body} material={material} />
      <mesh ref={flame} geometry={fire} material={material} position={[0, -0.5, 0]} />
    </group>
  )
}
