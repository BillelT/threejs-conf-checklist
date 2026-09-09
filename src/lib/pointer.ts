// Shared pointer manager — one source of truth for the DOM soft shapes and
// the Three.js scene. Both systems read from the same coordinates so their
// motion stays causally connected, per the interaction spec.

export type PointerState = {
  screenX: number
  screenY: number
  ndcX: number
  ndcY: number
  vx: number
  vy: number
  active: boolean
}

const state: PointerState = {
  screenX: -9999,
  screenY: -9999,
  ndcX: 0,
  ndcY: 0,
  vx: 0,
  vy: 0,
  active: false
}

let lastX = -9999
let lastY = -9999
let lastT = 0
let subscribers = 0

function onMove(e: PointerEvent) {
  const now = performance.now()
  const dt = Math.max(1, now - lastT)
  const nx = e.clientX
  const ny = e.clientY
  if (state.active) {
    state.vx = (nx - lastX) / dt
    state.vy = (ny - lastY) / dt
  }
  lastX = nx
  lastY = ny
  lastT = now
  state.screenX = nx
  state.screenY = ny
  state.ndcX = (nx / window.innerWidth) * 2 - 1
  state.ndcY = -((ny / window.innerHeight) * 2 - 1)
  state.active = true
}

function onLeave() {
  state.active = false
  state.vx = 0
  state.vy = 0
  state.screenX = -9999
  state.screenY = -9999
}

export function installPointerManager() {
  if (subscribers++ === 0) {
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    window.addEventListener('blur', onLeave)
  }
  return () => {
    if (--subscribers !== 0) return
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerdown', onMove)
    document.documentElement.removeEventListener('pointerleave', onLeave)
    window.removeEventListener('blur', onLeave)
    onLeave()
  }
}

export function getPointer(): PointerState {
  return state
}
