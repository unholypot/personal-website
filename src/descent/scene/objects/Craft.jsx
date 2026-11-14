import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Matrix4, Quaternion, Vector3 } from 'three'
import { pathPoint, pathTangent } from '../layout.js'
import { TOUCHDOWN, TURN_END, craftT, engineAmount, jetAmount, turnAmount } from '../craftFlight.js'
import { PALETTE, TONES, mix, rgb } from '../palette.js'
import { createBuilder } from '../build.js'
import { createSceneMaterial, motion, shared } from '../sceneMaterial.js'

// Scratch values for each frame's orientation.
const UP = new Vector3(0, 1, 0)
const SIDE = new Vector3(1, 0, 0) // a fixed sideways reference that settles the roll, so the hull never spins
const nose = new Vector3()
const across = new Vector3()
const roll = new Vector3()
const turnAxis = new Vector3()
const basis = new Matrix4()
const flight = new Quaternion()
const flip = new Quaternion()

const smooth = (v) => {
  const x = v > 0 ? (v < 1 ? v : 1) : 0
  return x * x * (3 - 2 * x)
}

// How big it stands once it is down on the pad, in the scene's units.
const LANDED_SCALE = 2.9

// A white hull whichever way it faces: its shaded side is a cool grey, never the moon's mustard,
// so the rocket stays white and orange against planet and ground alike.
const HULL = [PALETTE.cream, PALETTE.cream, mix(rgb(PALETTE.cream), rgb(PALETTE.navy), 0.22)]
// Orange trim that stays orange in shade (a deeper orange, not black).
const TRIM = [PALETTE.orange, PALETTE.orange, mix(rgb(PALETTE.orange), rgb(PALETTE.navy), 0.3)]
const FLAME = [PALETTE.orange, PALETTE.orange, PALETTE.orange]
const PUFF = [PALETTE.cream, PALETTE.cream, PALETTE.cream]

// The little rocket that leads the way down. It flies nose first, trailing its ribbon, then turns itself
// over on its side jets and comes down tail first on its engine, landing upright on the pad. It is drawn larger
// the farther off it is, so it stays readable from orbit as well as near the ground.
export default function Craft({ progress }) {
  const group = useRef(null)
  const flame = useRef(null)
  const jetsA = useRef(null)
  const jetsB = useRef(null)
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
  // A small puff of cold gas, a short cone pointing along +y (turned into place by the mesh that carries it).
  const puff = useMemo(() => {
    const b = createBuilder()
    b.lathe([[0, 0.34], [1.5, 0.05]], 5, PUFF)
    return b.toGeometry()
  }, [])
  const material = useMemo(() => createSceneMaterial({ fogNear: 1e9, fogFar: 2e9 }), [])

  useFrame(({ camera }) => {
    const g = group.current
    if (!g) return
    const p = progress.current
    const at = pathPoint(craftT(p))
    g.position.set(at[0], at[1], at[2])

    // Nose along the line it is flying (held at the line's direction when the turn ends, so that it stands still afterwards).
    const tan = pathTangent(craftT(Math.min(p, TURN_END)))
    nose.set(tan[0], tan[1], tan[2])
    roll.crossVectors(nose, SIDE).normalize() // its z
    across.crossVectors(nose, roll) // its x, so that x, y, z are right-handed
    basis.makeBasis(across, nose, roll)
    flight.setFromRotationMatrix(basis)
    // Turning over: swing the nose, about the horizontal axis square to its flight, from where it points to straight up.
    const s = turnAmount(p)
    if (s > 0) {
      turnAxis.crossVectors(nose, UP)
      if (turnAxis.lengthSq() > 1e-8) {
        turnAxis.normalize()
        flip.setFromAxisAngle(turnAxis, Math.acos(Math.max(-1, Math.min(1, nose.dot(UP)))) * s)
        flight.premultiply(flip)
      }
    }
    g.quaternion.copy(flight)

    // Big enough to read from far off while it flies; one fixed size once it settles on the pad.
    const far = Math.max(1.5, camera.position.distanceTo(g.position) * 0.019)
    g.scale.setScalar(far + (LANDED_SCALE - far) * smooth((p - (TOUCHDOWN - 0.07)) / 0.07))

    const time = shared.uTime.value
    const flutter = motion.on ? 0.85 + 0.25 * Math.sin(time * 23) * Math.sin(time * 7.3) : 1
    // the engine: a quiet burn on the way in, off while it turns, then a long burn that dies away at touchdown
    if (flame.current) {
      const burn = engineAmount(p)
      flame.current.visible = burn > 0.02
      flame.current.scale.set(0.5 + 0.5 * burn, burn * flutter, 0.5 + 0.5 * burn)
    }
    // the side jets: one pair while the turn speeds up, the other while it slows
    const jet = jetAmount(p)
    const half = turnAmount(p) < 0.5
    const puffing = motion.on ? (Math.sin(time * 40) > -0.2 ? 1 : 0.3) : 1
    if (jetsA.current) {
      jetsA.current.visible = jet > 0.05 && half
      jetsA.current.scale.setScalar(0.6 + 0.4 * jet * puffing)
    }
    if (jetsB.current) {
      jetsB.current.visible = jet > 0.05 && !half
      jetsB.current.scale.setScalar(0.6 + 0.4 * jet * puffing)
    }
  })

  return (
    <group ref={group}>
      <mesh geometry={body} material={material} />
      <mesh ref={flame} geometry={fire} material={material} position={[0, -0.5, 0]} />
      {/* turning over: a puff near the nose on one side and near the tail on the other, then the reverse to stop the turn */}
      <group ref={jetsA}>
        <mesh geometry={puff} material={material} position={[1.3, 4.9, 0]} rotation={[0, 0, -Math.PI / 2]} />
        <mesh geometry={puff} material={material} position={[-1.3, 0.8, 0]} rotation={[0, 0, Math.PI / 2]} />
      </group>
      <group ref={jetsB}>
        <mesh geometry={puff} material={material} position={[-1.3, 4.9, 0]} rotation={[0, 0, Math.PI / 2]} />
        <mesh geometry={puff} material={material} position={[1.3, 0.8, 0]} rotation={[0, 0, -Math.PI / 2]} />
      </group>
    </group>
  )
}
