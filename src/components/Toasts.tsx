import { useEffect, useState } from 'react'

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
      {items.map((t) => (
        <div key={t.id} className={`toast ${t.kind ?? 'success'}`}>
          <span className="dot" style={t.color ? { background: t.color } : undefined} />
          {t.text}
        </div>
      ))}
    </div>
  )
}
