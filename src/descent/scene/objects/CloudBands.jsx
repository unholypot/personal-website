import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferGeometry, Float32BufferAttribute, ShaderMaterial, Vector3 } from 'three'
import { MOON } from '../layout.js'
import { CLOUD_SPIN_SECONDS, CLOUD_TILT, cloudBanks, cloudSpin } from '../clouds.js'
import { PALETTE, mix, rgb } from '../palette.js'
import { LIGHT, rng } from '../build.js'
import { GRAIN_GLSL, motion, shared } from '../sceneMaterial.js'

const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const unit = (v) => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / l, v[1] / l, v[2] / l]
}

// Two directions along the ground at a place on the moon, square to each other and to "up".
const tangentBasis = (up) => {
  const reference = Math.abs(up[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]
  const e1 = unit(cross(up, reference))
  return [e1, cross(up, e1)]
}

// The six faces of a box about the origin, as [normal, four corners], in units of half its size.
const FACES = [
  [[0, 1, 0], [[-1, 1, -1], [-1, 1, 1], [1, 1, 1], [1, 1, -1]]],
  [[0, -1, 0], [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]]],
  [[1, 0, 0], [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]]],
  [[-1, 0, 0], [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]]],
  [[0, 0, 1], [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]],
  [[0, 0, -1], [[-1, -1, -1], [-1, 1, -1], [1, 1, -1], [1, -1, -1]]],
]

// Clouds in the same blocky language as the rest of the scene: each is a short stack of
// slabs, every slab a whole number of blocks long and one block tall, stepping in toward
// the top like a cloud cut from squared paper. Each stands square to the ground beneath it.
function cloudGeometry() {
  const rand = rng(51)
  const positions = []
  const normals = []

  // One slab, given in a cloud's own frame (along it, up, across it).
  const slab = (frame, centre, size) => {
    const { origin, along, up, across } = frame
    const place = (p) => [
      origin[0] + along[0] * p[0] + up[0] * p[1] + across[0] * p[2],
      origin[1] + along[1] * p[0] + up[1] * p[1] + across[1] * p[2],
      origin[2] + along[2] * p[0] + up[2] * p[1] + across[2] * p[2],
    ]
    for (const [n, corners] of FACES) {
      const normal = [
        along[0] * n[0] + up[0] * n[1] + across[0] * n[2],
        along[1] * n[0] + up[1] * n[1] + across[1] * n[2],
        along[2] * n[0] + up[2] * n[1] + across[2] * n[2],
      ]
      const [a, b, c, d] = corners.map((k) => place([centre[0] + (k[0] * size[0]) / 2, centre[1] + (k[1] * size[1]) / 2, centre[2] + (k[2] * size[2]) / 2]))
      for (const p of [a, b, c, a, c, d]) {
        positions.push(p[0], p[1], p[2])
        normals.push(normal[0], normal[1], normal[2])
      }
    }
  }

  // Everything here is in the moon's own frame, about its centre with y up its spin axis; the
  // component below sets that frame in the world and turns it.
  for (const bank of cloudBanks()) {
    const shell = MOON.radius + bank.altitude
    const block = bank.radius * 0.065 // every measurement of this bank's clouds is a whole number of these
    const [e1, e2] = tangentBasis(bank.direction)
    for (let i = 0; i < 6; i++) {
      const a = rand() * Math.PI * 2
      const spread = i === 0 ? 0 : Math.sqrt(rand()) * bank.radius * 0.8
      // slide along the sphere, so the bank follows the moon's curve
      const dx = Math.cos(a) * spread
      const dz = Math.sin(a) * spread * 0.65
      const up = unit([0, 1, 2].map((k) => bank.direction[k] + (e1[k] * dx + e2[k] * dz) / shell))
      const origin = up.map((v) => v * (shell + (rand() - 0.5) * 22))
      // the cloud's own frame: up is straight out from the moon, and it lies along the bank's heading
      const [f1, f2] = tangentBasis(up)
      const flat = [0, 1, 2].map((k) => Math.cos(bank.heading) * f1[k] + Math.sin(bank.heading) * f2[k])
      const frame = { origin, along: flat, up, across: cross(flat, up) }

      // the stack: a long base, then shorter slabs stepping in, each shifted a block or two
      let length = 6 + Math.floor(rand() * 7)
      let depth = 3 + Math.floor(rand() * 3)
      let shift = 0
      const layers = 3 + (rand() < 0.5 ? 1 : 0)
      for (let k = 0; k < layers && length >= 1; k++) {
        slab(frame, [shift * block, (k + 0.5) * block, 0], [length * block, block, depth * block])
        const trim = 1 + Math.floor(rand() * 2)
        shift += (rand() < 0.5 ? -1 : 1) * (trim - 1 + (rand() < 0.5 ? 0.5 : 0))
        length -= trim * 2 - (rand() < 0.4 ? 1 : 0)
        depth = Math.max(1, depth - 1)
      }
      // now and then a stray block trailing off one end
      if (rand() < 0.5) {
        const side = rand() < 0.5 ? -1 : 1
        slab(frame, [side * (5.5 + rand() * 3) * block, 0.5 * block, (rand() - 0.5) * block], [(1 + Math.floor(rand() * 2)) * block, block, block])
      }
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3))
  geometry.computeBoundingSphere()
  return geometry
}

