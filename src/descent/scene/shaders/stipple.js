// Poster shading for round bodies: two flat colours, and a terminator that dissolves into dots.
import { ShaderMaterial, Vector3 } from 'three'
import { GRAIN_GLSL, shared } from '../sceneMaterial.js'
import { LIGHT } from '../build.js'
import { rgb } from '../palette.js'

const VERT = /* glsl */ `
varying vec3 vNormal;
void main() {
  vNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const FRAG = /* glsl */ `
${GRAIN_GLSL}
uniform vec3 uLit;
uniform vec3 uShadow;
uniform vec3 uLight;
uniform float uCell;
varying vec3 vNormal;
void main() {
  float facing = dot(normalize(vNormal), uLight);
  float lit = smoothstep(-0.35, 0.35, facing);
  float dotHash = hash(floor(gl_FragCoord.xy / (uCell * uDpr)) + 17.0);
  vec3 c = lit > dotHash ? uLit : uShadow;
  gl_FragColor = vec4(grain(c), 1.0);
}
`

// `light` is the direction the light comes from; it defaults to the scene's own.
export function createStippleMaterial({ lit, shadow, cell = 3, light = LIGHT }) {
  return new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uTime: shared.uTime,
      uDpr: shared.uDpr,
      uLit: { value: new Vector3(...rgb(lit)) },
      uShadow: { value: new Vector3(...rgb(shadow)) },
      uLight: { value: new Vector3(...light).normalize() },
      uCell: { value: cell },
    },
  })
}
