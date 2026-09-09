import { useId } from 'react'

export function BagTarget() {
  const id = `bag-ring-${useId().replace(/:/g, '')}`
  return <div className="bag-target" aria-label="Place your items here">
    <svg viewBox="0 0 240 240" aria-hidden>
      <defs><path id={id} d="M120,18 a102,102 0 1,1 0,204 a102,102 0 1,1 0,-204" /></defs>
      <text><textPath href={`#${id}`} textLength="640" lengthAdjust="spacing">PLACE YOUR ITEMS HERE · PLACE YOUR ITEMS HERE · </textPath></text>
    </svg>
  </div>
}
