import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferGeometry, DoubleSide, Float32BufferAttribute, ShaderMaterial } from 'three'
import { pathPoint, pathTangent } from '../layout.js'
import { PALETTE, rgb } from '../palette.js'
import { GRAIN_GLSL, shared } from '../sceneMaterial.js'
import { TRAIL_OFF_END, craftT, trailReeled } from '../craftFlight.js'

const SEGMENTS = 240
const STRIPES = [PALETTE.orange, PALETTE.cream, PALETTE.teal]

// Half the ribbon's width at path position t: broad out in space, narrow by the ground.
const halfWidth = (t) => 1 + 14 * (1 - t) * (1 - t)

// The ribbon is built from its centre line outward: every vertex carries the centre point, the direction of flight,
// which of the four edges it is on (-1 to 1 across) and the half-width there. The shader then turns the band to face the
// camera, so it shows its whole width however the line runs, and never goes thin when seen along its flat side.
const EDGES = [-1, -1 / 3, 1 / 3, 1]

function build() {
  const pos = []
  const col = []
  const along = []
  const tangent = []
  const side = []
  const half = []
  const rows = []
  for (let i = 0; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS
    rows.push({ c: pathPoint(t), tan: pathTangent(t), w: halfWidth(t) })
  }
  for (let i = 0; i < SEGMENTS; i++) {
    for (let s = 0; s < 3; s++) {
      const color = rgb(STRIPES[s])
      const quad = [
        [i, s],
        [i, s + 1],
        [i + 1, s + 1],
        [i, s],
        [i + 1, s + 1],
        [i + 1, s],
      ]
      for (const [row, edge] of quad) {
        const r = rows[row]
        pos.push(r.c[0], r.c[1], r.c[2])
        tangent.push(r.tan[0], r.tan[1], r.tan[2])
        side.push(EDGES[edge])
        half.push(r.w)
        col.push(color[0], color[1], color[2])
        along.push(row / SEGMENTS)
      }
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new Float32BufferAttribute(col, 3))
  g.setAttribute('aAlong', new Float32BufferAttribute(along, 1))
  g.setAttribute('aTangent', new Float32BufferAttribute(tangent, 3))
  g.setAttribute('aSide', new Float32BufferAttribute(side, 1))
  g.setAttribute('aHalf', new Float32BufferAttribute(half, 1))
  return g
}

const VERT = /* glsl */ `
attribute float aAlong;
attribute vec3 aTangent;
attribute float aSide;
attribute float aHalf;
varying float vAlong;
varying vec3 vColor;
void main() {
  vAlong = aAlong;
  vColor = color;
  // across the band, square to both the flight line and the line of sight
  vec3 across = cross(aTangent, cameraPosition - position);
  float len = length(across);
  across = len > 1e-4 ? across / len : vec3(1.0, 0.0, 0.0);
  gl_Position = projectionMatrix * viewMatrix * vec4(position + across * aSide * aHalf, 1.0);
}
`

// The two ends melt rather than cut: the very start thins out into dots, and once the craft has turned away the
// whole ribbon dissolves from its tail forward, cell by cell, in the same dither the clouds and the rocks use.
const FRAG = /* glsl */ `
${GRAIN_GLSL}
uniform float uReveal;
uniform float uMelt;
varying float vAlong;
varying vec3 vColor;
void main() {
  if (vAlong > uReveal) discard;
  float cell = hash(floor(gl_FragCoord.xy / (3.0 * uDpr)));
  if (cell > smoothstep(0.0, 0.07, vAlong)) discard;
  float n = vAlong / max(uReveal, 0.001);
  float melted = clamp((uMelt * 1.4 - n) / 0.4, 0.0, 1.0);
  if (cell < melted) discard;
  gl_FragColor = vec4(grain(vColor), 1.0);
}
`

// The striped trail the craft leaves, drawn only as far as the craft has flown, and reeled back in after the thesis shot.
export default function TrailRibbon({ progress }) {
  const geometry = useMemo(() => build(), [])
  const reveal = useMemo(() => ({ value: 0 }), [])
  const melt = useMemo(() => ({ value: 0 }), [])
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        vertexColors: true,
        side: DoubleSide,
        uniforms: { uTime: shared.uTime, uDpr: shared.uDpr, uReveal: reveal, uMelt: melt },
      }),
    [reveal, melt],
  )

  const mesh = useRef(null)

  useFrame(() => {
    // drawn as far as the craft has flown, then melted away from its tail once the thesis shot is over
    const head = Math.min(craftT(progress.current), craftT(TRAIL_OFF_END))
    if (!mesh.current) return
    const uniforms = mesh.current.material.uniforms
    uniforms.uReveal.value = head
    uniforms.uMelt.value = trailReeled(progress.current)
  })

  return <mesh ref={mesh} geometry={geometry} material={material} frustumCulled={false} />
}
