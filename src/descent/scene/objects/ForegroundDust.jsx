import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferGeometry, Float32BufferAttribute, ShaderMaterial, Vector2 } from 'three'
import { rng } from '../build.js'
import { pointer } from '../../scroll/parallax.js'
import { motion, shared } from '../sceneMaterial.js'

const COUNT = 30

const VERT = /* glsl */ `
uniform float uTime;
uniform float uDpr;
uniform vec2 uPointer;
uniform float uStrength;
attribute vec4 aSeed; // x, y: where it starts (0 to 1); z: how near it is (0 far, 1 near); w: a phase
varying float vAlpha;
varying float vSoft;
void main() {
  float near = aSeed.z;
  // drift slowly up and to the left, the nearer ones faster, wrapping round the screen
  vec2 p = fract(aSeed.xy + vec2(-0.0035, 0.0055) * uTime * (0.25 + near));
  vec2 clip = p * 2.4 - 1.2 + uPointer * (0.03 + 0.09 * near);
  gl_Position = vec4(clip, 0.0, 1.0);
  gl_PointSize = (3.0 + 11.0 * near) * uDpr;
  float twinkle = 0.75 + 0.25 * sin(uTime * (0.4 + aSeed.w) + aSeed.w * 20.0);
  vAlpha = (0.09 + 0.17 * near) * twinkle * uStrength;
  vSoft = near;
}
`

const FRAG = /* glsl */ `
varying float vAlpha;
varying float vSoft;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  // near specks are out of focus: wide and soft; far ones are small and sharper
  float a = 1.0 - smoothstep(mix(0.5, 0.0, vSoft), 1.0, d);
  if (a * vAlpha < 0.004) discard;
  gl_FragColor = vec4(0.95, 0.9, 0.81, a * vAlpha);
}
`

// A few soft specks of drifting dust in front of everything, out of focus, that slide a little with
// the pointer: the nearest thing to the lens, which gives the rest of the scene somewhere to be
// behind. They are only in space; they thin out as the descent reaches the air.
export default function ForegroundDust({ progress }) {
  const { geometry, material } = useMemo(() => {
    const rand = rng(404)
    const seeds = []
    for (let i = 0; i < COUNT; i++) seeds.push(rand(), rand(), Math.pow(rand(), 1.6), rand() * 3)
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(new Float32Array(COUNT * 3), 3))
    g.setAttribute('aSeed', new Float32BufferAttribute(seeds, 4))
    const m = new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: { uTime: shared.uTime, uDpr: shared.uDpr, uPointer: { value: new Vector2() }, uStrength: { value: 1 } },
    })
    return { geometry: g, material: m }
  }, [])

  const points = useRef(null)

  useFrame(() => {
    if (!points.current) return
    const u = points.current.material.uniforms
    const t = Math.min(1, Math.max(0, (progress.current - 0.02) / 0.2))
    u.uStrength.value = motion.on ? 1 - t : 0
    u.uPointer.value.set(pointer.x, -pointer.y)
  })

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} renderOrder={20} />
}
