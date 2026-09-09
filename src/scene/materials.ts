import { useLoader, useThree } from '@react-three/fiber'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import * as THREE from 'three'

const base = `${import.meta.env.BASE_URL}textures/`
const urls = ['atlas-diffuse', 'atlas-normal', 'atlas-roughness', 'face-atlas'].map(name => `${base}${name}_half_etc1s.ktx2`)

export function useAtlases() {
  const gl = useThree(state => state.gl)
  return useLoader(KTX2Loader, urls, loader => {
    loader.setTranscoderPath(`${import.meta.env.BASE_URL}basis/`).setWorkerLimit(2).detectSupport(gl)
  })
}

/** Inset atlas cells by one pixel to prevent neighbouring tiles from bleeding. */
export function atlasTile(source: THREE.Texture, column: number, row: number, columns: number, rows: number, color = false) {
  const texture = source.clone()
  const insetX = 1 / source.image.width
  const insetY = 1 / source.image.height
  texture.repeat.set(1 / columns - insetX * 2, 1 / rows - insetY * 2)
  texture.offset.set(column / columns + insetX, 1 - (row + 1) / rows + insetY)
  texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.needsUpdate = true
  return texture
}

export function createBallMaterial(atlases: THREE.Texture[], variant: number) {
  const palettes = [
    ['#7a13d2', '#f4a8f0'], ['#d92a56', '#f7beb8'], ['#378c78', '#cfe8a0'],
    ['#6960dd', '#d4b874'], ['#df4a91', '#f0c3df'], ['#b8a8dd', '#f0ebfc'],
    ['#f0ce55', '#aa8fd1'], ['#334abb', '#a8b3f2'], ['#b90fbe', '#df9a42']
  ]
  const [baseColor, accent] = palettes[variant % palettes.length]
  const pattern = [0, 2, 3][variant % 3]
  const surface = [1, 3, 5, 0][variant % 4]
  const map = atlasTile(atlases[0], pattern % 2, Math.floor(pattern / 2), 2, 2)
  const normalMap = atlasTile(atlases[1], surface % 3, Math.floor(surface / 3), 3, 2)
  const roughnessMap = atlasTile(atlases[2], surface % 3, Math.floor(surface / 3), 3, 2)
  const material = new THREE.MeshPhysicalMaterial({
    color: baseColor, map, normalMap, roughnessMap,
    normalScale: new THREE.Vector2(0.45, 0.45),
    roughness: 0.85, metalness: variant % 3 === 0 ? 0.55 : 0.22,
    clearcoat: 0.18, clearcoatRoughness: 0.4, envMapIntensity: 0.85
  })
  material.onBeforeCompile = shader => {
    shader.uniforms.accentColor = { value: new THREE.Color(accent) }
    shader.fragmentShader = `uniform vec3 accentColor;\n${shader.fragmentShader}`.replace(
      '#include <map_fragment>',
      'float patternMask = texture2D(map, vMapUv).r; diffuseColor.rgb = mix(diffuseColor.rgb, accentColor, smoothstep(0.15, 0.85, patternMask));'
    )
  }
  material.customProgramCacheKey = () => 'ball-atlas-two-colors-v1'
  return material
}

export function disposeMaterial(material: THREE.MeshStandardMaterial) {
  material.map?.dispose()
  material.normalMap?.dispose()
  material.roughnessMap?.dispose()
  material.dispose()
}
