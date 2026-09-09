import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

await mkdir('artifacts', { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
page.on('pageerror', error => console.log('PAGE ERROR:', error.message))
await page.goto('http://127.0.0.1:5173/')
await page.waitForTimeout(2500)
await page.screenshot({ path: 'artifacts/before-hero.png' })
await page.evaluate(() => window.scrollTo(0, window.innerHeight))
await page.waitForTimeout(1500)
await page.screenshot({ path: 'artifacts/before-scene.png' })
await page.goto('http://127.0.0.1:5173/')
const metadata = await page.evaluate(async () => {
  document.body.innerHTML = ''
  const video = document.createElement('video')
  video.src = '/demo mouse interaction with ui and 3d.mp4'
  video.muted = true
  await new Promise((resolve, reject) => { video.onloadedmetadata = resolve; video.onerror = reject })
  const canvas = document.createElement('canvas')
  canvas.width = 1440
  canvas.height = 1080
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')
  for (let i = 0; i < 9; i++) {
    const time = 0.1 + (video.duration - 0.2) * i / 8
    await new Promise(resolve => { video.onseeked = resolve; video.currentTime = time })
    const x = (i % 3) * 480, y = Math.floor(i / 3) * 360
    ctx.drawImage(video, x, y, 480, 330)
    ctx.fillStyle = '#fff'; ctx.fillRect(x, y + 330, 480, 30)
    ctx.fillStyle = '#222'; ctx.font = '18px sans-serif'; ctx.fillText(time.toFixed(2) + 's', x + 12, y + 352)
  }
  return { duration: video.duration, width: video.videoWidth, height: video.videoHeight }
})
console.log('VIDEO', metadata)
await page.setViewportSize({ width: 1440, height: 1080 })
await page.screenshot({ path: 'artifacts/reference-video.png' })
for (const name of ['diffuse', 'normal', 'roughness', 'face']) {
  await page.goto('http://127.0.0.1:5173/')
  await page.evaluate(async name => {
    const THREE = await import('/node_modules/three/build/three.module.js')
    const { KTX2Loader } = await import('/node_modules/three/examples/jsm/loaders/KTX2Loader.js')
    document.body.innerHTML = ''
    const renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true })
    const loader = new KTX2Loader().setTranscoderPath('/node_modules/three/examples/jsm/libs/basis/').detectSupport(renderer)
    const filename = name === 'face' ? 'face-atlas_half_etc1s.ktx2' : `atlas-${name}_half_etc1s.ktx2`
    const texture = await loader.loadAsync('/' + filename)
    texture.colorSpace = THREE.SRGBColorSpace
    renderer.setSize(texture.image.width, texture.image.height)
    document.body.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#ffffff')
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: texture, transparent: true })))
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 5)
    camera.position.z = 2
    renderer.render(scene, camera)
    loader.dispose()
  }, name)
  await page.locator('canvas').last().screenshot({ path: `artifacts/atlas-${name}.png` })
}
await browser.close()
