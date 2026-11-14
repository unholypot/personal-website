import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferGeometry, Euler, Float32BufferAttribute, Matrix4, Quaternion, ShaderMaterial, Vector3 } from 'three'
import { GIANT } from '../layout.js'
import { RING_SCALE, RING_OUTER_UNSCALED } from '../satelliteLayout.js'
import { PALETTE, mix, rgb } from '../palette.js'
import { LIGHT, createBuilder, rng } from '../build.js'
import { createSceneMaterial, motion, shared } from '../sceneMaterial.js'

// Ringlets from the inside out: [inner radius, outer radius, colour]. Broad bands, hair-thin
// ones and dark gaps between, so the system reads as many rings and not one flat disc.
const RINGLETS = [
  [1630, 1650, PALETTE.cream],
  [1675, 1700, PALETTE.mustard],
  [1740, 1955, PALETTE.mustard],
  [1970, 1990, PALETTE.orange],
  [2005, 2090, PALETTE.cream],
  [2140, 2215, PALETTE.mustard],
  [2222, 2236, PALETTE.cream],
  [2243, 2330, PALETTE.mustard],
  [2350, 2368, PALETTE.teal],
  [2395, 2445, PALETTE.mustard],
  [2500, 2512, PALETTE.cream],
  [2560, RING_OUTER_UNSCALED, PALETTE.mustard],
]

const SEGMENTS = 240

// How much larger the rings are drawn than the radii listed above. They are true circles;
// they look long and tapered because they are seen nearly edge-on (see GIANT.tilt).
const SIZE = RING_SCALE
const navy = rgb(PALETTE.navy)

// The ringed giant's rings, seen nearly edge-on, with the planet's own shadow falling across them.
export default function Rings() {
  const geometry = useMemo(() => {
    const b = createBuilder()
    const tilt = new Euler(...GIANT.tilt)
    const light = new Vector3(...LIGHT)
    const p = new Vector3()
    // Is this point of the ring plane in the planet's shadow? It is if the planet lies between
    // it and the light: behind the planet, and within the planet's width of the line through it.
    const shadowed = (x, z) => {
      p.set(x, 0, z).applyEuler(tilt)
      const along = p.dot(light)
      if (along > 0) return false
      return p.addScaledVector(light, -along).length() < GIANT.radius
    }
    const rand = rng(77)
    const cream = rgb(PALETTE.cream)
    for (const [innerEdge, outerEdge, color] of RINGLETS) {
      const base = rgb(color)
      const width = outerEdge - innerEdge
      for (let i = 0; i < SEGMENTS; i++) {
        // the band is not a clean stripe: each stretch is a little paler or darker, its edges wander,
        // and now and then a stretch is thin or missing, as in a ring made of clumps and gaps
        const tint = (rand() - 0.5) * 0.12
        const lit = mix(base, tint > 0 ? cream : navy, Math.abs(tint))
        const dim = mix(lit, navy, 0.62)
        const ragged = width > 60
        const inner = innerEdge + (ragged ? rand() * 0.05 * width : 0)
        const outer = outerEdge - (ragged ? rand() * 0.05 * width : 0)
        if (ragged && rand() < 0.01) continue
        const a0 = (i / SEGMENTS) * Math.PI * 2
        const a1 = ((i + 1) / SEGMENTS) * Math.PI * 2
        const mid = (a0 + a1) / 2
        const r = (inner + outer) / 2
        const at = (radius, a) => [Math.cos(a) * radius * SIZE, 0, Math.sin(a) * radius * SIZE]
        const centre = at(r, mid)
        b.flat([at(inner, a0), at(outer, a0), at(outer, a1), at(inner, a1)], [shadowed(centre[0], centre[2]) ? dim : lit])
      }
    }
    return b.toGeometry()
  }, [])
  // Never faded: the giant is always far away and must stay crisp.
  const material = useMemo(() => createSceneMaterial({ fogNear: 1e9, fogFar: 2e9, doubleSided: true }), [])
  return (
    <>
      <mesh geometry={geometry} material={material} position={GIANT.center} rotation={GIANT.tilt} />
      <RingDebris />
    </>
  )
}

// What the rings are really made of: countless chunks of ice and rock, each its own little body, all
// circling the planet, the inner ones quicker. They are drawn as small flat squares in the ring colours,
// scattered through the bands (thickest in the broad ones, hardly any in the gaps), with a little thickness
// to the sheet and a slow ripple through it. They are small and only a shade off their band's colour. The planet's shadow darkens the ones it falls on.
const DEBRIS = 6500

