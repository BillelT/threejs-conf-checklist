import { useMemo } from 'react'
import * as THREE from 'three'
import { ToyMaterial } from './ToyMaterial'

export function Blender() {
  const shape = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-0.18, 0.64)
    s.bezierCurveTo(-0.3, 0.77, -0.47, 0.62, -0.34, 0.5)
    s.lineTo(-0.08, 0.28)
    s.lineTo(-0.64, 0.28)
    s.bezierCurveTo(-0.82, 0.28, -0.81, 0.08, -0.64, 0.08)
    s.lineTo(-0.34, 0.08)
    s.lineTo(-0.65, -0.16)
    s.bezierCurveTo(-0.79, -0.27, -0.64, -0.43, -0.5, -0.32)
    s.lineTo(-0.28, -0.15)
    s.bezierCurveTo(-0.22, -0.64, 0.62, -0.59, 0.63, -0.06)
    s.bezierCurveTo(0.65, 0.12, 0.51, 0.29, 0.35, 0.39)
    s.lineTo(-0.18, 0.64)
    return s
  }, [])
  return <group rotation={[0.06, -0.12, -0.08]} scale={0.85}>
    <mesh><extrudeGeometry args={[shape, { depth: 0.10, bevelEnabled: true, bevelThickness: 0.055, bevelSize: 0.055, bevelSegments: 5, curveSegments: 24 }]} /><ToyMaterial color="#ff850a" /></mesh>
    <mesh position={[0.17, -0.07, 0.14]} scale={[1, 0.92, 0.25]}><sphereGeometry args={[0.32, 40, 24]} /><ToyMaterial color="#fff5e8" /></mesh>
    <mesh position={[0.17, -0.07, 0.215]} scale={[1, 0.92, 0.3]}><sphereGeometry args={[0.215, 32, 24]} /><ToyMaterial color="#0872e8" /></mesh>
  </group>
}
