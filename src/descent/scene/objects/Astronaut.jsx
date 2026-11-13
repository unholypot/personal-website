import { useMemo } from 'react'
import { RIDGE, RIDGE_TOP } from '../layout.js'
import { TONES } from '../palette.js'
import { createBuilder } from '../build.js'
import { createSceneMaterial } from '../sceneMaterial.js'

// A small astronaut on the summit, back to us, looking up at the giant: a pale suit with a
// round helmet, a life-support pack and an aerial. Feet at local y = 0, facing local -z.
export default function Astronaut() {
  const geometry = useMemo(() => {
    const b = createBuilder()
    const suit = TONES.station // cream, mustard, navy
    const pack = TONES.dome // cream, teal, navy
    const dark = TONES.silhouette

    for (const x of [-0.19, 0.19]) {
      b.box([x, 0.08, -0.04], [0.26, 0.16, 0.42], dark) // boots
      b.lathe([[0.14, 0.13], [0.5, 0.155], [0.86, 0.17]], 6, suit, [x, 0, 0]) // legs
    }
    // hips, chest and shoulders
    b.lathe([[0.82, 0.3], [1.0, 0.33], [1.36, 0.37], [1.5, 0.31], [1.58, 0.17]], 8, suit)
    b.box([0, 0.9, 0], [0.64, 0.09, 0.62], dark) // belt
    for (const x of [-0.48, 0.48]) {
      b.lathe([[0.84, 0.095], [1.1, 0.11], [1.46, 0.125]], 6, suit, [x, 0, 0]) // arms
      b.box([x, 0.76, 0], [0.2, 0.16, 0.2], dark) // gloves
    }
    // helmet: a faceted ball on a collar
    b.lathe([[1.56, 0.15], [1.63, 0.28], [1.82, 0.34], [2.0, 0.28], [2.08, 0.13]], 8, suit)
    b.box([0, 1.82, -0.27], [0.4, 0.24, 0.16], dark) // visor, on the far side
    // life-support pack on the back (toward the viewer), with a stripe and an aerial
    b.box([0, 1.2, 0.4], [0.52, 0.68, 0.26], pack)
    b.box([0, 1.6, 0.4], [0.4, 0.12, 0.22], pack)
    b.box([0, 1.3, 0.54], [0.34, 0.09, 0.03], TONES.payload)
    b.box([0.19, 1.86, 0.44], [0.03, 0.44, 0.03], dark)
    b.box([0.19, 2.1, 0.44], [0.08, 0.08, 0.08], TONES.payload)
    return b.toGeometry()
  }, [])
  const material = useMemo(() => createSceneMaterial({ fogNear: 400, fogFar: 3000 }), [])
  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[RIDGE[0], RIDGE_TOP, RIDGE[2]]}
      rotation={[0, 0.25, 0]}
      scale={1.3}
    />
  )
}
