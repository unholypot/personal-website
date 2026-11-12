import { Canvas } from '@react-three/fiber'
import Scene from './scene/Scene.jsx'
import { STOPS } from './content/stops.js'
import { createProgress, useScrollProgress } from './scroll/useScrollProgress.js'
import PosterFrame from './ui/PosterFrame.jsx'
import StopCaption from './ui/StopCaption.jsx'

const progress = createProgress()

export default function DescentApp() {
  useScrollProgress(progress)

  return (
    <main className="descent">
      <div className="stage" aria-hidden="true">
        <Canvas dpr={1} gl={{ antialias: true }} camera={{ near: 0.5, far: 20000, fov: 50 }}>
          <Scene progress={progress} />
        </Canvas>
      </div>
      <div className="captions">
        {STOPS.map((stop, index) => (
          <StopCaption key={stop.id} stop={stop} index={index} progress={progress} />
        ))}
      </div>
      <PosterFrame />
      <div className="track" />
    </main>
  )
}
