import { useRef } from 'react'
import { moonPositions } from '../descent/scene/moonBody.js'
import { useSpin } from './useSpin.js'

// The descent's ringed giant, small: a faceted ball in flat orange and mustard stripes, shaded in
// three tones from the same side as everything else, with its rings seen nearly edge-on. It turns
// slowly (the stripes drift past), and the rings stay put, as they do in the descent.
const W = 80
const H = 48
const LIGHT = (() => {
  const v = [-0.45, 0.75, 0.5]
  const l = Math.hypot(...v)
  return v.map((c) => c / l)
})()
const STRIPE = [
  ['#d9532b', '#9c3a1e'],
  ['#e3a72f', '#a47a30'],
]
const SHADOW = '#0b1220'
const RING_TILT = -0.2 // radians

function makeDraw(w, h) {
  // a smooth ball: the moon's faceting with no craters would need its own path, so take the moon's
  // triangles, put each corner back on a clean sphere and keep them as the facets
  const raw = moonPositions(1, 1, 5)
  const verts = new Float32Array(raw.length)
  for (let i = 0; i < raw.length; i += 3) {
    const l = Math.hypot(raw[i], raw[i + 1], raw[i + 2])
    verts[i] = raw[i] / l
    verts[i + 1] = raw[i + 1] / l
    verts[i + 2] = raw[i + 2] / l
  }
  const tris = verts.length / 9
  const out = new Float32Array(verts.length)
  // sized so the widest ring (2.15 radii out, plus its stroke) stays inside the canvas
  const R = Math.min(h * 0.4, (w / 2) / 2.45)
  const cx = w / 2
  const cy = h / 2
  // wavy bands: the edges wander with longitude, which is what shows the planet turning
  const stripeOf = (y, lon) => (Math.floor((y + 1) * 3.2 + Math.sin(y * 9) * 0.25 + Math.sin(lon * 2 + y * 4) * 0.35) % 2 + 2) % 2

  const ring = (ctx, front) => {
    // two bands, a wide mustard one and a thin cream one, as an ellipse seen almost edge-on
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(RING_TILT)
    const bands = [
      [R * 2.15, R * 0.34, '#e3a72f', R * 0.2],
      [R * 1.78, R * 0.28, '#f2e6ce', R * 0.1],
    ]
    for (const [rx, ry, color, width] of bands) {
      ctx.beginPath()
      // the far half passes behind the planet, the near half in front
      ctx.ellipse(0, 0, rx, ry, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2)
      ctx.strokeStyle = color
      ctx.lineWidth = width
      ctx.stroke()
    }
    ctx.restore()
  }

  return (ctx, angle) => {
    ctx.clearRect(0, 0, w, h)
    ring(ctx, false)
    const [ca, sa] = [Math.cos(angle), Math.sin(angle)]
    for (let i = 0; i < verts.length; i += 3) {
      out[i] = verts[i] * ca + verts[i + 2] * sa
      out[i + 1] = verts[i + 1]
      out[i + 2] = -verts[i] * sa + verts[i + 2] * ca
    }
    // the light stays fixed on the screen, so the world turns through it
    const order = []
    for (let t = 0; t < tris; t++) {
      const o = t * 9
      const ux = out[o + 3] - out[o]
      const uy = out[o + 4] - out[o + 1]
      const vx = out[o + 6] - out[o]
      const vy = out[o + 7] - out[o + 1]
      if (ux * vy - uy * vx > 0) order.push(t)
    }
    for (const t of order) {
      const o = t * 9
      // shade by the facet's normal in the fixed frame; colour by its height (the stripes turn with the planet)
      const ux = out[o + 3] - out[o]
      const uy = out[o + 4] - out[o + 1]
      const uz = out[o + 5] - out[o + 2]
      const vx = out[o + 6] - out[o]
      const vy = out[o + 7] - out[o + 1]
      const vz = out[o + 8] - out[o + 2]
      let nx = uy * vz - uz * vy
      let ny = uz * vx - ux * vz
      let nz = ux * vy - uy * vx
      const len = Math.hypot(nx, ny, nz) || 1
      nx /= len
      ny /= len
      nz /= len
      const d = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]
      const mid = (verts[o + 1] + verts[o + 4] + verts[o + 7]) / 3
      const lon = Math.atan2(verts[o + 2] + verts[o + 5] + verts[o + 8], verts[o] + verts[o + 3] + verts[o + 6])
      const [lit, dim] = STRIPE[stripeOf(mid, lon)]
      ctx.fillStyle = ctx.strokeStyle = d > 0.15 ? lit : d > -0.25 ? dim : SHADOW
      ctx.beginPath()
      ctx.moveTo(cx + out[o] * R, cy - out[o + 1] * R)
      ctx.lineTo(cx + out[o + 3] * R, cy - out[o + 4] * R)
      ctx.lineTo(cx + out[o + 6] * R, cy - out[o + 7] * R)
      ctx.closePath()
      ctx.fill()
      ctx.lineWidth = 0.7
      ctx.stroke()
    }
    ring(ctx, true)
  }
}

export default function SaturnBadge() {
  const canvas = useRef(null)
  useSpin(canvas, W, H, makeDraw, 0.3)
  return <canvas ref={canvas} className="saturn-badge" style={{ width: W, height: H }} aria-hidden="true" />
}
