import { RoundedBox } from '@react-three/drei'
import { ToyMaterial } from './ToyMaterial'
import { PrintedLabel } from './PrintedLabel'

export function Badge() {
  return <group rotation={[0, -0.12, -0.12]}>
    {[-1, 1].map(side => <group key={side}>
      <RoundedBox position={[side * 0.19, 0.64, -0.015]} rotation={[0, 0, -side * 0.23]} args={[0.085, 0.57, 0.024]} radius={0.012}><ToyMaterial color="#ff51c0" /></RoundedBox>
      <RoundedBox position={[side * 0.13, 0.35, 0]} rotation={[0, 0, side * 0.75]} args={[0.085, 0.27, 0.024]} radius={0.012}><ToyMaterial color="#ff51c0" /></RoundedBox>
    </group>)}
    <RoundedBox position={[0, -0.15, 0]} args={[0.76, 1.04, 0.06]} radius={0.045}><meshPhysicalMaterial color="#e0d6ff" transparent opacity={0.5} roughness={0.18} metalness={0.15} depthWrite={false} /></RoundedBox>
    <mesh position={[0, -0.15, 0.034]}><planeGeometry args={[0.66, 0.94]} /><PrintedLabel badge /></mesh>
    <mesh position={[0, 0.32, 0.04]}><torusGeometry args={[0.042, 0.012, 8, 16]} /><ToyMaterial color="#f4efff" metalness={0.6} /></mesh>
  </group>
}
