import { test, expect, type Page } from '@playwright/test'
import { springStep } from '../src/lib/motion'

const objectPositions = [
  [271, 576], [704, 800], [720, 585], [1148, 580], [292, 796], [1153, 802]
] as const
const bagPosition = [472, 221] as const

async function openScene(page: Page) {
  await page.goto('/')
  await expect(page.locator('canvas')).toBeVisible()
  await expect(page.locator('canvas')).toHaveAttribute('aria-busy', 'false')
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(1000)
}

async function reveal(page: Page, x: number, y: number) {
  await page.mouse.move(x, y)
  await expect(page.locator('body')).toHaveCSS('cursor', 'grab', { timeout: 3000 })
}

test('spring settles identically at 30, 60 and 144 Hz without overshoot', () => {
  const endpoints = [30, 60, 144].map(fps => {
    let position = 0, velocity = 0
    for (let i = 0; i < fps; i++) {
      const next = springStep(position, velocity, 1, 9, 1 / fps)
      expect(next.position).toBeGreaterThanOrEqual(position)
      expect(next.position).toBeLessThanOrEqual(1)
      position = next.position; velocity = next.velocity
    }
    return position
  })
  expect(endpoints[0]).toBeGreaterThan(0.998)
  expect(endpoints[0]).toBeCloseTo(endpoints[1], 10)
  expect(endpoints[0]).toBeCloseTo(endpoints[2], 10)
})

test('balls hide objects, reveal them under the cursor, then allow collection', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await openScene(page)
  for (const [i, [x, y]] of objectPositions.entries()) {
    await reveal(page, x, y)
    await page.mouse.down()
    await page.mouse.move(...bagPosition, { steps: 14 })
    await page.mouse.up()
    await expect(page.locator('.clist__items li.is-done')).toHaveCount(i + 1)
  }
  await page.reload()
  await expect(page.locator('.clist__items li.is-done')).toHaveCount(6)
  expect(errors).toEqual([])
})

test('a drop outside the bag returns the object and cancellation releases it', async ({ page }) => {
  await openScene(page)
  await reveal(page, ...objectPositions[0])
  await page.mouse.down()
  await page.mouse.move(720, 210, { steps: 10 })
  await page.mouse.up()
  await expect(page.locator('.clist__items li.is-done')).toHaveCount(0)
  await page.waitForTimeout(1000)
  await reveal(page, ...objectPositions[0])
  await page.mouse.down()
  await page.evaluate(() => window.dispatchEvent(new Event('blur')))
  await expect(page.locator('body')).not.toHaveCSS('cursor', 'grabbing')
  await page.mouse.up()
  await expect(page.locator('.clist__items li.is-done')).toHaveCount(0)
})

test('UI deformation stays bounded and returns to rest', async ({ page }) => {
  await openScene(page)
  const path = page.locator('.clist__card > svg > path')
  const before = await path.boundingBox()
  await page.mouse.move(1145, 160)
  await page.waitForTimeout(500)
  const during = await path.boundingBox()
  expect(Math.abs(during!.width - before!.width)).toBeLessThan(12)
  expect(Math.abs(during!.height - before!.height)).toBeLessThan(12)
  await page.mouse.move(50, 50)
  await expect.poll(async () => Math.abs((await path.boundingBox())!.width - before!.width)).toBeLessThan(0.2)
})

test('mobile scene needs only a short scroll and responds to touch', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.locator('canvas')).toHaveAttribute('aria-busy', 'false')
  const maxScroll = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
  expect(maxScroll).toBeGreaterThan(80)
  expect(maxScroll).toBeLessThan(300)
  const cdp = await context.newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 30, y: 740 }] })
  for (let y = 700; y >= 580; y -= 30) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 30, y }] })
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(60)
  await context.close()
})
