import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { rng } from '../build.js'
import { backdropMaterial, collect } from '../backdrop.js'
import { PALETTE, rgb } from '../palette.js'
import { cross, frame, offset, sky, unit } from '../skyMath.js'

const cream = rgb(PALETTE.cream)
const mustard = rgb(PALETTE.mustard)
const teal = rgb(PALETTE.teal)
const orange = rgb(PALETTE.orange)

// A river of faint stars across the sky along a great circle running from upper left to lower
// right of the opening view, thicker in a few knots, with a little colour in it.
function riverOfStars() {
  const rand = rng(61)
  const out = collect()
  const a = sky(-55, 26)
  const b = sky(30, -24)
  const pole = unit(cross(a, b))
  const along = unit(cross(pole, a))
  const knots = [0.2, 1.1, 2.3, 3.9, 5.2]
  for (let i = 0; i < 2600; i++) {
    // gather toward the knots two times in three
    let t = rand() * Math.PI * 2
    if (rand() < 0.66) t = knots[Math.floor(rand() * knots.length)] + (rand() + rand() + rand() - 1.5) * 0.35
    // spread across the band: mostly near its middle
    const across = (rand() + rand() + rand() - 1.5) * 0.14
    const p = unit([0, 1, 2].map((k) => a[k] * Math.cos(t) + along[k] * Math.sin(t) + pole[k] * across))
    const pick = rand()
    const c = pick < 0.14 ? teal : pick < 0.26 ? mustard : pick < 0.3 ? orange : cream
    out.add(p, c, 0.22 + rand() * 0.5, 1 + rand() * 1.6)
  }
  return out.geometry()
}

// A comet: a bright head and two tails fading away behind it.
function comet() {
  const out = collect()
  const head = sky(-37, 13)
  const axes = frame(head)
  const tail = (angle, length, width, c, strength) => {
    const dx = Math.cos(angle)
    const dy = Math.sin(angle)
    const tip = offset(head, axes, dx * length, dy * length)
    const left = offset(head, axes, -dy * width, dx * width)
    const right = offset(head, axes, dy * width, -dx * width)
    out.add(left, c, strength)
    out.add(right, c, strength)
    out.add(tip, c, 0)
  }
  tail(2.25, 0.13, 0.0045, cream, 0.75)
  tail(2.5, 0.085, 0.003, teal, 0.6)
  const core = collect()
  core.add(head, cream, 1, 7)
  return { tails: out.geometry(), head: core.geometry() }
}

// The far backdrop of space: a river of stars and a comet. (The constellations are their own thing.)
export default function DeepSky({ progress }) {
  const refs = useRef([])
  const parts = useMemo(() => {
    const visitor = comet()
    return [
      { kind: 'points', geometry: riverOfStars(), material: backdropMaterial(true) },
      { kind: 'mesh', geometry: visitor.tails, material: backdropMaterial(false) },
      { kind: 'points', geometry: visitor.head, material: backdropMaterial(true) },
    ]
  }, [])

  useFrame(() => {
    // fainter once the sky pales near the ground, but never gone
    const t = Math.min(1, Math.max(0, (progress.current - 0.5) / 0.3))
    for (const object of refs.current) if (object) object.material.uniforms.uStrength.value = 1 - 0.55 * t
  })

  return parts.map((part, i) => {
    const props = {
      ref: (el) => {
        refs.current[i] = el
      },
      geometry: part.geometry,
      material: part.material,
      frustumCulled: false,
      renderOrder: -4,
    }
    if (part.kind === 'points') return <points key={i} {...props} />
    return <mesh key={i} {...props} />
  })
}
