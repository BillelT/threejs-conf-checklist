import { useEffect, useState } from 'react'

export function useCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 })
  const [grow, setGrow] = useState(false)

  useEffect(() => {
    const onMove = (e: PointerEvent) => setPos({ x: e.clientX, y: e.clientY })
    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null
      if (!t) return
      const interactive = t.closest('button, a, li, .checklist-card, .stage')
      setGrow(!!interactive)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('mouseover', onOver)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('mouseover', onOver)
    }
  }, [])

  return { pos, grow }
}
