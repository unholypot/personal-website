// Shared drawing for everything painted on the far sky. Each thing is a list of directions
// with a colour, a brightness and a size; it travels with the camera so it never gets nearer,
// and it is always drawn behind the planets and the moon.
import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, ShaderMaterial } from 'three'
import { shared } from './sceneMaterial.js'

const VERT = /* glsl */ `
uniform float uDpr;
uniform float uScale;
attribute vec3 color;
attribute float aAlpha;
attribute float aSize;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vColor = color;
  vAlpha = aAlpha;
  gl_Position = projectionMatrix * viewMatrix * vec4(cameraPosition + position * 8800.0, 1.0);
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
// `uStrength` scales the brightness and `uScale` the size of points.
export const backdropMaterial = (round) =>
  new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { uDpr: shared.uDpr, uScale: { value: 1 }, uStrength: { value: 1 }, uRound: { value: round ? 1 : 0 } },
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
