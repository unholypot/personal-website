import { useMemo } from 'react'
import { RIDGE } from '../layout.js'
import { SHADE, TONES, WORN } from '../palette.js'
import { createBuilder, rng } from '../build.js'
import { createSceneMaterial } from '../sceneMaterial.js'
import { addShadow, groundAt } from '../ground.js'

const DARK = TONES.silhouette

// Where the rover is parked, in the plain between the closing camera and the astronaut's mountain.
const ROVER = [-9, 25]
const TURN = 0.8

// The ground right in front of the closing view, which would otherwise be bare plain: a rover that has
// been left parked, a scatter of rocks with their shadows, and a line of bootprints (the astronaut's)
// leading from the rover up to the foot of the mountain.
export default function Foreground() {
  const { solid, marks } = useMemo(() => {
    const b = createBuilder()
    const decal = createBuilder()
    const rand = rng(515)
    const [rx, rz] = ROVER

    // the rover: a body and cab on six wheels, a mast, a dish and an orange panel
    const at = (x, z, y) => [rx + x * Math.cos(TURN) + z * Math.sin(TURN), y, rz - x * Math.sin(TURN) + z * Math.cos(TURN)]
    b.box(at(0, 0, 1.55), [4.6, 1.1, 2.5], TONES.craft, TURN)
    b.box(at(-0.3, 0, 2.55), [2.1, 0.95, 1.9], TONES.station, TURN)
    b.box(at(-0.3, 0, 2.58), [0.2, 0.55, 1.5], DARK, TURN) // the windscreen strip, facing the front... of the cab
    for (const x of [-1.7, 0, 1.7])
      for (const z of [-1.4, 1.4]) b.box(at(x, z, 0.7), [1.2, 1.2, 0.55], DARK, TURN)
    b.box(at(1.5, 0, 3.9), [0.15, 2.6, 0.15], DARK, TURN)
    b.lathe([[0, 0.2], [0.5, 0.8], [0.7, 1.0]], 8, TONES.station, at(-1.6, 0.4, 3.0))
    b.box(at(-1.8, -0.2, 2.2), [1.0, 1.4, 0.12], TONES.payload, TURN)
    addShadow(decal, rx, rz, 2.2, 2.4, SHADE, 0.2)

    // rocks, the nearer ones the bigger, in the open ground in front of the mountain
    for (let i = 0; i < 16; i++) {
      const x = -30 + rand() * 34
      const z = 15 + rand() * 24
      if (Math.hypot(x - rx, z - rz) < 4.5 || Math.hypot(x - RIDGE[0], z - RIDGE[2]) < 12) continue
      const s = 0.35 + Math.pow(rand(), 1.6) * 1.5
      b.rock([x, groundAt(x, z) + s * 0.3, z], s, TONES.rock, { seed: 600 + i, squash: 0.6 + rand() * 0.25, turn: [rand() * 3, rand() * 3, 0] })
      addShadow(decal, x, z, s * 0.8, s * 0.7, SHADE, 0.2)
    }

    // bootprints, left and right in turn, from beside the rover to the foot of the mountain
    const from = [rx - 3, rz - 2]
    const to = [RIDGE[0] + 3, RIDGE[2] + 9]
    const steps = 13
    for (let i = 1; i < steps; i++) {
      const t = i / steps
      const x = from[0] + (to[0] - from[0]) * t
      const z = from[1] + (to[1] - from[1]) * t
      const heading = Math.atan2(to[1] - from[1], to[0] - from[0])
      const side = i % 2 ? 0.32 : -0.32
      const cx = x - Math.sin(heading) * side
      const cz = z + Math.cos(heading) * side
      const along = [Math.cos(heading), Math.sin(heading)]
      const across = [-along[1], along[0]]
      const corner = (a, c) => [cx + along[0] * a + across[0] * c, groundAt(cx, cz) + 0.22, cz + along[1] * a + across[1] * c]
      decal.flat([corner(-0.42, -0.17), corner(0.42, -0.17), corner(0.42, 0.17), corner(-0.42, 0.17)], [WORN])
    }
    return { solid: b.toGeometry(), marks: decal.toGeometry() }
  }, [])
  const material = useMemo(() => createSceneMaterial({ fogNear: 400, fogFar: 3000 }), [])
  const decalMaterial = useMemo(() => createSceneMaterial({ fogNear: 2500, fogFar: 14000, doubleSided: true, decal: true }), [])

  return (
    <>
      <mesh geometry={solid} material={material} />
      <mesh geometry={marks} material={decalMaterial} renderOrder={3} />
    </>
  )
}
