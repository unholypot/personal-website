import { useMemo } from 'react'
import { RADIO_ARRAY } from '../layout.js'
import { PALE, SHADE, TONES, WORN } from '../palette.js'
import { createBuilder } from '../build.js'
import { createSceneMaterial } from '../sceneMaterial.js'
import { addPatch, addShadow, groundAt } from '../ground.js'

// Three arms at 120 degrees, like a letter Y seen from above, each with a line of dishes.
const ARMS = [Math.PI / 2, Math.PI / 2 + (Math.PI * 2) / 3, Math.PI / 2 + (Math.PI * 4) / 3]
const DISHES_PER_ARM = 4
const FIRST = 13 // distance of the nearest dish from the control hut
const SPACING = 9.5

const DARK = TONES.silhouette

// A very-large-array style radio telescope: a Y of dishes, listening to the sky, with a control
// hut at its heart. The Moon's far side is the quietest place near Earth for radio astronomy, so
// this is the sort of thing a base builds there. Dishes stare straight up.
export default function RadioArray() {
  const [cx, cz] = RADIO_ARRAY

  const solid = useMemo(() => {
    const b = createBuilder()
    // the control hut
    b.box([0, 1.6, 0], [6, 3.2, 4.6], TONES.station)
    b.box([0, 3.4, 0], [6.5, 0.4, 5.1], TONES.craft)
    b.box([0, 1.2, 2.4], [1.8, 2.2, 0.25], DARK)
    b.box([2.2, 5, -1], [0.25, 3.4, 0.25], DARK) // its antenna
    b.box([2.2, 6.9, -1], [0.8, 0.4, 0.8], TONES.payload)
    for (const a of ARMS) {
      for (let k = 0; k < DISHES_PER_ARM; k++) {
        const d = FIRST + k * SPACING
        const x = Math.cos(a) * d
        const z = Math.sin(a) * d
        // a pedestal, the dish (a wide shallow bowl seen from outside), and the feed on its prop
        b.box([x, 1.4, z], [1, 2.8, 1], TONES.station)
        b.lathe([[0, 0.5], [0.7, 1.7], [1.3, 3.0], [1.6, 3.5], [1.65, 3.5]], 10, TONES.station, [x, 2.8, z])
        b.box([x, 6.1, z], [0.14, 2.6, 0.14], DARK)
        b.box([x, 7.5, z], [0.55, 0.35, 0.55], TONES.payload)
      }
    }
    return b.toGeometry()
  }, [])

  // Flat marks on the ground, in world coordinates: a worn pad under the hut, a rail along each arm,
  // and every dish's shadow.
  const marks = useMemo(() => {
    const b = createBuilder()
    addPatch(b, cx, cz, () => 9, WORN, 0.14, { segments: 20 })
    addPatch(b, cx, cz, () => 9, PALE, 0.16, { inner: 8.2, segments: 20 })
    for (const a of ARMS) {
      const end = FIRST + (DISHES_PER_ARM - 1) * SPACING + 5
      const dx = Math.cos(a)
      const dz = Math.sin(a)
      for (const side of [-1.1, 1.1]) {
        const ox = -dz * side
        const oz = dx * side
        const quad = [
          [cx + dx * 9 + ox - dz * 0.2, cz + dz * 9 + oz + dx * 0.2],
          [cx + dx * end + ox - dz * 0.2, cz + dz * end + oz + dx * 0.2],
          [cx + dx * end + ox + dz * 0.2, cz + dz * end + oz - dx * 0.2],
          [cx + dx * 9 + ox + dz * 0.2, cz + dz * 9 + oz - dx * 0.2],
        ]
        b.flat(quad.map(([x, z]) => [x, groundAt(x, z) + 0.15, z]), [WORN])
      }
      for (let k = 0; k < DISHES_PER_ARM; k++) {
        const d = FIRST + k * SPACING
        addShadow(b, cx + dx * d, cz + dz * d, 2.4, 7, SHADE, 0.18)
      }
    }
    addShadow(b, cx, cz, 3, 4, SHADE, 0.18)
    return b.toGeometry()
  }, [cx, cz])

  const material = useMemo(() => createSceneMaterial({ fogNear: 400, fogFar: 3000 }), [])
  const decalMaterial = useMemo(() => createSceneMaterial({ fogNear: 2500, fogFar: 14000, doubleSided: true, decal: true }), [])
  return (
    <>
      <mesh geometry={solid} material={material} position={[cx, 0.2, cz]} />
      <mesh geometry={marks} material={decalMaterial} renderOrder={3} />
    </>
  )
}
