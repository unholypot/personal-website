import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { Canvas } from '@react-three/fiber'
import Scene from './scene/Scene.jsx'
import { motion } from './scene/sceneMaterial.js'
import { STOPS } from './content/stops.js'
import { createProgress, useScrollProgress } from './scroll/useScrollProgress.js'
import PosterFrame from './ui/PosterFrame.jsx'
import StopCaption from './ui/StopCaption.jsx'
import Opening from './ui/Opening.jsx'
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

  useScrollProgress(progress, { reducedMotion })

  useEffect(() => {
    motion.on = !reducedMotion
    // With reduced motion the page moves in whole stops.
    document.documentElement.classList.toggle('descent-snap', reducedMotion)
    return () => document.documentElement.classList.remove('descent-snap')
  }, [reducedMotion])

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), WARM_LIMIT_MS)
    return () => clearTimeout(timer)
  }, [])

  const onWarm = useCallback(() => setReady(true), [])
  const onCreated = useCallback(({ gl }) => {
    gl.domElement.addEventListener('webglcontextlost', () => setWebgl(false))
  }, [])

  if (!webgl) {
    // No scene: the same words as a plain page inside the same border.
    return (
      <main className="descent no-gl">
        <div className="captions">
          {STOPS.map((stop, index) => (
            <StopCaption key={stop.id} stop={stop} index={index} progress={progress} fixed />
          ))}
        </div>
        <PosterFrame />
      </main>
    )
  }

  return (
    <main className="descent">
      <div className={ready ? 'stage stage-ready' : 'stage'} aria-hidden="true">
        <Canvas dpr={[1, 2]} gl={{ antialias: true }} camera={{ near: 0.5, far: 20000, fov: 50 }} onCreated={onCreated}>
          <Scene progress={progress} ready={ready} onWarm={onWarm} />
        </Canvas>
      </div>
      <div className="captions">
        {STOPS.map((stop, index) => (
          <StopCaption key={stop.id} stop={stop} index={index} progress={progress} />
        ))}
      </div>
      <PosterFrame />
      <Opening done={ready} />
      <div className="track">
        {STOPS.map((stop) => (
          <div className="track-stop" key={stop.id} />
        ))}
      </div>
    </main>
  )
}
