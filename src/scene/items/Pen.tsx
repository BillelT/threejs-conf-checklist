import { RoundedBox } from '@react-three/drei'
import { ToyMaterial } from './ToyMaterial'

export function Pen() {
  return <group rotation={[0, 0, -0.32]}>
    <mesh><capsuleGeometry args={[0.105, 0.92, 8, 24]} /><ToyMaterial color="#1672ef" /></mesh>
    <mesh position={[0, 0.62, 0]}><capsuleGeometry args={[0.052, 0.13, 6, 16]} /><ToyMaterial color="#ff43b2" /></mesh>
    <RoundedBox position={[0.115, 0.35, 0.02]} args={[0.055, 0.38, 0.06]} radius={0.025}><ToyMaterial color="#ff43b2" /></RoundedBox>
    <mesh position={[0, -0.62, 0]} rotation={[0, 0, Math.PI]}><coneGeometry args={[0.085, 0.22, 24]} /><ToyMaterial color="#f4eee9" roughness={0.28} /></mesh>
    <mesh position={[0, -0.745, 0]}><capsuleGeometry args={[0.019, 0.045, 4, 12]} /><ToyMaterial color="#9b9ba7" metalness={0.8} roughness={0.2} /></mesh>
  </group>
}
