export function Toothbrush() {
  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      {/* handle */}
      <mesh>
        <capsuleGeometry args={[0.06, 0.75, 8, 16]} />
        <meshStandardMaterial color="#a8dcff" roughness={0.3} />
      </mesh>
      {/* head */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.14, 0.18, 0.07]} />
        <meshStandardMaterial color="#f6f0dc" roughness={0.5} />
      </mesh>
      {/* bristles */}
      <mesh position={[0, 0.58, 0]}>
        <boxGeometry args={[0.12, 0.05, 0.05]} />
        <meshStandardMaterial color="#ff6ab8" roughness={0.6} />
      </mesh>
    </group>
  )
}
