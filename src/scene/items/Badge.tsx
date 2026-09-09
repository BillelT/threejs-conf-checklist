import { Text } from '@react-three/drei'

export function Badge() {
  return (
    <group rotation={[0, 0, -0.15]}>
      {/* lanyard */}
      <mesh position={[0, 0.55, 0]}>
        <torusGeometry args={[0.28, 0.03, 8, 24, Math.PI]} />
        <meshStandardMaterial color="#ff6ab8" roughness={0.5} />
      </mesh>
      {/* clip */}
      <mesh position={[0, 0.28, 0]}>
        <boxGeometry args={[0.14, 0.06, 0.05]} />
        <meshStandardMaterial color="#16121b" metalness={0.4} roughness={0.3} />
      </mesh>
      {/* card */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[0.6, 0.85, 0.05]} />
        <meshStandardMaterial color="#7d63ff" roughness={0.3} />
      </mesh>
      {/* card inner light strip */}
      <mesh position={[0, 0.2, 0.03]}>
        <boxGeometry args={[0.5, 0.03, 0.005]} />
        <meshStandardMaterial color="#ffd94a" />
      </mesh>
      <Text
        position={[0, 0.05, 0.028]}
        fontSize={0.09}
        color="#ffd94a"
        anchorX="center"
        anchorY="middle"
        maxWidth={0.55}
        textAlign="center"
      >
        THREE.JS
      </Text>
      <Text
        position={[0, -0.08, 0.028]}
        fontSize={0.07}
        color="#f6f0dc"
        anchorX="center"
        anchorY="middle"
      >
        CONF 2026
      </Text>
      <Text
        position={[0, -0.28, 0.028]}
        fontSize={0.05}
        color="#f6f0dc"
        anchorX="center"
        anchorY="middle"
      >
        VOLUNTEER
      </Text>
    </group>
  )
}
