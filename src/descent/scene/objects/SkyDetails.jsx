import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, ShaderMaterial, Vector3 } from 'three'
import { rng } from '../build.js'
import { PALETTE, rgb } from '../palette.js'
import { motion, shared } from '../sceneMaterial.js'
import { createStippleMaterial } from '../shaders/stipple.js'

const CREAM = new Vector3(...rgb(PALETTE.cream))

// ---------- Shooting stars ----------
// Each streak lives on the screen itself, behind everything in the scene. It waits most of
// its cycle, then crosses a stretch of sky in under a second: bright at the head, fading
// along the tail. Where and which way it goes changes every time it comes round.
const STREAKS = 5

const STREAK_VERT = /* glsl */ `
uniform float uTime;
uniform float uAspect;
attribute float aSeed;
attribute vec2 aCorner; // x: 0 at the tail, 1 at the head; y: -1 or 1 across
varying float vAlong;
varying float vLife;
float rnd(float n) { return fract(sin(n * 91.7 + 13.1) * 43758.5453); }
void main() {
  float period = 5.0 + aSeed * 7.0;
  float clock = uTime + aSeed * 40.0;
  float turn = floor(clock / period);
  float age = (clock - turn * period) / 0.85; // 0..1 while it is crossing
  float key = turn * 3.7 + aSeed * 57.0;
  vec2 from = vec2(mix(-0.85, 0.85, rnd(key)), mix(0.05, 0.92, rnd(key + 1.0)));
  float heading = mix(-2.6, -0.55, rnd(key + 2.0)); // always falling, to the left or the right
  vec2 way = vec2(cos(heading), sin(heading));
  float travel = 0.5 + 0.35 * rnd(key + 3.0);
  float tail = 0.16;
  float head = age * travel;
  vec2 at = from + way * (head - tail * (1.0 - aCorner.x));
  vec2 across = vec2(-way.y, way.x) * aCorner.y * 0.0035 * mix(0.25, 1.0, aCorner.x);
  // way is in screen proportions, so undo the aspect on x
  vec2 ndc = vec2((at.x * uAspect + across.x) / uAspect, at.y + across.y);
  vAlong = aCorner.x;
  vLife = age < 1.0 ? sin(age * 3.14159) : 0.0;
  gl_Position = vec4(ndc, 0.99999, 1.0);
}
`

const STREAK_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uStrength;
varying float vAlong;
varying float vLife;
void main() {
  float a = vAlong * vAlong * vLife * uStrength;
  if (a < 0.003) discard;
  gl_FragColor = vec4(uColor, a);
}
`

function streakGeometry() {
  const rand = rng(8)
  const corners = []
  const seeds = []
  const positions = []
  const quad = [[0, -1], [1, -1], [1, 1], [0, -1], [1, 1], [0, 1]]
  for (let i = 0; i < STREAKS; i++) {
    const seed = rand()
    for (const c of quad) {
      corners.push(c[0], c[1])
      seeds.push(seed)
      positions.push(0, 0, 0)
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(positions, 3))
  g.setAttribute('aCorner', new Float32BufferAttribute(corners, 2))
  g.setAttribute('aSeed', new Float32BufferAttribute(seeds, 1))
  return g
}

// ---------- Sparkles ----------
// A handful of bright stars drawn as four-pointed glints, far off in fixed directions.
const SPARK_VERT = /* glsl */ `
uniform float uTime;
uniform float uDpr;
attribute float aSeed;
varying float vPulse;
void main() {
  vPulse = 0.55 + 0.45 * sin(uTime * (0.5 + aSeed * 1.3) + aSeed * 70.0);
  vec4 mv = viewMatrix * vec4(cameraPosition + position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_Position.z = gl_Position.w * 0.99999; // behind every planet
  gl_PointSize = (14.0 + 16.0 * fract(aSeed * 9.0)) * uDpr * (0.7 + 0.3 * vPulse);
}
`

const SPARK_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uStrength;
varying float vPulse;
void main() {
  vec2 p = (gl_PointCoord - 0.5) * 2.0;
  vec2 q = abs(p);
  // two thin crossed rays and a small hot centre
  float rays = max(0.0, 1.0 - q.x * 9.0) * (1.0 - q.y) + max(0.0, 1.0 - q.y * 9.0) * (1.0 - q.x);
  float core = max(0.0, 1.0 - length(p) * 4.0);
  float a = clamp(rays * 0.8 + core, 0.0, 1.0) * vPulse * uStrength;
  if (a < 0.01) discard;
  gl_FragColor = vec4(uColor, a);
}
`

function sparkGeometry() {
  const rand = rng(19)
  const positions = []
  const seeds = []
  for (let i = 0; i < 46; i++) {
    // spread over the whole sky, a little below the level of the eye as well as above
    const y = -0.35 + rand() * 1.25
    const a = rand() * Math.PI * 2
    const k = Math.sqrt(1 - y * y)
    positions.push(Math.cos(a) * k * 9000, y * 9000, Math.sin(a) * k * 9000)
    seeds.push(rand())
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(positions, 3))
  g.setAttribute('aSeed', new Float32BufferAttribute(seeds, 1))
  return g
}

const additive = (vertexShader, fragmentShader) =>
  new ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uTime: shared.uTime,
      uDpr: shared.uDpr,
      uAspect: shared.uAspect,
      uColor: { value: CREAM },
      uStrength: { value: 1 },
    },
  })

// A small far-off world, to give the empty side of the sky something to rest on.
const FAR_WORLD = { position: [2300, 3400, -9000], radius: 340 }

// Things in the deep sky: shooting stars, glinting stars and a distant little planet.
export default function SkyDetails({ progress }) {
  const streaks = useRef(null)
  const sparks = useRef(null)
  const streak = useMemo(() => ({ geometry: streakGeometry(), material: additive(STREAK_VERT, STREAK_FRAG) }), [])
  const spark = useMemo(() => ({ geometry: sparkGeometry(), material: additive(SPARK_VERT, SPARK_FRAG) }), [])
  const world = useMemo(() => createStippleMaterial({ lit: PALETTE.teal, shadow: PALETTE.navy, cell: 3, spread: 0.22, lift: 0.1 }), [])

  useFrame(() => {
    // Brightest in open space; fainter once the sky pales near the ground. Shooting stars rest under reduced motion.
    const t = Math.min(1, Math.max(0, (progress.current - 0.5) / 0.3))
    if (streaks.current) streaks.current.material.uniforms.uStrength.value = motion.on ? 1 - 0.5 * t : 0
    if (sparks.current) sparks.current.material.uniforms.uStrength.value = 1 - 0.45 * t
  })

  return (
    <>
      <mesh ref={streaks} geometry={streak.geometry} material={streak.material} frustumCulled={false} renderOrder={-3} />
      <points ref={sparks} geometry={spark.geometry} material={spark.material} frustumCulled={false} renderOrder={-2} />
      <mesh material={world} position={FAR_WORLD.position}>
        <sphereGeometry args={[FAR_WORLD.radius, 32, 20]} />
      </mesh>
    </>
  )
}
