import { useFrame } from '@react-three/fiber'
import { backdropMaterial, collect } from '../backdrop.js'
import { PALETTE, mix, rgb } from '../palette.js'
import { figures, skyStore } from '../skyStore.js'
import { motion, shared } from '../sceneMaterial.js'

const cream = rgb(PALETTE.cream)
// The cool red giants glow warm and the hottest stars cool blue-white, as the real ones do.
const TINTS = { orange: mix(cream, rgb(PALETTE.orange), 0.55), blue: mix(cream, rgb(PALETTE.teal), 0.4) }

// Each figure is its own set of three things, so that one can light up on its own: the stars,
// the thin lines joining them, and a soft halo behind each star that only shows when it is lit.
// They are made once, here, and the frame loop below only changes their brightness.
const items = figures.map((f) => {
  const stars = collect()
  const halo = collect()
  const lines = collect()
  f.stars.forEach((p, i) => {
    const color = TINTS[f.tints[i]] ?? cream
    stars.add(p, color, 0.95, f.sizes[i])
    halo.add(p, color, 0.22, f.sizes[i] * 4.5)
  })
  for (const [a, b] of f.links) {
    lines.add(f.stars[a], cream, 0.3)
    lines.add(f.stars[b], cream, 0.3)
  }
  return {
    stars: { geometry: stars.geometry(), material: backdropMaterial(true) },
    halo: { geometry: halo.geometry(), material: backdropMaterial(true) },
    lines: { geometry: lines.geometry(), material: backdropMaterial(false) },
  }
})
const lit = figures.map(() => 0)

// The skills, as constellations on the far sky. The one being looked at brightens, its stars
// swell and a halo comes up behind them; the rest breathe very gently, which hints they are alive.
export default function Constellations({ progress }) {
  useFrame((_, delta) => {
    const time = shared.uTime.value
    // fainter once the sky pales near the ground, but never gone
    const pale = 1 - 0.55 * Math.min(1, Math.max(0, (progress.current - 0.5) / 0.3))
    items.forEach((item, i) => {
      lit[i] += ((skyStore.active === i ? 1 : 0) - lit[i]) * (1 - Math.exp(-Math.min(delta, 0.1) / 0.12))
      const breathe = motion.on ? 1 + 0.1 * Math.sin(time * 1.4 + i * 1.7) : 1
      item.stars.material.uniforms.uStrength.value = pale
      item.stars.material.uniforms.uScale.value = (1 + 0.6 * lit[i]) * breathe
      item.lines.material.uniforms.uStrength.value = pale * (1 + 1.8 * lit[i])
      item.halo.material.uniforms.uStrength.value = pale * lit[i]
    })
  })

  return items.map((item, i) => (
    <group key={figures[i].id}>
      <points geometry={item.halo.geometry} material={item.halo.material} frustumCulled={false} renderOrder={-4} />
      <lineSegments geometry={item.lines.geometry} material={item.lines.material} frustumCulled={false} renderOrder={-4} />
      <points geometry={item.stars.geometry} material={item.stars.material} frustumCulled={false} renderOrder={-4} />
    </group>
  ))
}
