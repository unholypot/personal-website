// What the 3D scene and the page's own controls both need to know about the constellations:
// where each one is on the screen right now, and which one (if any) is being looked at.
import { buildConstellations, projectDirection, screenRadius, viewDirection } from './constellations.js'

// The layout is chosen once, for the shape of the screen the page opens on.
const aspect = typeof window === 'undefined' ? 1.6 : window.innerWidth / window.innerHeight
export const figures = buildConstellations(aspect)

export const skyStore = {
  active: -1, // the figure under the pointer or pinned by a tap, or -1
  discovered: false, // set once the visitor has found one, so the hint can go
  screen: figures.map(() => ({ x: 0, y: 0, r: 0, visible: false })),
}

// Works out where each figure is on the screen. Call every frame, once the camera is placed.
export function updateScreens(camera, width, height) {
  camera.updateMatrixWorld()
  camera.matrixWorldInverse.copy(camera.matrixWorld).invert()
  const e = camera.matrixWorldInverse.elements
  figures.forEach((f, i) => {
    const p = projectDirection(viewDirection(e, f.centre), camera.fov, width / height)
    const s = skyStore.screen[i]
    s.visible = p.visible && Math.abs(p.x) < 1 && Math.abs(p.y) < 1
    s.x = ((p.x + 1) / 2) * width
    s.y = ((1 - p.y) / 2) * height
    s.r = screenRadius(f.radius, camera.fov, height)
  })
}
