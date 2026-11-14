import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, SRGBColorSpace } from 'three'
import { sampleCamera } from './cameraPath.js'
import { arrivalLift } from './arrival.js'
import { skyColor } from './palette.js'
import { motion, shared } from './sceneMaterial.js'
import { createQuality } from '../quality.js'
import { parallaxAngles, pointer, step as stepPointer } from '../scroll/parallax.js'
import { skyStore, updateScreens } from './skyStore.js'
import Starfield from './objects/Starfield.jsx'
import ProbeOrbit from './objects/ProbeOrbit.jsx'
import AsteroidBelt from './objects/AsteroidBelt.jsx'
import SkyDetails from './objects/SkyDetails.jsx'
import DeepSky from './objects/DeepSky.jsx'
import Constellations from './objects/Constellations.jsx'
import DistantShip from './objects/DistantShip.jsx'
import ForegroundDust from './objects/ForegroundDust.jsx'
import GiantPlanet from './objects/GiantPlanet.jsx'
import Rings from './objects/Rings.jsx'
import Moon from './objects/Moon.jsx'
import Atmosphere from './objects/Atmosphere.jsx'
import OrbitalRocks from './objects/OrbitalRocks.jsx'
import Station from './objects/Station.jsx'
import Craft from './objects/Craft.jsx'
import TrailRibbon from './objects/TrailRibbon.jsx'
import CloudBands from './objects/CloudBands.jsx'
import Terrain from './objects/Terrain.jsx'
import Surface from './objects/Surface.jsx'
import Drone from './objects/Drone.jsx'
import DomeBase from './objects/DomeBase.jsx'
import RadioArray from './objects/RadioArray.jsx'
import Astronaut from './objects/Astronaut.jsx'

const clear = new Color()

export default function Scene({ progress, ready, onWarm }) {
  const quality = useMemo(() => createQuality({ maxDpr: window.devicePixelRatio || 1 }), [])
  const run = useRef({ quick: 0, warmed: false, arriving: null, arrivalStart: 0 })

  useFrame((state, delta) => {
    const { camera, gl, size } = state
    const r = run.current
    const p = progress.current

    // Warm-up: three quick frames in a row mean shaders and buffers are ready.
    if (!r.warmed) {
      r.quick = delta < 0.025 ? r.quick + 1 : 0
      if (r.quick >= 3) {
        r.warmed = true
        onWarm()
      }
    }

    const lift = arrivalLift(r, { enabled: motion.on, ready, atTop: progress.target < 0.02, time: shared.uTime.value })

    // Development aid: window.__cam = { position, target, fov } takes the camera off the scroll path.
    const view = (import.meta.env.DEV && window.__cam) || sampleCamera(p, size.width / size.height)
    camera.position.set(view.position[0], view.position[1] + lift, view.position[2])
    camera.lookAt(view.target[0], view.target[1] + lift, view.target[2])
    // a slight sway with the pointer, where there is one
    if (pointer.on) {
      stepPointer(pointer, delta)
      const [yaw, pitch] = parallaxAngles(pointer)
      camera.rotateY(yaw)
      camera.rotateX(pitch)
    }
    if (camera.fov !== view.fov) {
      camera.fov = view.fov
      camera.updateProjectionMatrix()
    }
    // where each constellation is on the screen now, for the page's hover and tap
    updateScreens(camera, size.width, size.height, shared.uTime.value)

    const sky = skyColor(p)
    shared.uSky.value.set(sky[0], sky[1], sky[2])
    gl.setClearColor(clear.setRGB(sky[0], sky[1], sky[2], SRGBColorSpace), 1)

    // Adaptive quality: while the view is moving and frames run slow, lower the resolution.
    const moving = Math.abs(progress.target - progress.current) > 0.0005
    const level = quality.sample(delta * 1000, moving)
    if (level < gl.getPixelRatio()) state.setDpr(level)

    // Development aid: lets the browser console inspect and place things.
    if (import.meta.env.DEV) window.__descent = { camera, progress, scene: state.scene, skyStore }

    const dpr = gl.getPixelRatio()
    // The scene's clock stops for reduced motion, which stills the dust, the drift and the grain band.
    if (motion.on) shared.uTime.value += delta
    shared.uDpr.value = dpr
    shared.uAspect.value = size.width / size.height
    shared.uPx.value = (size.height * dpr) / (2 * Math.tan((view.fov * Math.PI) / 360))
  })

  return (
    <>
      <Starfield progress={progress} />
      <DeepSky progress={progress} />
      <Constellations progress={progress} ready={ready} />
      <SkyDetails progress={progress} />
      <GiantPlanet />
      <ProbeOrbit />
      <AsteroidBelt progress={progress} />
      <Rings />
      <Moon />
      <Atmosphere />
      <Station />
      <DistantShip />
      <OrbitalRocks />
      <CloudBands />
      <Surface />
      <Terrain />
      <Drone />
      <DomeBase />
      <RadioArray />
      <Astronaut />
      <TrailRibbon progress={progress} />
      <Craft progress={progress} />
      <ForegroundDust progress={progress} />
    </>
  )
}
