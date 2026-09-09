import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

type Ball = {
  home: THREE.Vector3
  pos: THREE.Vector3
  vel: THREE.Vector3
  scale: number
  color: THREE.Color
  seed: number
}

const PALETTE = ['#7d63ff', '#ff6ab8', '#ffd94a', '#a8dcff', '#ff9a5a', '#b6f0c8', '#f6f0dc']

function seededRand(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

export function BallsField({
  count = 44,
  bounds = { x: 8, y: 3.2, z: 1.2 },
  yOffset = -1.3,
  pointer
}: {
  count?: number
  bounds?: { x: number; y: number; z: number }
  yOffset?: number
  pointer: React.MutableRefObject<THREE.Vector3>
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const { viewport } = useThree()

  const balls = useMemo<Ball[]>(() => {
    const rnd = seededRand(42)
    const list: Ball[] = []
    for (let i = 0; i < count; i++) {
      const x = (rnd() * 2 - 1) * bounds.x
      const y = yOffset + (rnd() * 2 - 1) * bounds.y
      const z = (rnd() * 2 - 1) * bounds.z
      const home = new THREE.Vector3(x, y, z)
      list.push({
        home,
        pos: home.clone(),
        vel: new THREE.Vector3(),
        scale: 0.35 + rnd() * 0.55,
        color: new THREE.Color(PALETTE[Math.floor(rnd() * PALETTE.length)]),
        seed: rnd() * 1000
      })
    }
    return list
  }, [count, bounds.x, bounds.y, bounds.z, yOffset])

  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30)
    const time = state.clock.elapsedTime
    const p = pointer.current
    const w = viewport.width
    const responsive = Math.max(0.6, Math.min(1.3, w / 12))

    balls.forEach((b, i) => {
      // spring to home
      tmp.copy(b.home).sub(b.pos).multiplyScalar(5.5 * dt)
      b.vel.add(tmp)

      // gentle idle drift
      b.vel.x += Math.sin(time * 0.6 + b.seed) * 0.002
      b.vel.y += Math.cos(time * 0.7 + b.seed * 1.3) * 0.002

      // pointer repulsion
      tmp.copy(b.pos).sub(p)
      const d = tmp.length()
      const R = 1.8 * responsive
      if (d < R && d > 0.001) {
        const force = (1 - d / R) * 0.75
        tmp.normalize().multiplyScalar(force)
        b.vel.add(tmp)
      }

      b.vel.multiplyScalar(0.86)
      b.pos.add(b.vel.clone().multiplyScalar(dt * 60))

      const spin = time * 0.4 + b.seed
      dummy.position.copy(b.pos)
      dummy.rotation.set(spin * 0.5, spin, 0)
      const pulse = 1 + Math.sin(time * 1.5 + b.seed) * 0.03
      dummy.scale.setScalar(b.scale * pulse)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
      meshRef.current.setColorAt(i, b.color)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.5, 24, 24]} />
      <meshStandardMaterial roughness={0.28} metalness={0.05} />
    </instancedMesh>
  )
}
