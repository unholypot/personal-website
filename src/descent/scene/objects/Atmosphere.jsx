import { useMemo } from 'react'
import { BackSide, ShaderMaterial, Vector3 } from 'three'
import { MOON } from '../layout.js'
import { PALETTE, mix, rgb } from '../palette.js'

// A thin shell, not a screen-wide glow. Opaque world geometry hides its far
// side, leaving only the sliver outside the moon's silhouette visible.
export default function Atmosphere() {
  const material = useMemo(() => new ShaderMaterial({
    side: BackSide,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uCenter: { value: new Vector3(...MOON.center) },
      uRadius: { value: MOON.radius },
      uTint: { value: new Vector3(...mix(rgb(PALETTE.teal), rgb(PALETTE.cream), 0.38)) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vWorld;
      void main() {
        vNormal = normalize(mat3(modelMatrix) * normal);
        vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * viewMatrix * vec4(vWorld, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uCenter;
      uniform float uRadius;
      uniform vec3 uTint;
      varying vec3 vNormal;
      varying vec3 vWorld;
      void main() {
        float altitude = length(cameraPosition - uCenter) - uRadius;
        float away = smoothstep(90.0, 500.0, altitude);
        float facing = abs(dot(normalize(vNormal), normalize(cameraPosition - vWorld)));
        float rim = pow(1.0 - facing, 3.0);
        float alpha = rim * away * 0.38;
        if (alpha < 0.004) discard;
        gl_FragColor = vec4(uTint, alpha);
      }
    `,
  }), [])
  return <mesh position={MOON.center} material={material}>
    <sphereGeometry args={[MOON.radius + 18, 96, 64]} />
  </mesh>
}
