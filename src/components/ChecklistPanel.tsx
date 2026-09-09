import { useMemo } from 'react'
import { checklist } from '../data/checklist'
import { useChecklistStore } from '../hooks/useChecklistStore'

export function ChecklistPanel() {
  const packed = useChecklistStore((s) => s.packed)

  const done = useMemo(
    () => checklist.reduce((acc, it) => acc + (packed[it.id] ? 1 : 0), 0),
    [packed]
  )

  return (
    <aside className="clist" aria-label="Packing checklist">
      <div className="clist__pill">My checklist</div>
      <div className="clist__count">
        {done} / {checklist.length}
      </div>
      <ul className="clist__items" role="list">
        {checklist.map((item) => {
          const isDone = !!packed[item.id]
          return (
            <li
              key={item.id}
              className={isDone ? 'is-done' : ''}
              aria-label={`${item.label}${isDone ? ' — packed' : ' — pending'}`}
            >
              <span className="clist__bullet" aria-hidden>•</span>
              <span className="clist__label">{item.label}</span>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
