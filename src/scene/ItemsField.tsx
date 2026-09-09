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
  packedAt: number
}

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
    // scatter around the lower half, avoid center where balls hide them (they show through)
    const spots: [number, number, number][] = [
      [-3.6, -1.3, 0.2],
      [-1.8, -2.4, 0.4],
      [0.4, -1.6, 0.1],
      [2.2, -2.6, 0.3],
      [3.6, -1.1, 0.2],
      [1.2, -3.2, 0.4]
    ]
    checklist.forEach((it, i) => {
      const [x, y, z] = spots[i % spots.length]
      const jitter = 0.35
      const home = new THREE.Vector3(
        x + (rnd() - 0.5) * jitter,
        y + (rnd() - 0.5) * jitter,
        z + (rnd() - 0.5) * jitter
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
        packedAt: 0
      }
    })
    return list
  }, [])

  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30)
    const t = state.clock.elapsedTime
    const p = pointer.current

    checklist.forEach((it) => {
      const s = items[it.id]
      const isPacked = !!packed[it.id]
      s.packed = isPacked

      // choose target: bag if packed, home otherwise
      if (isPacked) {
        s.target.copy(bagPosition)
      } else {
        s.target.copy(s.home)
      }

      // spring
      tmp.copy(s.target).sub(s.pos).multiplyScalar(6 * dt)
      s.vel.add(tmp)

      // pointer subtle repulsion — items shift slightly
      if (!isPacked) {
        tmp.copy(s.pos).sub(p)
        const d = tmp.length()
        const R = 1.5
        if (d < R && d > 0.001) {
          const force = (1 - d / R) * 0.25
          tmp.normalize().multiplyScalar(force)
          s.vel.add(tmp)
        }
      }

      // damping
      s.vel.multiplyScalar(0.85)
      s.pos.add(s.vel.clone().multiplyScalar(dt * 60))

      const g = refs.current[it.id]
      if (g) {
        g.position.copy(s.pos)
        const idleY = Math.sin(t * 1.2 + s.spin) * 0.06
        g.position.y += isPacked ? 0 : idleY
        const targetScale = isPacked ? 0.35 : (s.hovered ? 1.18 : 1)
        const cur = g.scale.x
        const next = cur + (targetScale - cur) * Math.min(1, 10 * dt)
        g.scale.setScalar(next)
        g.rotation.y = t * 0.6 + s.spin
        g.rotation.x = Math.sin(t * 0.9 + s.spin) * 0.15
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
              if (!packed[it.id]) document.body.style.cursor = 'pointer'
            }}
            onPointerOut={() => {
              items[it.id].hovered = false
              document.body.style.cursor = ''
            }}
            onClick={(e) => {
              e.stopPropagation()
              if (packed[it.id]) return
              onCollect(it.id, e.nativeEvent.clientX, e.nativeEvent.clientY)
            }}
          >
            <Renderer />
          </group>
        )
      })}
    </group>
  )
}
