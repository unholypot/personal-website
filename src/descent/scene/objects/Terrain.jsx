import { useMemo } from 'react'
import { MOON, RIDGE, RIDGE_TOP } from '../layout.js'
import { terrainBlocked } from '../terrainLayout.js'
import { PALETTE, SHADE, TONES, mix, rgb } from '../palette.js'
import { createBuilder, rng } from '../build.js'
import { createSceneMaterial } from '../sceneMaterial.js'
import { PLAIN_RADIUS, PLAIN_BLEND_RADIUS, addPatch, addShadow, groundAt } from '../ground.js'

const ink = rgb(PALETTE.ink)
const navy = rgb(PALETTE.navy)
const teal = rgb(PALETTE.teal)

// Mountain ranges behind the landing site, nearest first. Each is a wandering chain of solid
// peaks, darker close by and paler with distance, so they layer like a poster's cut-outs when
// seen from the ground and read as real ranges when seen from above.
// [z of the middle, width, tallest peak, how far the chain wanders, tones: lit / mid / shadow]
const RANGES = [
  [-22, 300, 9, 16, [mix(navy, teal, 0.4), mix(ink, navy, 0.6), ink]],
  [-62, 500, 20, 28, [mix(navy, teal, 0.65), mix(navy, teal, 0.2), ink]],
  [-175, 800, 42, 40, [mix(teal, rgb(PALETTE.cream), 0.12), mix(navy, teal, 0.45), navy]],
  [-380, 1100, 76, 70, [mix(teal, rgb(PALETTE.cream), 0.26), mix(navy, teal, 0.65), mix(navy, teal, 0.2)]],
]

// Broad, overlapping poster mountains, rooted in the ground. Their complete
// footprint must stay outside the landing clearings, regardless of their centre.
function peak(solid, decal, x, z, radius, height, tones, options) {
  if (terrainBlocked(x, z, radius * 1.35)) return
  const foot = groundAt(x, z) - 2
  solid.mountain([x, foot, z], radius, height + 2, tones, options)
  addShadow(decal, x, z, radius * 0.7, height, mix(rgb(SHADE), navy, 0.2))
}

function range(solid, decal, [z0, width, tallest, wander, tones], rand, seed) {
  const half = width / 2
  // the ends of each chain curve toward the viewer, so together they ring the landing site
  const bow = Math.abs(z0) * 0.35
  const phase = rand() * Math.PI * 2
  const waves = 1.5 + rand() * 1.5
  // two passes through the chain
  const gaps = [rand(), rand()].map((g) => -half + width * (0.12 + 0.76 * g))
  const count = Math.round(width / (tallest * 1.35))
  for (let i = 0; i < count; i++) {
    const x = -half + (width * (i + rand())) / count
    const u = x / half
    const z = z0 + bow * u * u + Math.sin(u * waves * Math.PI + phase) * wander * 0.6 + (rand() - 0.5) * wander * 0.5
    // heights swell and fall along the chain, with a tall peak now and then
    const swell = 0.62 + 0.38 * Math.sin(u * 2.3 * Math.PI + phase * 1.7)
    const height = tallest * Math.max(0.3, (rand() < 0.2 ? 1 : 0.5 + rand() * 0.4) * swell)
    const radius = tallest * (0.8 + rand() * 0.6)
    const foothills = rand() < 0.75 ? (rand() < 0.5 ? 3 : 2) : 1
    const spots = Array.from({ length: foothills }, () => {
      const a = rand() * Math.PI * 2
      return [x + Math.cos(a) * radius * 1.15, z + Math.sin(a) * radius * 1.15, 0.45 + rand() * 0.25, 0.3 + rand() * 0.25]
    })
    if (gaps.some((g) => Math.abs(x - g) < width * 0.035)) continue
    // a shoulder or two part-way up one side, so the profile steps and shows more than one summit
    const shoulders = Array.from({ length: radius > tallest * 1.0 ? 2 : 1 }, () => {
      const a = rand() * Math.PI * 2
      const out = radius * (0.3 + rand() * 0.25)
      return [x + Math.cos(a) * out, z + Math.sin(a) * out * 0.8, 0.42 + rand() * 0.2, 0.5 + rand() * 0.25]
    })
    // finer faceting than before, but the same solid, irregular peaks (ribs made them star-shaped)
    const options = { seed: seed + i, segments: 11, tiers: 6, texture: 0.35 }
    peak(solid, decal, x, z, radius, height, tones, options)
    shoulders.forEach(([sx, sz, size, rise], k) => {
      peak(solid, decal, sx, sz, radius * size, height * rise, tones, { ...options, seed: seed + i * 11 + k + 90, segments: 8, tiers: 4 })
    })
    spots.forEach(([fx, fz, size, rise], k) => {
      peak(solid, decal, fx, fz, radius * size, height * rise, tones, { ...options, seed: seed + i * 7 + k + 50, segments: 8, tiers: 3 })
    })
  }
}

