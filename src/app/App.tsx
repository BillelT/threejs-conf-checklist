import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Experience } from '../scene/Experience'
import { ChecklistPanel } from '../components/ChecklistPanel'
import { Toasts, pushToast } from '../components/Toasts'
import { Completion } from '../components/Completion'
import { useChecklistStore } from '../hooks/useChecklistStore'
import { checklist, type ItemKind } from '../data/checklist'
import { popConfetti, celebrate } from '../lib/confetti'
import { installPointerManager } from '../lib/pointer'

export function App() {
  const packed = useChecklistStore((s) => s.packed)
  const toggle = useChecklistStore((s) => s.toggle)
  const totalDone = useMemo(
    () => checklist.reduce((n, it) => n + (packed[it.id] ? 1 : 0), 0),
    [packed]
  )
  const [showCompletion, setShowCompletion] = useState(false)
  const celebratedRef = useRef(false)
  const heroRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)

  useLayoutEffect(() => {
    const hero = heroRef.current
    const title = titleRef.current
    if (!hero || !title) return

    const fit = () => {
      const heroStyle = getComputedStyle(hero)
      const available =
        hero.clientWidth - parseFloat(heroStyle.paddingLeft) - parseFloat(heroStyle.paddingRight)
      if (available <= 0) return
      title.querySelectorAll<HTMLSpanElement>('span').forEach((line) => {
        line.style.fontSize = ''
        const currentSize = parseFloat(getComputedStyle(line).fontSize)
        const measured = line.getBoundingClientRect().width
        if (measured > 0) {
          line.style.fontSize = `${(currentSize * available) / measured}px`
        }
      })
    }

    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(hero)
    document.fonts?.ready.then(fit).catch(() => {})
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    installPointerManager()
  }, [])

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
      <div className="stage" aria-hidden>
        <Experience onCollect={handleCollect} />
      </div>
      <div className="grain" aria-hidden />
      <ChecklistPanel />
      <main className="page">
        <section className="hero" ref={heroRef}>
          <h1 className="title" ref={titleRef}>
            <span>Three.js</span>
            <span>Conf</span>
            <span>Checklist</span>
          </h1>
        </section>
        <section className="game" aria-label="3D packing area" />
      </main>
      <Toasts />
      <Completion visible={showCompletion} />
    </>
  )
}
