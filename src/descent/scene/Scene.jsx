import { useFrame } from '@react-three/fiber'
import { Color, SRGBColorSpace } from 'three'
import { sampleCamera } from './cameraPath.js'
import { skyColor } from './palette.js'
import { shared } from './sceneMaterial.js'
import Starfield from './objects/Starfield.jsx'
import GiantPlanet from './objects/GiantPlanet.jsx'
import Rings from './objects/Rings.jsx'
import Moon from './objects/Moon.jsx'
import Station from './objects/Station.jsx'
import Craft from './objects/Craft.jsx'
import TrailRibbon from './objects/TrailRibbon.jsx'
import CloudBands from './objects/CloudBands.jsx'
import Terrain from './objects/Terrain.jsx'
import Drone from './objects/Drone.jsx'
import DomeBase from './objects/DomeBase.jsx'
import Astronaut from './objects/Astronaut.jsx'

const clear = new Color()

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

    // Development aid: lets the browser console inspect and place things.
    if (import.meta.env.DEV) window.__descent = { camera, progress, scene: state.scene }

    const dpr = gl.getPixelRatio()
    shared.uTime.value += delta
    shared.uDpr.value = dpr
    shared.uPx.value = (size.height * dpr) / (2 * Math.tan((view.fov * Math.PI) / 360))
  })

  return (
    <>
      <Starfield progress={progress} />
      <GiantPlanet />
      <Rings />
      <Moon />
      <Station />
      <CloudBands />
      <Terrain />
      <Drone />
      <DomeBase />
      <Astronaut />
      <TrailRibbon progress={progress} />
      <Craft progress={progress} />
    </>
  )
}
