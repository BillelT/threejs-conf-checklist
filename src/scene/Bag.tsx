import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { BagMaterial as ToyMaterial } from './BagMaterial'
import { PrintedLabel } from './items/PrintedLabel'
import { dampFactor, reducedMotion } from '../lib/motion'
import { getPointer } from '../lib/pointer'

// A domed outline gives the shell and pocket the padded backpack silhouette.
function outline(width: number, height: number) {
  const w = width / 2, bottom = -height / 2, top = height / 2
  const shape = new THREE.Shape()
  shape.moveTo(-w + 0.16, bottom)
  shape.lineTo(w - 0.16, bottom)
  shape.quadraticCurveTo(w, bottom, w, bottom + 0.18)
  shape.lineTo(w, top - width * 0.48)
  shape.bezierCurveTo(w, top + 0.13, -w, top + 0.13, -w, top - width * 0.48)
  shape.lineTo(-w, bottom + 0.18)
  shape.quadraticCurveTo(-w, bottom, -w + 0.16, bottom)
  return shape
}

export function Bag({ position, size, packedCount }: { position: THREE.Vector3; size: React.MutableRefObject<number>; packedCount: number }) {
  const group = useRef<THREE.Group>(null!)
  const previousCount = useRef(packedCount)
  const impactTime = useRef(10)
  const tilt = useRef({ x: 0, y: 0 })
  const geometries = useMemo(() => {
    const shell = outline(1.48, 1.96)
    const pocket = outline(1.12, 0.84)
    const settings = { steps: 1, bevelEnabled: true, bevelSegments: 5, curveSegments: 32, bevelSize: 0.10, bevelThickness: 0.10 }
    const zipperPoints = shell.getPoints(64).map(p => new THREE.Vector3(p.x * 1.13, p.y * 1.10, 0.30))
    return {
      shell: new THREE.ExtrudeGeometry(shell, { ...settings, depth: 0.48 }),
      pocket: new THREE.ExtrudeGeometry(pocket, { ...settings, depth: 0.13 }),
      zipper: new THREE.TubeGeometry(new THREE.CatmullRomCurve3(zipperPoints, true), 160, 0.024, 8, true),
    }
  }, [])
  useEffect(() => () => Object.values(geometries).forEach(geometry => geometry.dispose()), [geometries])
  useFrame((state, delta) => {
    const quiet = reducedMotion()
    const cursor = getPointer()
    const smoothing = dampFactor(4, Math.min(delta, 0.05))
    tilt.current.x += ((cursor.active && !quiet ? -cursor.ndcY * 0.035 : 0) - tilt.current.x) * smoothing
    tilt.current.y += ((cursor.active && !quiet ? cursor.ndcX * 0.055 : 0) - tilt.current.y) * smoothing
    if (packedCount !== previousCount.current) {
      if (packedCount > previousCount.current) impactTime.current = -0.52
      previousCount.current = packedCount
    }
    impactTime.current += Math.min(delta, 0.05)
    const t = impactTime.current
    const pulse = quiet || t < 0 ? 0 : Math.sin(t * 19) * Math.exp(-t * 6) * 0.13
    group.current.scale.set(size.current * (1 + pulse), size.current * (1 - pulse * 0.7), size.current * (1 + pulse * 0.5))
    group.current.rotation.set(-0.045 + tilt.current.x, 0.28 + tilt.current.y + (quiet ? 0 : Math.sin(state.clock.elapsedTime * 0.35) * 0.045), pulse * 0.22)
    group.current.position.copy(position)
    group.current.position.y += quiet ? 0 : Math.sin(state.clock.elapsedTime * 0.7) * 0.015
  })
  return <group ref={group} name="backpack" position={position}>
    {[-0.48, 0.48].map(x => <mesh key={x} position={[x, -0.02, -0.4]} scale={[0.62, 1.5, 1]}><torusGeometry args={[0.43, 0.07, 12, 40]} /><ToyMaterial color="#d52ca3" /></mesh>)}
    <mesh position={[0, 0.99, -0.19]} scale={[1, 1.15, 1]}><torusGeometry args={[0.25, 0.057, 16, 48, Math.PI]} /><ToyMaterial color="#ff26a8" roughness={0.3} /></mesh>
    <group position={[0, 0, -0.25]}>
      <mesh geometry={geometries.shell}><ToyMaterial color="#7221ee" roughness={0.34} /></mesh>
      <mesh geometry={geometries.zipper}><ToyMaterial color="#ff35b8" roughness={0.3} /></mesh>
    </group>
    <mesh position={[0, -0.48, 0.38]} geometry={geometries.pocket}><ToyMaterial color="#7828ef" roughness={0.36} /></mesh>
    <RoundedBox position={[0.05, -0.31, 0.626]} args={[0.31, 0.043, 0.027]} radius={0.02}><ToyMaterial color="#c086ff" /></RoundedBox>
    <RoundedBox position={[-0.08, 0.52, 0.348]} args={[0.4, 0.057, 0.035]} radius={0.025}><ToyMaterial color="#bd80ff" /></RoundedBox>
    <mesh position={[0.32, 0.15, 0.354]} rotation={[0, 0, 0.18]}><planeGeometry args={[0.61, 0.61]} /><PrintedLabel /></mesh>
    <mesh position={[-0.77, -0.23, 0.23]} rotation={[0, 0, -0.3]} scale={[0.65, 1, 1]}><torusGeometry args={[0.074, 0.022, 12, 24]} /><ToyMaterial color="#f7e8ff" metalness={0.25} /></mesh>
    <RoundedBox position={[-0.795, -0.34, 0.25]} rotation={[0, 0, -0.3]} args={[0.08, 0.19, 0.045]} radius={0.035}><ToyMaterial color="#f5dcff" /></RoundedBox>
    <RoundedBox position={[0.79, -0.66, -0.08]} args={[0.22, 0.53, 0.43]} radius={0.1}><ToyMaterial color="#812ced" /></RoundedBox>
  </group>
}

