import { useMemo } from 'react'
import { IcosahedronGeometry } from 'three'
import { STATION } from '../layout.js'
import { createBuilder, rng } from '../build.js'
import { PALETTE, mix, rgb } from '../palette.js'
import { createSceneMaterial } from '../sceneMaterial.js'

// Two sparse groups off the station's sides, well clear of its panels and the
// descent path. Fixed world positions create parallax as the camera approaches.
const ROCKS = [
  [-290, 85, -180, 13], [-245, 110, -220, 7], [-325, 35, -250, 9],
  [-225, 145, -285, 5], [-355, 65, -310, 6],
  [245, -70, -170, 10], [285, -35, -205, 6], [315, -95, -250, 4],
]
const TONES = [
  mix(rgb(PALETTE.cream), rgb(PALETTE.teal), 0.5),
  mix(rgb(PALETTE.navy), rgb(PALETTE.teal), 0.45),
  rgb(PALETTE.navy),
]

export default function OrbitalRocks() {
  const geometry = useMemo(() => {
    const builder = createBuilder()
    const rand = rng(83)
    for (const [x, y, z, radius] of ROCKS) {
      const centre = [STATION[0] + x, STATION[1] + y, STATION[2] + z]
      const rock = new IcosahedronGeometry(radius, 0)
      rock.scale(0.85 + rand() * 0.4, 0.65 + rand() * 0.4, 0.8 + rand() * 0.4)
      rock.rotateX(rand() * Math.PI)
      rock.rotateZ(rand() * Math.PI)
      rock.translate(...centre)
      const positions = rock.getAttribute('position')
      const point = (i) => [positions.getX(i), positions.getY(i), positions.getZ(i)]
      for (let i = 0; i < positions.count; i += 3) {
        builder.tri(point(i), point(i + 1), point(i + 2), TONES, centre)
      }
      rock.dispose()
    }
    return builder.toGeometry()
  }, [])
  const material = useMemo(() => createSceneMaterial({ fogNear: 600, fogFar: 4200 }), [])
  return <mesh geometry={geometry} material={material} />
}
