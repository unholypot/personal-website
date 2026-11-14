import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, DoubleSide, Euler, Matrix4, MeshBasicMaterial, PlaneGeometry, Vector3 } from 'three'
import { MOON } from '../layout.js'
import { LIGHT } from '../build.js'
import { SHADE } from '../palette.js'
import { PLAIN_RADIUS, groundAt } from '../ground.js'
import { CLOUD_TILT, cloudLobes, cloudSpin, shadowPoint } from '../clouds.js'

const REACH = 1250 // shadows beyond this far from the landing site are on the curve out of sight

// The shadow every cloud throws on the moon: flat, square-cornered patches (cut from the same
// squared paper as the clouds) laid on the ground under and away from each, on the side opposite the
// sun. They turn with the weather, so they slide across the surface as the clouds drift overhead.
export default function CloudShadows() {
  const mesh = useRef(null)
  const lobes = useMemo(() => cloudLobes(), [])
  const geometry = useMemo(() => new PlaneGeometry(1, 1).rotateX(-Math.PI / 2), [])
  const material = useMemo(
    () =>
      new MeshBasicMaterial({
        color: new Color(SHADE[0], SHADE[1], SHADE[2]),
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
        side: DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
    [],
  )
  const scratch = useMemo(
    () => ({
      tilt: new Matrix4().makeRotationFromEuler(new Euler(...CLOUD_TILT)),
      spin: new Matrix4(),
      turn: new Matrix4(),
      up: new Vector3(),
      right: new Vector3(),
      fore: new Vector3(),
      at: new Vector3(),
      m: new Matrix4(),
    }),
    [],
  )

  useFrame(() => {
    const target = mesh.current
    if (!target) return
    const { tilt, spin, turn, up, right, fore, at, m } = scratch
    turn.copy(tilt).multiply(spin.makeRotationY(cloudSpin.angle))
    lobes.forEach((lobe, i) => {
      const shell = MOON.radius + lobe.altitude
      at.set(lobe.direction[0] * shell, lobe.direction[1] * shell, lobe.direction[2] * shell).applyMatrix4(turn)
      const p = [at.x + MOON.center[0], at.y + MOON.center[1], at.z + MOON.center[2]]
      const q = shadowPoint(p, LIGHT, MOON.center, MOON.radius)
      const r = q ? Math.hypot(q[0], q[2]) : Infinity
      if (!q || r > REACH || q[1] < MOON.center[1] + MOON.radius - 400) {
        m.makeScale(0, 0, 0)
        target.setMatrixAt(i, m)
        return
      }
      // flat on the plain; on the curve beyond it, square to the ground there
      if (r < PLAIN_RADIUS) up.set(0, 1, 0)
      else up.set(q[0] - MOON.center[0], q[1] - MOON.center[1], q[2] - MOON.center[2]).normalize()
      right.set(Math.cos(lobe.heading), 0, Math.sin(lobe.heading))
      right.addScaledVector(up, -right.dot(up)).normalize()
      fore.crossVectors(right, up)
      m.makeBasis(right.multiplyScalar(lobe.width), up, fore.multiplyScalar(lobe.depth))
      m.setPosition(q[0], groundAt(q[0], q[2]) + (r < PLAIN_RADIUS ? 0.5 : 1.1), q[2])
      target.setMatrixAt(i, m)
    })
    target.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={mesh} args={[geometry, material, lobes.length]} frustumCulled={false} renderOrder={4} />
}

