/** Exact critically damped spring, with velocity expressed per second. */
export function springStep(position: number, velocity: number, target: number, frequency: number, dt: number) {
  const offset = position - target
  const decay = Math.exp(-frequency * dt)
  const impulse = (velocity + frequency * offset) * dt
  return {
    position: target + (offset + impulse) * decay,
    velocity: (velocity - frequency * impulse) * decay
  }
}

export function dampFactor(speed: number, dt: number) {
  return 1 - Math.exp(-speed * Math.min(dt, 0.05))
}

export function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
