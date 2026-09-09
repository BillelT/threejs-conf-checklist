import { useEffect, useMemo } from 'react'
import * as THREE from 'three'

/** Local print texture; no remote font request can interrupt the 3D scene. */
export function PrintedLabel({ badge = false }: { badge?: boolean }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = badge ? 768 : 512
    const ctx = canvas.getContext('2d')!
    if (badge) {
      ctx.fillStyle = '#7461f0'; ctx.fillRect(0, 0, 512, 768)
    } else {
      ctx.fillStyle = '#ff52d0'; ctx.beginPath(); ctx.arc(256, 256, 250, 0, Math.PI * 2); ctx.fill()
    }
    ctx.fillStyle = '#ffed34'
    ctx.font = '900 108px Arial Black, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('THREE', 256, badge ? 140 : 240)
    ctx.fillText('CONF', 256, badge ? 237 : 335)
    if (badge) {
      const gradient = ctx.createRadialGradient(210, 330, 10, 256, 420, 155)
      gradient.addColorStop(0, '#d3b9ff'); gradient.addColorStop(1, '#5133c7')
      ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(256, 420, 143, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#201a31'
      for (const x of [210, 305]) { ctx.beginPath(); ctx.arc(x, 407, 18, 0, Math.PI * 2); ctx.fill() }
      ctx.fillRect(237, 463, 38, 5)
      ctx.fillStyle = '#ffed34'; ctx.font = '900 38px Arial, sans-serif'; ctx.fillText('@THREEJSCONF', 256, 635)
      ctx.fillStyle = '#e1d6ff'; ctx.font = 'bold 30px Arial, sans-serif'; ctx.fillText('10,11 SEPT 2026', 256, 686)
    }
    const result = new THREE.CanvasTexture(canvas)
    result.colorSpace = THREE.SRGBColorSpace
    return result
  }, [badge])
  useEffect(() => () => texture.dispose(), [texture])
  return <meshBasicMaterial map={texture} transparent toneMapped={false} />
}
