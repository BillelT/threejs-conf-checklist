import { useCursor } from '../hooks/useCursor'

export function Cursor() {
  const { pos, grow } = useCursor()
  return (
    <div
      className={`cursor${grow ? ' grow' : ''}`}
      style={{ transform: `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)` }}
    />
  )
}
