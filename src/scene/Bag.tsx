import { Suspense, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, Text } from '@react-three/drei'
import * as THREE from 'three'

type Props = {
  position?: [number, number, number]
  packedCount: number
}

/** Soft rounded backpack — soft plastic look with a pink→orange gradient
 *  albedo, matching the reference item render. */
export function Bag({ position = [0, 0, 0], packedCount }: Props) {
  const group = useRef<THREE.Group>(null!)
  const lid = useRef<THREE.Group>(null!)

  // Vertical pink→coral gradient texture used on the body + pocket
  const gradientTex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 4
    c.height = 256
    const ctx = c.getContext('2d')!
    const g = ctx.createLinearGradient(0, 0, 0, 256)
    g.addColorStop(0, '#ff9a5a')
    g.addColorStop(0.55, '#ff6ab8')
    g.addColorStop(1, '#e63a7a')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 4, 256)
    // grain
    const img = ctx.getImageData(0, 0, 4, 256)
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 18
      img.data[i] = Math.max(0, Math.min(255, img.data[i] + n))
      img.data[i + 1] = Math.max(0, Math.min(255, img.data[i + 1] + n))
      img.data[i + 2] = Math.max(0, Math.min(255, img.data[i + 2] + n))
    }
    ctx.putImageData(img, 0, 0)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    return t
  }, [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (group.current) {
      group.current.rotation.y = Math.sin(t * 0.5) * 0.15
      group.current.position.y = position[1] + Math.sin(t * 1.2) * 0.05
    }
    if (lid.current) {
      const targetTilt = -0.25 - packedCount * 0.03
      lid.current.rotation.x +=
        (targetTilt - lid.current.rotation.x) * 0.08
    }
  })

  return (
    <group ref={group} position={position}>
      {/* Body — soft rounded plastic with pink→coral gradient */}
      <RoundedBox args={[1.7, 2.05, 1.0]} radius={0.34} smoothness={6} castShadow receiveShadow>
        <meshPhysicalMaterial
          map={gradientTex}
          roughness={0.42}
          metalness={0.02}
          clearcoat={0.65}
          clearcoatRoughness={0.35}
          sheen={0.25}
          sheenColor="#ffd6e6"
          envMapIntensity={1.05}
        />
      </RoundedBox>

      {/* Front pocket */}
      <group position={[0, -0.35, 0.52]}>
        <RoundedBox args={[1.28, 0.85, 0.12]} radius={0.16} smoothness={5}>
          <meshPhysicalMaterial
            map={gradientTex}
            color="#ffb6d6"
            roughness={0.5}
            clearcoat={0.5}
            clearcoatRoughness={0.4}
          />
        </RoundedBox>
      </group>

      {/* Top zipper — pink cord like the reference */}
      <mesh position={[0, 0.72, 0.42]}>
        <torusGeometry args={[0.65, 0.02, 8, 40, Math.PI]} />
        <meshStandardMaterial color="#ff2fa0" roughness={0.35} />
      </mesh>

      {/* Top lid handle (rounded strap loop) */}
      <group ref={lid} position={[0, 1.03, 0.05]}>
        <mesh>
          <torusGeometry args={[0.22, 0.055, 12, 32, Math.PI]} />
          <meshPhysicalMaterial
            color="#ff8a4a"
            roughness={0.35}
            clearcoat={0.6}
            clearcoatRoughness={0.3}
          />
        </mesh>
      </group>

      {/* THREE.JS CONF text on the front pocket — wrapped in Suspense so if
          Troika can't fetch its default font (proxy-restricted environment),
          the bag still renders. */}
      <Suspense fallback={null}>
        <Text
          position={[0, -0.35, 0.6]}
          fontSize={0.14}
          color="#2b0a1a"
          anchorX="center"
          anchorY="middle"
          letterSpacing={-0.02}
          maxWidth={1.1}
          textAlign="center"
        >
          {'THREE.JS\nCONF'}
        </Text>
      </Suspense>

      {/* Straps — dark rounded loops */}
      {[-0.6, 0.6].map((x) => (
        <mesh key={x} position={[x, 0.55, -0.55]}>
          <torusGeometry args={[0.48, 0.06, 10, 28, Math.PI]} />
          <meshPhysicalMaterial color="#2a0f24" roughness={0.55} />
        </mesh>
      ))}

      {/* Zip pull — small dark ball */}
      <mesh position={[0.68, -0.35, 0.6]} castShadow>
        <sphereGeometry args={[0.075, 16, 16]} />
        <meshPhysicalMaterial
          color="#f6f0dc"
          roughness={0.35}
          metalness={0.05}
          clearcoat={0.8}
          clearcoatRoughness={0.2}
        />
      </mesh>

      {/* Little mascot on the side */}
      <group position={[-0.78, 0.4, 0.52]}>
        <mesh>
          <sphereGeometry args={[0.18, 24, 20]} />
          <meshPhysicalMaterial
            color="#a8dcff"
            roughness={0.3}
            clearcoat={0.9}
            clearcoatRoughness={0.15}
          />
        </mesh>
        {/* Eyes */}
        {[-0.055, 0.055].map((dx) => (
          <mesh key={dx} position={[dx, 0.01, 0.17]}>
            <sphereGeometry args={[0.022, 10, 10]} />
            <meshBasicMaterial color="#0a0710" />
          </mesh>
        ))}
      </group>
    </group>
  )
}
