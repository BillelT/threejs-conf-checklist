import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

type Ball = {
  home: THREE.Vector3
  pos: THREE.Vector3
  vel: THREE.Vector3
  scale: number
  seed: number
  variant: number
}

// Threejs.paris palette: soft violets with the occasional cream ball.
const PURPLES = [
  '#8f78ff',
  '#a087ff',
  '#7d63ff',
  '#b5a4ff',
  '#9b82ff',
  '#c9baff',
  '#6f56e6',
  '#d3c7ff'
]
const CREAMS = ['#f6f0dc', '#f2ebd5', '#ecdfbf', '#fbf3d8']

// The mesh axis whose direction we align with "where the face should look".
// Sphere UV (0.5, 0.5) — where we paint the face — lies at the +X side of
// three.js SphereGeometry, so we align local +X with the camera direction.
const FACE_AXIS = new THREE.Vector3(1, 0, 0)
const CAMERA_Z = 8

function seededRand(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function makeBallTexture(seed: number): THREE.CanvasTexture {
  const rnd = seededRand(seed)
  const size = 512
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const ctx = c.getContext('2d')!

  const isCream = rnd() < 0.18
  const base = isCream
    ? CREAMS[Math.floor(rnd() * CREAMS.length)]
    : PURPLES[Math.floor(rnd() * PURPLES.length)]

  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)

  // Face — painted at UV(0.5, 0.5) → sphere's +X side (looking at camera).
  const fx = size * 0.5
  const fy = size * 0.5
  const eyeGap = size * 0.075
  const eyeR = size * (0.028 + rnd() * 0.006)

  ctx.fillStyle = '#0f0a18'

  // Eyes — occasionally a happier variant (heart) but mostly clean dots to
  // match the reference, which reads as a tight vector illustration.
  const style = rnd()
  if (style < 0.08) {
    const heart = (hx: number, hy: number, s: number) => {
      ctx.save()
      ctx.translate(hx, hy)
      ctx.beginPath()
      ctx.moveTo(0, s * 0.55)
      ctx.bezierCurveTo(s * 1.3, -s * 0.35, s * 0.6, -s * 1.4, 0, -s * 0.4)
      ctx.bezierCurveTo(-s * 0.6, -s * 1.4, -s * 1.3, -s * 0.35, 0, s * 0.55)
      ctx.fill()
      ctx.restore()
    }
    heart(fx - eyeGap, fy, size * 0.032)
    heart(fx + eyeGap, fy, size * 0.032)
  } else {
    // Rounded oval eyes — slightly taller than wide reads friendlier.
    const drawEye = (ex: number, ey: number) => {
      ctx.beginPath()
      ctx.ellipse(ex, ey, eyeR * 0.82, eyeR * 1.05, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    drawEye(fx - eyeGap, fy)
    drawEye(fx + eyeGap, fy)
    // tiny catchlights
    ctx.fillStyle = '#ffffff'
    const cl = eyeR * 0.28
    ctx.beginPath()
    ctx.arc(fx - eyeGap + eyeR * 0.28, fy - eyeR * 0.35, cl, 0, Math.PI * 2)
    ctx.arc(fx + eyeGap + eyeR * 0.28, fy - eyeR * 0.35, cl, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#0f0a18'
  }

  // Mouth — small, quiet.
  ctx.strokeStyle = '#0f0a18'
  ctx.lineCap = 'round'
  ctx.lineWidth = size * 0.012
  ctx.beginPath()
  const mw = size * 0.04
  const my = fy + size * 0.07
  const smile = rnd()
  if (smile < 0.5) {
    ctx.moveTo(fx - mw, my)
    ctx.quadraticCurveTo(fx, my + size * 0.022, fx + mw, my)
  } else if (smile < 0.85) {
    ctx.moveTo(fx - mw * 0.7, my)
    ctx.lineTo(fx + mw * 0.7, my)
  } else {
    // small "o"
    ctx.arc(fx, my, size * 0.015, 0, Math.PI * 2)
  }
  ctx.stroke()

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  tex.needsUpdate = true
  return tex
}

export function BallsField({
  count = 160,
  bounds = { x: 9, y: 3.2, z: 1.8 },
  yOffset = -0.3,
  pointer
}: {
  count?: number
  bounds?: { x: number; y: number; z: number }
  yOffset?: number
  pointer: React.MutableRefObject<THREE.Vector3>
}) {
  const meshesRef = useRef<(THREE.Mesh | null)[]>([])
  const { viewport } = useThree()

  const textures = useMemo(
    () => Array.from({ length: 20 }, (_, i) => makeBallTexture(1000 + i * 137)),
    []
  )

  // Soft plastic look — matte with a slight highlight. MeshStandardMaterial
  // is portable across GPUs (some headless/software drivers choke on
  // PhysicalMaterial's sheen shader).
  const materials = useMemo(
    () =>
      textures.map(
        (t) =>
          new THREE.MeshStandardMaterial({
            map: t,
            roughness: 0.5,
            metalness: 0.05,
            envMapIntensity: 0.4
          })
      ),
    [textures]
  )
  const geometry = useMemo(() => new THREE.SphereGeometry(0.5, 40, 32), [])

  const balls = useMemo<Ball[]>(() => {
    const rnd = seededRand(42)
    const list: Ball[] = []
    const cols = Math.ceil(Math.sqrt(count * (bounds.x / bounds.y)))
    const rows = Math.ceil(count / cols)
    let idx = 0
    for (let r = 0; r < rows && idx < count; r++) {
      for (let cc = 0; cc < cols && idx < count; cc++) {
        const gx = (cc / Math.max(1, cols - 1)) * 2 - 1
        const gy = (r / Math.max(1, rows - 1)) * 2 - 1
        const x = gx * bounds.x + (rnd() - 0.5) * (bounds.x / cols) * 1.6
        const y = yOffset + gy * bounds.y + (rnd() - 0.5) * (bounds.y / rows) * 1.6
        const z = (rnd() * 2 - 1) * bounds.z
        list.push({
          home: new THREE.Vector3(x, y, z),
          pos: new THREE.Vector3(x, y, z),
          vel: new THREE.Vector3(),
          scale: 0.42 + rnd() * 0.85,
          seed: rnd() * 1000,
          variant: Math.floor(rnd() * textures.length)
        })
        idx++
      }
    }
    return list
  }, [count, bounds.x, bounds.y, bounds.z, yOffset, textures.length])

  const targetDir = useMemo(() => new THREE.Vector3(), [])
  const targetQuat = useMemo(() => new THREE.Quaternion(), [])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30)
    const time = state.clock.elapsedTime
    const p = pointer.current
    const w = viewport.width
    const responsive = Math.max(0.7, Math.min(1.3, w / 12))

    // Spec-faithful parameters:
    //   velocity += (target - position) * spring
    //   velocity *= damping
    //   position += velocity
    // Combined with a local pointer force with radial falloff.
    const spring = 5.5
    const damping = 0.82
    const interactionRadius = 2.2 * responsive
    const pointerStrength = 1.6

    balls.forEach((b, i) => {
      // Spring toward home (target position).
      b.vel.x += (b.home.x - b.pos.x) * spring * dt
      b.vel.y += (b.home.y - b.pos.y) * spring * dt
      b.vel.z += (b.home.z - b.pos.z) * spring * dt

      // Idle drift — very small so it doesn't muddy the pointer response.
      b.vel.x += Math.sin(time * 0.5 + b.seed) * 0.0018
      b.vel.y += Math.cos(time * 0.6 + b.seed * 1.3) * 0.0018

      // Local repulsion (planar, matches the DOM shape force model).
      const dx = b.pos.x - p.x
      const dy = b.pos.y - p.y
      const d = Math.hypot(dx, dy)
      if (d < interactionRadius && d > 0.001) {
        const falloff = 1 - d / interactionRadius
        const force = falloff * falloff * pointerStrength
        b.vel.x += (dx / d) * force
        b.vel.y += (dy / d) * force
      }

      // Damping and integration.
      b.vel.multiplyScalar(damping)
      b.pos.x += b.vel.x * dt * 60
      b.pos.y += b.vel.y * dt * 60
      b.pos.z += b.vel.z * dt * 60

      const m = meshesRef.current[i]
      if (!m) return

      m.position.copy(b.pos)

      // Parallax rotation — face slides across the surface, drifting AWAY
      // from the pointer with a soft falloff so distant balls stay looking
      // at the camera.
      const pdx = b.pos.x - p.x
      const pdy = b.pos.y - p.y
      const pd = Math.hypot(pdx, pdy)
      const parallaxRange = 5.5
      const parallaxFalloff = pd < parallaxRange ? 1 - pd / parallaxRange : 0
      const parallaxStrength = 3.2 * parallaxFalloff
      const nx = pd > 0.001 ? pdx / pd : 0
      const ny = pd > 0.001 ? pdy / pd : 0

      const swayX = Math.sin(time * 0.55 + b.seed) * 0.24
      const swayY = Math.cos(time * 0.48 + b.seed * 1.3) * 0.2

      const tx = nx * parallaxStrength + swayX
      const ty = ny * parallaxStrength + swayY
      const tz = CAMERA_Z

      const vx = tx - b.pos.x
      const vy = ty - b.pos.y
      const vz = tz - b.pos.z
      const vlen = Math.hypot(vx, vy, vz) || 1
      targetDir.set(vx / vlen, vy / vlen, vz / vlen)

      targetQuat.setFromUnitVectors(FACE_AXIS, targetDir)
      m.quaternion.slerp(targetQuat, 1 - Math.exp(-8 * dt))

      const pulse = 1 + Math.sin(time * 1.3 + b.seed) * 0.018
      m.scale.setScalar(b.scale * pulse)
    })
  })

  const noRaycast = useMemo(() => () => null as unknown as void, [])

  return (
    <group>
      {balls.map((b, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshesRef.current[i] = el
          }}
          geometry={geometry}
          material={materials[b.variant]}
          raycast={noRaycast as unknown as THREE.Mesh['raycast']}
        />
      ))}
    </group>
  )
}
