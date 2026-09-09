import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { dampFactor, reducedMotion, springStep } from '../lib/motion'
import { atlasTile, createBallMaterial, disposeMaterial, useAtlases } from './materials'
import { playSound } from '../lib/sounds'
import { getPointer } from '../lib/pointer'

function facePatch(x: number, y: number, width: number, height: number) {
  const geometry = new THREE.PlaneGeometry(width, height, 12, 8)
  const positions = geometry.attributes.position
  for (let i = 0; i < positions.count; i++) {
    const px = positions.getX(i) + x
    const py = positions.getY(i) + y
    positions.setXYZ(i, px, py, Math.sqrt(0.25 - px * px - py * py) + 0.003)
  }
  geometry.computeVertexNormals()
  return geometry
}

export function BallsField({ pointer, width, depth }: {
  pointer: React.MutableRefObject<THREE.Vector3>
  width: number
  depth: number
}) {
  const atlases = useAtlases()
  const refs = useRef<(THREE.Group | null)[]>([])
  const faces = useRef<(THREE.Group | null)[]>([])
  const lastPointer = useRef({ x: 0, y: 0, active: false })
  const resources = useMemo(() => {
    const materials = Array.from({ length: 18 }, (_, i) => createBallMaterial(atlases, i))
    const eyes = [[0, 4], [1, 1], [1, 2], [5, 4]].map(([col, row]) =>
      new THREE.MeshBasicMaterial({ map: atlasTile(atlases[3], col, row, 7, 6, true), transparent: true, depthWrite: false, toneMapped: false, color: '#08060d' }))
    const mouths = [[4, 4], [4, 0], [2, 2]].map(([col, row]) =>
      new THREE.MeshBasicMaterial({ map: atlasTile(atlases[3], col, row, 7, 6, true), transparent: true, depthWrite: false, toneMapped: false, color: '#08060d' }))
    return { materials, eyes, mouths, sphere: new THREE.SphereGeometry(0.5, 40, 28), leftEye: facePatch(-0.14, 0.07, 0.13, 0.14), rightEye: facePatch(0.14, 0.07, 0.13, 0.14), mouth: facePatch(0, -0.11, 0.18, 0.10) }
  }, [atlases])
  useEffect(() => () => {
    resources.materials.forEach(disposeMaterial)
    ;[...resources.eyes, ...resources.mouths].forEach(m => { m.map?.dispose(); m.dispose() })
    resources.sphere.dispose()
    resources.leftEye.dispose()
    resources.rightEye.dispose()
    resources.mouth.dispose()
  }, [resources])

  const balls = useMemo(() => {
    let seed = 42
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
    const columns = Math.ceil(width / 0.85) + 3
    const rows = Math.ceil(depth / 0.8) + 3
    return Array.from({ length: columns * rows }, (_, i) => {
      const row = Math.floor(i / columns)
      const radius = 1.20 + random() * 0.12
      const x = ((i % columns) - (columns - 1) / 2) * 0.85 + (row % 2) * 0.34 + (random() - 0.5) * 0.10
      const y = 2 - row * 0.8 + (random() - 0.5) * 0.08
      // Three staggered depth layers keep overlapping silhouettes circular.
      const layer = ((i % columns) + 2 * (row % 2)) % 3
      const home = new THREE.Vector3(x, y, 1.6 + layer * 1.12)
      return { home, pos: home.clone(), velocity: new THREE.Vector3(), radius, seed: random() * 50, variant: i % 18, influence: 0 }
    })
  }, [width, depth])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const quiet = reducedMotion()
    const time = state.clock.elapsedTime
    const cursor = getPointer()
    const previous = lastPointer.current
    const speed = cursor.active && previous.active ? Math.hypot(cursor.screenX - previous.x, cursor.screenY - previous.y) / Math.max(dt, 0.001) : 0
    previous.x = cursor.screenX
    previous.y = cursor.screenY
    previous.active = cursor.active
    let bump = 0
    balls.forEach((ball, index) => {
      const group = refs.current[index]
      if (!group) return
      const dx = ball.home.x - pointer.current.x
      const dy = ball.home.y - pointer.current.y
      const distance = Math.hypot(dx, dy)
      const clearance = 1.1 + ball.radius * 0.5
      const influence = Math.max(0, 1 - distance / clearance)
      // Sound follows fresh displacement, never idle bobbing or scrolling.
      const pressure = (influence - ball.influence) / Math.max(dt, 0.001)
      if (speed > 35 && influence > 0.12 && pressure > 0.35) {
        bump = Math.max(bump, Math.min(1, pressure * 0.16) * Math.min(1, speed / 650))
      }
      ball.influence = influence
      const push = Math.max(0, clearance - distance)
      const directionX = distance > 0.01 ? dx / distance : Math.cos(ball.seed)
      const directionY = distance > 0.01 ? dy / distance : Math.sin(ball.seed)
      const targetX = ball.home.x + directionX * push
      const targetY = ball.home.y + directionY * push + (quiet ? 0 : Math.sin(time * 0.55 + ball.seed) * 0.02)
      for (const axis of ['x', 'y'] as const) {
        const next = springStep(ball.pos[axis], ball.velocity[axis], axis === 'x' ? targetX : targetY, 8, dt)
        ball.pos[axis] = quiet ? (axis === 'x' ? targetX : targetY) : next.position
        ball.velocity[axis] = quiet ? 0 : next.velocity
      }
      group.position.copy(ball.pos)
      // Roll in the camera plane: faces lean away without turning their backs.
      const face = faces.current[index]
      if (face) {
        const roll = quiet ? 0 : directionX * influence * 0.65 + THREE.MathUtils.clamp(-ball.velocity.x * 0.035, -0.16, 0.16)
        face.rotation.z += (roll - face.rotation.z) * dampFactor(7, dt)
      }
      group.scale.set(ball.radius * (1 + influence * 0.015), ball.radius * (1 - influence * 0.015), ball.radius)
    })
    if (bump > 0.04) playSound('bump', { intensity: 0.3 + bump * 0.7, pan: cursor.screenX / window.innerWidth * 2 - 1 })
  })

  return <group name="balls" dispose={null}>
    {balls.map((ball, i) => <group key={i} name={`ball-${i}`} ref={value => { refs.current[i] = value }} position={ball.home} scale={ball.radius}>
      <mesh geometry={resources.sphere} material={resources.materials[ball.variant]}
        onPointerOver={event => { event.stopPropagation() }}
        onPointerMove={event => { event.stopPropagation() }}
        onPointerDown={event => { event.stopPropagation() }} />
      <group name={`face-${i}`} ref={value => { faces.current[i] = value }}>
      <mesh geometry={resources.leftEye} material={resources.eyes[i % resources.eyes.length]} raycast={() => {}} />
      <mesh geometry={resources.rightEye} material={resources.eyes[i % resources.eyes.length]} raycast={() => {}} />
      <mesh geometry={resources.mouth} material={resources.mouths[i % resources.mouths.length]} raycast={() => {}} />
      </group>
    </group>)}
  </group>
}
