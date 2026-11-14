// Shared drawing for everything painted on the far sky. Each thing is a list of directions
// with a colour, a brightness and a size; it travels with the camera so it never gets nearer,
// and it is always drawn behind the planets and the moon.
import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, ShaderMaterial, Vector3 } from 'three'
import { shared } from './sceneMaterial.js'

const VERT = /* glsl */ `
uniform float uDpr;
uniform float uScale;
uniform float uTime;
uniform float uTwinkle;
uniform vec3 uShift;
attribute vec3 color;
attribute float aAlpha;
attribute float aSize;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vColor = color;
  // every star shimmers at its own rate and phase, worked out from where it is
  float h = fract(sin(dot(position, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
  vAlpha = aAlpha * (1.0 + uTwinkle * sin(uTime * (1.2 + h * 2.6) + h * 40.0));
  // uShift slides the whole set a little across the sky, so sets at different depths drift against each other
  gl_Position = projectionMatrix * viewMatrix * vec4(cameraPosition + (position + uShift) * 8800.0, 1.0);
  gl_Position.z = gl_Position.w * 0.99999;
  gl_PointSize = aSize * uDpr * uScale;
}
`

const FRAG = /* glsl */ `
uniform float uStrength;
uniform float uRound;
varying vec3 vColor;
varying float vAlpha;
void main() {
  float a = vAlpha * uStrength;
  if (uRound > 0.5) a *= 1.0 - smoothstep(0.5, 1.0, length(gl_PointCoord - 0.5) * 2.0);
  if (a < 0.004) discard;
  gl_FragColor = vec4(vColor, a);
}
`

// Round points when `round` is true (stars); otherwise flat (lines and tails).
// `uStrength` scales the brightness and `uScale` the size of points; `uTwinkle` (0 to 1) is how much
// each star shimmers, and `uShift` (a direction offset) moves the set to give it its own parallax.
export const backdropMaterial = (round) =>
  new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uDpr: shared.uDpr,
      uTime: shared.uTime,
      uScale: { value: 1 },
      uStrength: { value: 1 },
      uRound: { value: round ? 1 : 0 },
      uTwinkle: { value: 0 },
      uShift: { value: new Vector3() },
    },
  })

// Gathers directions (with colour, brightness and size) into one geometry.
export function collect() {
  const position = []
  const color = []
  const alpha = []
  const size = []
  return {
    add(p, c, a, s = 1) {
      position.push(p[0], p[1], p[2])
      color.push(c[0], c[1], c[2])
      alpha.push(a)
      size.push(s)
    },
    geometry() {
      const g = new BufferGeometry()
      g.setAttribute('position', new Float32BufferAttribute(position, 3))
      g.setAttribute('color', new Float32BufferAttribute(color, 3))
      g.setAttribute('aAlpha', new Float32BufferAttribute(alpha, 1))
      g.setAttribute('aSize', new Float32BufferAttribute(size, 1))
      return g
    },
  }
}
