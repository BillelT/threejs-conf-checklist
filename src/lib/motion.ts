/** Exact critically damped spring, with velocity expressed per second. */
export function springStep(position: number, velocity: number, target: number, frequency: number, dt: number, dampingRatio = 1) {
  const offset = position - target
  if (dampingRatio < 1) {
    const attenuation = frequency * Math.max(0, dampingRatio)
    const angular = Math.sqrt(frequency * frequency - attenuation * attenuation)
    const decay = Math.exp(-attenuation * dt)
    const cosine = Math.cos(angular * dt)
    const sine = Math.sin(angular * dt)
    const impulse = (velocity + attenuation * offset) / angular
    return {
      position: target + decay * (offset * cosine + impulse * sine),
      velocity: decay * (velocity * cosine - (attenuation * impulse + angular * offset) * sine),
    }
  }
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
