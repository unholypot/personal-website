import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, SRGBColorSpace } from 'three'
import { sampleCamera } from './cameraPath.js'
import { skyColor, TONES } from './palette.js'
import { createBuilder } from './build.js'
import { createSceneMaterial, shared } from './sceneMaterial.js'
import { STATION, DRONE, BASE, RIDGE } from './layout.js'

const clear = new Color()

function Placeholders() {
  const geometry = useMemo(() => {
    const b = createBuilder()
    for (const at of [STATION, [0, 390, 0], DRONE, BASE, RIDGE]) b.box(at, [20, 20, 20], TONES.station, 0.5)
    return b.toGeometry()
  }, [])
  const material = useMemo(() => createSceneMaterial({ fogNear: 800, fogFar: 6000 }), [])
  return <mesh geometry={geometry} material={material} frustumCulled={false} />
}

export default function Scene({ progress }) {
  useFrame((state, delta) => {
    const { camera, gl, size } = state
    const p = progress.current
    const view = sampleCamera(p, size.width / size.height)
    camera.position.set(view.position[0], view.position[1], view.position[2])
    camera.lookAt(view.target[0], view.target[1], view.target[2])
    if (camera.fov !== view.fov) {
      camera.fov = view.fov
      camera.updateProjectionMatrix()
    }
    const sky = skyColor(p)
    shared.uSky.value.set(sky[0], sky[1], sky[2])
    gl.setClearColor(clear.setRGB(sky[0], sky[1], sky[2], SRGBColorSpace), 1)
    shared.uTime.value += delta
  })

  return <Placeholders />
}
