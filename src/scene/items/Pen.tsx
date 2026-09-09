export function Pen() {
  return (
    <group rotation={[0, 0, -Math.PI / 5]}>
      <mesh>
        <cylinderGeometry args={[0.05, 0.05, 0.9, 20]} />
        <meshStandardMaterial color="#16121b" roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.15, 20]} />
        <meshStandardMaterial color="#ffd94a" roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.48, 0]}>
        <coneGeometry args={[0.05, 0.12, 20]} />
        <meshStandardMaterial color="#16121b" roughness={0.25} metalness={0.4} />
      </mesh>
      <mesh position={[0.06, 0.4, 0]}>
        <boxGeometry args={[0.015, 0.16, 0.03]} />
        <meshStandardMaterial color="#ffd94a" />
      </mesh>
    </group>
  )
}
