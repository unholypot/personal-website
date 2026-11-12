import { useMemo } from 'react'
import { GIANT } from '../layout.js'
import { PALETTE } from '../palette.js'
import { createBuilder } from '../build.js'
import { createSceneMaterial } from '../sceneMaterial.js'

const BANDS = [
  [1750, 1950, PALETTE.mustard],
  [2000, 2080, PALETTE.cream],
  [2130, 2400, PALETTE.mustard],
]

// Three flat bands round the giant, tipped toward the viewer.
export default function Rings() {
  const geometry = useMemo(() => {
    const b = createBuilder()
    for (const [inner, outer, color] of BANDS) b.annulus([0, 0, 0], inner, outer, 96, color)
    return b.toGeometry()
  }, [])
  // Never faded: the giant is always far away and must stay crisp.
  const material = useMemo(() => createSceneMaterial({ fogNear: 1e9, fogFar: 2e9, doubleSided: true }), [])
  const tilt = [(20 * Math.PI) / 180, 0, (8 * Math.PI) / 180]
  return <mesh geometry={geometry} material={material} position={GIANT.center} rotation={tilt} />
}
