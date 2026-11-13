import { useEffect, useRef } from 'react'
import { moonPositions } from '../descent/scene/moonBody.js'

// The descent's own cratered moon (same geometry, same three flat tones, lit from the same side),
// drawn small on a 2D canvas so the page does not have to load a 3D engine. It turns slowly, and
// stands still for anyone who prefers reduced motion.
const SIZE = 52
const LIGHT = (() => {
  const v = [-0.45, 0.75, 0.5]
  const l = Math.hypot(...v)
  return v.map((c) => c / l)
})()
const LIT = '#e3a72f'
const MID = '#a47a30'
const SHADOW = '#0b1220'
const TILT = 0.38 // radians; the moon's axis leans a little

export default function MoonBadge() {
  const canvas = useRef(null)

  useEffect(() => {
    const el = canvas.current
    const ctx = el.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    el.width = SIZE * dpr
    el.height = SIZE * dpr
    const R = SIZE * dpr * 0.46
    const c = (SIZE * dpr) / 2
    const verts = moonPositions(1, 1, 6)
    const tris = verts.length / 9
    const order = new Uint32Array(tris)
    const depth = new Float32Array(tris)
    const out = new Float32Array(verts.length)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const [ct, st] = [Math.cos(TILT), Math.sin(TILT)]

    const draw = (angle) => {
      const [ca, sa] = [Math.cos(angle), Math.sin(angle)]
      // turn about the vertical axis, then lean the whole moon over
      for (let i = 0; i < verts.length; i += 3) {
        const x = verts[i] * ca + verts[i + 2] * sa
        const z = -verts[i] * sa + verts[i + 2] * ca
        const y = verts[i + 1]
        out[i] = x * ct - y * st
        out[i + 1] = x * st + y * ct
        out[i + 2] = z
      }
      ctx.clearRect(0, 0, el.width, el.height)
      let n = 0
      for (let t = 0; t < tris; t++) {
        const o = t * 9
        const ux = out[o + 3] - out[o]
        const uy = out[o + 4] - out[o + 1]
        const vx = out[o + 6] - out[o]
        const vy = out[o + 7] - out[o + 1]
        if (ux * vy - uy * vx <= 0) continue // facing away
        order[n++] = t
        depth[t] = out[o + 2] + out[o + 5] + out[o + 8]
      }
      const drawn = Array.from(order.subarray(0, n)).sort((a, b) => depth[a] - depth[b])
      for (const t of drawn) {
        const o = t * 9
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
        ctx.fillStyle = ctx.strokeStyle = d > 0.4 ? LIT : d > -0.1 ? MID : SHADOW
        ctx.beginPath()
        ctx.moveTo(c + out[o] * R, c - out[o + 1] * R)
        ctx.lineTo(c + out[o + 3] * R, c - out[o + 4] * R)
        ctx.lineTo(c + out[o + 6] * R, c - out[o + 7] * R)
        ctx.closePath()
        ctx.fill()
        ctx.lineWidth = 0.7
        ctx.stroke()
      }
    }

    if (reduced) {
      draw(0.9)
      return undefined
    }
    let raf = 0
    let last = 0
    let angle = 0.9
    const tick = (now) => {
      raf = requestAnimationFrame(tick)
      if (document.hidden || now - last < 33) return
      angle += ((now - last) / 1000) * 0.5
      last = now
      draw(angle)
    }
    raf = requestAnimationFrame((now) => {
      last = now
      tick(now)
    })
    return () => cancelAnimationFrame(raf)
  }, [])

  return <canvas ref={canvas} className="moon-badge" style={{ width: SIZE, height: SIZE }} aria-hidden="true" />
}
