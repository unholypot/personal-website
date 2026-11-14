import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { TONES } from '../palette.js'
import { createBuilder } from '../build.js'
import { createSceneMaterial, motion, shared } from '../sceneMaterial.js'
import { directionFromScreen } from '../constellations.js'
import { sampleCamera } from '../cameraPath.js'

// Where it hangs: far out, in the empty sky left of the giant as the opening shows it.
const DISTANCE = 6500
const SPOT = [-0.66, -0.3] // opening-screen position, x and y from -1 to 1
const SWING = 520 // how far it drifts to either side, in world units
const PERIOD = 150 // seconds for one there-and-back

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

// A tiny ship a long way off, drifting slowly across the empty part of the sky with a lit window.
// Small enough to read as distant, big enough to be found: a hull, two solar wings and a dish.
export default function DistantShip() {
  const ship = useRef(null)
  const window_ = useRef(null)
  const { geometry, origin } = useMemo(() => {
    const b = createBuilder()
    // the hull stands along local y with its nose up; the group turns it onto its side
    b.lathe([[-70, 14], [-55, 24], [20, 24], [48, 14], [66, 0]], 8, TONES.station, [0, 0, 0])
    for (const side of [-1, 1]) {
      b.box([side * 62, -20, 0], [76, 30, 2], TONES.solar)
      b.box([side * 26, -20, 0], [12, 8, 6], TONES.station)
    }
    b.box([0, -74, 0], [10, 12, 10], TONES.payload)
    const cam = sampleCamera(0, 1.6)
    const d = directionFromScreen(SPOT[0], SPOT[1])
    return { geometry: b.toGeometry(), origin: cam.position.map((v, i) => v + d[i] * DISTANCE) }
  }, [])
  const material = useMemo(() => createSceneMaterial({ fogNear: 20000, fogFar: 60000 }), [])
  // its lit window: one small glowing block
  const glow = useMemo(() => {
    const b = createBuilder()
    b.box([0, 30, 24], [20, 14, 5], [[0.89, 0.65, 0.18], [0.89, 0.65, 0.18], [0.89, 0.65, 0.18]])
    return b.toGeometry()
  }, [])

  useFrame(() => {
    const el = ship.current
    if (!el) return
    const t = motion.on ? shared.uTime.value : 0
    const phase = (t / PERIOD) * Math.PI * 2
    el.position.set(origin[0] + Math.sin(phase) * SWING, origin[1] + Math.sin(phase * 2) * 40, origin[2])
    // it turns round at each end of its swing, where it is almost still
    el.rotation.set(0.25, Math.PI * smooth(0.25, -0.25, Math.cos(phase)), -Math.PI / 2 + 0.12)
    if (window_.current) window_.current.visible = motion.on ? Math.sin(t * 1.3) > -0.55 : true
  })

  return (
    <group ref={ship} position={origin}>
      <mesh geometry={geometry} material={material} />
      <mesh ref={window_} geometry={glow} material={material} />
    </group>
  )
}
