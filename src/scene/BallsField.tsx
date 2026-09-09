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
  faceVariant: number
  squash: number
}

// Rich palette inspired by threejs.paris: candy pinks/magentas, deep blues,
// mints, gold-cream, deep violets, off-whites. Each ball paints a base tone
// with a soft radial-gradient accent smudge on its flank so the surface
// reads two-tone, matching the "marble plastic" look of the reference.
const PALETTES: Array<{ base: string; accent: string }> = [
  { base: '#ff5aa8', accent: '#ffd0e6' },
  { base: '#e63a7a', accent: '#ffb6d6' },
  { base: '#f4ecdf', accent: '#ffb4d6' },
  { base: '#7d63ff', accent: '#c4b6ff' },
  { base: '#5a3fff', accent: '#a89bff' },
  { base: '#4b7bff', accent: '#a8cfff' },
  { base: '#2b3fa8', accent: '#8fb6ff' },
  { base: '#33c6a8', accent: '#c4f0e2' },
  { base: '#f4d155', accent: '#fff2b6' },
  { base: '#ff8a4a', accent: '#ffd6b8' },
  { base: '#d13a3a', accent: '#ff9a9a' },
  { base: '#c25aff', accent: '#ecc4ff' },
  { base: '#ffb2c8', accent: '#ffe4ec' },
  { base: '#2b1e5a', accent: '#7a63ff' },
  { base: '#8fe0c8', accent: '#e4faf1' },
  { base: '#f6f0dc', accent: '#f0d9a0' }
]

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

function hexWithAlpha(hex: string, a: number) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

/** Paint one ball's albedo: soft two-tone gradient body + bold kawaii face.
 *  Faces are ~2× the size of the previous iteration to match the reference,
 *  which reads as a chunky vector illustration. */