// Lone peaks and small clusters scattered sparingly over the rest of the moon, each standing
// straight out from the curved ground. From the landing site they are below the horizon; from
// above they keep the moon from looking empty everywhere but the middle.
const OUTLIER_TONES = [
  [mix(navy, teal, 0.6), mix(navy, teal, 0.35), navy],
  [mix(navy, teal, 0.35), navy, mix(ink, navy, 0.6)],
]
function outliers(solid, decal, rand) {
  for (let c = 0; c < 38; c++) {
    const a = rand() * Math.PI * 2
    const d = Math.sqrt(520 * 520 + rand() * (1320 * 1320 - 520 * 520))
    const tones = OUTLIER_TONES[c % 2]
    const members = 1 + Math.floor(rand() * 4)
    for (let m = 0; m < members; m++) {
      const x = Math.cos(a) * d + (m ? (rand() - 0.5) * 110 : 0)
      const z = Math.sin(a) * d + (m ? (rand() - 0.5) * 110 : 0)
      if (Math.hypot(x, z) < PLAIN_RADIUS + 60 || Math.hypot(x, z) > 1380) continue
      const height = (m ? 0.5 : 1) * (26 + rand() * 34)
      const radius = height * (1.2 + rand() * 0.5)
      const y = groundAt(x, z)
      const up = [x - MOON.center[0], y - MOON.center[1], z - MOON.center[2]]
      const len = Math.hypot(up[0], up[1], up[2])
      // rooted a little under the surface so no gap shows at its foot
      const sink = 5 / len
      const foot = [x - up[0] * sink, y - up[1] * sink, z - up[2] * sink]
      solid.mountain(foot, radius, height + 5, tones, { seed: 900 + c * 9 + m, segments: 7, tiers: 3, texture: 0.3, up })
      addShadow(decal, x, z, radius * 0.8, height, SHADE, 0.9)
    }
  }
}

