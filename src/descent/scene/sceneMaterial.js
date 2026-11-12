// The shared look of everything built from flat faces: vertex colours, a fade toward the sky
// with distance, and grain that is part of the picture.
import { ShaderMaterial, Vector3, DoubleSide } from 'three'

// One set of uniform objects, referenced by every material, so a single update per frame reaches all.
export const shared = {
  uSky: { value: new Vector3(0.078, 0.129, 0.239) },
  uTime: { value: 0 },
}

// Blocky grain, a faint scanline on every third row, and one slow band drifting up the screen.
export const GRAIN_GLSL = /* glsl */ `
uniform float uTime;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec3 grain(vec3 c) {
  vec2 x = gl_FragCoord.xy;
  c += (hash(floor(x / 1.5)) - 0.5) * 0.04;
  if (mod(floor(x.y), 3.0) == 2.0) c *= 0.95;
  c += 0.03 * smoothstep(0.94, 1.0, fract(x.y * 0.0009 - uTime * 0.05));
  return c;
}
`

const VERT = /* glsl */ `
uniform vec3 uSky;
uniform float uFogNear;
uniform float uFogFar;
varying vec3 vColor;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  float fade = smoothstep(uFogNear, uFogFar, distance(world.xyz, cameraPosition)) * 0.85;
  vColor = mix(color, uSky, fade);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

const FRAG = /* glsl */ `
${GRAIN_GLSL}
varying vec3 vColor;
void main() {
  gl_FragColor = vec4(grain(vColor), 1.0);
}
`

export function createSceneMaterial({ fogNear = 200, fogFar = 2500, doubleSided = false } = {}) {
  return new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    vertexColors: true,
    side: doubleSided ? DoubleSide : undefined,
    uniforms: {
      uSky: shared.uSky,
      uTime: shared.uTime,
      uFogNear: { value: fogNear },
      uFogFar: { value: fogFar },
    },
  })
}