function makeBallTexture(seed: number, faceVariant: number): THREE.CanvasTexture {
  const rnd = seededRand(seed)
  const size = 512
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const ctx = c.getContext('2d')!

  const palette = PALETTES[Math.floor(rnd() * PALETTES.length)]

  // Base fill
  ctx.fillStyle = palette.base
  ctx.fillRect(0, 0, size, size)

  // Accent smudge on the flank — kept off center so the face stays clean.
  const onLeftFlank = rnd() < 0.5
  const smudgeCX = onLeftFlank
    ? size * (0.08 + rnd() * 0.18)
    : size * (0.74 + rnd() * 0.18)
  const smudgeCY = size * (0.15 + rnd() * 0.7)
  const smudgeR = size * (0.32 + rnd() * 0.18)

  const grad = ctx.createRadialGradient(
    smudgeCX,
    smudgeCY,
    size * 0.02,
    smudgeCX,
    smudgeCY,
    smudgeR
  )
  grad.addColorStop(0, palette.accent)
  grad.addColorStop(0.55, hexWithAlpha(palette.accent, 0.6))
  grad.addColorStop(1, hexWithAlpha(palette.accent, 0))
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  // Optional secondary accent burst for depth
  if (rnd() < 0.65) {
    const bx = onLeftFlank
      ? size * (0.05 + rnd() * 0.1)
      : size * (0.85 + rnd() * 0.1)
    const by = size * (0.2 + rnd() * 0.6)
    const br = size * (0.14 + rnd() * 0.1)
    const g2 = ctx.createRadialGradient(bx, by, 0, bx, by, br)
    g2.addColorStop(0, hexWithAlpha(palette.accent, 0.9))
    g2.addColorStop(1, hexWithAlpha(palette.accent, 0))
    ctx.fillStyle = g2
    ctx.fillRect(0, 0, size, size)
  }

  // Very light grain
  const grain = ctx.getImageData(0, 0, size, size)
  const data = grain.data
  for (let i = 0; i < data.length; i += 4) {
    const n = (rnd() - 0.5) * 8
    data[i] = Math.max(0, Math.min(255, data[i] + n))
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n))
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n))
  }
  ctx.putImageData(grain, 0, 0)

  // ============= FACE =============
  const fx = size * 0.5
  const fy = size * 0.5

  const eyeGap = size * 0.11
  const eyeW = size * 0.055
  const eyeH = size * 0.075
  const eyeStyle = faceVariant % 5

  const drawEye = (ex: number, ey: number) => {
    ctx.fillStyle = '#0a0710'
    ctx.beginPath()
    ctx.ellipse(ex, ey, eyeW, eyeH, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.beginPath()
    ctx.ellipse(
      ex + eyeW * 0.28,
      ey - eyeH * 0.35,
      eyeW * 0.22,
      eyeH * 0.22,
      0,
      0,
      Math.PI * 2
    )
    ctx.fill()
  }

  if (eyeStyle === 0) {
    drawEye(fx - eyeGap, fy - size * 0.01)
    drawEye(fx + eyeGap, fy - size * 0.01)
  } else if (eyeStyle === 1) {
    ctx.strokeStyle = '#0a0710'
    ctx.lineCap = 'round'
    ctx.lineWidth = size * 0.024
    for (const dx of [-eyeGap, eyeGap]) {
      ctx.beginPath()
      ctx.moveTo(fx + dx - size * 0.04, fy + size * 0.01)
      ctx.lineTo(fx + dx, fy - size * 0.03)
      ctx.lineTo(fx + dx + size * 0.04, fy + size * 0.01)
      ctx.stroke()
    }
  } else if (eyeStyle === 2) {
    drawEye(fx - eyeGap, fy)
    ctx.strokeStyle = '#0a0710'
    ctx.lineCap = 'round'
    ctx.lineWidth = size * 0.024
    ctx.beginPath()
    ctx.moveTo(fx + eyeGap - size * 0.04, fy)
    ctx.lineTo(fx + eyeGap + size * 0.04, fy)
    ctx.stroke()
  } else if (eyeStyle === 3) {
    ctx.fillStyle = '#0a0710'
    const glassW = size * 0.09
    const glassH = size * 0.065
    const glassR = size * 0.018
    roundRect(ctx, fx - eyeGap - glassW / 2, fy - glassH / 2, glassW, glassH, glassR)
    ctx.fill()
    roundRect(ctx, fx + eyeGap - glassW / 2, fy - glassH / 2, glassW, glassH, glassR)
    ctx.fill()
    ctx.strokeStyle = '#0a0710'
    ctx.lineWidth = size * 0.012
    ctx.beginPath()
    ctx.moveTo(fx - eyeGap + glassW / 2, fy)
    ctx.lineTo(fx + eyeGap - glassW / 2, fy)
    ctx.stroke()
  } else {
    drawEye(fx - eyeGap, fy - size * 0.01)
    drawEye(fx + eyeGap, fy - size * 0.01)
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.beginPath()
    ctx.ellipse(fx - eyeGap - eyeW * 0.3, fy + eyeH * 0.15, eyeW * 0.18, eyeH * 0.18, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(fx + eyeGap + eyeW * 0.3, fy + eyeH * 0.15, eyeW * 0.18, eyeH * 0.18, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // Mouth
  ctx.strokeStyle = '#0a0710'
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = size * 0.02
  ctx.fillStyle = '#0a0710'

  const my = fy + size * 0.11
  const mouthKind = Math.floor(faceVariant / 5) % 5

  if (mouthKind === 0) {
    ctx.beginPath()
    ctx.moveTo(fx - size * 0.07, my)
    ctx.quadraticCurveTo(fx, my + size * 0.045, fx + size * 0.07, my)
    ctx.stroke()
  } else if (mouthKind === 1) {
    ctx.beginPath()
    ctx.moveTo(fx - size * 0.075, my)
    ctx.quadraticCurveTo(fx - size * 0.035, my + size * 0.03, fx, my)
    ctx.quadraticCurveTo(fx + size * 0.035, my + size * 0.03, fx + size * 0.075, my)
    ctx.stroke()
  } else if (mouthKind === 2) {
    ctx.beginPath()
    ctx.ellipse(fx, my + size * 0.01, size * 0.028, size * 0.032, 0, 0, Math.PI * 2)
    ctx.fill()
  } else if (mouthKind === 3) {
    ctx.beginPath()
    ctx.moveTo(fx - size * 0.06, my + size * 0.01)
    ctx.lineTo(fx + size * 0.06, my + size * 0.01)
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.moveTo(fx - size * 0.08, my)
    ctx.bezierCurveTo(
      fx - size * 0.03, my + size * 0.05,
      fx + size * 0.03, my + size * 0.05,
      fx + size * 0.08, my
    )
    ctx.stroke()
  }

  // Optional cheek blush
  if (faceVariant % 3 === 0) {
    ctx.fillStyle = 'rgba(255, 90, 140, 0.35)'
    ctx.beginPath()
    ctx.ellipse(fx - size * 0.13, fy + size * 0.06, size * 0.035, size * 0.022, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(fx + size * 0.13, fy + size * 0.06, size * 0.035, size * 0.022, 0, 0, Math.PI * 2)
    ctx.fill()
  }

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

  // Larger variant pool so no two adjacent balls read as siblings.
  const VARIANTS = 24
  const textures = useMemo(
    () =>
      Array.from({ length: VARIANTS }, (_, i) =>
        makeBallTexture(1000 + i * 137, i)
      ),
    []
  )

  // Glossy plastic look. Clearcoat gives the signature specular pop of the
  // reference; we deliberately skip `sheen`, which some software drivers
  // choke on. envMapIntensity is boosted because the scene ships with a
  // procedural RoomEnvironment (see Experience.tsx).
  const materials = useMemo(
    () =>
      textures.map(
        (t) =>
          new THREE.MeshPhysicalMaterial({
            map: t,
            roughness: 0.35,
            metalness: 0.02,
            clearcoat: 0.85,
            clearcoatRoughness: 0.2,
            envMapIntensity: 1.15
          })
      ),
    [textures]
  )
  const geometry = useMemo(() => new THREE.SphereGeometry(0.5, 48, 36), [])

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
          scale: 0.45 + rnd() * 0.85,
          seed: rnd() * 1000,
          variant: Math.floor(rnd() * textures.length),
          faceVariant: Math.floor(rnd() * textures.length),
          squash: 0
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

    // Spec-faithful parameters (kept from the previous iteration):
    //   velocity += (target - position) * spring
    //   velocity *= damping
    //   position += velocity
    const spring = 5.5
    const damping = 0.82
    const interactionRadius = 2.4 * responsive
    const pointerStrength = 1.8

    balls.forEach((b, i) => {
      b.vel.x += (b.home.x - b.pos.x) * spring * dt
      b.vel.y += (b.home.y - b.pos.y) * spring * dt
      b.vel.z += (b.home.z - b.pos.z) * spring * dt

      b.vel.x += Math.sin(time * 0.5 + b.seed) * 0.0018
      b.vel.y += Math.cos(time * 0.6 + b.seed * 1.3) * 0.0018

      const dx = b.pos.x - p.x
      const dy = b.pos.y - p.y
      const d = Math.hypot(dx, dy)
      let pushForce = 0
      if (d < interactionRadius && d > 0.001) {
        const falloff = 1 - d / interactionRadius
        pushForce = falloff * falloff * pointerStrength
        b.vel.x += (dx / d) * pushForce
        b.vel.y += (dy / d) * pushForce
      }

      b.vel.multiplyScalar(damping)
      b.pos.x += b.vel.x * dt * 60
      b.pos.y += b.vel.y * dt * 60
      b.pos.z += b.vel.z * dt * 60

      // Squash & stretch when pushed — organic jelly feel.
      const targetSquash = Math.min(0.16, pushForce * 0.12)
      b.squash += (targetSquash - b.squash) * Math.min(1, 6 * dt)

      const m = meshesRef.current[i]
      if (!m) return

      m.position.copy(b.pos)

      // Parallax rotation — face drifts AWAY from the pointer with falloff.
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

      const pulse = 1 + Math.sin(time * 1.3 + b.seed) * 0.02
      const sx = b.scale * pulse * (1 + b.squash)
      const sy = b.scale * pulse * (1 - b.squash * 0.7)
      const sz = b.scale * pulse * (1 + b.squash * 0.2)
      m.scale.set(sx, sy, sz)
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
