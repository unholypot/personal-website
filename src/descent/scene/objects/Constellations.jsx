import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferGeometry, Float32BufferAttribute } from 'three'
import { rng } from '../build.js'
import { backdropMaterial, collect } from '../backdrop.js'
import { PALETTE, mix, rgb } from '../palette.js'
import { figures, skyStore } from '../skyStore.js'
import { frame, offset } from '../skyMath.js'
import { VERTICES_PER_SEGMENT, fillRibbons, ribbonSides } from '../skyLines.js'
import { REVEAL_END, lineFade, linePulse, revealAmount, skyShift } from '../skyReveal.js'
import { pointer } from '../../scroll/parallax.js'
import { motion, shared } from '../sceneMaterial.js'

const cream = rgb(PALETTE.cream)
// The cool red giants glow warm and the hottest stars cool blue-white, as the real ones do.
const TINTS = { orange: mix(cream, rgb(PALETTE.orange), 0.55), blue: mix(cream, rgb(PALETTE.teal), 0.4) }
const DUST_TINTS = [cream, cream, cream, mix(cream, rgb(PALETTE.teal), 0.5), mix(cream, rgb(PALETTE.mustard), 0.5)]

// How bright the lines are at rest (they are meant to be only just there) and how wide (half, in radians).
const LINE_ALPHA = 0.13
const LINE_HALF_WIDTH = 0.0009

// Each figure is its own set of four things, so that one can light up on its own: the stars, the
// thin lines joining them, a soft halo behind each star that only shows when it is lit, and a
// scatter of faint stars round it, so it is picked out of a crowd and not drawn on a blank page.
// They are made once, here, and the frame loop below only changes their brightness and place.
const items = figures.map((f, index) => {
  const stars = collect()
  const halo = collect()
  const dust = collect()
  f.stars.forEach((p, i) => {
    const color = TINTS[f.tints[i]] ?? cream
    stars.add(p, color, 0.95, f.sizes[i])
    halo.add(p, color, 0.22, f.sizes[i] * 4.5)
  })
  // the lines joining the stars: very faint hairline ribbons that brighten when the figure is looked at
  const segments = f.links.map(([a, b]) => [f.stars[a], f.stars[b]])
  const vertexCount = segments.length * VERTICES_PER_SEGMENT
  const ribbon = new BufferGeometry()
  ribbon.setAttribute('position', new Float32BufferAttribute(new Float32Array(vertexCount * 3), 3))
  ribbon.setAttribute('aSide', new Float32BufferAttribute(ribbonSides(segments.length), 1))
  ribbon.setAttribute('color', new Float32BufferAttribute(Array.from({ length: vertexCount }, () => cream).flat(), 3))
  ribbon.setAttribute('aAlpha', new Float32BufferAttribute(new Float32Array(vertexCount).fill(LINE_ALPHA), 1))
  ribbon.setAttribute('aSize', new Float32BufferAttribute(new Float32Array(vertexCount).fill(1), 1))
  // the lines are whole from the start; only their brightness comes and goes
  fillRibbons(ribbon.attributes.position.array, segments, 1, LINE_HALF_WIDTH)
  // faint stars all round, thickest close in and thinning out
  const rand = rng(700 + index * 31)
  const axes = frame(f.centre)
  for (let i = 0; i < 90; i++) {
    const a = rand() * Math.PI * 2
    const d = f.radius * (0.3 + 2.3 * Math.pow(rand(), 0.8))
    const p = offset(f.centre, axes, Math.cos(a) * d, Math.sin(a) * d)
    dust.add(p, DUST_TINTS[Math.floor(rand() * DUST_TINTS.length)], 0.14 + rand() * 0.3, 1 + rand() * 1.5)
  }
  const make = (part, round) => ({ geometry: part.geometry(), material: backdropMaterial(round) })
  return {
    stars: make(stars, true),
    halo: make(halo, true),
    lines: { geometry: ribbon, material: backdropMaterial(false, true) },
    dust: make(dust, true),
  }
})
const lit = figures.map(() => 0)

// The skills, as constellations on the far sky. Once the opening is over the stars come in one after
// another and the lines between them rise, very slowly, out of nothing. Each sits at its own depth, drifting a little against the others and leaning
// differently with the pointer, and every star shimmers at its own rate. The one being looked at
// brightens, its stars swell and a halo comes up behind them.
export default function Constellations({ progress, ready = true }) {
  // seconds since the scene was ready, which is when the figures begin to draw
  const clock = useRef(0)

  useFrame((state, delta) => {
    const time = shared.uTime.value
    const dt = Math.min(delta, 0.1)
    if (ready) clock.current += dt
    const sinceReady = motion.on ? clock.current : REVEAL_END + 1
    // fainter once the sky pales near the ground, but never gone
    const pale = 1 - 0.55 * Math.min(1, Math.max(0, (progress.current - 0.5) / 0.3))
    // which way is right and up on the screen, for the drift
    const e = state.camera.matrixWorld.elements
    items.forEach((item, i) => {
      lit[i] += ((skyStore.active === i ? 1 : 0) - lit[i]) * (1 - Math.exp(-dt / 0.12))
      const reveal = revealAmount(sinceReady, i)
      const breathe = motion.on ? 1 + 0.1 * Math.sin(time * 1.4 + i * 1.7) : 1
      const [sx, sy, sz] = skyShift(i, time, pointer, e, motion.on)
      for (const part of [item.stars, item.halo, item.lines, item.dust]) part.material.uniforms.uShift.value.set(sx, sy, sz)
      item.stars.material.uniforms.uStrength.value = pale * Math.min(1, reveal * 3)
      item.stars.material.uniforms.uScale.value = (1 + 0.6 * lit[i]) * breathe
      item.stars.material.uniforms.uTwinkle.value = motion.on ? 0.22 : 0
      // the lines rise slowly from nothing to just visible, then now and then swell a very little;
      // looking at the figure lights them properly
      const fade = motion.on ? lineFade(clock.current, i) : 1
      const pulse = motion.on ? linePulse(time, i) : 1
      item.lines.material.uniforms.uStrength.value = pale * fade * pulse * (1 + 4.5 * lit[i])
      item.halo.material.uniforms.uStrength.value = pale * lit[i]
      item.dust.material.uniforms.uStrength.value = pale * Math.min(1, reveal * 1.5) * (1 + 0.8 * lit[i])
      item.dust.material.uniforms.uTwinkle.value = motion.on ? 0.4 : 0
    })
  })

  return items.map((item, i) => (
    <group key={figures[i].id}>
      <points geometry={item.dust.geometry} material={item.dust.material} frustumCulled={false} renderOrder={-5} />
      <points geometry={item.halo.geometry} material={item.halo.material} frustumCulled={false} renderOrder={-4} />
      <mesh geometry={item.lines.geometry} material={item.lines.material} frustumCulled={false} renderOrder={-4} />
      <points geometry={item.stars.geometry} material={item.stars.material} frustumCulled={false} renderOrder={-4} />
    </group>
  ))
}
