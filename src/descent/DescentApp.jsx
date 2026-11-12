import { Canvas } from '@react-three/fiber'
import Scene from './scene/Scene.jsx'
import { createProgress, useScrollProgress } from './scroll/useScrollProgress.js'

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
      <div className="track" />
    </main>
  )
}
