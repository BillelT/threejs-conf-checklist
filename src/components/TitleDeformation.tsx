import { useEffect, useId, useRef, type RefObject } from 'react'
import { getPointer } from '../lib/pointer'
import { reducedMotion, springStep } from '../lib/motion'

// A neutral displacement map outside the cursor's radius leaves the rest
// of the heading untouched. Red and green encode the local pull in x/y.
function createPullMap() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const pixels = ctx.createImageData(128, 128)
  for (let y = 0; y < 128; y++) {
    for (let x = 0; x < 128; x++) {
      const dx = (x - 63.5) / 63.5
      const dy = (y - 63.5) / 63.5
      const falloff = Math.max(0, 1 - Math.hypot(dx, dy)) ** 2
      const i = (y * 128 + x) * 4
      pixels.data[i] = 128 + dx * falloff * 255
      pixels.data[i + 1] = 128 + dy * falloff * 255
      pixels.data[i + 2] = 128
      pixels.data[i + 3] = 255
    }
  }
  ctx.putImageData(pixels, 0, 0)
  return canvas.toDataURL()
}

export function TitleDeformation({ titleRef }: { titleRef: RefObject<HTMLHeadingElement> }) {
  const id = `title-pull-${useId().replace(/:/g, '')}`
  const imageRef = useRef<SVGFEImageElement>(null)
  const displacementRef = useRef<SVGFEDisplacementMapElement>(null)

  useEffect(() => {
    const title = titleRef.current
    const map = imageRef.current
    const displacement = displacementRef.current
    if (!title || !map || !displacement) return
    map.setAttribute('href', createPullMap())
    let frame = 0
    let last = performance.now()
    let strength = 0
    let velocity = 0
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const rect = title.getBoundingClientRect()
      const p = getPointer()
      const quiet = reducedMotion()
      const active = !quiet && p.active && p.screenX >= rect.left &&
        p.screenX <= rect.right && p.screenY >= rect.top && p.screenY <= rect.bottom
      const radius = Math.min(170, Math.max(60, rect.width * 0.12))
      if (active) {
        map.setAttribute('x', `${p.screenX - rect.left - radius}`)
        map.setAttribute('y', `${p.screenY - rect.top - radius}`)
        map.setAttribute('width', `${radius * 2}`)
        map.setAttribute('height', `${radius * 2}`)
      }
      const next = springStep(strength, velocity, active ? Math.min(18, radius * 0.14) : 0, 13, dt)
      strength = quiet ? 0 : next.position
      velocity = quiet ? 0 : next.velocity
      displacement.setAttribute('scale', strength.toFixed(3))
      title.style.filter = strength > 0.05 ? `url(#${id})` : ''
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      title.style.filter = ''
    }
  }, [id, titleRef])

  return (
    <svg width="0" height="0" aria-hidden style={{ position: 'absolute', pointerEvents: 'none' }}>
      <defs>
        <filter id={id} x="-5%" y="-10%" width="110%" height="120%" colorInterpolationFilters="sRGB">
          <feFlood floodColor="rgb(128,128,128)" result="neutral" />
          <feImage ref={imageRef} x="0" y="0" width="1" height="1" result="pull" />
          <feComposite in="pull" in2="neutral" operator="over" result="map" />
          <feDisplacementMap ref={displacementRef} in="SourceGraphic" in2="map" scale="0" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  )
}
