import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, SRGBColorSpace } from 'three'
import { sampleCamera } from './cameraPath.js'
import { skyColor } from './palette.js'
import { motion, shared } from './sceneMaterial.js'
import { createQuality } from '../quality.js'
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

// Arrival: the first view starts raised this far above its place and is let down onto it.
const ARRIVAL_HEIGHT = 300
const ARRIVAL_SECONDS = 1.6
// eases from 0 to 1, starting and landing at rest
const settle = (t) => t * t * t * (t * (t * 6 - 15) + 10)

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

    // Arrival, only for a visit that starts at the top and allows motion.
    let lift = 0
    if (r.arriving === null) {
      const wanted = motion.on && progress.target < 0.02
      if (!ready) lift = wanted ? ARRIVAL_HEIGHT : 0
      else {
        r.arriving = wanted
        r.arrivalStart = shared.uTime.value
        lift = wanted ? ARRIVAL_HEIGHT : 0
      }
    } else if (r.arriving) {
      const t = (shared.uTime.value - r.arrivalStart) / ARRIVAL_SECONDS
      if (t >= 1) r.arriving = false
      else lift = ARRIVAL_HEIGHT * (1 - settle(t))
    }

    const view = sampleCamera(p, size.width / size.height)
    camera.position.set(view.position[0], view.position[1] + lift, view.position[2])
    camera.lookAt(view.target[0], view.target[1] + lift, view.target[2])
    if (camera.fov !== view.fov) {
      camera.fov = view.fov
      camera.updateProjectionMatrix()
    }

    const sky = skyColor(p)
    shared.uSky.value.set(sky[0], sky[1], sky[2])
    gl.setClearColor(clear.setRGB(sky[0], sky[1], sky[2], SRGBColorSpace), 1)

    // Adaptive quality: while the view is moving and frames run slow, lower the resolution.
    const moving = Math.abs(progress.target - progress.current) > 0.0005
    const level = quality.sample(delta * 1000, moving)
    if (level < gl.getPixelRatio()) state.setDpr(level)

    // Development aid: lets the browser console inspect and place things.
    if (import.meta.env.DEV) window.__descent = { camera, progress, scene: state.scene }

    const dpr = gl.getPixelRatio()
    // The scene's clock stops for reduced motion, which stills the dust, the drift and the grain band.
    if (motion.on) shared.uTime.value += delta
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
