import { RoundedBox } from '@react-three/drei'
import { ToyMaterial } from './ToyMaterial'

export function Toothbrush() {
  return <group rotation={[0.05, -0.2, 0.35]}>
    <mesh position={[0, -0.15, 0]}><capsuleGeometry args={[0.085, 0.78, 8, 20]} /><ToyMaterial color="#158aec" /></mesh>
    <mesh position={[0, -0.08, 0.079]} scale={[0.7, 1, 0.35]}><capsuleGeometry args={[0.07, 0.24, 6, 16]} /><ToyMaterial color="#f8f5ef" /></mesh>
    <mesh position={[-0.03, 0.35, 0]} rotation={[0, 0, -0.1]}><capsuleGeometry args={[0.045, 0.26, 6, 16]} /><ToyMaterial color="#158aec" /></mesh>
    <RoundedBox position={[-0.04, 0.55, 0]} args={[0.21, 0.35, 0.1]} radius={0.045}><ToyMaterial color="#168af1" /></RoundedBox>
    {Array.from({ length: 5 }, (_, i) => <RoundedBox key={i} position={[-0.04, 0.425 + i * 0.06, 0.1]} args={[0.19, 0.037, 0.15]} radius={0.017}><ToyMaterial color={i % 2 ? '#ff67c5' : '#fff4ed'} roughness={0.65} /></RoundedBox>)}
  </group>
}
