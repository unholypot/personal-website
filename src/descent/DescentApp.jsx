import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Canvas } from '@react-three/fiber'
import Scene from './scene/Scene.jsx'
import { motion } from './scene/sceneMaterial.js'
import { STOPS } from './content/stops.js'
import { createProgress, useScrollProgress } from './scroll/useScrollProgress.js'
import PosterFrame from './ui/PosterFrame.jsx'
import StopCaption from './ui/StopCaption.jsx'
import Opening from './ui/Opening.jsx'
import ScrollCue from './ui/ScrollCue.jsx'
import SkillList from './ui/SkillList.jsx'
import SkyLabels from './ui/SkyLabels.jsx'
import SunCorner from './ui/SunCorner.jsx'
import { aim, pointer } from './scroll/parallax.js'
import { hasWebGL } from './webgl.js'

const progress = createProgress()

const REDUCED = '(prefers-reduced-motion: reduce)'
const subscribeReduced = (notify) => {
  const query = window.matchMedia(REDUCED)
  query.addEventListener('change', notify)
  return () => query.removeEventListener('change', notify)
}
const readReduced = () => window.matchMedia(REDUCED).matches

// If the scene has not reported itself ready by now, show it anyway.
const WARM_LIMIT_MS = 1500

export default function DescentApp() {
  const reducedMotion = useSyncExternalStore(subscribeReduced, readReduced)
  const [webgl, setWebgl] = useState(hasWebGL)
  const [ready, setReady] = useState(false)
  // Chosen by the visitor: the same words as a plain page, with no animation.
  const [plain, setPlain] = useState(false)
  // Taking the canvas down on purpose makes its renderer report a lost context; that is not a failure.
  const leaving = useRef(false)

  useScrollProgress(progress, { reducedMotion })

  useEffect(() => {
    motion.on = !reducedMotion
    // With reduced motion the page moves in whole stops.
    document.documentElement.classList.toggle('descent-snap', reducedMotion)
    return () => document.documentElement.classList.remove('descent-snap')
  }, [reducedMotion])

  // The view sways a little with the pointer, but only where there is a fine pointer and motion is welcome.
  useEffect(() => {
    if (reducedMotion || !window.matchMedia('(pointer: fine)').matches) return undefined
    const move = (e) => aim(pointer, e.clientX, e.clientY, window.innerWidth, window.innerHeight)
    const leave = () => aim(pointer, 0, 0, 0, 0)
    pointer.on = true
    window.addEventListener('pointermove', move)
    document.documentElement.addEventListener('pointerleave', leave)
    return () => {
      pointer.on = false
      pointer.x = pointer.y = pointer.tx = pointer.ty = 0
      window.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('pointerleave', leave)
    }
  }, [reducedMotion])

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), WARM_LIMIT_MS)
    return () => clearTimeout(timer)
  }, [])

  const onWarm = useCallback(() => setReady(true), [])
  const onCreated = useCallback(({ gl }) => {
    gl.domElement.addEventListener('webglcontextlost', () => {
      if (!leaving.current) setWebgl(false)
    })
  }, [])

  if (!webgl || plain) {
    // No scene (or none wanted): the same words as a plain page inside the same border.
    return (
      <main className="descent no-gl">
        {webgl && (
          <button className="mode-switch" type="button" onClick={() => {
              leaving.current = false
              setPlain(false)
            }}>
            Play the descent
          </button>
        )}
        <div className="captions">
          {STOPS.map((stop, index) => (
            <StopCaption key={stop.id} stop={stop} index={index} progress={progress} fixed />
          ))}
          <SkillList />
        </div>
        <PosterFrame />
      </main>
    )
  }

  return (
    <main className="descent">
      <button className="mode-switch skip" type="button" onClick={() => {
          leaving.current = true
          setPlain(true)
        }}>
        Skip the animation and read this as a page
      </button>
      <div className={ready ? 'stage stage-ready' : 'stage'} aria-hidden="true">
        <Canvas dpr={[1, 2]} gl={{ antialias: true }} camera={{ near: 0.5, far: 20000, fov: 50 }} onCreated={onCreated}>
          <Scene progress={progress} ready={ready} onWarm={onWarm} />
        </Canvas>
      </div>
      <div className="scrim" aria-hidden="true" />
      <SunCorner progress={progress} />
      <div className="captions">
        {STOPS.map((stop, index) => (
          <StopCaption key={stop.id} stop={stop} index={index} progress={progress} />
        ))}
      </div>
      <SkillList visuallyHidden />
      <PosterFrame />
      <SkyLabels progress={progress} />
      <ScrollCue progress={progress} />
      <Opening done={ready} />
      <div className="track">
        {STOPS.map((stop) => (
          <div className="track-stop" key={stop.id} />
        ))}
      </div>
    </main>
  )
}
