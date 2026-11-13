import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, ShaderMaterial, Vector3 } from 'three'
import { rng } from '../build.js'
import { PALETTE, rgb } from '../palette.js'
import { shared } from '../sceneMaterial.js'

const CREAM = new Vector3(...rgb(PALETTE.cream))

// Near dust: points that live in a box which wraps around the camera, so the air is equally
// full wherever the camera goes. Each one sways a little, twinkles, and fades near the box edge.
const DUST_VERT = /* glsl */ `
uniform float uTime;
uniform float uPx;
attribute float aSeed;
varying float vAlpha;
const vec3 BOX = vec3(600.0, 400.0, 600.0);
void main() {
  float s = aSeed;
  vec3 home = position * BOX;
  home.x += sin(uTime * (0.10 + s * 0.15) + s * 31.0) * 4.0;
  home.y += cos(uTime * (0.08 + s * 0.12) + s * 47.0) * 3.0;
  vec3 rel = mod(home - cameraPosition + BOX * 0.5, BOX) - BOX * 0.5;
  vec3 edge = abs(rel) / (BOX * 0.5);
  float inside = 1.0 - smoothstep(0.72, 1.0, max(edge.x, max(edge.y, edge.z)));
  float twinkle = 0.55 + 0.45 * sin(uTime * (0.6 + s * 1.5) + s * 60.0);
  vAlpha = inside * twinkle * smoothstep(6.0, 30.0, length(rel));
  vec4 mv = viewMatrix * vec4(cameraPosition + rel, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp((0.5 + fract(s * 13.0)) * uPx / -mv.z, 1.5, 10.0);
}
`

// Far stars: fixed directions on a huge shell that travels with the camera.
const STAR_VERT = /* glsl */ `
uniform float uTime;
uniform float uDpr;
attribute float aSeed;
varying float vAlpha;
void main() {
  vAlpha = 0.5 + 0.5 * sin(uTime * (0.3 + aSeed) + aSeed * 90.0);
  vec4 mv = viewMatrix * vec4(cameraPosition + position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_Position.z = gl_Position.w * 0.99999; // behind every planet
  gl_PointSize = (1.2 + 2.2 * fract(aSeed * 7.0)) * uDpr;
}
`

const POINT_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uStrength;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = (1.0 - smoothstep(0.25, 1.0, d)) * vAlpha * uStrength;
  gl_FragColor = vec4(uColor, a);
}
`

function points(count, seed, place) {
  const rand = rng(seed)
  const pos = []
  const seeds = []
  for (let i = 0; i < count; i++) {
    pos.push(...place(rand))
    seeds.push(rand())
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('aSeed', new Float32BufferAttribute(seeds, 1))
  return g
}

const material = (vertexShader, strength) =>
  new ShaderMaterial({
    vertexShader,
    fragmentShader: POINT_FRAG,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uTime: shared.uTime,
      uPx: shared.uPx,
      uDpr: shared.uDpr,
      uColor: { value: CREAM },
      uStrength: { value: strength },
    },
  })

export default function Starfield({ progress }) {
  const stars = useRef(null)
  const dust = useMemo(() => {
    const count = window.innerWidth < 700 ? 350 : 700
    return { geometry: points(count, 11, (r) => [r(), r(), r()]), material: material(DUST_VERT, 0.8) }
  }, [])
  const far = useMemo(() => {
    const geometry = points(420, 23, (r) => {
      // even spread over a sphere of radius 9000
      const y = r() * 2 - 1
      const a = r() * Math.PI * 2
      const k = Math.sqrt(1 - y * y)
      return [Math.cos(a) * k * 9000, y * 9000, Math.sin(a) * k * 9000]
    })
    return { geometry, material: material(STAR_VERT, 1) }
  }, [])

  useFrame(() => {
    // Stars thin out as the sky brightens near the ground, but never vanish.
    const p = progress.current
    const t = Math.min(1, Math.max(0, (p - 0.5) / 0.3))
    if (stars.current) stars.current.material.uniforms.uStrength.value = 1 - 0.55 * t
  })

  return (
    <>
      <points ref={stars} geometry={far.geometry} material={far.material} frustumCulled={false} renderOrder={-2} />
      <points geometry={dust.geometry} material={dust.material} frustumCulled={false} />
    </>
  )
}
