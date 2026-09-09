import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { Bag } from './Bag'
import { BallsField } from './BallsField'
import { ItemsField } from './ItemsField'
import { useChecklistStore } from '../hooks/useChecklistStore'
import type { ItemKind } from '../data/checklist'

const BAG_POS = new THREE.Vector3(-3.6, 0, -0.3)

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
    const span = viewport.height
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
    const groupY = -viewport.height * (1 - scroll.current)
    pointer.current.set(nx, ny - groupY, 0)
  })
  return null
}

/** Bakes a soft studio envmap from THREE's RoomEnvironment via PMREM so
 *  clearcoated plastic gets convincing highlights without pulling an HDRI
 *  over the network (some hosts / proxies block CDN fetches). */
function ProceduralEnv() {
  const { scene, gl } = useThree()
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const room = new RoomEnvironment()
    const env = pmrem.fromScene(room, 0.04).texture
    scene.environment = env
    return () => {
      env.dispose()
      pmrem.dispose()
    }
  }, [scene, gl])
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
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
        gl.outputColorSpace = THREE.SRGBColorSpace
      }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.42} color="#f4ecff" />
      <directionalLight
        position={[5, 6, 6]}
        intensity={1.35}
        color="#fff5ea"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-6, -2, 4]} intensity={0.55} color="#ff9ac8" />
      <directionalLight position={[4, -3, -2]} intensity={0.45} color="#a8dcff" />
      <hemisphereLight args={['#f6f0dc', '#6b3fff', 0.4]} />

      <ProceduralEnv />

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

        <ContactShadows
          position={[0, -3.2, 0]}
          opacity={0.35}
          scale={22}
          blur={2.8}
          far={4}
          color="#2a1a5a"
        />
      </ScrollWorld>
    </Canvas>
  )
}
