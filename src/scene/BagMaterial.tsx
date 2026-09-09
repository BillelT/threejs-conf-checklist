import { useEffect, useMemo } from 'react'
import * as THREE from 'three'

export function BagMaterial({ color, roughness = 0.38, metalness = 0.04 }: { color: string; roughness?: number; metalness?: number }) {
  const grain = useMemo(() => {
    const data = new Uint8Array(128 * 128 * 4)
    let seed = 17
    for (let i = 0; i < data.length; i += 4) {
      seed = (seed * 1664525 + 1013904223) >>> 0
      data[i] = data[i + 1] = data[i + 2] = seed >>> 24
      data[i + 3] = 255
    }
    const texture = new THREE.DataTexture(data, 128, 128)
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(8, 8)
    texture.magFilter = THREE.LinearFilter
    texture.needsUpdate = true
    return texture
  }, [])
  useEffect(() => () => grain.dispose(), [grain])
  return <meshPhysicalMaterial color={color} roughness={roughness} metalness={metalness} bumpMap={grain} bumpScale={0.006} clearcoat={0.28} clearcoatRoughness={0.3} envMapIntensity={0.8} />
}
