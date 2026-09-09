import confetti from 'canvas-confetti'
import { reducedMotion } from './motion'
import { playSound } from './sounds'

const PALETTE = ['#ffd94a', '#ff6ab8', '#7d63ff', '#a8dcff', '#ff9a5a', '#16121b']

export function popConfetti(x?: number, y?: number) {
  playSound('confetti')
  if (reducedMotion()) return
  const origin =
    x !== undefined && y !== undefined
      ? { x: x / window.innerWidth, y: y / window.innerHeight }
      : { x: 0.5, y: 0.5 }
  confetti({
    particleCount: 36,
    spread: 65,
    startVelocity: 24,
    scalar: 1.05,
    origin,
    colors: PALETTE,
    zIndex: 60
  })
}

export function celebrate() {
  playSound('celebrate')
  if (reducedMotion()) return
  // One bounded burst per side; never emit hundreds of particles every frame.
  for (const side of [0, 1]) {
    confetti({
      particleCount: 70,
      angle: side === 0 ? 60 : 120,
      spread: 65,
      origin: { x: side, y: 0.75 },
      colors: PALETTE,
      zIndex: 60,
      startVelocity: 55,
      scalar: 1.2
    })
  }
}
