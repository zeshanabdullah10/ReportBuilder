import { expect, test, type Page } from '@playwright/test'

const mod = process.platform === 'darwin' ? 'Meta' : 'Control'

async function openStarter(page: Page, name = 'ATE Final Test') {
  await page.goto('/')
  await page.getByRole('button', { name: `New ${name}` }).click()
  await expect(page.locator('.page .svg svg').first()).toBeVisible()
  await expect(page.locator('.canvas-status')).toContainText('page')
  await page.getByRole('tab', { name: 'Layers' }).click()
}

function watchErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  return errors
}

const DATA = {
  unit: { SN: 'X-100', product: 'Widget' },
  operator: 'Sam',
  results: [
    { test: 'Voltage', reading: 5.01, lsl: 4.75, usl: 5.25, unit: 'V' },
    { test: 'Current', reading: 1.2, lsl: 0.5, usl: 1.0, unit: 'A' },
  ],
  log: [{ time: '2026-03-01T10:00:00Z', message: 'Started' }],
}

async function startFromData(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Paste JSON' }).click()
  await page.locator('.dz-paste textarea').fill(JSON.stringify(DATA))
  await page.getByRole('button', { name: 'Use this data' }).click()
  await expect(page.locator('.using-data')).toContainText('Pasted data')
}

