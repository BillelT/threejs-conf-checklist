import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Bag } from './Bag'
import { BallsField } from './BallsField'
import { ItemsField } from './ItemsField'
import { useChecklistStore } from '../hooks/useChecklistStore'
import type { ItemKind } from '../data/checklist'

const BAG_POS = new THREE.Vector3(-3.6, 0, -0.3)

/** Reads window.scrollY into a ref so the render loop can slide the whole
 *  world up as the user scrolls; at scroll 0 the content sits below the
 *  viewport (only the gradient is visible), by scroll ≈ 1 viewport it is
 *  centered in the frame. */
function useScrollProgress() {
  const ref = useRef(0)
  useEffect(() => {
    const compute = () => {
      const vh = window.innerHeight || 1
      const y = window.scrollY || 0
      ref.current = Math.max(0, Math.min(1.2, y / vh))
    }
    compute()
    window.addEventListener('scroll', compute, { passive: true })
    window.addEventListener('resize', compute)
    return () => {
      window.removeEventListener('scroll', compute)
      window.removeEventListener('resize', compute)
    }
  }, [])
  return ref
}

function ScrollWorld({
  scroll,
  children
}: {
  scroll: React.MutableRefObject<number>
  children: React.ReactNode
}) {
  const group = useRef<THREE.Group>(null!)
  const { viewport } = useThree()
  useFrame(() => {
    if (!group.current) return
    // vertical world span of one viewport at z=0
    const span = viewport.height
    // when scroll=0 push content one full viewport down;
    // when scroll=1 content is centered.
    const target = -span * (1 - scroll.current)
    const cur = group.current.position.y
    group.current.position.y = cur + (target - cur) * 0.18
  })
  return <group ref={group}>{children}</group>
}

function PointerTracker({
  pointer,
  scroll
}: {
  pointer: React.MutableRefObject<THREE.Vector3>
  scroll: React.MutableRefObject<number>
}) {
  const { viewport } = useThree()
  useFrame((state) => {
    const nx = (state.pointer.x * viewport.width) / 2
    const ny = (state.pointer.y * viewport.height) / 2
    // ny is in world space; the scene group is translated by groupY, so
    // convert to the group's local space by subtracting that offset.
    const groupY = -viewport.height * (1 - scroll.current)
    pointer.current.set(nx, ny - groupY, 0)
  })
  return null
}

type Props = {
  onCollect: (id: ItemKind, x: number, y: number) => void
}

export function Experience({ onCollect }: Props) {
  const packed = useChecklistStore((s) => s.packed)
  const pointer = useRef(new THREE.Vector3(999, 999, 0))
  const scroll = useScrollProgress()
  const packedCount = useMemo(
    () => Object.values(packed).filter(Boolean).length,
    [packed]
  )

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 8], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.45} />
      <directionalLight position={[3, 6, 5]} intensity={1.35} castShadow />
      <directionalLight position={[-4, -2, 3]} intensity={0.55} color="#ffbcda" />
      <directionalLight position={[4, 2, -3]} intensity={0.55} color="#b8ddff" />
      <hemisphereLight args={['#f6f0dc', '#6b3fff', 0.55]} />
      <pointLight position={[0, 0, 6]} intensity={0.5} color="#ffffff" />

      <PointerTracker pointer={pointer} scroll={scroll} />

      <ScrollWorld scroll={scroll}>
        <Bag position={[BAG_POS.x, BAG_POS.y, BAG_POS.z]} packedCount={packedCount} />
        <ItemsField
          packed={packed}
          onCollect={onCollect}
          bagPosition={BAG_POS}
          pointer={pointer}
        />
        <BallsField pointer={pointer} />
      </ScrollWorld>
    </Canvas>
  )
}
