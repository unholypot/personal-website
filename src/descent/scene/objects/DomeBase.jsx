import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Color, MeshBasicMaterial } from 'three'
import { BASE, LANDING_PAD, RIDGE } from '../layout.js'
import { PALE, PALETTE, SHADE, TONES, WORN, mix, rgb } from '../palette.js'
import { createBuilder, rng } from '../build.js'
import { createSceneMaterial, motion, shared } from '../sceneMaterial.js'
import { addPatch, addShadow, groundAt } from '../ground.js'

// [x, z, radius], measured from BASE. The big dome is the hub; the rest are joined to it.
// The east side is kept short of the landing pad.
const DOMES = [
  [0, 0, 12],
  [-21, 8, 8],
  [11, 12, 6],
  [-5, 26, 6],
  [-11, -13, 7],
  [-31, -4, 4], // a small utility pod
]
// The domes are cream, except the greenhouse (the third), which is glassier.
const GREENHOUSE = [mix(rgb(PALETTE.teal), rgb(PALETTE.cream), 0.55), rgb(PALETTE.teal), rgb(PALETTE.navy)]
const PANEL = [mix(rgb(PALETTE.teal), rgb(PALETTE.cream), 0.3), rgb(PALETTE.teal), rgb(PALETTE.navy)]
const CRATE = [rgb(PALETTE.cream), rgb(PALETTE.orange), rgb(PALETTE.navy)]
const CRATE_ALT = [rgb(PALETTE.mustard), mix(rgb(PALETTE.mustard), rgb(PALETTE.navy), 0.35), rgb(PALETTE.navy)]
const DARK = TONES.silhouette
const BEACON = [rgb(PALETTE.orange), rgb(PALETTE.orange), rgb(PALETTE.orange)]
// A lit window: the same warm yellow whichever way it faces.
const WARM = mix(rgb(PALETTE.mustard), rgb(PALETTE.cream), 0.35)
const LIT = [WARM, WARM, WARM]

// Which way a thing on a dome's rim faces: turning a box by this makes its front look outward.
const facing = (a) => Math.atan2(Math.cos(a), Math.sin(a))

const dome = (r) => [
  [0, r],
  [r * 0.5, r * 0.87],
  [r * 0.87, r * 0.5],
  [r, 0],
]

// A flat band along a line of [x, z] points, lying on the ground.
function track(b, points, width, color, lift = 0.16) {
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, az] = points[i]
    const [bx, bz] = points[i + 1]
    const len = Math.hypot(bx - ax, bz - az) || 1
    const nx = (-(bz - az) / len) * (width / 2)
    const nz = ((bx - ax) / len) * (width / 2)
    const quad = [
      [ax - nx, az - nz],
      [bx - nx, bz - nz],
      [bx + nx, bz + nz],
      [ax + nx, az + nz],
    ]
    b.flat(quad.map(([x, z]) => [x, groundAt(x, z) + lift, z]), [color])
  }
}

// The same line shifted sideways, for a pair of wheel ruts.
const beside = (points, d) =>
  points.map(([x, z], i) => {
    const [ax, az] = points[Math.max(0, i - 1)]
    const [bx, bz] = points[Math.min(points.length - 1, i + 1)]
    const len = Math.hypot(bx - ax, bz - az) || 1
    return [x - ((bz - az) / len) * d, z + ((bx - ax) / len) * d]
  })

