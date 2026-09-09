import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import * as THREE from 'three'
import { Bag } from './Bag'
import { BallsField } from './BallsField'
import { ItemsField } from './ItemsField'
import { useChecklistStore } from '../hooks/useChecklistStore'
import type { ItemKind } from '../data/checklist'

const BAG_POS = new THREE.Vector3(-4.6, 1.6, 0)

function PointerTracker({ pointer }: { pointer: React.MutableRefObject<THREE.Vector3> }) {
  const { viewport } = useThree()
  useFrame((state) => {
    const nx = (state.pointer.x * viewport.width) / 2
    const ny = (state.pointer.y * viewport.height) / 2
    pointer.current.set(nx, ny, 0)
  })
  return null
}

type Props = {
  onCollect: (id: ItemKind, x: number, y: number) => void
}

export function Experience({ onCollect }: Props) {
  const packed = useChecklistStore((s) => s.packed)
  const pointer = useRef(new THREE.Vector3(999, 999, 0))
  const packedCount = useMemo(
    () => Object.values(packed).filter(Boolean).length,
    [packed]
  )

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 8], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={[0]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 6, 5]} intensity={1.2} castShadow />
      <directionalLight position={[-4, -2, 3]} intensity={0.6} color="#ff9ac8" />
      <directionalLight position={[4, 2, -3]} intensity={0.5} color="#a8dcff" />
      <Environment preset="studio" />

      <PointerTracker pointer={pointer} />

      <Bag position={[BAG_POS.x, BAG_POS.y, BAG_POS.z]} packedCount={packedCount} />
      <ItemsField
        packed={packed}
        onCollect={onCollect}
        bagPosition={BAG_POS}
        pointer={pointer}
      />
      <BallsField pointer={pointer} />
    </Canvas>
  )
}
