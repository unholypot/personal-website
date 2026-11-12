import { useMemo } from 'react'
import { RIDGE, RIDGE_TOP } from '../layout.js'
import { TONES } from '../palette.js'
import { createBuilder } from '../build.js'
import { createSceneMaterial } from '../sceneMaterial.js'

// A small figure on the ridge, back to us, looking up at the giant. Feet at local y = 0.
export default function Astronaut() {
  const geometry = useMemo(() => {
    const b = createBuilder()
    const t = TONES.silhouette
    b.box([-0.2, 0.4, 0], [0.28, 0.8, 0.3], t) // legs
    b.box([0.2, 0.4, 0], [0.28, 0.8, 0.3], t)
    b.box([0, 1.15, 0], [0.78, 0.7, 0.45], t) // torso
    b.box([-0.52, 1.1, 0], [0.22, 0.7, 0.26], t) // arms
    b.box([0.52, 1.1, 0], [0.22, 0.7, 0.26], t)
    b.box([0, 1.2, 0.36], [0.6, 0.75, 0.3], t) // backpack, toward the viewer
    b.box([0, 1.74, 0], [0.5, 0.46, 0.5], t) // helmet
    return b.toGeometry()
  }, [])
  const material = useMemo(() => createSceneMaterial({ fogNear: 400, fogFar: 3000 }), [])
  return <mesh geometry={geometry} material={material} position={[RIDGE[0], RIDGE_TOP, RIDGE[2]]} rotation={[0, 0.25, 0]} />
}
