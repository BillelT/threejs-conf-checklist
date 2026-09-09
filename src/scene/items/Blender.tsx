export function Blender() {
  return (
    <group>
      {/* outer orange ring */}
      <mesh>
        <torusGeometry args={[0.32, 0.08, 12, 40]} />
        <meshStandardMaterial color="#ff9a5a" roughness={0.35} />
      </mesh>
      {/* inner blue dot */}
      <mesh position={[0, 0, 0.03]}>
        <sphereGeometry args={[0.16, 24, 24]} />
        <meshStandardMaterial color="#3b82f6" roughness={0.3} />
      </mesh>
      {/* wedge (blender's little dot) */}
      <mesh position={[0.24, 0, 0.06]}>
        <sphereGeometry args={[0.07, 20, 20]} />
        <meshStandardMaterial color="#ff9a5a" roughness={0.35} />
      </mesh>
    </group>
  )
}
