import { useMemo } from 'react'
import { BASE } from '../layout.js'
import { TONES } from '../palette.js'
import { createBuilder } from '../build.js'
import { createSceneMaterial } from '../sceneMaterial.js'

// [x, z, radius]
const DOMES = [
  [0, 0, 9],
  [-14, 6, 6],
  [13, 8, 6],
  [4, 16, 4],
]

const dome = (r) => [
  [0, r],
  [r * 0.5, r * 0.87],
  [r * 0.87, r * 0.5],
  [r, 0],
]

// The surface base: bubble habitats joined by low corridors. The thesis on bubbles, as a place.
export default function DomeBase() {
  const geometry = useMemo(() => {
    const b = createBuilder()
    for (const [x, z, r] of DOMES) {
      b.lathe([[0, r * 1.06], [0.5, r * 1.06]], 8, TONES.rock, [x, 0, z])
      b.lathe(dome(r), 8, TONES.dome, [x, 0.5, z])
    }
    // corridors from the main dome to each of the others
    for (const [x, z] of DOMES.slice(1)) {
      const len = Math.hypot(x, z)
      b.box([x / 2, 0.9, z / 2], [len, 1.8, 1.6], TONES.station, -Math.atan2(z, x))
    }
    // mast with a beacon
    b.box([-6, 8, -9], [0.4, 16, 0.4], TONES.silhouette)
    b.box([-6, 16.4, -9], [1, 0.8, 1], TONES.payload)
    return b.toGeometry()
  }, [])
  const material = useMemo(() => createSceneMaterial({ fogNear: 400, fogFar: 3000 }), [])
  return <mesh geometry={geometry} material={material} position={BASE} />
}
