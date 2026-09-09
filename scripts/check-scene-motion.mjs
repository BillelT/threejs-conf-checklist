import { chromium, expect } from '@playwright/test'
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await page.goto('http://127.0.0.1:5173/')
  await page.locator('canvas[aria-busy="false"]').waitFor()
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(800)
  const result = await page.evaluate(async () => {
    const source = await (await fetch('/src/scene/Experience.tsx')).text()
    const url = source.match(/from ["']([^"']*@react-three_fiber[^"']*)["']/)[1]
    const fiber = await import(url)
    window.sceneState = fiber._roots.get(document.querySelector('canvas')).store.getState()
    const { scene, camera } = window.sceneState
    const balls = scene.getObjectByName('balls').children
    const points = balls.map(ball => ball.getWorldPosition(ball.position.clone()).project(camera))
    const ball = balls.find((ball, i) => points[i].x > -0.3 && points[i].x < 0.3 && points[i].y > -0.3 && points[i].y < 0.3)
    window.testBall = ball
    const point = ball.getWorldPosition(ball.position.clone()).project(camera)
    return { left: Math.min(...points.map(p => p.x)), right: Math.max(...points.map(p => p.x)), bottom: Math.min(...points.map(p => p.y)), x: (point.x + 1) * innerWidth / 2, y: (1 - point.y) * innerHeight / 2 }
  })
  expect(result.left).toBeLessThan(-1)
  expect(result.right).toBeGreaterThan(1)
  expect(result.bottom).toBeLessThan(-1)
  const rotation = await page.locator('.bag-target svg').evaluate(el => getComputedStyle(el).transform)
  await page.mouse.move(result.x - 55, result.y)
  await page.waitForTimeout(800)
  const face = await page.evaluate(() => {
    const f = window.testBall.children.find(child => child.name.startsWith('face-'))
    return { x: f.rotation.x, y: f.rotation.y, z: f.rotation.z }
  })
  expect(face.x).toBe(0)
  expect(face.y).toBe(0)
  expect(face.z).toBeGreaterThan(0.02)
  expect(await page.locator('.bag-target svg').evaluate(el => getComputedStyle(el).transform)).not.toBe(rotation)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  expect(await page.locator('.bag-target svg').evaluate(el => getComputedStyle(el).animationName)).toBe('none')
  console.log('PASS: balls beyond left/right/bottom, faces roll away and stay camera-facing, infinite ring rotation, reduced-motion support')
} finally { await browser.close() }
