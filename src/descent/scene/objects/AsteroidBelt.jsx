import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, ShaderMaterial, Vector3 } from 'three'
import { BELT, beltDust, beltRocks } from '../belt.js'
import { createBuilder, rng } from '../build.js'
import { PALETTE, mix, rgb } from '../palette.js'
import { createSceneMaterial, motion, shared } from '../sceneMaterial.js'

// Warm where the light catches them, rusty in between, and cool in shadow, so they stand out
// against both the navy of space and the teal of the lower sky.
const ROCK_TONES = [mix(rgb(PALETTE.cream), rgb(PALETTE.mustard), 0.35), mix(rgb(PALETTE.orange), rgb(PALETTE.navy), 0.4), mix(rgb(PALETTE.teal), rgb(PALETTE.navy), 0.6)]
const DUST_COLOR = new Vector3(...mix(rgb(PALETTE.cream), rgb(PALETTE.mustard), 0.3))

const SECONDS_PER_TURN = 420

// Each grain is a soft round dot, a little bigger when it is nearer, that thins away with the belt.
const DUST_VERT = /* glsl */ `
uniform float uDpr;
attribute float aSize;
void main() {
  vec4 view = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * view;
  gl_PointSize = aSize * uDpr * clamp(4200.0 / -view.z, 0.7, 2.6);
}
`
const DUST_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uFade;
void main() {
  float a = (1.0 - smoothstep(0.35, 1.0, length(gl_PointCoord - 0.5) * 2.0)) * 0.55 * uFade;
  if (a < 0.01) discard;
  gl_FragColor = vec4(uColor, a);
}
`

function dustGeometry() {
  const rand = rng(31)
  const positions = beltDust()
  const sizes = new Float32Array(positions.length / 3).map(() => 1.2 + rand() * 1.8)
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(positions, 3))
  g.setAttribute('aSize', new Float32BufferAttribute(sizes, 1))
  return g
}

// A thin ring of rubble round the moon, lying in the moon's equator and tipped across the sky: a
// sheet of fine dust with a scatter of rocks in it and one clear gap, drifting slowly round. It is
// far enough from the flight path that the camera never goes near it (see belt.test.js). It belongs
// to the space half of the journey: it thins away in a screen of dots between the clouds and the
// ground, so the landing view stays clear.
export default function AsteroidBelt({ progress }) {
  const drift = useRef(null)
  const rocks = useRef(null)
  const dust = useRef(null)
  const geometry = useMemo(() => {
    const b = createBuilder()
    for (const { position, radius, seed, squash, turn } of beltRocks()) b.rock(position, radius, ROCK_TONES, { seed, squash, turn })
    return b.toGeometry()
  }, [])
  const grains = useMemo(() => dustGeometry(), [])
  const material = useMemo(() => createSceneMaterial({ fogNear: 6000, fogFar: 22000 }), [])
  const dustMaterial = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: DUST_VERT,
        fragmentShader: DUST_FRAG,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: { uDpr: shared.uDpr, uColor: { value: DUST_COLOR }, uFade: { value: 1 } },
      }),
    [],
  )

  useFrame((_, delta) => {
    if (!drift.current || !rocks.current || !dust.current) return
    if (motion.on) drift.current.rotation.y += (Math.min(delta, 0.1) * Math.PI * 2) / SECONDS_PER_TURN
    const t = Math.min(1, Math.max(0, (progress.current - 0.45) / 0.17))
    const fade = 1 - t * t * (3 - 2 * t)
    rocks.current.material.uniforms.uFade.value = fade
    dust.current.material.uniforms.uFade.value = fade
    drift.current.visible = fade > 0
  })

  return (
    <group position={BELT.centre} rotation={BELT.tilt}>
      <group ref={drift}>
        <mesh ref={rocks} geometry={geometry} material={material} frustumCulled={false} />
        <points ref={dust} geometry={grains} material={dustMaterial} frustumCulled={false} />
      </group>
    </group>
  )
}
