import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { ToyMaterial } from './items/ToyMaterial'
import { PrintedLabel } from './items/PrintedLabel'
import { dampFactor, reducedMotion } from '../lib/motion'

export function Bag({ position, size, packedCount }: { position: THREE.Vector3; size: React.MutableRefObject<number>; packedCount: number }) {
  const group = useRef<THREE.Group>(null!)
  const previousCount = useRef(packedCount)
  const pulse = useRef(0)
  useFrame((state, delta) => {
    const quiet = reducedMotion()
    if (packedCount !== previousCount.current) { pulse.current = quiet ? 0 : 0.045; previousCount.current = packedCount }
    pulse.current += (0 - pulse.current) * dampFactor(6, delta)
    group.current.scale.setScalar(size.current * (1 + pulse.current))
    group.current.rotation.y = -0.14 + (quiet ? 0 : Math.sin(state.clock.elapsedTime * 0.35) * 0.055)
    group.current.position.copy(position)
    group.current.position.y += quiet ? 0 : Math.sin(state.clock.elapsedTime * 0.7) * 0.015
  })
  return <group ref={group} name="backpack" position={position}>
    {[-0.53, 0.53].map(x => <mesh key={x} position={[x, 0.03, -0.43]} scale={[0.65, 1.4, 1]}><torusGeometry args={[0.43, 0.065, 12, 40]} /><ToyMaterial color="#ee39a2" /></mesh>)}
    <RoundedBox args={[1.65, 2.05, 0.68]} radius={0.28} smoothness={6}><ToyMaterial color="#6518d4" roughness={0.46} /></RoundedBox>
    <RoundedBox position={[0, -0.44, 0.4]} args={[1.31, 0.94, 0.28]} radius={0.18} smoothness={5}><ToyMaterial color="#701cdf" roughness={0.48} /></RoundedBox>
    <RoundedBox position={[0, -0.2, 0.553]} args={[0.63, 0.055, 0.035]} radius={0.025}><ToyMaterial color="#af69ff" /></RoundedBox>
    <RoundedBox position={[-0.12, 0.59, 0.35]} args={[0.54, 0.06, 0.045]} radius={0.025}><ToyMaterial color="#b477ff" /></RoundedBox>
    <mesh position={[0, 1.04, -0.02]}><torusGeometry args={[0.26, 0.048, 12, 40, Math.PI]} /><ToyMaterial color="#ff36a9" /></mesh>
    <mesh position={[0.30, 0.27, 0.354]} rotation={[0, 0, 0.14]}><planeGeometry args={[0.65, 0.65]} /><PrintedLabel /></mesh>
    <mesh position={[-0.78, -0.07, 0.16]} rotation={[0, 0, -0.22]} scale={[0.6, 1, 1]}><torusGeometry args={[0.075, 0.021, 10, 24]} /><ToyMaterial color="#eee3ff" metalness={0.6} /></mesh>
    <RoundedBox position={[0.80, -0.64, 0]} args={[0.14, 0.52, 0.45]} radius={0.065}><ToyMaterial color="#7928dc" /></RoundedBox>
  </group>
}
