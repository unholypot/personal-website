import { useMemo } from 'react'
import { BASE, LANDING_PAD, RADIO_ARRAY, RIDGE } from '../layout.js'
import { PALETTE, mix, rgb } from '../palette.js'
import { createBuilder, rng } from '../build.js'
import { createSceneMaterial } from '../sceneMaterial.js'
import { addCrater, addRays } from '../craters.js'
import { PLAIN_RADIUS, PLAIN_BLEND_RADIUS, addPatch, groundAt } from '../ground.js'

const mustard = rgb(PALETTE.mustard)
const navy = rgb(PALETTE.navy)
const BRIGHT = mix(mustard, rgb(PALETTE.cream), 0.24) // pale uplands
const BLOT = mix(mustard, rgb(PALETTE.orange), 0.3) // broad warm lowlands
const DUSK = mix(mustard, navy, 0.14) // faint darker ground and long cracks
const SPECK = mix(mustard, navy, 0.3)

// How far out from the landing site the markings go. The moon's edge is at 1500.
const REACH = 1300

// Height above the ground: a touch more out on the slope, where the moon's own facets sit a
// little under its true curve. Later layers are drawn over earlier ones regardless.
const lift = (x, z) => (Math.hypot(x, z) < PLAIN_RADIUS ? 0.12 : 0.9)

// A marking must sit wholly on the plain or wholly on the slope, and wholly on the moon.
const fits = (x, z, radius) => {
  const r = Math.hypot(x, z)
  return (r + radius < PLAIN_RADIUS - 15 || r - radius > PLAIN_RADIUS + 15) && r + radius < REACH + 120
}

const near = (x, z, [cx, cz], d) => Math.hypot(x - cx, z - cz) < d
// Keep the base, the pad and the astronaut's mountain clear of craters.
const busy = (x, z, radius) =>
  near(x, z, [BASE[0], BASE[2]], 75 + radius) || near(x, z, LANDING_PAD, 20 + radius) || near(x, z, [RIDGE[0], RIDGE[2]], 30 + radius) || near(x, z, RADIO_ARRAY, 55 + radius)

// A thin crack wandering across the ground.
function crack(b, x, z, rand) {
  let heading = rand() * Math.PI * 2
  let at = [x, z]
  const pieces = 5 + Math.floor(rand() * 6)
  for (let i = 0; i < pieces; i++) {
    heading += (rand() - 0.5) * 0.9
    const len = 18 + rand() * 30
    const next = [at[0] + Math.cos(heading) * len, at[1] + Math.sin(heading) * len]
    const half = 0.9 + rand() * 0.8
    const nx = -Math.sin(heading) * half
    const nz = Math.cos(heading) * half
    const quad = [
      [at[0] - nx, at[1] - nz],
      [next[0] - nx, next[1] - nz],
      [next[0] + nx, next[1] + nz],
      [at[0] + nx, at[1] + nz],
    ]
    const radii = quad.map(([qx, qz]) => Math.hypot(qx, qz))
    const crossesApron = Math.min(...radii) < PLAIN_BLEND_RADIUS && Math.max(...radii) > PLAIN_RADIUS
    if (!crossesApron && quad.every(([qx, qz]) => fits(qx, qz, 0) && !busy(qx, qz, 6)))
      b.flat(quad.map(([qx, qz]) => [qx, groundAt(qx, qz) + lift(qx, qz), qz]), [SPECK])
    at = next
  }
}

