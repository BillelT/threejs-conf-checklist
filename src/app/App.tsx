import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Experience } from '../scene/Experience'
import { ChecklistPanel } from '../components/ChecklistPanel'
import { Toasts, pushToast } from '../components/Toasts'
import { Completion } from '../components/Completion'
import { useChecklistStore } from '../hooks/useChecklistStore'
import { checklist, type ItemKind } from '../data/checklist'
import { popConfetti, celebrate } from '../lib/confetti'

export function App() {
  const packed = useChecklistStore((s) => s.packed)
  const toggle = useChecklistStore((s) => s.toggle)
  const totalDone = useMemo(
    () => checklist.reduce((n, it) => n + (packed[it.id] ? 1 : 0), 0),
    [packed]
  )
  const [showCompletion, setShowCompletion] = useState(false)
  const celebratedRef = useRef(false)

  const handleCollect = useCallback(
    (id: ItemKind, x: number, y: number) => {
      const wasPacked = !!packed[id]
      if (wasPacked) return
      toggle(id)
      const item = checklist.find((i) => i.id === id)
      pushToast({
        text: `Packed: ${item?.label ?? id}`,
        kind: 'success',
        color: item?.color
      })
      popConfetti(x, y)
    },
    [packed, toggle]
  )

  useEffect(() => {
    if (totalDone === checklist.length && !celebratedRef.current) {
      celebratedRef.current = true
      celebrate()
      pushToast({ text: "You're ready — see you in Paris!", kind: 'win' })
      setShowCompletion(true)
      window.setTimeout(() => setShowCompletion(false), 4200)
    }
    if (totalDone < checklist.length) {
      celebratedRef.current = false
    }
  }, [totalDone])

  return (
    <>
      <div className="bg-gradient" aria-hidden />
      <div className="stage" aria-label="3D packing scene">
        <Experience onCollect={handleCollect} />
      </div>
      <div className="grain" aria-hidden />
      <main className="page">
        <section className="top">
          <h1 className="title">
            <span>Three.js</span>
            <span>Conf</span>
            <span>Checklist</span>
          </h1>
          <ChecklistPanel />
        </section>
      </main>
      <Toasts />
      <Completion visible={showCompletion} />
    </>
  )
}
