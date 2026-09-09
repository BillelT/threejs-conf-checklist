import { useEffect, useMemo } from 'react'
import { Vector2 } from 'three'
import { atlasTile, useAtlases } from '../materials'

export function ToyMaterial({ color, roughness = 0.4, metalness = 0.05 }: { color: string; roughness?: number; metalness?: number }) {
  const atlases = useAtlases()
  const normal = useMemo(() => atlasTile(atlases[1], 1, 0, 3, 2), [atlases])
  const normalScale = useMemo(() => new Vector2(0.2, 0.2), [])
  useEffect(() => () => normal.dispose(), [normal])
  return <meshPhysicalMaterial color={color} normalMap={normal} normalScale={normalScale} roughness={roughness} metalness={metalness} clearcoat={0.12} clearcoatRoughness={0.45} envMapIntensity={0.65} />
}
