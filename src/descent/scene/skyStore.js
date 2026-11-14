// What the 3D scene and the page's own controls both need to know about the constellations:
// where each one is on the screen right now, and which one (if any) is being looked at.
import { buildConstellations, projectDirection, screenRadius, viewDirection } from './constellations.js'
import { skyShift } from './skyReveal.js'
import { pointer } from '../scroll/parallax.js'
import { motion } from './sceneMaterial.js'

// The layout is chosen once, for the shape of the screen the page opens on.
const aspect = typeof window === 'undefined' ? 1.6 : window.innerWidth / window.innerHeight
export const figures = buildConstellations(aspect)

export const skyStore = {
  active: -1, // the figure under the pointer or pinned by a tap, or -1
  discovered: false, // set once the visitor has found one, so the hint can go
  screen: figures.map((f) => ({ x: 0, y: 0, r: 0, visible: false, stars: f.stars.map(() => ({ x: 0, y: 0 })) })),
  star: null, // the star under the pointer, { figure, star }, or null
}

// Works out where each figure, and each star in it, is on the screen. Call every frame, once the camera
// is placed. `time` is the scene's clock: the figures drift, and what is under the pointer must follow.
export function updateScreens(camera, width, height, time = 0) {
  camera.updateMatrixWorld()
  camera.matrixWorldInverse.copy(camera.matrixWorld).invert()
  const e = camera.matrixWorldInverse.elements
  const aspect = width / height
  figures.forEach((f, i) => {
    const [dx, dy, dz] = skyShift(i, time, pointer, camera.matrixWorld.elements, motion.on)
    const at = (d) => projectDirection(viewDirection(e, [d[0] + dx, d[1] + dy, d[2] + dz]), camera.fov, aspect)
    const p = at(f.centre)
    const s = skyStore.screen[i]
    s.visible = p.visible && Math.abs(p.x) < 1 && Math.abs(p.y) < 1
    s.x = ((p.x + 1) / 2) * width
    s.y = ((1 - p.y) / 2) * height
    s.r = screenRadius(f.radius, camera.fov, height)
    f.stars.forEach((star, k) => {
      const q = at(star)
      s.stars[k].x = ((q.x + 1) / 2) * width
      s.stars[k].y = ((1 - q.y) / 2) * height
    })
  })
}
