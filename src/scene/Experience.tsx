import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { Bag } from './Bag'
import { BallsField } from './BallsField'
import { ItemsField } from './ItemsField'
import { useChecklistStore } from '../hooks/useChecklistStore'
import type { ItemKind } from '../data/checklist'
import { getPointer } from '../lib/pointer'

function StudioEnvironment() {
  const { scene, gl } = useThree()
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const room = new RoomEnvironment()
    const target = pmrem.fromScene(room, 0.04)
    const previous = scene.environment
    scene.environment = target.texture
    room.dispose()
    pmrem.dispose()
    return () => { scene.environment = previous; target.dispose() }
  }, [scene, gl])
  return null
}

function World({ onCollect }: { onCollect: (id: ItemKind, x: number, y: number) => void }) {
  const packed = useChecklistStore(s => s.packed)
  const { viewport, size, gl } = useThree()
  const mobile = size.width < 700
  const field = useRef<THREE.Group>(null!)
  const pointer = useRef(new THREE.Vector3(999, 999, 3))
  const bagPosition = useMemo(() => new THREE.Vector3(0, 0, 5.5), [])
  const dropPosition = useMemo(() => new THREE.Vector3(0, 0, 5.5), [])
  const bagSize = useRef(0.7)
  const scale = Math.min(viewport.width / (mobile ? 5.8 : 13.8), viewport.height / (mobile ? 9 : 7.5))
  const pixelsPerUnit = size.height / viewport.height * scale
  const layout = useRef({ bagX: 0, bagY: 0, ring: 240, fieldCenter: 0 })
  const ring = useRef<HTMLElement | null>(null)
  const lastEventUpdate = useRef(0)

  useEffect(() => {
    ring.current = document.querySelector('.bag-target')
    const title = document.querySelector('.title')!
    const measure = () => {
      const line = title.querySelector('span:last-child')!
      const range = document.createRange()
      const text = line.firstChild!
      range.setStart(text, 2)
      range.setEnd(text, 3)
      const letter = range.getBoundingClientRect()
      const titleBottom = title.getBoundingClientRect().bottom + window.scrollY
      const diameter = mobile ? 180 : Math.min(320, size.height * 0.35, size.width * 0.23)
      const radius = diameter / 2
      const bagX = mobile
        ? Math.max(radius + 12, Math.min(letter.x + letter.width / 2, size.width - 160 - radius - 24))
        : Math.max(radius + 20, letter.x + letter.width / 2)
      const bagY = Math.min(titleBottom + radius + 18, size.height - radius - 16)
      const fieldHeight = (mobile ? 5.3 : 5.4) * pixelsPerUnit
      const fieldTop = bagY + radius + 28
      layout.current = { bagX, bagY, ring: diameter, fieldCenter: fieldTop + fieldHeight / 2 }
      bagSize.current = diameter * 0.65 / (2.35 * pixelsPerUnit)
      document.documentElement.style.setProperty('--experience-height', `${Math.max(size.height, fieldTop + fieldHeight + 28)}px`)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(title)
    document.fonts.ready.then(measure)
    gl.domElement.setAttribute('aria-busy', 'false')
    return () => {
      observer.disconnect()
      gl.domElement.setAttribute('aria-busy', 'true')
      if (ring.current) ring.current.style.visibility = 'hidden'
    }
  }, [size.width, size.height, pixelsPerUnit, mobile, gl])

  useFrame(state => {
    if (!field.current) return
    const { bagX, bagY, ring: diameter, fieldCenter } = layout.current
    const screenBagY = Math.max(diameter / 2 + 18, bagY - window.scrollY)
    const fieldY = (size.height / 2 - fieldCenter + window.scrollY) / pixelsPerUnit
    field.current.position.y = fieldY
    bagPosition.set((bagX - size.width / 2) / pixelsPerUnit, (size.height / 2 - screenBagY) / pixelsPerUnit, 5.5)
    dropPosition.copy(bagPosition)
    dropPosition.y -= fieldY
    if (ring.current) {
      ring.current.style.width = `${diameter}px`
      ring.current.style.height = `${diameter}px`
      ring.current.style.transform = `translate3d(${bagX - diameter / 2}px, ${screenBagY - diameter / 2}px, 0)`
      ring.current.style.visibility = 'visible'
    }
    const p = getPointer()
    if (!p.active) pointer.current.set(999, 999, 3)
    else pointer.current.set((p.screenX - size.width / 2) / pixelsPerUnit, (size.height / 2 - p.screenY) / pixelsPerUnit - fieldY, 3)
    // Update hit testing while the balls uncover a stationary cursor.
    if (p.active && state.clock.elapsedTime - lastEventUpdate.current > 0.08) {
      state.events.update?.()
      lastEventUpdate.current = state.clock.elapsedTime
    }
  }, -1)

  return <group name="packing-world" scale={scale}>
    <Bag position={bagPosition} size={bagSize} packedCount={Object.values(packed).filter(Boolean).length} />
    <group ref={field} name="search-field">
      <ItemsField packed={packed} onCollect={onCollect} bagPosition={dropPosition} mobile={mobile} />
      <BallsField pointer={pointer} mobile={mobile} />
    </group>
  </group>
}

export function Experience({ onCollect }: { onCollect: (id: ItemKind, x: number, y: number) => void }) {
  return <Canvas
    orthographic
    dpr={[1, 1.75]}
    camera={{ position: [0, 0, 8], zoom: 100, near: 0.1, far: 50 }}
    gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    onCreated={({ gl }) => {
      gl.domElement.setAttribute('aria-busy', 'true')
      gl.toneMapping = THREE.ACESFilmicToneMapping
      gl.toneMappingExposure = 0.66
      gl.outputColorSpace = THREE.SRGBColorSpace
    }}
    style={{ background: 'transparent', touchAction: 'none' }}
  >
    <ambientLight intensity={0.14} color="#f5efff" />
    <directionalLight position={[-4, 6, 5]} intensity={1.1} color="#fff7ef" />
    <directionalLight position={[5, 1, 3]} intensity={0.25} color="#e9ddff" />
    <hemisphereLight args={['#e6efff', '#594080', 0.22]} />
    <StudioEnvironment />
    <Suspense fallback={null}><World onCollect={onCollect} /></Suspense>
  </Canvas>
}
