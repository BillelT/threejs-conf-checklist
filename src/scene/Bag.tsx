import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

type Props = {
  position?: [number, number, number]
  packedCount: number
}

export function Bag({ position = [0, 0, 0], packedCount }: Props) {
  const group = useRef<THREE.Group>(null!)
  const lid = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (group.current) {
      group.current.rotation.y = Math.sin(t * 0.5) * 0.15
      group.current.position.y = position[1] + Math.sin(t * 1.2) * 0.05
    }
    if (lid.current) {
      const targetTilt = -0.25 - packedCount * 0.03
      lid.current.rotation.x = THREE.MathUtils.damp(
        lid.current.rotation.x,
        targetTilt,
        4,
        state.clock.getDelta() + 0.016
      )
    }
  })

  return (
    <group ref={group} position={position}>
      {/* body */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[1.6, 1.9, 0.9]} />
        <meshStandardMaterial color="#ff6ab8" roughness={0.32} metalness={0.05} />
      </mesh>
      {/* front pocket */}
      <mesh position={[0, -0.35, 0.46]}>
        <boxGeometry args={[1.2, 0.7, 0.06]} />
        <meshStandardMaterial color="#ffd94a" roughness={0.4} />
      </mesh>
      {/* pocket flap */}
      <mesh position={[0, -0.02, 0.48]} rotation={[0.02, 0, 0]}>
        <boxGeometry args={[1.25, 0.35, 0.04]} />
        <meshStandardMaterial color="#16121b" roughness={0.5} />
      </mesh>
      {/* top lid */}
      <mesh
        ref={lid}
        position={[0, 0.95, -0.15]}
        rotation={[-0.25, 0, 0]}
      >
        <boxGeometry args={[1.62, 0.5, 1.15]} />
        <meshStandardMaterial color="#7d63ff" roughness={0.3} />
      </mesh>
      {/* THREE.JS CONF text on front */}
      <Text
        position={[0, 0.35, 0.462]}
        fontSize={0.16}
        color="#16121b"
        anchorX="center"
        anchorY="middle"
        letterSpacing={-0.02}
        maxWidth={1.4}
        textAlign="center"
      >
        {'THREE.JS\nCONF'}
      </Text>
      {/* straps */}
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, 0.55, -0.55]}>
          <torusGeometry args={[0.45, 0.05, 8, 24, Math.PI]} />
          <meshStandardMaterial color="#16121b" roughness={0.4} />
        </mesh>
      ))}
      {/* zip pull */}
      <mesh position={[0.6, -0.35, 0.5]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color="#16121b" metalness={0.6} roughness={0.2} />
      </mesh>
      {/* dot mascot on side */}
      <mesh position={[-0.75, 0.35, 0.46]}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color="#a8dcff" roughness={0.25} />
      </mesh>
      <mesh position={[-0.7, 0.38, 0.6]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#16121b" />
      </mesh>
      <mesh position={[-0.8, 0.38, 0.6]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#16121b" />
      </mesh>
    </group>
  )
}
