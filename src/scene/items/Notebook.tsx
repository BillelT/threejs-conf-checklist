import { RoundedBox } from '@react-three/drei'
import { ToyMaterial } from './ToyMaterial'

export function Notebook() {
  return <group rotation={[0.06, -0.2, -0.08]}>
    <RoundedBox args={[0.78, 1.08, 0.2]} radius={0.07} smoothness={4}><ToyMaterial color="#ffda08" /></RoundedBox>
    <RoundedBox position={[0.025, 0, 0.025]} args={[0.70, 1, 0.16]} radius={0.035} smoothness={3}><meshStandardMaterial color="#fff4df" roughness={0.75} /></RoundedBox>
    {[-0.105, 0.12].map(z => <RoundedBox key={z} position={[0, 0, z]} args={[0.78, 1.08, 0.035]} radius={0.017} smoothness={3}><ToyMaterial color="#ffe018" /></RoundedBox>)}
    <RoundedBox position={[0.25, 0, 0.145]} args={[0.036, 1.08, 0.024]} radius={0.01}><ToyMaterial color="#eaba05" /></RoundedBox>
    {['#ff4bb4', '#34c894'].map((color, i) => <RoundedBox key={color} position={[0.43, 0.25 - i * 0.4, 0.015]} args={[0.15, 0.21, 0.045]} radius={0.017}><ToyMaterial color={color} /></RoundedBox>)}
    {Array.from({ length: 5 }, (_, i) => <mesh key={i} position={[0.035, -0.495, -0.055 + i * 0.026]}><boxGeometry args={[0.59, 0.002, 0.002]} /><meshBasicMaterial color="#c8b99e" /></mesh>)}
  </group>
}
