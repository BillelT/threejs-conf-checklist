import { useMemo } from 'react'
import { checklist } from '../data/checklist'
import { useChecklistStore } from '../hooks/useChecklistStore'

export function ChecklistPanel() {
  const packed = useChecklistStore((s) => s.packed)
  const toggle = useChecklistStore((s) => s.toggle)
  const reset = useChecklistStore((s) => s.reset)

  const done = useMemo(
    () => checklist.reduce((acc, it) => acc + (packed[it.id] ? 1 : 0), 0),
    [packed]
  )

  return (
    <aside className="checklist-card" aria-label="Packing checklist">
      <div className="checklist-card__title">
        <h2>My checklist</h2>
        <span className="progress">
          {done} / {checklist.length}
        </span>
      </div>
      <ul className="checklist" role="list">
        {checklist.map((item) => {
          const isDone = !!packed[item.id]
          return (
            <li key={item.id} className={isDone ? 'done' : ''}>
              <button
                type="button"
                className="check"
                aria-pressed={isDone}
                aria-label={`Toggle ${item.label}`}
                onClick={() => toggle(item.id)}
                style={{ background: isDone ? item.color : 'transparent' }}
              />
              <span className="label">{item.label}</span>
              <span
                aria-hidden
                style={{
                  marginLeft: 'auto',
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: item.color,
                  boxShadow: `0 0 0 2px ${item.accent}`
                }}
              />
            </li>
          )
        })}
      </ul>
      <button className="reset-btn" type="button" onClick={reset}>
        Empty the bag
      </button>
    </aside>
  )
}