// What the moon's surface looks like from above: lowlands and uplands in slightly different
// tones, fields of stippled dots, long cracks, and craters of every kind: real bowls with raised
// rims, terraced walls and central peaks, streaks of dust thrown out from the youngest, secondary
// craters round the big ones, and chains of small ones.
export default function Surface() {
  const geometry = useMemo(() => {
    const b = createBuilder()
    const rand = rng(77)
    const spot = (min, max) => {
      const a = rand() * Math.PI * 2
      // spread evenly over the area, not bunched toward the middle
      const d = Math.sqrt(min * min + rand() * (max * max - min * min))
      return [Math.cos(a) * d, Math.sin(a) * d]
    }
    const blot = (color, min, max, small, large) => {
      const [x, z] = spot(min, max)
      const radius = small + rand() * (large - small)
      const lobes = 2 + Math.floor(rand() * 4)
      const phase = rand() * 6
      if (!fits(x, z, radius * 1.3)) return
      addPatch(b, x, z, (a) => radius * (1 + 0.22 * Math.sin(a * lobes + phase) + 0.08 * Math.sin(a * 7 + phase)), color, lift(x, z), { segments: 30 })
    }

    // broad regions of slightly different ground
    for (let i = 0; i < 12; i++) blot(BLOT, 520, REACH, 120, 280)
    for (let i = 0; i < 9; i++) blot(DUSK, 480, REACH, 90, 220)
    for (let i = 0; i < 12; i++) blot(BRIGHT, 480, REACH, 70, 200)
    for (let i = 0; i < 5; i++) blot(DUSK, 130, 330, 30, 60)

    // stippled fields: dots that thin out toward one edge, like a printed halftone
    for (let i = 0; i < 22; i++) {
      const [cx, cz] = spot(120, REACH)
      const size = 45 + rand() * 90
      const lean = rand() * Math.PI * 2
      for (let k = 0; k < 34; k++) {
        const a = rand() * Math.PI * 2
        const d = Math.sqrt(rand()) * size
        const x = cx + Math.cos(a) * d
        const z = cz + Math.sin(a) * d
        // denser on the side the field leans toward
        if (rand() > 0.55 + 0.45 * Math.cos(a - lean)) continue
        const radius = 1.1 + rand() * 2.6
        if (!fits(x, z, radius) || busy(x, z, 0)) continue
        addPatch(b, x, z, () => radius, SPECK, lift(x, z), { segments: 6 })
      }
    }

    for (let i = 0; i < 16; i++) crack(b, ...spot(140, REACH - 100), rand)

    // Where every crater goes is settled first, so the dust streaks can be laid beneath them all.
    const craters = []
    const free = (x, z, r) => craters.every(([cx, cz, cr]) => Math.hypot(x - cx, z - cz) > (r + cr) * 0.95)
    const place = (x, z, r) => {
      if (!fits(x, z, r * 1.7) || busy(x, z, r) || !free(x, z, r)) return false
      craters.push([x, z, r])
      return true
    }
    const big = []
    for (let i = 0; i < 24 && big.length < 9; i++) {
      const [x, z] = spot(480, REACH - 80)
      const r = 52 + rand() * 56
      if (place(x, z, r)) big.push([x, z, r])
    }
    for (let i = 0; i < 90; i++) {
      const [x, z] = spot(110, REACH)
      place(x, z, 13 + Math.pow(rand(), 1.4) * 27)
    }
    // small craters cluster round the big ones, where the thrown-out rock fell
    for (const [bx, bz, br] of big) {
      for (let i = 0; i < 12; i++) {
        const a = rand() * Math.PI * 2
        const d = br * (1.5 + rand() * 1.3)
        place(bx + Math.cos(a) * d, bz + Math.sin(a) * d, 4 + rand() * 6)
      }
    }
    // and now and then a chain of small ones, strung out along a line
    for (let c = 0; c < 4; c++) {
      let [x, z] = spot(200, REACH - 100)
      const heading = rand() * Math.PI * 2
      const links = 6 + Math.floor(rand() * 4)
      for (let i = 0; i < links; i++) {
        place(x + (rand() - 0.5) * 3, z + (rand() - 0.5) * 3, 4 + rand() * 3)
        x += Math.cos(heading) * (19 + rand() * 8)
        z += Math.sin(heading) * (19 + rand() * 8)
      }
    }
    for (let i = 0; i < 170; i++) {
      const [x, z] = spot(90, REACH)
      place(x, z, 3 + rand() * 7)
    }

    // dust streaks from the biggest craters, first, so every crater lies over them
    for (const [x, z, r] of big.slice(0, 4)) addRays(b, x, z, r, rand, 10 + Math.floor(rand() * 7), lift(x, z) - 0.04, (qx, qz) => busy(qx, qz, 0) || !fits(qx, qz, 0))
    // then the craters themselves, large first so the small ones are never buried
    craters.sort((p, q) => q[2] - p[2]).forEach(([x, z, r]) => addCrater(b, x, z, r, rand, lift(x, z)))
    return b.toGeometry()
  }, [])
  const material = useMemo(() => createSceneMaterial({ fogNear: 2500, fogFar: 14000, doubleSided: true, decal: true }), [])
  return <mesh geometry={geometry} material={material} renderOrder={1} />
}
