// The skills as constellations: five real ones (Orion, Scorpius, the Southern Cross, the Big
// Dipper and Cassiopeia), each drawn from the real positions of its stars and standing for a group
// of skills. They are set in the sky of the opening view so that all of them sit on screen at
// once, clear of the planet. This file holds the pure parts: where they are, where they land on
// the screen, and which one a pointer is on.
import { SKILLS } from '../content/skills.js'
import { CHARTS } from '../content/starCharts.js'
import { cross, frame, offset, unit } from './skyMath.js'
import { sampleCamera } from './cameraPath.js'
import { chartOffsets } from './starChart.js'

// Where each figure sits on the opening screen, in the same order as SKILLS: the middle of the
// figure as [x, y] from -1 to 1 (at the 1.6 aspect), and its size as the angle from its middle to
// its farthest star, in radians.
export const ANCHORS = [
  [-0.72, 0.4, 0.115], // Orion: languages
  [0.74, -0.08, 0.13], // Scorpius: tools
  [-0.3, 0.74, 0.06], // the Southern Cross: engineering
  [0.12, 0.7, 0.125], // the Big Dipper: machine learning
  [0.64, 0.66, 0.085], // Cassiopeia: ways of working
]

// The same five for a tall, phone-shaped screen (aspect about 0.46), where the rings run the full
// width and only the sky above the planet is free: two rows of figures, smaller and closer together.
export const TALL_ANCHORS = [
  [-0.62, 0.42, 0.075], // Orion: languages
  [0.45, 0.42, 0.075], // Scorpius: tools
  [-0.08, 0.44, 0.042], // the Southern Cross: engineering
  [-0.42, 0.7, 0.085], // the Big Dipper: machine learning
  [0.45, 0.72, 0.065], // Cassiopeia: ways of working
]

const OPENING_ASPECT = 1.6

// The camera's three directions at the opening: forward, right and up.
function openingBasis(aspect = OPENING_ASPECT) {
  const cam = sampleCamera(0, aspect)
  const forward = unit(cam.target.map((v, i) => v - cam.position[i]))
  const right = unit(cross(forward, [0, 1, 0]))
  return { forward, right, up: cross(right, forward), t: Math.tan((cam.fov * Math.PI) / 360) }
}

// The direction at a point of the opening screen (x and y from -1 to 1).
export function directionFromScreen(x, y, aspect = OPENING_ASPECT) {
  const { forward, right, up, t } = openingBasis(aspect)
  return unit([0, 1, 2].map((k) => forward[k] + right[k] * x * t * aspect + up[k] * y * t))
}

// The reverse: where a direction lands on the opening screen.
export function projectToOpening(d, aspect = OPENING_ASPECT) {
  const { forward, right, up, t } = openingBasis(aspect)
  const along = d[0] * forward[0] + d[1] * forward[1] + d[2] * forward[2]
  return {
    x: (d[0] * right[0] + d[1] * right[1] + d[2] * right[2]) / along / (t * aspect),
    y: (d[0] * up[0] + d[1] * up[1] + d[2] * up[2]) / along / t,
  }
}

const angleBetween = (a, b) => Math.acos(Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])))

// How big a star looks, from how bright it is (smaller magnitudes are brighter).
export const starSize = (magnitude) => Math.max(3, 3 + (3.6 - magnitude) * 1.2)

// One figure per skill group: its real stars, scaled to the size set above and laid round its
// anchor, with the lines that join them, how big each star looks and what colour it is. The layout
// depends on the shape of the screen (wide by default, or the phone layout when it is tall).
export function buildConstellations(aspect = OPENING_ASPECT) {
  const layout = aspect < 1 ? TALL_ANCHORS : ANCHORS
  return SKILLS.map((skill, i) => {
    const chart = CHARTS[skill.constellation]
    const [ax, ay, size] = layout[i]
    const centre = directionFromScreen(ax, ay, aspect)
    const axes = frame(centre)
    const flat = chartOffsets(chart.stars)
    const scale = size / Math.max(...flat.map((p) => Math.hypot(p.x, p.y)))
    const stars = flat.map((p) => offset(centre, axes, p.x * scale, p.y * scale))
    const index = new Map(chart.stars.map((s, k) => [s.name, k]))
    const links = chart.links.map(([a, b]) => [index.get(a), index.get(b)])
    const radius = Math.max(...stars.map((s) => angleBetween(s, centre)))
    return {
      id: skill.id,
      name: chart.name,
      centre,
      stars,
      links,
      sizes: chart.stars.map((s) => starSize(s.mag)),
      tints: chart.stars.map((s) => s.tint ?? null),
      radius,
    }
  })
}

// A direction in the world, as the camera sees it: the camera's matrix (column-major) applied
// as a pure turn, with no move. The camera looks down its own -z.
export function viewDirection(e, d) {
  return [
    e[0] * d[0] + e[4] * d[1] + e[8] * d[2],
    e[1] * d[0] + e[5] * d[1] + e[9] * d[2],
    e[2] * d[0] + e[6] * d[1] + e[10] * d[2],
  ]
}

// Where a direction in camera space lands on the screen (x and y from -1 to 1), and whether it is in front of the camera.
export function projectDirection(view, fovDegrees, aspect) {
  if (!(view[2] < -1e-6)) return { x: 0, y: 0, visible: false }
  const t = Math.tan((fovDegrees * Math.PI) / 360)
  const depth = -view[2]
  return { x: view[0] / depth / (t * aspect) || 0, y: view[1] / depth / t || 0, visible: true }
}

// A small angle as pixels on the screen.
// The constellations answer to the pointer only in the opening view. A sliver of scrolling
// ends it, so nothing lights up by accident in the sections further down.
export const EXPLORE_UNTIL = 0.01
export const canExplore = (p) => Number.isFinite(p) && p >= 0 && p < EXPLORE_UNTIL

export const screenRadius =(angle, fovDegrees, heightPx) => (Math.tan(angle) / Math.tan((fovDegrees * Math.PI) / 360)) * (heightPx / 2)

// The figure a pointer is on, or near (within `slack` pixels of its edge); -1 if none. Figures
// that are off screen never count.
export function nearestFigure(screens, px, py, slack) {
  let best = -1
  let bestDistance = Infinity
  screens.forEach((s, i) => {
    if (!s.visible) return
    const d = Math.hypot(px - s.x, py - s.y)
    if (d <= s.r + slack && d < bestDistance) {
      best = i
      bestDistance = d
    }
  })
  return best
}
