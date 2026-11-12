import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferGeometry, DoubleSide, Float32BufferAttribute, ShaderMaterial } from 'three'
import { pathPoint, pathTangent } from '../layout.js'
import { PALETTE, rgb } from '../palette.js'
import { GRAIN_GLSL, shared } from '../sceneMaterial.js'
import { CRAFT_LEAD } from './Craft.jsx'

const SEGMENTS = 240
const STRIPES = [PALETTE.orange, PALETTE.cream, PALETTE.teal]
const reveal = { value: 0 }

// Half the ribbon's width at path position t: broad out in space, narrow by the ground.
const halfWidth = (t) => 1 + 14 * (1 - t) * (1 - t)

function build() {
  const pos = []
  const col = []
  const along = []
  const rows = []
  for (let i = 0; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS
    const c = pathPoint(t)
    const [tx, , tz] = pathTangent(t)
    // level direction across the path
    const len = Math.hypot(tz, tx) || 1
    const side = [-tz / len, 0, tx / len]
    const w = halfWidth(t)
    rows.push([-1, -1 / 3, 1 / 3, 1].map((k) => [c[0] + side[0] * w * k, c[1], c[2] + side[2] * w * k]))
  }
  for (let i = 0; i < SEGMENTS; i++) {
    for (let s = 0; s < 3; s++) {
      const color = rgb(STRIPES[s])
      const quad = [
        [rows[i][s], i],
        [rows[i][s + 1], i],
        [rows[i + 1][s + 1], i + 1],
        [rows[i][s], i],
        [rows[i + 1][s + 1], i + 1],
        [rows[i + 1][s], i + 1],
      ]
      for (const [p, row] of quad) {
        pos.push(p[0], p[1], p[2])
        col.push(color[0], color[1], color[2])
        along.push(row / SEGMENTS)
      }
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new Float32BufferAttribute(col, 3))
  g.setAttribute('aAlong', new Float32BufferAttribute(along, 1))
  return g
}

const VERT = /* glsl */ `
attribute float aAlong;
varying float vAlong;
varying vec3 vColor;
void main() {
  vAlong = aAlong;
  vColor = color;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const FRAG = /* glsl */ `
${GRAIN_GLSL}
uniform float uReveal;
varying float vAlong;
varying vec3 vColor;
void main() {
  if (vAlong > uReveal) discard;
  gl_FragColor = vec4(grain(vColor), 1.0);
}
`

// The striped trail the craft leaves, drawn only as far as the craft has flown.
export default function TrailRibbon({ progress }) {
  const geometry = useMemo(() => build(), [])
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        vertexColors: true,
        side: DoubleSide,
        uniforms: { uTime: shared.uTime, uDpr: shared.uDpr, uReveal: reveal },
      }),
    [],
  )

  useFrame(() => {
    reveal.value = Math.min(1, progress.current + CRAFT_LEAD)
  })

  return <mesh geometry={geometry} material={material} frustumCulled={false} />
}
