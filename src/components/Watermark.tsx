import { useEffect, useRef } from 'react'

const WORDS = 'THREE.JS ▸ CONF ▸ PARIS ▸ WELCOME ▸ '

export function Watermark() {
  const rowsRef = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    let raf = 0
    let t = 0
    const tick = () => {
      t += 0.35
      rowsRef.current.forEach((row, i) => {
        const dir = i % 2 === 0 ? -1 : 1
        row.style.transform = `translateX(${(t * dir) % 400}px)`
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const rows = Array.from({ length: 8 })
  return (
    <div className="watermark" aria-hidden>
      {rows.map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            if (el) rowsRef.current[i] = el
          }}
          className="watermark-row"
          style={{ marginTop: i === 0 ? 0 : '-0.1em' }}
        >
          {Array.from({ length: 8 }).map((__, k) => (
            <span key={k}>{WORDS}</span>
          ))}
        </div>
      ))}
    </div>
  )
}