function debrisGeometry() {
  const rand = rng(1313)
  // thin ringlets get more than their share of chunks, or the broad bands would bury them
  const weight = ([a, b]) => Math.sqrt(b - a) * 6
  const total = RINGLETS.reduce((sum, band) => sum + weight(band), 0)
  const radius = []
  const angle = []
  const lift = []
  const size = []
  const color = []
  const cream = rgb(PALETTE.cream)
  for (let i = 0; i < DEBRIS; i++) {
    let r
    if (rand() < 0.015) {
      // a few stray chunks out in the gaps and round the edges
      r = RINGLETS[0][0] - 60 + rand() * (RING_OUTER_UNSCALED - RINGLETS[0][0] + 120)
    } else {
      let pick = rand() * total
      for (const band of RINGLETS) {
        if (pick < weight(band)) {
          r = band[0] + ((band[1] - band[0]) * pick) / weight(band)
          break
        }
        pick -= weight(band)
      }
    }
    const band = RINGLETS.find(([a, b]) => r >= a && r <= b)
    const base = rgb(band ? band[2] : PALETTE.cream)
    // chunks clump: thinner scatter where a ripple's trough is
    const ripple = 0.5 + 0.5 * Math.sin(r * 0.045)
    if (rand() > 0.55 + 0.45 * ripple) {
      i--
      continue
    }
    const a = rand() * Math.PI * 2
    radius.push(r * SIZE)
    angle.push(a)
    // thickness: a sheet a few tens of units deep, bending in a slow wave round the ring
    lift.push((rand() + rand() + rand() - 1.5) * 18 + Math.sin(a * 3 + r * 0.01) * 6)
    size.push(rand() < 0.02 ? 12 + rand() * 8 : 4 + rand() * 4)
    // each chunk only a shade lighter or darker than its band, so they read as texture in the band
    const shade = 0.9 + rand() * 0.2
    const tint = rand() < 0.04 ? mix(base, cream, 0.35) : base
    color.push(tint[0] * shade, tint[1] * shade, tint[2] * shade)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(new Float32Array(DEBRIS * 3), 3))
  g.setAttribute('aRadius', new Float32BufferAttribute(radius, 1))
  g.setAttribute('aAngle', new Float32BufferAttribute(angle, 1))
  g.setAttribute('aLift', new Float32BufferAttribute(lift, 1))
  g.setAttribute('aSize', new Float32BufferAttribute(size, 1))
  g.setAttribute('color', new Float32BufferAttribute(color, 3))
  return g
}

const DEBRIS_VERT = /* glsl */ `
uniform float uTime;
uniform float uPx;
uniform float uDpr;
uniform mat4 uRingMatrix;
uniform vec3 uCentre;
uniform vec3 uLight;
uniform float uPlanet;
attribute float aRadius;
attribute float aAngle;
attribute float aLift;
attribute float aSize;
attribute vec3 color;
varying vec3 vColor;
void main() {
  // each chunk's own orbit: nearer in is quicker (as with real orbits, period grows with distance)
  float turn = aAngle + uTime * 0.016 * pow(2400.0 / aRadius, 1.5);
  vec3 local = vec3(cos(turn) * aRadius, aLift, sin(turn) * aRadius);
  vec4 world = uRingMatrix * vec4(local, 1.0);
  // in the planet's shadow? behind the planet from the sun and within its width of the line through it
  vec3 rel = world.xyz - uCentre;
  float along = dot(rel, uLight);
  float inShadow = (along < 0.0 && length(rel - uLight * along) < uPlanet) ? 1.0 : 0.0;
  vColor = color * mix(1.0, 0.28, inShadow);
  vec4 view = viewMatrix * world;
  gl_Position = projectionMatrix * view;
  gl_PointSize = clamp(aSize * uPx / max(1.0, -view.z), 1.0 * uDpr, 2.6 * uDpr);
}
`

// flat colour, no grain: the picture's own grain lies over the whole frame already
const DEBRIS_FRAG = /* glsl */ `
varying vec3 vColor;
void main() {
  gl_FragColor = vec4(vColor, 1.0);
}
`

function RingDebris() {
  const points = useRef(null)
  const geometry = useMemo(() => debrisGeometry(), [])
  const material = useMemo(() => {
    const m = new Matrix4().compose(new Vector3(...GIANT.center), new Quaternion().setFromEuler(new Euler(...GIANT.tilt)), new Vector3(1, 1, 1))
    return new ShaderMaterial({
      vertexShader: DEBRIS_VERT,
      fragmentShader: DEBRIS_FRAG,
      uniforms: {
        uTime: shared.uTime,
        uPx: shared.uPx,
        uDpr: shared.uDpr,
        uRingMatrix: { value: m },
        uCentre: { value: new Vector3(...GIANT.center) },
        uLight: { value: new Vector3(...LIGHT) },
        uPlanet: { value: GIANT.radius },
      },
    })
  }, [])
  // nothing to update each frame: the clock in `shared` turns the whole ring (and stands still for reduced motion)
  useFrame(() => {
    if (points.current && !motion.on) points.current.visible = true
  })
  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} />
}