// The landing ground: a level plain, mountain ranges behind it, the small mountain the
// astronaut stands on, and the shadows all of them cast.
export default function Terrain() {
  const { solid, shadows } = useMemo(() => {
    const b = createBuilder()
    const decal = createBuilder()
    const rand = rng(42)
    // A continuous apron joins the landing plain to the globe; the same height
    // function places surface markings, so they follow the slope too.
    addPatch(b, 0, 0, () => PLAIN_BLEND_RADIUS, PALETTE.mustard, 0, { segments: 192, step: 10 })
    RANGES.forEach((r, i) => range(b, decal, r, rand, 100 * (i + 1)))
    outliers(b, decal, rng(314))

    // Small stone clusters supply parallax and scale during the drone flyover.
    // Keep the central flight corridor and the landing landmarks unobstructed.
    const stones = rng(912)
    for (let i = 0; i < 48; i++) {
      const x = (stones() - 0.5) * 560
      const z = (stones() - 0.5) * 440
      const size = 0.8 + stones() * 2.5
      if (terrainBlocked(x, z, size * 1.9) || (Math.abs(x) < 65 && z > -110)) continue
      b.mountain([x, groundAt(x, z) - 0.2, z], size * 1.4, size,
        [mix(teal, rgb(PALETTE.mustard), 0.25), mix(navy, teal, 0.5), navy],
        { seed: 1800 + i, segments: 6, tiers: 2, plateau: size * 0.22, texture: 0.1 })
      addShadow(decal, x, z, size, size, SHADE)
    }

    // Boulder fields and loose rock over the plain: single stones, and a few clusters with a big
    // boulder among small ones, each with its shadow. They give the ground texture and scale
    // from the air, and something to pass by on the way down. Kept off the landing landmarks.
    const loose = rng(2718)
    const rockTones = [mix(teal, rgb(PALETTE.mustard), 0.2), mix(navy, teal, 0.5), navy]
    const stone = (x, z, size, seed) => {
      if (terrainBlocked(x, z, size * 2) || (Math.abs(x) < 40 && z > -20)) return
      b.rock([x, groundAt(x, z) + size * 0.25, z], size, rockTones, { seed, squash: 0.6 + loose() * 0.3, turn: [loose() * 3, loose() * 3, 0] })
      addShadow(decal, x, z, size * 0.8, size * 0.6, SHADE)
    }
    for (let i = 0; i < 120; i++) stone((loose() - 0.5) * 520, (loose() - 0.5) * 420 - 40, 0.5 + loose() * 1.1, 3000 + i)
    for (let c = 0; c < 14; c++) {
      const cx = (loose() - 0.5) * 480
      const cz = (loose() - 0.5) * 380 - 60
      stone(cx, cz, 2.2 + loose() * 1.6, 3300 + c * 10)
      for (let k = 1; k < 8; k++) {
        const a = loose() * Math.PI * 2
        const d = 3 + loose() * 9
        stone(cx + Math.cos(a) * d, cz + Math.sin(a) * d, 0.35 + loose() * 0.8, 3300 + c * 10 + k)
      }
    }
    // low dunes of drifted dust: wide, shallow humps that break up the flat ground
    for (let i = 0; i < 16; i++) {
      const x = (loose() - 0.5) * 560
      const z = (loose() - 0.5) * 420 - 60
      const r = 18 + loose() * 26
      if (terrainBlocked(x, z, r * 1.2) || (Math.abs(x) < 70 && z > -120)) continue
      b.mountain([x, groundAt(x, z) - 0.4, z], r, 1.6 + loose() * 2, [mix(rgb(PALETTE.mustard), rgb(PALETTE.cream), 0.22), rgb(PALETTE.mustard), mix(rgb(PALETTE.mustard), navy, 0.28)], { seed: 3700 + i, segments: 9, tiers: 2, texture: 0.15 })
    }

    // The astronaut's mountain: a craggy rise with a small level summit, foothills on the side
    // away from the base (so the domes stay in view), and a few boulders at its foot.
    const [rx, , rz] = RIDGE
    const rock = (x, z, radius, height, options) => {
      b.mountain([x, 0, z], radius, height, TONES.rock, { texture: 0.55, ...options })
      addShadow(decal, x, z, radius * 0.8, height, SHADE)
    }
    rock(rx, rz, 8.5, RIDGE_TOP, { seed: 7, segments: 10, tiers: 5, plateau: 1.3 })
    rock(rx - 8, rz - 2, 5.5, 3.8, { seed: 12, segments: 7, tiers: 3 })
    rock(rx - 13, rz + 3, 4, 2.2, { seed: 15, segments: 6, tiers: 2 })
    rock(rx + 5.5, rz - 5, 3.2, 2.4, { seed: 21, segments: 6, tiers: 2 })
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (0.55 + rand() * 0.9) // the left and near-left of the mountain
      const d = 9 + rand() * 7
      const s = 0.5 + rand() * 0.9
      rock(rx + Math.cos(a) * d, rz + Math.sin(a) * d * 0.6, s, s * (0.7 + rand() * 0.5), { seed: 40 + i, segments: 5, tiers: 2 })
    }
    return { solid: b.toGeometry(), shadows: decal.toGeometry() }
  }, [])
  const material = useMemo(() => createSceneMaterial({ fogNear: 2500, fogFar: 14000, doubleSided: true }), [])
  const decalMaterial = useMemo(() => createSceneMaterial({ fogNear: 2500, fogFar: 14000, doubleSided: true, decal: true }), [])
  return (
    <>
      <mesh geometry={solid} material={material} />
      <mesh geometry={shadows} material={decalMaterial} renderOrder={2} />
    </>
  )
}
