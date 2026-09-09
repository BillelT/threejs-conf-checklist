import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { checklist, type ItemKind } from '../data/checklist'
import { Notebook } from './items/Notebook'
import { Toothbrush } from './items/Toothbrush'
import { Pen } from './items/Pen'
import { Laptop } from './items/Laptop'
import { Badge } from './items/Badge'
import { Blender } from './items/Blender'
import { dampFactor, reducedMotion, springStep } from '../lib/motion'
import { playSound } from '../lib/sounds'
import { getItemLayoutSeed, seededRandom } from '../lib/userSeed'

const RENDERERS = { notebook: Notebook, toothbrush: Toothbrush, pen: Pen, laptop: Laptop, badge: Badge, blender: Blender }
const ITEM_Z = 0.3
type ItemState = { home: THREE.Vector3; target: THREE.Vector3; pos: THREE.Vector3; velocity: THREE.Vector3; hovered: boolean; dragging: boolean; phase: number; flight: number; flightStart: THREE.Vector3; wasPacked: boolean }

export function ItemsField({ packed, onCollect, bagPosition, mobile }: {
  packed: Record<string, boolean>
  onCollect: (id: ItemKind, x: number, y: number) => void
  bagPosition: THREE.Vector3
  mobile: boolean
}) {
  const { camera, gl } = useThree()
  const root = useRef<THREE.Group>(null!)
  const refs = useRef<Partial<Record<ItemKind, THREE.Group>>>({})
  const active = useRef<{ id: ItemKind; pointerId: number; offset: THREE.Vector3; canvas: HTMLCanvasElement; touchAction: string } | null>(null)
  const latest = useRef({ packed, onCollect, bagPosition })
  latest.current = { packed, onCollect, bagPosition }
  const layoutSeed = useMemo(() => getItemLayoutSeed(), [])

  const items = useMemo(() => {
    const baseSpots = mobile
      ? [[-1.55, 1.05], [0, 1.05], [1.55, 1.05], [1.55, -1.05], [-1.55, -1.05], [0, -1.05]]
      : [[-4.3, 1.05], [-0.15, -1.05], [0, 1.05], [4.1, 1.05], [-4.1, -1.05], [4.15, -1.05]]
    const random = seededRandom(layoutSeed)
    const spots = [...baseSpots]
    for (let i = spots.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      const spot = spots[i]
      spots[i] = spots[j]
      spots[j] = spot
    }

    return Object.fromEntries(checklist.map((item, i) => {
      const home = new THREE.Vector3(spots[i][0], spots[i][1], ITEM_Z)
      return [item.id, { home, target: home.clone(), pos: home.clone(), velocity: new THREE.Vector3(), hovered: false, dragging: false, phase: i * 1.7, flight: 1, flightStart: home.clone(), wasPacked: !!packed[item.id] }]
    })) as Record<ItemKind, ItemState>
  }, [mobile, layoutSeed])

  const ray = useMemo(() => new THREE.Raycaster(), [])
  const plane = useMemo(() => new THREE.Plane(), [])
  const hit = useMemo(() => new THREE.Vector3(), [])
  const ndc = useMemo(() => new THREE.Vector2(), [])
  const origin = useMemo(() => new THREE.Vector3(), [])

  const projectPointer = (x: number, y: number) => {
    if (!root.current) return null
    const rect = gl.domElement.getBoundingClientRect()
    ndc.set((x - rect.left) / rect.width * 2 - 1, 1 - (y - rect.top) / rect.height * 2)
    ray.setFromCamera(ndc, camera)
    root.current.updateWorldMatrix(true, false)
    root.current.localToWorld(origin.set(0, 0, ITEM_Z))
    plane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 0, 1), origin)
    return ray.ray.intersectPlane(plane, hit) ? root.current.worldToLocal(hit) : null
  }

  useEffect(() => {
    let pan: { id: number; y: number } | null = null
    const startPan = (event: PointerEvent) => {
      if (event.pointerType !== 'touch' || active.current || event.target !== gl.domElement) return
      pan = { id: event.pointerId, y: event.clientY }
      gl.domElement.setPointerCapture(event.pointerId)
    }
    const finish = (event?: PointerEvent, collect = false) => {
      if (pan && (!event || event.pointerId === pan.id)) {
        if (gl.domElement.hasPointerCapture(pan.id)) gl.domElement.releasePointerCapture(pan.id)
        pan = null
      }
      const drag = active.current
      if (!drag || (event && event.pointerId !== drag.pointerId)) return
      const item = items[drag.id]
      // Use the release coordinates, not the visually lagging mesh position.
      const point = event ? projectPointer(event.clientX, event.clientY) : null
      if (point) { item.target.copy(point).add(drag.offset); item.target.z = 6 }
      item.dragging = false
      item.hovered = false
      active.current = null
      document.body.style.cursor = ''
      drag.canvas.style.touchAction = drag.touchAction
      if (drag.canvas.hasPointerCapture(drag.pointerId)) drag.canvas.releasePointerCapture(drag.pointerId)
      const bag = latest.current.bagPosition
      if (collect && event && !latest.current.packed[drag.id] && Math.abs(item.target.x - bag.x) < 0.95 && Math.abs(item.target.y - bag.y) < 1.15) {
        latest.current.onCollect(drag.id, event.clientX, event.clientY)
      } else if (collect) { playSound('return') }
    }
    const move = (event: PointerEvent) => {
      if (pan && event.pointerId === pan.id) {
        window.scrollBy(0, pan.y - event.clientY)
        pan.y = event.clientY
        return
      }
      const drag = active.current
      if (!drag || event.pointerId !== drag.pointerId) return
      const point = projectPointer(event.clientX, event.clientY)
      if (point) { items[drag.id].target.copy(point).add(drag.offset); items[drag.id].target.z = 6 }
    }
    const up = (event: PointerEvent) => finish(event, true)
    const cancel = (event: PointerEvent) => finish(event)
    const blur = () => finish()
    window.addEventListener('pointerdown', startPan)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', cancel)
    gl.domElement.addEventListener('lostpointercapture', cancel)
    window.addEventListener('blur', blur)
    return () => {
      finish()
      window.removeEventListener('pointerdown', startPan)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', cancel)
      gl.domElement.removeEventListener('lostpointercapture', cancel)
      window.removeEventListener('blur', blur)
    }
  }, [items, camera, gl, mobile])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const quiet = reducedMotion()
    checklist.forEach(({ id }) => {
      const item = items[id]
      const mesh = refs.current[id]
      if (!mesh) return
      const collected = !!packed[id]
      if (collected && !item.wasPacked) {
        item.flight = 0
        item.flightStart.copy(item.pos)
        item.velocity.set(0, 0, 0)
        playSound('pack')
      }
      item.wasPacked = collected
      if (collected) {
        item.flight = Math.min(1, item.flight + dt / (quiet ? 0.16 : 0.72))
        const t = item.flight
        const travel = THREE.MathUtils.smoothstep(t, 0.12, 1)
        item.pos.lerpVectors(item.flightStart, bagPosition, travel)
        if (!quiet) item.pos.y += Math.sin(Math.PI * travel) * 1.35
        item.pos.z = THREE.MathUtils.lerp(item.flightStart.z, bagPosition.z + 0.55, travel)
        mesh.position.copy(item.pos)
        const shrink = 1 - THREE.MathUtils.smoothstep(t, 0.48, 1)
        const bounce = quiet ? 1 : 1 + Math.sin(Math.min(t / 0.22, 1) * Math.PI) * 0.16
        mesh.scale.set(shrink * bounce * (1 - 0.2 * Math.sin(t * Math.PI)), shrink * bounce * (1 + 0.25 * Math.sin(t * Math.PI)), shrink * bounce)
        mesh.rotation.z = quiet ? 0 : Math.sin(t * Math.PI) * 0.45
        mesh.rotation.y = quiet ? 0 : Math.sin(t * Math.PI) * 0.65
        mesh.visible = t < 1
        return
      }
      else if (!item.dragging) {
        item.target.copy(item.home)
        if (!quiet) item.target.y += Math.sin(state.clock.elapsedTime * 0.65 + item.phase) * 0.045
      }
      for (const axis of ['x', 'y', 'z'] as const) {
        const next = springStep(item.pos[axis], item.velocity[axis], item.target[axis], item.dragging ? 24 : collected ? 10 : 9, dt)
        item.pos[axis] = next.position
        item.velocity[axis] = next.velocity
      }
      mesh.position.copy(item.pos)
      mesh.rotation.z += ((item.dragging && !quiet ? THREE.MathUtils.clamp(-item.velocity.x * 0.025, -0.25, 0.25) : 0) - mesh.rotation.z) * dampFactor(10, dt)
      const scale = collected ? 0.001 : item.dragging ? 1.06 : item.hovered ? 1.035 : 1
      mesh.scale.setScalar(THREE.MathUtils.lerp(mesh.scale.x, scale, dampFactor(collected ? 7 : 10, dt)))
      mesh.visible = !collected || mesh.scale.x > 0.012
      const yaw = quiet || item.dragging ? 0 : Math.sin(state.clock.elapsedTime * 0.3 + item.phase) * 0.16
      mesh.rotation.y += (yaw - mesh.rotation.y) * dampFactor(8, dt)
      mesh.rotation.x += ((quiet ? 0 : Math.sin(state.clock.elapsedTime * 0.4 + item.phase) * 0.04) - mesh.rotation.x) * dampFactor(8, dt)
    })
  })

  const startDrag = (id: ItemKind, event: ThreeEvent<PointerEvent>) => {
    if (packed[id] || active.current || event.button !== 0) return
    event.stopPropagation()
    const point = projectPointer(event.nativeEvent.clientX, event.nativeEvent.clientY)
    if (!point) return
    const item = items[id]
    const canvas = gl.domElement
    active.current = { id, pointerId: event.pointerId, offset: item.pos.clone().sub(point), canvas, touchAction: canvas.style.touchAction }
    playSound('pickup')
    item.dragging = true
    item.target.copy(item.pos)
    item.target.z = 6
    item.velocity.set(0, 0, 0)
    canvas.style.touchAction = 'none'
    canvas.setPointerCapture(event.pointerId)
    document.body.style.cursor = 'grabbing'
  }

  return <group ref={root} name="collectibles">
    {checklist.map(({ id }) => {
      const Model = RENDERERS[id]
      return <group key={id} name={id} position={items[id].home}
        ref={value => { if (value) refs.current[id] = value }}
        onPointerOver={event => {
          if (packed[id] || active.current) return
          event.stopPropagation()
          items[id].hovered = true
          document.body.style.cursor = 'grab'
        }}
        onPointerOut={() => {
          items[id].hovered = false
          if (!active.current) document.body.style.cursor = ''
        }}
        onPointerMove={event => {
          if (packed[id] || active.current) return
          event.stopPropagation()
          items[id].hovered = true
          document.body.style.cursor = 'grab'
        }}
        onPointerDown={event => startDrag(id, event)}
      ><Model /></group>
    })}
  </group>
}
