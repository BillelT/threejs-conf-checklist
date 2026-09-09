import { chromium } from '@playwright/test'
import assert from 'node:assert/strict'

const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('http://127.0.0.1:5173/')
  await page.evaluate(() => document.fonts.ready)
  for (const width of [390, 768, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 })
    await page.waitForTimeout(250)
    const result = await page.locator('.title').evaluate(title => {
      const rect = title.getBoundingClientRect()
      const lines = Array.from(title.querySelectorAll('span'), line => {
        const range = document.createRange()
        range.selectNodeContents(line)
        return { width: range.getBoundingClientRect().width, font: getComputedStyle(line).fontSize }
      })
      return { available: rect.width, left: rect.left, lines }
    })
    assert.equal(new Set(result.lines.map(line => line.font)).size, 1)
    assert.ok(Math.abs(Math.max(...result.lines.map(line => line.width)) - result.available) < 1)
    assert.ok(result.left >= 8 && result.left <= 16)
    console.log(width, JSON.stringify(result))
  }
  await page.mouse.move(550, 115)
  await page.waitForTimeout(700)
  assert.ok(Number(await page.locator('feDisplacementMap').getAttribute('scale')) > 10)
  await page.screenshot({ path: 'artifacts/title-hover.png' })
  await page.mouse.move(1900, 880)
  await page.waitForTimeout(1200)
  assert.equal(await page.locator('.title').evaluate(el => el.style.filter), '')
  await page.screenshot({ path: 'artifacts/title-fit.png' })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.mouse.move(550, 115)
  await page.waitForTimeout(200)
  assert.equal(await page.locator('.title').evaluate(el => el.style.filter), '')
  assert.deepEqual(errors, [])
  console.log('Title fit, hover, spring return and reduced motion passed.')
} finally {
  await browser.close()
}