test('starting from your data: draft builds blocks from the fields', async ({ page }) => {
  const errors = watchErrors(page)
  await startFromData(page)
  await page.getByRole('button', { name: 'Build a report from your data' }).click()
  await expect(page.locator('.page .svg svg').first()).toBeVisible()
  await page.getByRole('tab', { name: 'Layers' }).click()
  const labels = page.locator('.tree .tree-row .label')
  await expect(labels.filter({ hasText: 'Measurements' })).toHaveCount(1)
  await expect(labels.filter({ hasText: 'Table' })).toHaveCount(1)
  await expect(page.locator('.issue.warning')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('a template that reads other field names offers to match them', async ({ page }) => {
  await startFromData(page)
  await page.locator('.starter-grid').last().getByRole('button', { name: 'New ATE Final Test' }).click()
  const dialog = page.getByRole('dialog', { name: 'Match fields' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByLabel('Field for dut.serial')).toHaveValue('unit.SN')
  await expect(dialog.getByLabel('Field for measurements')).toHaveValue('results')
  await dialog.getByRole('button', { name: 'Create report' }).click()
  await expect(page.locator('.page .svg svg').first()).toBeVisible()
  // What could be matched is matched; only fields the data really lacks are reported.
  await expect(page.locator('.issue.warning', { hasText: "'dut.serial'" })).toHaveCount(0)
  await expect(page.locator('.issue.warning', { hasText: "'measurements'" })).toHaveCount(0)
})

test('dragging a field from the data tree onto the page creates a block', async ({ page }) => {
  const errors = watchErrors(page)
  await startFromData(page)
  await page.locator('.starter-grid').last().getByRole('button', { name: 'New Blank Report' }).click()
  // The blank template reads a `title` this data lacks: leave it empty.
  await page.getByRole('button', { name: 'Create report' }).click()
  await expect(page.locator('.page .svg svg').first()).toBeVisible()
  await page.getByRole('tab', { name: 'Data' }).click()
  const field = page.locator('.field-row', { hasText: 'results' }).first()
  await expect(field).toBeVisible()
  const pg = (await page.locator('.page').first().boundingBox())!
  await field.dragTo(page.locator('.page').first(), { targetPosition: { x: pg.width / 2, y: pg.height * 0.6 } })
  await page.getByRole('tab', { name: 'Layers' }).click()
  await expect(page.locator('.tree .tree-row .label', { hasText: 'Measurements' })).toHaveCount(1)
  expect(errors).toEqual([])
})

test('dropping a block on the side of another puts them side by side', async ({ page }) => {
  await openStarter(page, 'Blank Report')
  await page.getByRole('tab', { name: 'Layers' }).click()
  await page.locator('.tree-row', { hasText: 'Heading' }).first().click()
  const hit = (await page.locator('.hit.selected').boundingBox())!
  await page.getByRole('button', { name: 'Add block' }).click()
  await page.getByPlaceholder('Add a block…').fill('qr')
  const item = page.locator('.add-item', { hasText: 'QR code' })
  const from = (await item.boundingBox())!
  await page.mouse.move(from.x + 20, from.y + 10)
  await page.mouse.down()
  await page.mouse.move(from.x + 40, from.y + 30, { steps: 4 })
  await page.mouse.move(hit.x + hit.width - 8, hit.y + hit.height / 2, { steps: 12 })
  await expect(page.locator('.drop-edge')).toBeVisible()
  await page.mouse.up()
  // The blank template's footer already has one columns block.
  await expect(page.locator('.tree .tree-row .label', { hasText: 'Columns' })).toHaveCount(2)
  await expect(page.locator('.tree .tree-row .label', { hasText: 'QR code' })).toHaveCount(1)
})

test('double-click edits text in place; fields are chips with live values', async ({ page }) => {
  const errors = watchErrors(page)
  await openStarter(page)
  await page.locator('.tree-row', { hasText: 'Heading' }).first().click()
  const hit = (await page.locator('.hit.selected').boundingBox())!
  await page.mouse.dblclick(hit.x + hit.width / 2, hit.y + hit.height / 2)
  const editor = page.locator('.inline-editor .tpl-editor')
  await expect(editor).toBeVisible()
  // {{ test.name }} shows its value, not the expression.
  await expect(editor.locator('.chip').first()).toContainText('Final Functional Test')
  await page.keyboard.press('End')
  await page.keyboard.type(' - ')
  await page.keyboard.type('{')
  await expect(page.locator('.picker')).toBeVisible()
  await page.keyboard.type('dut.serial')
  await page.keyboard.press('Enter')
  await expect(editor.locator('.chip')).toHaveCount(2)
  await page.keyboard.press('Escape')
  await expect(page.locator('.tree-row', { hasText: '{{ dut.serial }}' }).first()).toBeVisible()
  expect(errors).toEqual([])
})

test('a field binding is picked from a list, not typed', async ({ page }) => {
  await openStarter(page)
  await page.locator('.tree-row', { has: page.locator('.label', { hasText: /^Measurements$/ }) }).click()
  await page.locator('.binding-btn').first().click()
  await expect(page.locator('.picker')).toBeVisible()
  await page.locator('.pick-item', { hasText: 'measurements' }).first().click()
  await expect(page.locator('.binding-btn .p').first()).toHaveText('measurements')
})

test('column presets reshape a columns block', async ({ page }) => {
  await openStarter(page, 'Blank Report')
  await page.getByRole('button', { name: 'Add block' }).click()
  await page.getByPlaceholder('Add a block…').fill('columns')
  await page.keyboard.press('Enter')
  await expect(page.locator('.inspector-head .title')).toContainText('Columns')
  await page.locator('.preset').nth(3).click()
  await expect(page.locator('.field', { hasText: 'Column 3' })).toBeVisible()
})

test('use panel shows the data contract and call snippets', async ({ page }) => {
  await openStarter(page)
  await page.getByRole('button', { name: 'Use', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Use this template' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.contract-chip').first()).toBeVisible()
  await expect(dialog.locator('.snippet.call')).toContainText('rb_render_file')
  await dialog.getByRole('tab', { name: 'Command line' }).click()
  await expect(dialog.locator('.snippet.call')).toContainText('report-cli render')
  // Typed structures generated from the contract.
  await expect(dialog.locator('.snippet.types')).toContainText('Cluster')
  await dialog.getByRole('tab', { name: 'C#' }).click()
  await expect(dialog.locator('.snippet.types')).toContainText('public class')
})

test('welcome gallery shows starters with live thumbnails', async ({ page }) => {
  const errors = watchErrors(page)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Create a report' })).toBeVisible()
  await expect(page.locator('.starter').nth(17)).toBeVisible()
  const total = await page.locator('.starter').count()
  expect(total).toBeGreaterThanOrEqual(18)
  await expect(page.locator('.starter .thumb svg')).toHaveCount(total, { timeout: 30_000 })
  // Categories filter the gallery.
  await page.getByRole('tab', { name: 'Certificates and labels' }).click()
  await expect(page.locator('.starter')).toHaveCount(3)
  await page.getByRole('tab', { name: 'All' }).click()
  await expect(page.locator('.starter')).toHaveCount(total)
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

test('add menu inserts after the selection; delete removes', async ({ page }) => {
  await openStarter(page, 'Blank Report')
  await page.getByRole('tab', { name: 'Layers' }).click()
  await page.locator('.tree-row', { hasText: 'Heading' }).first().click()
  await page.getByRole('button', { name: 'Add block' }).click()
  await page.getByPlaceholder('Add a block…').fill('gauge')
  await page.locator('.add-item', { hasText: 'Gauge' }).click()
  await expect(page.locator('.inspector-head .title')).toContainText('Gauge')
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
  await page.getByRole('button', { name: 'JSON', exact: true }).click()
  const editor = page.getByRole('textbox', { name: 'Data JSON' })
  await editor.fill('{ not json')
  await expect(page.locator('.json-status.bad')).toBeVisible()
  await page.keyboard.press('Escape')
  await page.getByLabel('Active data set').selectOption({ label: 'Empty (missing data)' })
  await expect(page.locator('.issue.warning').first()).toBeVisible()
  await expect(page.getByRole('button', { name: /warning/ })).toBeVisible()
  await page.getByLabel('Active data set').selectOption({ label: 'Stress test (long lists)' })
  await expect.poll(async () => page.locator('.page').count(), { timeout: 20_000 }).toBeGreaterThan(3)
})

test('layers drag and drop reorders blocks', async ({ page }) => {
  await openStarter(page, 'Blank Report')
  await page.getByRole('tab', { name: 'Layers' }).click()
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
