import confetti from 'canvas-confetti'

const PALETTE = ['#ffd94a', '#ff6ab8', '#7d63ff', '#a8dcff', '#ff9a5a', '#16121b']

export function popConfetti(x?: number, y?: number) {
  const origin =
    x !== undefined && y !== undefined
      ? { x: x / window.innerWidth, y: y / window.innerHeight }
      : { x: 0.5, y: 0.5 }
  confetti({
    particleCount: 90,
    spread: 65,
    startVelocity: 42,
    scalar: 1.05,
    origin,
    colors: PALETTE,
    zIndex: 60
  })
}

export function celebrate() {
  const end = Date.now() + 1600
  const fire = () => {
    confetti({
      particleCount: 60,
      angle: 60,
      spread: 65,
      origin: { x: 0, y: 0.75 },
      colors: PALETTE,
      zIndex: 60,
      startVelocity: 55,
      scalar: 1.2
    })
    confetti({
      particleCount: 60,
      angle: 120,
      spread: 65,
      origin: { x: 1, y: 0.75 },
      colors: PALETTE,
      zIndex: 60,
      startVelocity: 55,
      scalar: 1.2
    })
    confetti({
      particleCount: 130,
      spread: 130,
      startVelocity: 45,
      origin: { x: 0.5, y: 0.4 },
      colors: PALETTE,
      zIndex: 60,
      scalar: 1.35
    })
    if (Date.now() < end) requestAnimationFrame(fire)
  }
  fire()
}
