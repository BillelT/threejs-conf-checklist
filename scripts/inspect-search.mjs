import { chromium } from '@playwright/test'
const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
await page.goto('http://127.0.0.1:5173/')
await page.locator('canvas[aria-busy="false"]').waitFor()
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
await page.waitForTimeout(1200)
const point = await page.evaluate(async () => {
  const source = await (await fetch('/src/scene/Experience.tsx')).text()
  const url = source.match(/from ["']([^"']*@react-three_fiber[^"']*)["']/)[1]
  const fiber = await import(url)
  const state = fiber._roots.get(document.querySelector('canvas')).store.getState()
  const ids = ['notebook', 'toothbrush', 'pen', 'laptop', 'badge', 'blender']
  const positions = Object.fromEntries(ids.map(id => {
    const item = state.scene.getObjectByName(id)
    const p = item.getWorldPosition(item.position.clone()).project(state.camera)
    return [id, { x: (p.x + 1) * innerWidth / 2, y: (1 - p.y) * innerHeight / 2 }]
  }))
  const ring = document.querySelector('.bag-target').getBoundingClientRect()
  return { positions, bag: { x: ring.x + ring.width / 2, y: ring.y + ring.height / 2 } }
})
console.log(point)
await page.screenshot({ path: 'artifacts/search-covered.png' })
await page.mouse.move(point.positions.notebook.x, point.positions.notebook.y)
await page.waitForTimeout(1000)
await page.screenshot({ path: 'artifacts/search-revealed.png' })
console.log('CURSOR', await page.locator('body').evaluate(e=>e.style.cursor))
await browser.close()
