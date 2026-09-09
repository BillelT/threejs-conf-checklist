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

const PURPLES = ['#7d63ff', '#8a6fff', '#a087ff', '#b8a8ff', '#c9baff', '#6f56e6', '#9b82ff']
const YELLOWS = ['#f5e6a8', '#ecd97a', '#f7eeb8', '#e8dca3', '#fff2b8', '#ead46a']

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
  const size = 256
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const ctx = c.getContext('2d')!

  const yellowBase = rnd() < 0.22
  const base = yellowBase
    ? YELLOWS[Math.floor(rnd() * YELLOWS.length)]
    : PURPLES[Math.floor(rnd() * PURPLES.length)]
  const accent = yellowBase
    ? PURPLES[Math.floor(rnd() * PURPLES.length)]
    : YELLOWS[Math.floor(rnd() * YELLOWS.length)]

  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)

  // Accent patch — kept off the face side so it reads as a "second color"
  // on the ball's flank when the ball tilts.
  const onLeftFlank = rnd() < 0.5
  const patchCX = onLeftFlank
    ? size * (0.05 + rnd() * 0.2) // near u=0.05..0.25 (behind-left)
    : size * (0.75 + rnd() * 0.2) // near u=0.75..0.95 (behind-right)
  const patchCY = size * (0.1 + rnd() * 0.7)
  ctx.fillStyle = accent
  ctx.filter = 'blur(11px)'
  const blobs = 6 + Math.floor(rnd() * 4)
  for (let i = 0; i < blobs; i++) {
    const bx = patchCX + (rnd() - 0.5) * size * 0.42
    const by = patchCY + (rnd() - 0.5) * size * 0.36
    const br = size * (0.08 + rnd() * 0.14)
    ctx.beginPath()
    ctx.arc(bx, by, br, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.filter = 'none'

  // Subtle grain
  const grain = ctx.getImageData(0, 0, size, size)
  const data = grain.data
  for (let i = 0; i < data.length; i += 4) {
    const n = (rnd() - 0.5) * 12
    data[i] = Math.max(0, Math.min(255, data[i] + n))
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n))
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n))
  }
  ctx.putImageData(grain, 0, 0)

  // Face — painted at UV(0.5, 0.5) which maps to the sphere's +X side.
  // We rotate the mesh each frame so +X points at (roughly) the camera.
  const fx = size * 0.5
  const fy = size * 0.5
  const style = rnd()
  const eyeGap = size * 0.085
  const eyeR = size * (0.032 + rnd() * 0.008)

  ctx.fillStyle = '#0a0710'
  if (style < 0.15) {
    // heart eyes
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
    heart(fx - eyeGap, fy, size * 0.04)
    heart(fx + eyeGap, fy, size * 0.04)
  } else {
    ctx.beginPath()
    ctx.arc(fx - eyeGap, fy, eyeR, 0, Math.PI * 2)
    ctx.arc(fx + eyeGap, fy, eyeR, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.strokeStyle = '#0a0710'
  ctx.lineCap = 'round'
  ctx.lineWidth = size * 0.014
  ctx.beginPath()
  const mw = size * 0.045
  const my = fy + size * 0.075
  if (rnd() < 0.35) {
    ctx.moveTo(fx - mw, my)
    ctx.quadraticCurveTo(fx, my + size * 0.02, fx + mw, my)
  } else {
    ctx.moveTo(fx - mw, my)
    ctx.lineTo(fx + mw, my)
  }
  ctx.stroke()

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  tex.needsUpdate = true
  return tex
}

export function BallsField({
  count = 140,
  bounds = { x: 9, y: 3, z: 1.8 },
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
    () => Array.from({ length: 16 }, (_, i) => makeBallTexture(1000 + i * 137)),
    []
  )
  const materials = useMemo(
    () =>
      textures.map(
        (t) =>
          new THREE.MeshStandardMaterial({
            map: t,
            roughness: 0.6,
            metalness: 0.02
          })
      ),
    [textures]
  )
  const geometry = useMemo(() => new THREE.SphereGeometry(0.5, 28, 22), [])

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
          scale: 0.4 + rnd() * 0.8,
          seed: rnd() * 1000,
          variant: Math.floor(rnd() * textures.length)
        })
        idx++
      }
    }
    return list
  }, [count, bounds.x, bounds.y, bounds.z, yOffset, textures.length])

  const tmp = useMemo(() => new THREE.Vector3(), [])
  const targetDir = useMemo(() => new THREE.Vector3(), [])
  const targetQuat = useMemo(() => new THREE.Quaternion(), [])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30)
    const time = state.clock.elapsedTime
    const p = pointer.current
    const w = viewport.width
    const responsive = Math.max(0.7, Math.min(1.3, w / 12))
    const R = 2.4 * responsive

    balls.forEach((b, i) => {
      // spring to home
      tmp.copy(b.home).sub(b.pos).multiplyScalar(4.2 * dt)
      b.vel.add(tmp)

      // idle drift
      b.vel.x += Math.sin(time * 0.5 + b.seed) * 0.002
      b.vel.y += Math.cos(time * 0.6 + b.seed * 1.3) * 0.002

      // pointer repulsion (planar)
      const dx = b.pos.x - p.x
      const dy = b.pos.y - p.y
      const d = Math.hypot(dx, dy)
      if (d < R && d > 0.001) {
        const force = Math.pow(1 - d / R, 2) * 2.2
        b.vel.x += (dx / d) * force
        b.vel.y += (dy / d) * force
      }

      b.vel.multiplyScalar(0.86)
      b.pos.x += b.vel.x * dt * 60
      b.pos.y += b.vel.y * dt * 60
      b.pos.z += b.vel.z * dt * 60

      const m = meshesRef.current[i]
      if (!m) return

      m.position.copy(b.pos)

      // Parallax rotation — the face slides across the ball surface, drifting
      // AWAY from the pointer. Falloff so distant balls stay pointed at the
      // camera without spurious tilt.
      const pdx = b.pos.x - p.x
      const pdy = b.pos.y - p.y
      const pd = Math.hypot(pdx, pdy)
      const parallaxRange = 5.5
      const parallaxFalloff = pd < parallaxRange ? 1 - pd / parallaxRange : 0
      const parallaxStrength = 3.5 * parallaxFalloff
      const nx = pd > 0.001 ? pdx / pd : 0
      const ny = pd > 0.001 ? pdy / pd : 0

      // subtle idle sway of the face
      const swayX = Math.sin(time * 0.55 + b.seed) * 0.28
      const swayY = Math.cos(time * 0.48 + b.seed * 1.3) * 0.24

      // "target" the face looks at — camera position offset by parallax
      const tx = nx * parallaxStrength + swayX
      const ty = ny * parallaxStrength + swayY
      const tz = CAMERA_Z

      const vx = tx - b.pos.x
      const vy = ty - b.pos.y
      const vz = tz - b.pos.z
      const vlen = Math.hypot(vx, vy, vz) || 1
      targetDir.set(vx / vlen, vy / vlen, vz / vlen)

      // Align mesh local +X (where the face is painted) with targetDir.
      targetQuat.setFromUnitVectors(FACE_AXIS, targetDir)
      // Smooth toward the target so the rotation feels gentle.
      m.quaternion.slerp(targetQuat, 1 - Math.exp(-8 * dt))

      const pulse = 1 + Math.sin(time * 1.4 + b.seed) * 0.02
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
