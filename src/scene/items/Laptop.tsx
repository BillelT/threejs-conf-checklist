import { RoundedBox } from '@react-three/drei'
import { ToyMaterial } from './ToyMaterial'

export function Laptop() {
  return <group rotation={[0.22, -0.48, -0.05]} scale={1.15}>
    <RoundedBox position={[0, -0.3, 0.12]} args={[1.05, 0.065, 0.74]} radius={0.028}><ToyMaterial color="#ced0dc" metalness={0.6} roughness={0.28} /></RoundedBox>
    <mesh position={[0, -0.262, 0.32]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.32, 0.17]} /><meshStandardMaterial color="#a8aaba" metalness={0.5} roughness={0.4} /></mesh>
    {Array.from({ length: 30 }, (_, i) => <mesh key={i} position={[-0.41 + (i % 10) * 0.09, -0.258, -0.12 + Math.floor(i / 10) * 0.09]}><boxGeometry args={[0.07, 0.012, 0.065]} /><meshStandardMaterial color="#242334" roughness={0.6} /></mesh>)}
    <group position={[0, -0.28, -0.23]} rotation={[-0.18, 0, 0]}>
      <RoundedBox position={[0, 0.36, 0]} args={[1.05, 0.72, 0.055]} radius={0.025}><ToyMaterial color="#555662" metalness={0.45} roughness={0.4} /></RoundedBox>
      {[[-0.065, 0.39], [0.065, 0.39], [0, 0.50]].map(([x, y], i) => <mesh key={i} position={[x, y, 0.034]} scale={[1, 1.2, 0.3]}><sphereGeometry args={[0.039, 16, 12]} /><meshStandardMaterial color="#e5deef" /></mesh>)}
    </group>
  </group>
}
