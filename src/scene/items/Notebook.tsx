export function Notebook() {
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[0.55, 0.75, 0.1]} />
        <meshStandardMaterial color="#ffd94a" roughness={0.35} />
      </mesh>
      <mesh position={[0, 0, 0.055]}>
        <boxGeometry args={[0.5, 0.7, 0.02]} />
        <meshStandardMaterial color="#f6f0dc" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.32, 0.07]}>
        <boxGeometry args={[0.45, 0.03, 0.005]} />
        <meshStandardMaterial color="#16121b" />
      </mesh>
      <mesh position={[0, 0.22, 0.07]}>
        <boxGeometry args={[0.3, 0.03, 0.005]} />
        <meshStandardMaterial color="#16121b" />
      </mesh>
      <mesh position={[-0.3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.05, 0.02, 8, 12]} />
        <meshStandardMaterial color="#16121b" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  )
}
