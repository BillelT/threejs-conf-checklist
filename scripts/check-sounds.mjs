import { chromium, expect } from '@playwright/test'
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => {
    window.audioStarts = []
    const original = AudioContext.prototype.createOscillator
    AudioContext.prototype.createOscillator = function (...args) {
      const oscillator = original.apply(this, args)
      const start = oscillator.start.bind(oscillator)
      oscillator.start = (...values) => { window.audioStarts.push(performance.now()); return start(...values) }
      return oscillator
    }
  })
  await page.goto('http://127.0.0.1:5173/')
  await page.locator('canvas[aria-busy="false"]').waitFor()
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(700)
  await page.mouse.move(100, 650)
  await page.mouse.move(900, 650, { steps: 20 })
  expect(await page.evaluate(() => window.audioStarts.length)).toBe(0)
  await page.keyboard.press('Shift')
  await page.waitForTimeout(150)
  await page.mouse.move(100, 650, { steps: 30 })
  const count = await page.evaluate(() => window.audioStarts.length)
  expect(count).toBeGreaterThan(0)
  await page.waitForTimeout(400)
  expect(await page.evaluate(() => window.audioStarts.length)).toBe(count)
  await page.evaluate(() => window.scrollBy(0, -120))
  await page.waitForTimeout(200)
  expect(await page.evaluate(() => window.audioStarts.length)).toBe(count)
  const intervals = await page.evaluate(() => window.audioStarts.filter((_, i) => i % 2 === 0).map((t, i, all) => i ? t - all[i - 1] : 999))
  expect(Math.min(...intervals)).toBeGreaterThan(90)
  await page.getByRole('button', { name: 'Mute sound effects' }).click()
  const mutedCount = await page.evaluate(() => window.audioStarts.length)
  await page.mouse.move(1100, 650, { steps: 25 })
  expect(await page.evaluate(() => window.audioStarts.length)).toBe(mutedCount)
  await page.getByRole('button', { name: 'Mute sound effects' }).click()
  await page.evaluate(async () => {
    const { playSound } = await import('/src/lib/sounds.ts')
    for (const name of ['pickup', 'return', 'pack', 'confetti', 'celebrate']) playSound(name)
  })
  await page.waitForTimeout(1600)
  expect(errors).toEqual([])
  console.log('PASS: first-interaction unlock, movement sounds, stationary/scroll silence, rate limit, mute, all sound cues without browser errors')
} finally { await browser.close() }