// The surface base: bubble habitats joined by low corridors (the thesis on bubbles, as a place),
// with the marks a working base leaves on the ground round it.
export default function DomeBase() {
  const { geometry, halo, blinkA, blinkB } = useMemo(() => {
    const b = createBuilder()
    // the glow round the lit windows, and the two sets of lamps that blink in turn
    const glow = createBuilder()
    const flashA = createBuilder()
    const flashB = createBuilder()
    const rand = rng(63)

    // the domes, each on a low plinth, with a ring of windows
    DOMES.forEach(([x, z, r], i) => {
      const tones = i === 2 ? GREENHOUSE : TONES.dome
      b.lathe([[0, r * 1.06], [0.5, r * 1.06]], 10, TONES.rock, [x, 0, z])
      b.lathe(dome(r), 10, tones, [x, 0.5, z])
      const windows = Math.max(4, Math.round(r * 0.7))
      for (let k = 0; k < windows; k++) {
        const a = (k / windows) * Math.PI * 2 + i
        // leave the front of the hub clear for its airlock
        if (i === 0 && Math.abs(Math.sin(a) - 1) < 0.18) continue
        const h = r * (i === 2 ? 0.5 : 0.36)
        const rr = Math.sqrt(r * r - h * h) * 0.985
        const w = Math.max(1.1, r * 0.17)
        const at = [x + Math.cos(a) * rr, 0.5 + h, z + Math.sin(a) * rr]
        // most windows are lit, the greenhouse's all of them; a few are dark, like a place people live in
        const lit = i === 2 || (k + i) % 3 !== 0
        b.box(at, [w, w * 0.62, 0.3], lit ? LIT : DARK, facing(a))
        if (lit) glow.box(at, [w * 2.1, w * 1.5, 0.35], LIT, facing(a))
      }
      // a short mast on top
      b.box([x, 0.5 + r + 1.4, z], [0.25, 3, 0.25], DARK)
    })

    // corridors from the hub to each of the others
    for (const [x, z] of DOMES.slice(1)) {
      const len = Math.hypot(x, z)
      b.box([x / 2, 0.9, z / 2], [len, 1.8, 1.6], TONES.station, -Math.atan2(z, x))
    }

    // the hub's airlock, a squat block with a dark door, and a flag beside it
    b.box([0, 1.8, 13.2], [4.4, 3.6, 3.4], TONES.station)
    b.box([0, 1.4, 15], [2, 2.6, 0.3], LIT) // the airlock door, lit from inside
    glow.box([0, 1.5, 15.1], [3.6, 3.6, 0.3], LIT)
    b.box([0, 3.8, 13.2], [4.8, 0.4, 3.8], TONES.craft)
    b.box([7.5, 2.8, 17], [0.2, 5.6, 0.2], DARK)
    b.box([8.4, 5, 17], [1.8, 1.1, 0.12], TONES.payload)

    // a comms dish on its own mast, pointing up at the orbiting station
    b.box([7, 4.5, -16], [0.5, 9, 0.5], DARK)
    b.lathe([[0, 0.3], [1.3, 4.2], [1.5, 4.2]], 10, TONES.station, [7, 9, -16])
    b.box([7, 11.4, -16], [0.3, 1.8, 0.3], DARK)
    b.box([7, 12.4, -16], [0.9, 0.5, 0.9], TONES.payload)
    // the tall beacon mast
    b.box([-1, 11, -22], [0.4, 22, 0.4], DARK)
    b.box([-1, 22.4, -22], [1, 0.8, 1], TONES.payload)

    // a tunnel from the second dome out to the solar field, with a lit window along it
    {
      const [tx, tz] = [-27.5, 15]
      const len = Math.hypot(tx + 21, tz - 8)
      b.box([(tx - 21) / 2, 0.9, (tz + 8) / 2], [len, 1.6, 1.5], TONES.station, -Math.atan2(tz - 8, tx + 21))
    }
    // a bank of masts beside the comms dish, each with a small red tip
    for (const [mx, mz, mh] of [[10.5, -19, 7], [13, -17.5, 5.5], [15, -20, 6.5]]) {
      b.box([mx, mh / 2, mz], [0.22, mh, 0.22], DARK)
      b.box([mx, mh + 0.2, mz], [0.5, 0.4, 0.5], BEACON)
    }
    // the radar tower: its bar (the turning part) is its own mesh, below
    b.box([-26, 4.4, -8], [0.7, 8.8, 0.7], DARK)
    b.box([-26, 9, -8], [1.6, 0.6, 1.6], TONES.station)
    // a ring of lights round the landing pad, blinking in turn (the pad is at 28, 20 from the base)
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2
      ;(k % 2 ? flashA : flashB).box([28 + Math.cos(a) * 10.9, 0.5, 20 + Math.sin(a) * 10.9], [0.5, 0.5, 0.5], k % 4 < 2 ? BEACON : LIT)
    }
    // pipes between the tanks and out to the pad
    b.box([28.4, 0.5, 6], [10, 0.5, 0.5], DARK)
    b.box([28.4, 0.45, 8.6], [0.5, 0.5, 5.2], DARK)
    b.box([28.4, 1.1, 10.4], [1.6, 1.1, 1.6], TONES.station)

    // three tanks in a row, with pipes to the greenhouse
    for (let k = 0; k < 3; k++) {
      const x = 24 + k * 4.4
      b.lathe([[0, 1.5], [0.5, 2], [5, 2], [5.6, 1.5], [5.8, 0]], 10, TONES.station, [x, 0, 6])
    }
    b.box([18.5, 0.45, 8.5], [10, 0.5, 0.5], TONES.silhouette, -0.28)

    // a field of solar panels: tilted rows, facing the sun, on short legs
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        const cx = -39 + col * 6.2
        const cz = 20 + row * 5.2
        const lo = 1.1
        const hi = 3.4
        const pts = [
          [cx - 2.8, lo, cz + 2],
          [cx + 2.8, lo, cz + 2],
          [cx + 2.8, hi, cz - 1.4],
          [cx - 2.8, hi, cz - 1.4],
        ]
        b.quad(pts[0], pts[1], pts[2], pts[3], PANEL, [cx, -5, cz])
        b.box([cx, 1.1, cz - 0.2], [0.35, 2.2, 0.35], DARK)
      }
    }

    // cargo crates stacked beside the hub
    ;[[17, -7, 2.4, 0.2], [20.5, -6, 2, 0.5], [18.2, -10.5, 2.2, -0.2], [15, -11, 1.8, 0.6], [18.4, -7.2, 1.9, 0.4]].forEach(([x, z, s2, turn], k) => {
      const stacked = k === 4
      b.box([x, stacked ? 2.4 + 0.95 : s2 / 2, z], [s2, s2, s2], k % 2 ? CRATE_ALT : CRATE, turn)
    })

    // a rover parked at the start of the wheel ruts
    {
      const [rx, rz] = [7, 27]
      const turn = -0.35
      b.box([rx, 1.35, rz], [4.4, 1.1, 2.4], TONES.craft, turn)
      b.box([rx - Math.cos(turn) * 0.3, 2.3, rz + Math.sin(turn) * 0.3], [2, 0.9, 1.8], TONES.station, turn)
      for (const sx of [-1.6, 0, 1.6])
        for (const sz of [-1.35, 1.35]) {
          const px = rx + sx * Math.cos(turn) + sz * Math.sin(turn)
          const pz = rz - sx * Math.sin(turn) + sz * Math.cos(turn)
          b.box([px, 0.65, pz], [1.1, 1.1, 0.5], DARK, turn)
        }
      b.box([rx + 1.4 * Math.cos(turn), 3.6, rz - 1.4 * Math.sin(turn)], [0.15, 2.2, 0.15], DARK)
      b.box([rx - 1.6 * Math.cos(turn), 2.4, rz + 1.6 * Math.sin(turn)], [0.9, 1.3, 0.1], TONES.payload, turn)
    }

    // lamps round the perimeter road, except where the pad and the ruts cross it
    const hubX = 1
    const hubZ = 7
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2 + 0.2
      if (Math.abs(a - 0.45) < 0.55 || Math.abs(a - Math.PI / 2) < 0.2) continue
      const lx = hubX + Math.cos(a) * 32.8
      const lz = hubZ + Math.sin(a) * 32.8
      b.box([lx, 1.6, lz], [0.25, 3.2, 0.25], DARK)
      ;(k % 2 ? flashA : flashB).box([lx, 3.4, lz], [0.8, 0.6, 0.8], BEACON)
    }

    // loose rock scattered about the base
    for (let i = 0; i < 26; i++) {
      const a = rand() * Math.PI * 2
      const d = 16 + rand() * 24
      const x = hubX + Math.cos(a) * d
      const z = hubZ + Math.sin(a) * d
      if (DOMES.some(([dx, dz, r]) => Math.hypot(x - dx, z - dz) < r + 3) || Math.hypot(x - 28, z - 20) < 12) continue
      const s3 = 0.4 + rand() * 0.9
      b.rock([x, s3 * 0.4, z], s3, TONES.rock, { seed: 200 + i, squash: 0.65, turn: [rand() * 3, rand() * 3, 0] })
    }
    return { geometry: b.toGeometry(), halo: glow.toGeometry(), blinkA: flashA.toGeometry(), blinkB: flashB.toGeometry() }
  }, [])

  // Ground markings, in world coordinates: a perimeter road, a landing pad, wheel ruts out to
  // the astronaut's mountain, and the domes' shadows.
  const markings = useMemo(() => {
    const b = createBuilder()
    const [bx, , bz] = BASE
    const [px, pz] = LANDING_PAD
    const centre = [bx + 1, bz + 7]

    addPatch(b, centre[0], centre[1], () => 33.5, PALE, 0.14, { inner: 32, segments: 40 })
    for (const [x, z, r] of DOMES) addShadow(b, bx + x, bz + z, r * 0.9, r, SHADE, 0.18)

    // landing pad: a worn disc, a painted ring and a bullseye
    addPatch(b, px, pz, () => 10, WORN, 0.15, { segments: 24 })
    addPatch(b, px, pz, () => 10, PALE, 0.17, { inner: 8.8, segments: 24 })
    addPatch(b, px, pz, () => 5, PALE, 0.17, { inner: 4.2, segments: 20 })
    addPatch(b, px, pz, () => 1.4, PALE, 0.17, { segments: 10 })
    track(b, [[px - 9, pz - 3], [px - 12, pz - 7], [bx + 13, bz + 8]], 1.8, WORN)
    // paths worn between the buildings: hub to the tanks, greenhouse to the pad, tunnel to the solar field, hub to the pod
    track(b, [[bx + 12, bz + 3], [bx + 22, bz + 5], [bx + 26, bz + 8]], 1.2, WORN)
    track(b, [[bx - 21, bz + 16], [bx - 25, bz + 19], [bx - 29, bz + 23]], 1.2, WORN)
    track(b, [[bx - 11, bz + 1], [bx - 22, bz - 2], [bx - 28, bz - 3]], 1.2, WORN)
    track(b, [[bx + 7, bz + 15], [bx + 3, bz + 21], [bx - 1, bz + 27]], 1.2, WORN)

    // wheel ruts from the base out to the foot of the mountain
    const route = [
      [bx + 2, bz + 22],
      [bx + 1, bz + 34],
      [bx - 3, bz + 46],
      [bx - 8, bz + 57],
      [RIDGE[0] + 4, RIDGE[2] - 14],
      [RIDGE[0] + 1, RIDGE[2] - 9],
    ]
    for (const d of [-0.8, 0.8]) track(b, beside(route, d), 0.45, WORN)
    return b.toGeometry()
  }, [])

  const material = useMemo(() => createSceneMaterial({ fogNear: 400, fogFar: 3000 }), [])
  const glowMaterial = useMemo(
    () => new MeshBasicMaterial({ color: new Color(WARM[0], WARM[1], WARM[2]), transparent: true, opacity: 0.2, blending: AdditiveBlending, depthWrite: false }),
    [],
  )
  const lampsA = useRef(null)
  const lampsB = useRef(null)
  const windows = useRef(null)
  const radar = useRef(null)
  const radarBar = useMemo(() => {
    const b = createBuilder()
    b.box([0, 0, 0], [9, 2.4, 0.5], TONES.station)
    b.box([0, 1.5, 0], [0.4, 1.4, 0.4], DARK)
    b.box([4.4, 0, 0], [0.5, 1.6, 0.8], TONES.payload)
    return b.toGeometry()
  }, [])

  // the lamps round the base blink in turn, slowly; the windows breathe a little
  useFrame(() => {
    const t = shared.uTime.value
    if (lampsA.current) lampsA.current.visible = !motion.on || Math.sin(t * 1.5) > -0.2
    if (lampsB.current) lampsB.current.visible = !motion.on || Math.sin(t * 1.5 + Math.PI) > -0.2
    if (radar.current && motion.on) radar.current.rotation.y += 0.012
    if (windows.current) windows.current.material.opacity = motion.on ? 0.17 + 0.05 * Math.sin(t * 0.7) : 0.2
  })
  const decalMaterial = useMemo(() => createSceneMaterial({ fogNear: 2500, fogFar: 14000, doubleSided: true, decal: true }), [])
  return (
    <>
      <mesh geometry={geometry} material={material} position={BASE} />
      <mesh ref={windows} geometry={halo} material={glowMaterial} position={BASE} />
      <mesh ref={radar} geometry={radarBar} material={material} position={[BASE[0] - 26, 10.1, BASE[2] - 8]} />
      <mesh ref={lampsA} geometry={blinkA} material={material} position={BASE} />
      <mesh ref={lampsB} geometry={blinkB} material={material} position={BASE} />
      <mesh geometry={markings} material={decalMaterial} renderOrder={3} />
    </>
  )
}
