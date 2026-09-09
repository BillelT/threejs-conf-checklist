export function Laptop() {
  return (
    <group rotation={[-0.15, 0.3, 0]}>
      {/* base */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[0.9, 0.05, 0.65]} />
        <meshStandardMaterial color="#e7e2d0" roughness={0.35} metalness={0.15} />
      </mesh>
      {/* screen */}
      <mesh position={[0, 0.28, -0.3]} rotation={[-Math.PI / 2.5, 0, 0]}>
        <boxGeometry args={[0.9, 0.6, 0.04]} />
        <meshStandardMaterial color="#e7e2d0" roughness={0.35} metalness={0.15} />
      </mesh>
      {/* screen glow */}
      <mesh position={[0, 0.28, -0.27]} rotation={[-Math.PI / 2.5, 0, 0]}>
        <planeGeometry args={[0.8, 0.5]} />
        <meshStandardMaterial color="#7d63ff" emissive="#7d63ff" emissiveIntensity={0.5} />
      </mesh>
      {/* trackpad */}
      <mesh position={[0, -0.02, 0.15]}>
        <boxGeometry args={[0.35, 0.005, 0.22]} />
        <meshStandardMaterial color="#c8c2b0" roughness={0.4} />
      </mesh>
    </group>
  )
}
