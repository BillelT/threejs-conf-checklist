import { useEffect, useState } from 'react'
import { SoftShape } from './SoftShape'

export type Toast = {
  id: number
  text: string
  kind?: 'success' | 'win'
  color?: string
}

let counter = 0
const listeners = new Set<(t: Toast) => void>()

export function pushToast(t: Omit<Toast, 'id'>) {
  const toast = { ...t, id: ++counter }
  listeners.forEach((l) => l(toast))
}

const KIND_FILL: Record<NonNullable<Toast['kind']>, string> = {
  success: '#ffd94a',
  win: '#ff6ab8'
}

export function Toasts() {
  const [items, setItems] = useState<Toast[]>([])

  useEffect(() => {
    const handler = (t: Toast) => {
      setItems((prev) => [...prev, t])
      const life = t.kind === 'win' ? 4200 : 2200
      window.setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== t.id))
      }, life)
    }
    listeners.add(handler)
    return () => {
      listeners.delete(handler)
    }
  }, [])

  return (
    <div className="toasts" aria-live="polite">
      {items.map((t) => {
        const kind = t.kind ?? 'success'
        return (
          <SoftShape
            key={t.id}
            className={`toast toast--${kind}`}
            radius={999}
            fill={KIND_FILL[kind]}
            perimeterPoints={40}
            influenceRadius={130}
            strength={0.6}
            spring={0.16}
            damping={0.76}
            contentParallax={3}
          >
            <div className="toast__row">
              <span
                className="dot"
                style={t.color ? { background: t.color } : undefined}
              />
              {t.text}
            </div>
          </SoftShape>
        )
      })}
    </div>
  )
}
