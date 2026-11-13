// Poster shading for round bodies: two flat colours, and a terminator that dissolves into dots.
import { ShaderMaterial, Vector3, Vector4 } from 'three'
import { GRAIN_GLSL, shared } from '../sceneMaterial.js'
import { LIGHT } from '../build.js'
import { rgb } from '../palette.js'

const VERT = /* glsl */ `
varying vec3 vNormal;
varying vec3 vLocalNormal;
void main() {
  vLocalNormal = normal;
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
uniform float uSpread;
uniform float uLift;
uniform float uMid;
uniform float uMidEdge;
uniform vec3 uGlowDir;
uniform vec3 uGlow;
uniform float uGlowAmt;
uniform vec3 uStripe;
uniform vec3 uAxis;
uniform float uStriped;
uniform float uCratered;
uniform vec4 uCraters[12];
varying vec3 vNormal;
varying vec3 vLocalNormal;
void main() {
  vec3 n = normalize(vNormal);
  float facing = dot(n, uLight);
  float lit = smoothstep(-uSpread, uSpread, facing + uLift);
  float dotHash = hash(floor(gl_FragCoord.xy / (uCell * uDpr)) + 17.0);
  // stripes round the body, by latitude about its axis: a few broad ones with wavering edges
  float lat = dot(n, uAxis);
  float wave = sin(lat * 11.0 + sin(lat * 31.0) * 0.5);
  vec3 face = mix(uLit, uStripe, uStriped * step(0.45, wave));
  if (uCratered > 0.5) {
    vec3 local = normalize(vLocalNormal);
    for (int i = 0; i < 12; i++) {
      float d = distance(local, uCraters[i].xyz) / uCraters[i].w;
      float bowl = 1.0 - smoothstep(0.64, 0.84, d);
      float rim = smoothstep(0.76, 0.88, d) * (1.0 - smoothstep(0.98, 1.12, d));
      // Broad ink shapes remain readable when the moon is only a few pixels wide.
      face = mix(face, mix(uLit, uShadow, 0.48), bowl);
      face = mix(face, mix(uLit, vec3(1.0), 0.22), rim * 0.8);
    }
  }
  // a middle tone for ground that leans away from the light, so relief reads even on the lit side
  if (uMid > 0.0) {
    float top = smoothstep(uMidEdge - 0.1, uMidEdge + 0.1, facing);
    face = top > dotHash ? face : mix(face, uShadow, uMid);
  }
  // light thrown back from a bright neighbour (the giant planet) on ground the sun does not reach,
  // in two flat bands so it stays poster-like
  vec3 dark = uShadow;
  if (uGlowAmt > 0.0) {
    float g = dot(n, uGlowDir);
    dark = mix(uShadow, uGlow, uGlowAmt * (step(-0.25, g) * 0.16 + step(0.1, g) * 0.14));
  }
  vec3 c = lit > dotHash ? face : dark;
  gl_FragColor = vec4(grain(c), 1.0);
}
`

// `light` is the direction the light comes from; it defaults to the scene's own.
// `stripe` (a colour) and `axis` give the body bands round it, like a gas giant's.
// `spread` is how wide the band of dots between light and shadow is: smaller is a crisper edge.
// `mid` (0 to 1) adds a middle tone, that far toward the shadow colour, on ground facing less than
// `midEdge` toward the light; it is what lets a faceted body show its relief.
// `glow` is { direction, color }: light reflected onto the unlit side from that direction.
// `lift` slides that band toward the dark side, so more of the body stays in the light.
export function createStippleMaterial({ lit, shadow, cell = 3, light = LIGHT, stripe = null, axis = [0, 1, 0], spread = 0.35, lift = 0, mid = 0, midEdge = 0.4, glow = null, cratered = false }) {
  // Fixed surface-space locations: the markings rotate with the body, never the screen.
  const craters = Array.from({ length: 12 }, (_, i) => {
    const y = 1 - 2 * (i + 0.5) / 12
    const a = i * 2.39996323
    const r = Math.sqrt(1 - y * y)
    return new Vector4(Math.cos(a) * r, y, Math.sin(a) * r, 0.16 + (i % 4) * 0.045)
  })
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
      uSpread: { value: spread },
      uLift: { value: lift },
      uMid: { value: mid },
      uMidEdge: { value: midEdge },
      uGlowDir: { value: new Vector3(...(glow ? glow.direction : [0, 1, 0])).normalize() },
      uGlow: { value: new Vector3(...rgb(glow ? glow.color : shadow)) },
      uGlowAmt: { value: glow ? 1 : 0 },
      uStripe: { value: new Vector3(...rgb(stripe || lit)) },
      uAxis: { value: new Vector3(...axis).normalize() },
      uStriped: { value: stripe ? 1 : 0 },
      uCratered: { value: cratered ? 1 : 0 },
      uCraters: { value: craters },
    },
  })
}
