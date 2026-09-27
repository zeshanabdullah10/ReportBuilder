import { expect, test, type Page } from '@playwright/test'

const mod = process.platform === 'darwin' ? 'Meta' : 'Control'

async function openStarter(page: Page, name = 'ATE Final Test') {
  await page.goto('/')
  await page.getByRole('button', { name: `New ${name}` }).click()
  await expect(page.locator('.page .svg svg').first()).toBeVisible()
  await expect(page.locator('.canvas-status')).toContainText('page')
}

function watchErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  return errors
}

test('welcome gallery shows starters with live thumbnails', async ({ page }) => {
  const errors = watchErrors(page)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Create a report' })).toBeVisible()
  await expect(page.locator('.starter')).toHaveCount(6)
  await expect(page.locator('.starter .thumb svg')).toHaveCount(6, { timeout: 20_000 })
  expect(errors).toEqual([])
})

test('clicking the page selects the block under the pointer', async ({ page }) => {
  const errors = watchErrors(page)
  await openStarter(page)
  const pg = page.locator('.page').first()
  const box = (await pg.boundingBox())!
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.45)
  await expect(page.locator('.inspector-head .title')).toContainText('Measurements')
  await expect(page.locator('.hit.selected')).toBeVisible()
  await expect(page.locator('.tree-row.selected')).toContainText('Measurements')
  // Escape returns to document settings.
  await page.locator('.canvas').click({ position: { x: 5, y: 5 } })
  await expect(page.locator('.inspector-head .title')).toContainText('Document')
  expect(errors).toEqual([])
})

test('editing in the inspector re-renders, and undo/redo work', async ({ page }) => {
  await openStarter(page)
  const svg = page.locator('.page .svg').first()
  const before = await svg.innerHTML()
  await page.locator('.tree-row', { hasText: 'Heading' }).first().click()
  const input = page.getByLabel('Heading text')
  await input.fill('Burn-in Test {{ dut.serial }}')
  await expect.poll(() => svg.innerHTML()).not.toBe(before)
  await expect(page.locator('.tree-row.selected')).toContainText('Burn-in Test')
  await page.locator('.canvas').click({ position: { x: 5, y: 5 } })
  await page.keyboard.press(`${mod}+z`)
  await expect(page.locator('.tree-row', { hasText: 'Burn-in Test' })).toHaveCount(0)
  await page.keyboard.press(`${mod}+Shift+z`)
  await expect(page.locator('.tree-row', { hasText: 'Burn-in Test' })).toHaveCount(1)
})

test('library inserts after the selection; delete removes', async ({ page }) => {
  await openStarter(page, 'Blank Report')
  await page.locator('.tree-row', { hasText: 'Heading' }).first().click()
  await page.getByRole('tab', { name: 'Insert' }).click()
  await page.getByPlaceholder('Search blocks').fill('gauge')
  await page.locator('.tile', { hasText: 'Gauge' }).click()
  await expect(page.locator('.inspector-head .title')).toContainText('Gauge')
  await page.getByRole('tab', { name: 'Outline' }).click()
  const bodyRows = page.locator('.tree-row')
  await expect(bodyRows.filter({ hasText: 'Gauge' })).toHaveCount(1)
  await page.locator('.canvas').click({ position: { x: 5, y: 5 } })
  await bodyRows.filter({ hasText: 'Gauge' }).click()
  await page.keyboard.press('Delete')
  await expect(bodyRows.filter({ hasText: 'Gauge' })).toHaveCount(0)
})

test('command palette inserts blocks and navigates', async ({ page }) => {
  await openStarter(page, 'Blank Report')
  await page.keyboard.press(`${mod}+k`)
  await page.getByPlaceholder(/Type a command/).fill('insert chart')
  await page.keyboard.press('Enter')
  await expect(page.locator('.inspector-head .title')).toContainText('Chart')
  await page.keyboard.press(`${mod}+k`)
  await page.getByPlaceholder(/Type a command/).fill('heading')
  await expect(page.locator('.palette-item').first()).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('.palette')).toHaveCount(0)
})

test('data panel: live JSON edits, validation and generated edge-case sets', async ({ page }) => {
  await openStarter(page)
  await page.getByRole('tab', { name: 'Data' }).click()
  const editor = page.getByLabel('Data JSON')
  await editor.fill('{ not json')
  await expect(page.locator('.json-status.bad')).toBeVisible()
  await page.getByLabel('Active data set').selectOption({ label: 'Empty (missing data)' })
  await expect(page.locator('.issue.warning').first()).toBeVisible()
  await expect(page.getByRole('button', { name: /warning/ })).toBeVisible()
  await page.getByLabel('Active data set').selectOption({ label: 'Stress test (long lists)' })
  await expect.poll(async () => page.locator('.page').count(), { timeout: 20_000 }).toBeGreaterThan(3)
})

test('outline drag and drop reorders blocks', async ({ page }) => {
  await openStarter(page, 'Blank Report')
  const rows = page.locator('.tree-row')
  const texts = async () => page.locator('.tree .tree-row .label').allInnerTexts()
  const heading = rows.filter({ hasText: 'Heading' }).first()
  const text = rows.filter({ hasText: 'Start adding blocks' }).first()
  await text.dragTo(heading, { targetPosition: { x: 20, y: 2 } })
  await expect.poll(async () => {
    const order = await texts()
    return order.indexOf('Text') < order.indexOf('Heading')
  }).toBe(true)
})

test('export downloads a real PDF', async ({ page }) => {
  await openStarter(page)
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export PDF' }).click()
  const d = await download
  expect(d.suggestedFilename()).toBe('ATE Final Test Report.pdf')
  const path = await d.path()
  const fs = await import('node:fs')
  expect(fs.readFileSync(path!).subarray(0, 4).toString()).toBe('%PDF')
})
