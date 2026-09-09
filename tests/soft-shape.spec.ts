import { test, expect } from '@playwright/test'

test('return has a light bounce at different frame rates', async () => {
  const { springStep } = await import('../src/lib/motion')
  for (const fps of [30, 60, 144]) {
    let position = 5, velocity = 0, minimum = 0
    for (let i = 0; i < fps * 3; i++) {
      const next = springStep(position, velocity, 0, 7.5, 1 / fps, 0.65)
      position = next.position
      velocity = next.velocity
      minimum = Math.min(minimum, position)
    }
    expect(minimum).toBeLessThan(-0.2)
    expect(minimum).toBeGreaterThan(-0.5)
    expect(Math.abs(position)).toBeLessThan(0.001)
  }
})

test('heading reacts outside its bounds', async ({ page }) => {
  await page.goto('/')
  const box = (await page.locator('h1').boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height + 40)
  const displacement = page.locator('feDisplacementMap')
  await expect.poll(async () => Number(await displacement.getAttribute('scale'))).toBeGreaterThan(20)
  await page.evaluate(() => window.dispatchEvent(new Event('blur')))
  await expect.poll(async () => Math.abs(Number(await displacement.getAttribute('scale')))).toBeLessThan(0.05)
})

test('soft UI reacts outside its bounds and settles after the pointer leaves', async ({ page }) => {
  await page.goto('/')
  const card = page.locator('.clist__card')
  await card.scrollIntoViewIfNeeded()
  const path = card.locator(':scope > svg > path')
  await expect(path).not.toHaveAttribute('d', '')
  const rest = await path.getAttribute('d')
  const box = (await card.boundingBox())!
  // The distant pointer leaves the card and its label at rest.
  await page.mouse.move(box.x - 220, box.y + box.height / 2)
  await page.waitForTimeout(400)
  expect((await path.getAttribute('d'))?.replace(/-0\.00/g, '0.00')).toBe(rest?.replace(/-0\.00/g, '0.00'))
  const pill = card.locator('.clist__pill-wrap > svg > path')
  const pillRest = await pill.getAttribute('d')
  await page.mouse.move(box.x - 50, box.y + box.height / 2)
  await expect.poll(() => path.getAttribute('d')).not.toBe(rest)
  await page.waitForTimeout(1200)
  const deformed = (await path.boundingBox())!
  expect(deformed.x).toBeLessThan(box.x - 1)
  expect(deformed.width).toBeLessThan(box.width + 10)
  expect(await pill.getAttribute('d')).toBe(pillRest)
  await page.evaluate(() => window.dispatchEvent(new Event('blur')))
  await expect.poll(async () => (await path.getAttribute('d'))?.replace(/-0\.00/g, '0.00')).toBe(rest?.replace(/-0\.00/g, '0.00'))

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.mouse.move(box.x - 100, box.y + box.height / 2)
  await page.waitForTimeout(400)
  expect((await path.getAttribute('d'))?.replace(/-0\.00/g, '0.00')).toBe(rest?.replace(/-0\.00/g, '0.00'))
})



