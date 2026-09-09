import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { checklist, type ItemKind } from '../data/checklist'
import { Notebook } from './items/Notebook'
import { Toothbrush } from './items/Toothbrush'
import { Pen } from './items/Pen'
import { Laptop } from './items/Laptop'
import { Badge } from './items/Badge'
import { Blender } from './items/Blender'

const RENDERERS: Record<ItemKind, () => JSX.Element> = {
  notebook: Notebook,
  toothbrush: Toothbrush,
  pen: Pen,
  laptop: Laptop,
  badge: Badge,
  blender: Blender
}

function seededRand(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

type ItemState = {
  home: THREE.Vector3
  target: THREE.Vector3
  pos: THREE.Vector3
  vel: THREE.Vector3
  scale: number
  spin: number
  packed: boolean
  hovered: boolean
  dragging: boolean
  dragOffset: THREE.Vector3
}

const ITEM_Z = 1.8

export function ItemsField({
  packed,
  onCollect,
  bagPosition,
  pointer
}: {
  packed: Record<string, boolean>
  onCollect: (id: ItemKind, clientX: number, clientY: number) => void
  bagPosition: THREE.Vector3
  pointer: React.MutableRefObject<THREE.Vector3>
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const refs = useRef<Record<ItemKind, THREE.Group>>({} as any)

  const items = useMemo(() => {
    const rnd = seededRand(7)
    const list: Record<ItemKind, ItemState> = {} as any
    const spots: [number, number, number][] = [
      [-3.6, -1.3, ITEM_Z],
      [-1.8, -2.4, ITEM_Z],
      [0.4, -1.6, ITEM_Z],
      [2.2, -2.6, ITEM_Z],
      [3.6, -1.1, ITEM_Z],
      [1.2, -3.2, ITEM_Z]
    ]
    checklist.forEach((it, i) => {
      const [x, y, z] = spots[i % spots.length]
      const jitter = 0.35
      const home = new THREE.Vector3(
        x + (rnd() - 0.5) * jitter,
        y + (rnd() - 0.5) * jitter,
        z
      )
      list[it.id] = {
        home,
        target: home.clone(),
        pos: home.clone(),
        vel: new THREE.Vector3(),
        scale: 1,
        spin: rnd() * Math.PI * 2,
        packed: false,
        hovered: false,
        dragging: false,
        dragOffset: new THREE.Vector3()
      }
    })
    return list
  }, [])

  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30)
    const t = state.clock.elapsedTime

    checklist.forEach((it) => {
      const s = items[it.id]
      const isPacked = !!packed[it.id]
      s.packed = isPacked

      if (isPacked) {
        s.target.copy(bagPosition)
      } else if (s.dragging) {
        s.target.set(
          pointer.current.x + s.dragOffset.x,
          pointer.current.y + s.dragOffset.y,
          ITEM_Z
        )
      } else {
        s.target.copy(s.home)
      }

      const stiffness = s.dragging ? 22 : 6
      tmp.copy(s.target).sub(s.pos).multiplyScalar(stiffness * dt)
      s.vel.add(tmp)

      s.vel.multiplyScalar(s.dragging ? 0.5 : 0.85)
      s.pos.add(s.vel.clone().multiplyScalar(dt * 60))

      const g = refs.current[it.id]
      if (g) {
        g.position.copy(s.pos)
        const idleY = Math.sin(t * 1.2 + s.spin) * 0.06
        g.position.y += isPacked || s.dragging ? 0 : idleY
        const targetScale = isPacked
          ? 0.35
          : s.dragging
          ? 1.25
          : s.hovered
          ? 1.15
          : 1
        const cur = g.scale.x
        const next = cur + (targetScale - cur) * Math.min(1, 12 * dt)
        g.scale.setScalar(next)
        if (s.dragging) {
          // steady the item while dragging, small tilt only
          g.rotation.y += (0 - g.rotation.y) * Math.min(1, 6 * dt)
          g.rotation.x += (0 - g.rotation.x) * Math.min(1, 6 * dt)
        } else {
          g.rotation.y = t * 0.6 + s.spin
          g.rotation.x = Math.sin(t * 0.9 + s.spin) * 0.15
        }
      }
    })
  })

  return (
    <group ref={groupRef}>
      {checklist.map((it) => {
        const Renderer = RENDERERS[it.id]
        return (
          <group
            key={it.id}
            ref={(el) => {
              if (el) refs.current[it.id] = el
            }}
            onPointerOver={(e) => {
              e.stopPropagation()
              items[it.id].hovered = true
              if (!packed[it.id]) document.body.style.cursor = 'grab'
            }}
            onPointerOut={() => {
              items[it.id].hovered = false
              if (!items[it.id].dragging) document.body.style.cursor = ''
            }}
            onPointerDown={(e) => {
              if (packed[it.id]) return
              e.stopPropagation()
              const s = items[it.id]
              s.dragging = true
              s.dragOffset.set(
                s.pos.x - pointer.current.x,
                s.pos.y - pointer.current.y,
                0
              )
              document.body.style.cursor = 'grabbing'
              ;(e.target as any).setPointerCapture?.(e.pointerId)
            }}
            onPointerUp={(e) => {
              const s = items[it.id]
              if (!s.dragging) return
              e.stopPropagation()
              s.dragging = false
              document.body.style.cursor = s.hovered ? 'grab' : ''
              ;(e.target as any).releasePointerCapture?.(e.pointerId)
              // if dropped near the bag, pack it
              const dx = s.pos.x - bagPosition.x
              const dy = s.pos.y - bagPosition.y
              const d = Math.hypot(dx, dy)
              const threshold = 1.6
              if (d < threshold) {
                onCollect(it.id, e.nativeEvent.clientX, e.nativeEvent.clientY)
              }
            }}
            onPointerCancel={(e) => {
              const s = items[it.id]
              if (!s.dragging) return
              s.dragging = false
              document.body.style.cursor = ''
              ;(e.target as any).releasePointerCapture?.(e.pointerId)
            }}
          >
            <Renderer />
          </group>
        )
      })}
    </group>
  )
}