function cloudMaterial() {
  const cream = rgb(PALETTE.cream)
  const teal = rgb(PALETTE.teal)
  return new ShaderMaterial({
    uniforms: {
      uSky: shared.uSky,
      uTime: shared.uTime,
      uDpr: shared.uDpr,
      uGone: { value: 0 }, // 0 whole, 1 gone: the clouds dissolve away as the descent ends, leaving the sky clear
      uLit: { value: new Vector3(...cream) },
      uMid: { value: new Vector3(...mix(cream, teal, 0.24)) },
      uShade: { value: new Vector3(...mix(cream, teal, 0.52)) },
      uGlint: { value: new Vector3(...mix(cream, rgb(PALETTE.mustard), 0.2)) }, // the lit tops pick up the sun's warmth
      uDeep: { value: new Vector3(...mix(teal, rgb(PALETTE.navy), 0.45)) }, // the undersides, in the moon's cool bounce
      uLightDir: { value: new Vector3(...LIGHT) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vWorld;
      void main() {
        vec4 view = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(mat3(modelMatrix) * normal);
        vView = -view.xyz;
        vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * view;
      }
    `,
    fragmentShader: /* glsl */ `
      ${GRAIN_GLSL}
      uniform vec3 uSky;
      uniform vec3 uLit;
      uniform vec3 uMid;
      uniform vec3 uShade;
      uniform float uGone;
      uniform vec3 uGlint;
      uniform vec3 uDeep;
      uniform vec3 uLightDir;
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vWorld;
      void main() {
        // A cloud the camera flies right up to breaks into flecks at the lens instead of slicing through it.
        float nearFade = smoothstep(8.0, 65.0, length(vView));
        if (hash(floor(gl_FragCoord.xy / uDpr)) > nearFade) discard;
        if (hash(floor(gl_FragCoord.xy / uDpr) + 31.0) < uGone) discard;
        // Three flat tones, face by face: tops bright, sides toward the light paler, sides away shaded.
        vec3 n = normalize(vNormal);
        float facing = dot(n, uLightDir);
        vec3 color = facing > 0.6 ? uLit : facing > 0.1 ? uMid : uShade;
        // faces turned square to the sun blaze warm; faces turned away drop to a deep cool tone
        if (facing > 0.9) color = uGlint;
        if (facing < -0.35) color = uDeep;
        // and a bright rim where an edge turns away from us, as light catches the lip of a slab
        float rim = 1.0 - abs(dot(n, normalize(vView)));
        color = mix(color, vec3(1.0, 0.97, 0.9), smoothstep(0.78, 0.96, rim) * smoothstep(-0.2, 0.5, facing) * 0.6);
        float fog = smoothstep(900.0, 6500.0, distance(vWorld, cameraPosition));
        color = mix(color, uSky, fog * 0.65);
        gl_FragColor = vec4(grain(color), 1.0);
      }
    `,
  })
}

// Low blocky cloud over the whole moon. The shell of cloud turns slowly about the moon's spin
// axis, independent of scrolling, so the weather drifts right across the globe over a few
// minutes. Rotation keeps every bank at its height above the moon.
export default function CloudBands({ progress }) {
  const drift = useRef(null)
  const geometry = useMemo(() => cloudGeometry(), [])
  const material = useMemo(() => cloudMaterial(), [])

  useFrame((_, delta) => {
    if (drift.current) {
      const t = Math.min(1, Math.max(0, (progress.current - 0.84) / 0.12))
      drift.current.material.uniforms.uGone.value = t * t * (3 - 2 * t)
    }
    if (!drift.current || !motion.on) return
    // Cap elapsed time so returning to a backgrounded tab never causes a jump.
    drift.current.rotation.y = (drift.current.rotation.y + (Math.min(delta, 0.1) * Math.PI * 2) / CLOUD_SPIN_SECONDS) % (Math.PI * 2)
    cloudSpin.angle = drift.current.rotation.y
  })

  return (
    <group position={MOON.center} rotation={CLOUD_TILT}>
      <mesh ref={drift} geometry={geometry} material={material} frustumCulled={false} />
    </group>
  )
}
