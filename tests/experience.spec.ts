import { test, expect, type Page } from '@playwright/test'
import { springStep } from '../src/lib/motion'

async function openScene(page: Page) {
  await page.goto('/')
  await expect(page.locator('canvas')).toBeVisible()
  await expect(page.locator('canvas')).toHaveAttribute('aria-busy', 'false')
  await page.evaluate(() => window.scrollTo(0, window.innerHeight))
  await page.waitForTimeout(1600)
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

test('all six objects can be dragged into the bag and remain packed after reload', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await openScene(page)
  // Reference screen positions, also ensuring the rendered objects are actually hit-testable.
  const objects = [[551, 278], [747, 705], [875, 290], [1109, 520], [511, 705], [1020, 749]]
  for (const [i, [x, y]] of objects.entries()) {
    await page.mouse.move(x, y)
    await expect(page.locator('body')).toHaveCSS('cursor', 'grab')
    await page.mouse.down()
    await page.mouse.move(248, 472, { steps: 14 })
    await page.mouse.up()
    await expect(page.locator('.clist__count')).toHaveText(`${i + 1} / 6`)
    await page.waitForTimeout(200)
  }
  await page.reload()
  await expect(page.locator('.clist__count')).toHaveText('6 / 6')
  expect(errors).toEqual([])
})

test('a drop outside the bag returns the item; pointer cancellation releases it', async ({ page }) => {
  await openScene(page)
  await page.mouse.move(551, 278)
  await page.mouse.down()
  await page.mouse.move(710, 180, { steps: 10 })
  await page.mouse.up()
  await expect(page.locator('.clist__count')).toHaveText('0 / 6')
  await page.waitForTimeout(1000)
  await page.mouse.move(551, 278)
  await expect(page.locator('body')).toHaveCSS('cursor', 'grab')
  await page.mouse.down()
  await page.evaluate(() => window.dispatchEvent(new Event('blur')))
  await expect(page.locator('body')).not.toHaveCSS('cursor', 'grabbing')
  await page.mouse.up()
  await expect(page.locator('.clist__count')).toHaveText('0 / 6')
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

test('mobile touch can scroll the empty scene and pack an object', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.locator('canvas')).toHaveAttribute('aria-busy', 'false')
  await page.waitForTimeout(500)
  const cdp = await context.newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 50, y: 740 }] })
  for (let y = 700; y >= 250; y -= 50) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 50, y }] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(200)
  await page.evaluate(() => window.scrollTo(0, window.innerHeight))
  await page.waitForTimeout(1600)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 90, y: 405 }] })
  for (let y = 420; y <= 600; y += 20) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 94, y }] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect(page.locator('.clist__count')).toHaveText('1 / 6')
  await context.close()
})
