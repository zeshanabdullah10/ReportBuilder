# Missing Export Renderers Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 13 missing export renderers so templates with QRCode, Barcode, Logo, Watermark, SignatureLine, Histogram, ScatterPlot, PassRateChart, MeasurementTable, TestSummaryBox, RevisionBlock, SpecBox, and ToleranceBand components export correctly to HTML.

**Architecture:** Each renderer follows the pattern in `lib/export/component-renderers/render-*.ts`: takes `id` and `props`, returns `{ html: string, componentConfig: object | null }`, registers in `index.ts`.

**Tech Stack:** TypeScript, Chart.js (for chart renderers), inline SVG (for QRCode/Barcode), CSS-in-HTML styles

---

## Phase 1: Simple Components

### Task 1: QRCode Renderer

**Files:**
- Create: `lib/export/component-renderers/render-qrcode.ts`
- Modify: `lib/export/component-renderers/index.ts`

**Step 1: Create the renderer file**

```typescript
/**
 * QRCode Component Renderer
 *
 * Renders QRCode components to static HTML with embedded data URL.
 * Note: For export, we use a placeholder that gets rendered at runtime.
 */

import { ComponentRenderer, RendererResult } from './types'
import { generatePositionStyles, combineStyles } from '../utils/style-helpers'

interface QRCodeProps {
  value?: string
  binding?: string
  size?: number
  errorCorrection?: 'L' | 'M' | 'Q' | 'H'
  foregroundColor?: string
  backgroundColor?: string
  showLabel?: boolean
  label?: string
  labelPosition?: 'top' | 'bottom'
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
  visible?: boolean
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Renders a QRCode component to HTML
 */
export const renderQRCode: ComponentRenderer = (id, props): RendererResult => {
  const {
    value = 'https://example.com',
    binding = '',
    size = 100,
    foregroundColor = '#000000',
    backgroundColor = '#FFFFFF',
    showLabel = false,
    label = '',
    labelPosition = 'bottom',
    x = 0,
    y = 0,
    width = 120,
    height = 120,
    zIndex = 1,
    visible = true,
  } = props as QRCodeProps

  if (visible === false) {
    return { html: '', componentConfig: null }
  }

  const positionStyles = generatePositionStyles({ x, y, width, height, zIndex })
  const containerStyles = `display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: ${backgroundColor}; box-sizing: border-box;`
  const allStyles = combineStyles(positionStyles, containerStyles)

  const displayLabel = label || value
  const labelHtml = showLabel
    ? `<div style="font-size: 12px; text-align: center; color: ${foregroundColor}; margin-${labelPosition === 'top' ? 'bottom' : 'top'}: 4px; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(displayLabel)}</div>`
    : ''

  const topLabel = labelPosition === 'top' ? labelHtml : ''
  const bottomLabel = labelPosition === 'bottom' ? labelHtml : ''

  // Use a placeholder div that will be replaced at runtime
  const html = `<div id="${escapeHtml(id)}" data-component="qrcode" style="${allStyles}" data-value="${escapeHtml(value)}" data-binding="${escapeHtml(binding)}" data-size="${size}" data-fg="${foregroundColor}" data-bg="${backgroundColor}">
    ${topLabel}
    <div class="qrcode-placeholder" style="width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; color: #999; font-size: 10px;">
      QR Code
    </div>
    ${bottomLabel}
  </div>`

  const componentConfig = {
    id,
    type: 'QRCode',
    props: {
      value,
      binding: binding || undefined,
      size,
      foregroundColor,
      backgroundColor,
      showLabel,
      label,
      labelPosition,
    },
  }

  return { html, componentConfig }
}
```

**Step 2: Register in index.ts**

Add to imports and renderers object in `lib/export/component-renderers/index.ts`:
```typescript
import { renderQRCode } from './render-qrcode'
// ... in renderers object:
QRCode: renderQRCode,
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add lib/export/component-renderers/render-qrcode.ts lib/export/component-renderers/index.ts
git commit -m "feat: add QRCode export renderer"
```

---

### Task 2: Barcode Renderer

**Files:**
- Create: `lib/export/component-renderers/render-barcode.ts`
- Modify: `lib/export/component-renderers/index.ts`

**Step 1: Create the renderer file**

```typescript
/**
 * Barcode Component Renderer
 *
 * Renders Barcode components to static HTML with SVG placeholder.
 */

import { ComponentRenderer, RendererResult } from './types'
import { generatePositionStyles, combineStyles } from '../utils/style-helpers'

type BarcodeFormat = 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'UPC' | 'ITF14' | 'pharmacode'

interface BarcodeProps {
  value?: string
  binding?: string
  format?: BarcodeFormat
  barWidth?: number
  barHeight?: number
  displayValue?: boolean
  lineColor?: string
  background?: string
  fontSize?: number
  textAlign?: 'left' | 'center' | 'right'
  label?: string
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
  visible?: boolean
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export const renderBarcode: ComponentRenderer = (id, props): RendererResult => {
  const {
    value = '1234567890',
    binding = '',
    format = 'CODE128',
    barWidth = 2,
    barHeight = 100,
    displayValue = true,
    lineColor = '#000000',
    background = '#FFFFFF',
    fontSize = 14,
    textAlign = 'center',
    label = '',
    x = 0,
    y = 0,
    width = 200,
    height = 80,
    zIndex = 1,
    visible = true,
  } = props as BarcodeProps

  if (visible === false) {
    return { html: '', componentConfig: null }
  }

  const positionStyles = generatePositionStyles({ x, y, width, height, zIndex })
  const containerStyles = `display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4px; background-color: ${background}; box-sizing: border-box;`
  const allStyles = combineStyles(positionStyles, containerStyles)

  const labelHtml = label
    ? `<div style="font-size: 12px; text-align: center; margin-bottom: 4px; color: ${lineColor};">${escapeHtml(label)}</div>`
    : ''

  const html = `<div id="${escapeHtml(id)}" data-component="barcode" style="${allStyles}" data-value="${escapeHtml(value)}" data-binding="${escapeHtml(binding)}" data-format="${format}" data-bar-width="${barWidth}" data-bar-height="${barHeight}" data-display-value="${displayValue}" data-line-color="${lineColor}" data-font-size="${fontSize}" data-text-align="${textAlign}">
    ${labelHtml}
    <svg class="barcode-svg" style="max-width: 100%; max-height: 100%; overflow: visible;"></svg>
  </div>`

  const componentConfig = {
    id,
    type: 'Barcode',
    props: {
      value,
      binding: binding || undefined,
      format,
      barWidth,
      barHeight,
      displayValue,
      lineColor,
      background,
      fontSize,
      textAlign,
      label,
    },
  }

  return { html, componentConfig }
}
```

**Step 2: Register in index.ts**

**Step 3: Verify TypeScript compiles**

**Step 4: Commit**

```bash
git add lib/export/component-renderers/render-barcode.ts lib/export/component-renderers/index.ts
git commit -m "feat: add Barcode export renderer"
```

---

### Task 3: Logo Renderer

**Files:**
- Create: `lib/export/component-renderers/render-logo.ts`
- Modify: `lib/export/component-renderers/index.ts`

**Step 1: Create the renderer file**

```typescript
/**
 * Logo Component Renderer
 *
 * Renders Logo components to static HTML with img tag.
 */

import { ComponentRenderer, RendererResult } from './types'
import { generatePositionStyles, combineStyles } from '../utils/style-helpers'

interface LogoProps {
  src?: string
  binding?: string
  width?: number
  height?: number
  maxHeight?: number
  align?: 'left' | 'center' | 'right'
  alt?: string
  fallbackText?: string
  x?: number
  y?: number
  zIndex?: number
  visible?: boolean
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export const renderLogo: ComponentRenderer = (id, props): RendererResult => {
  const {
    src = '',
    binding = '',
    width = 150,
    height = 80,
    maxHeight = 80,
    align = 'left',
    alt = 'Company Logo',
    fallbackText = 'Company Name',
    x = 0,
    y = 0,
    zIndex = 1,
    visible = true,
  } = props as LogoProps

  if (visible === false) {
    return { html: '', componentConfig: null }
  }

  const positionStyles = generatePositionStyles({ x, y, width, height, zIndex })
  const justifyContent = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'
  const containerStyles = `display: flex; align-items: center; justify-content: ${justifyContent}; box-sizing: border-box;`
  const allStyles = combineStyles(positionStyles, containerStyles)

  const content = src
    ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" style="max-width: 100%; max-height: ${maxHeight}px; object-fit: contain;" />`
    : `<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; color: #6b7280; font-weight: 600; font-size: ${Math.min(maxHeight / 3, 16)}px;">${escapeHtml(fallbackText)}</div>`

  const html = `<div id="${escapeHtml(id)}" data-component="logo" style="${allStyles}" data-binding="${escapeHtml(binding)}">
    ${content}
  </div>`

  const componentConfig = binding ? {
    id,
    type: 'Logo',
    props: {
      src,
      binding,
      alt,
      maxHeight,
    },
  } : null

  return { html, componentConfig }
}
```

**Step 2-4: Register, verify, commit**

---

### Task 4: Watermark Renderer

**Files:**
- Create: `lib/export/component-renderers/render-watermark.ts`
- Modify: `lib/export/component-renderers/index.ts`

**Step 1: Create the renderer file**

```typescript
/**
 * Watermark Component Renderer
 *
 * Renders Watermark components with CSS-based repeated text overlay.
 */

import { ComponentRenderer, RendererResult } from './types'
import { generatePositionStyles, combineStyles } from '../utils/style-helpers'

interface WatermarkProps {
  text?: string
  binding?: string
  opacity?: number
  rotation?: number
  fontSize?: number
  fontFamily?: string
  color?: string
  repeat?: boolean
  spacingX?: number
  spacingY?: number
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
  visible?: boolean
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export const renderWatermark: ComponentRenderer = (id, props): RendererResult => {
  const {
    text = 'CONFIDENTIAL',
    binding = '',
    opacity = 0.1,
    rotation = -45,
    fontSize = 48,
    fontFamily = 'Arial, sans-serif',
    color = '#000000',
    repeat = true,
    spacingX = 200,
    spacingY = 150,
    x = 0,
    y = 0,
    width = 500,
    height = 300,
    zIndex = 0,
    visible = true,
  } = props as WatermarkProps

  if (visible === false) {
    return { html: '', componentConfig: null }
  }

  const positionStyles = generatePositionStyles({ x, y, width, height, zIndex })
  const containerStyles = 'position: relative; overflow: hidden; pointer-events: none; box-sizing: border-box;'
  const allStyles = combineStyles(positionStyles, containerStyles)

  // Generate repeated watermark pattern
  const cols = Math.ceil(width / spacingX) + 1
  const rows = Math.ceil(height / spacingY) + 1

  let watermarkItems = ''
  if (repeat) {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        watermarkItems += `<div style="position: absolute; display: flex; align-items: center; justify-content: center; left: ${col * spacingX}px; top: ${row * spacingY}px; width: ${spacingX}px; height: ${spacingY}px; transform: rotate(${rotation}deg);">
          <span style="font-size: ${fontSize}px; font-family: ${fontFamily}; color: ${color}; opacity: ${opacity}; font-weight: bold; white-space: nowrap;">${escapeHtml(text)}</span>
        </div>`
      }
    }
  } else {
    watermarkItems = `<div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; transform: rotate(${rotation}deg);">
      <span style="font-size: ${fontSize}px; font-family: ${fontFamily}; color: ${color}; opacity: ${opacity}; font-weight: bold; white-space: nowrap;">${escapeHtml(text)}</span>
    </div>`
  }

  const html = `<div id="${escapeHtml(id)}" data-component="watermark" style="${allStyles}" data-binding="${escapeHtml(binding)}">
    ${watermarkItems}
  </div>`

  const componentConfig = binding ? {
    id,
    type: 'Watermark',
    props: { text, binding, opacity, rotation, fontSize, fontFamily, color, repeat, spacingX, spacingY },
  } : null

  return { html, componentConfig }
}
```

**Step 2-4: Register, verify, commit**

---

### Task 5: SignatureLine Renderer

**Files:**
- Create: `lib/export/component-renderers/render-signatureline.ts`
- Modify: `lib/export/component-renderers/index.ts`

**Step 1: Create the renderer file**

```typescript
/**
 * SignatureLine Component Renderer
 *
 * Renders SignatureLine components with signature slots.
 */

import { ComponentRenderer, RendererResult } from './types'
import { generatePositionStyles, combineStyles } from '../utils/style-helpers'

interface SignatureSlot {
  label: string
  showDate?: boolean
  showName?: boolean
  nameBinding?: string
  dateBinding?: string
}

interface SignatureLineProps {
  layout?: 'horizontal' | 'vertical'
  signatureCount?: 1 | 2 | 3
  signatures?: SignatureSlot[]
  lineColor?: string
  lineWidth?: number
  labelFontSize?: number
  dateFontSize?: number
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
  visible?: boolean
}

const defaultSignatures: SignatureSlot[] = [
  { label: 'Test Engineer', showDate: true, showName: true },
  { label: 'Quality Manager', showDate: true, showName: true },
  { label: 'Supervisor', showDate: true, showName: true },
]

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export const renderSignatureLine: ComponentRenderer = (id, props): RendererResult => {
  const {
    layout = 'horizontal',
    signatureCount = 1,
    signatures = defaultSignatures,
    lineColor = '#000000',
    lineWidth = 1,
    labelFontSize = 12,
    dateFontSize = 10,
    x = 0,
    y = 0,
    width = 400,
    height = 80,
    zIndex = 1,
    visible = true,
  } = props as SignatureLineProps

  if (visible === false) {
    return { html: '', componentConfig: null }
  }

  const positionStyles = generatePositionStyles({ x, y, width, height, zIndex })
  const flexDirection = layout === 'horizontal' ? 'row' : 'column'
  const containerStyles = `display: flex; flex-direction: ${flexDirection}; background-color: white; box-sizing: border-box;`
  const allStyles = combineStyles(positionStyles, containerStyles)

  const activeSignatures = signatures.slice(0, signatureCount)
  const slotWidth = layout === 'horizontal' ? `${100 / signatureCount}%` : '100%'

  const slotsHtml = activeSignatures.map((sig, index) => `
    <div style="min-width: ${slotWidth}; padding: 8px 16px; box-sizing: border-box;">
      <div style="font-size: ${labelFontSize}px; color: ${lineColor}; font-weight: 500; margin-bottom: 8px;">${escapeHtml(sig.label)}</div>
      <div style="border-bottom: ${lineWidth}px solid ${lineColor}; height: 30px; margin-bottom: 8px;"></div>
      ${sig.showName ? `<div style="display: flex; align-items: center; margin-bottom: 4px;">
        <span style="font-size: ${dateFontSize}px; color: ${lineColor}; margin-right: 4px;">Name:</span>
        <div style="flex: 1; border-bottom: ${lineWidth}px solid ${lineColor}; min-height: 18px; padding-left: 4px; font-size: ${dateFontSize}px;" data-binding="${escapeHtml(sig.nameBinding || '')}"></div>
      </div>` : ''}
      ${sig.showDate ? `<div style="display: flex; align-items: center;">
        <span style="font-size: ${dateFontSize}px; color: ${lineColor}; margin-right: 4px;">Date:</span>
        <div style="flex: 1; border-bottom: ${lineWidth}px solid ${lineColor}; min-height: 18px; padding-left: 4px; font-size: ${dateFontSize}px;" data-binding="${escapeHtml(sig.dateBinding || '')}"></div>
      </div>` : ''}
    </div>
  `).join('')

  const html = `<div id="${escapeHtml(id)}" data-component="signatureline" style="${allStyles}">
    ${slotsHtml}
  </div>`

  const componentConfig = {
    id,
    type: 'SignatureLine',
    props: {
      layout,
      signatureCount,
      signatures: activeSignatures,
      lineColor,
      lineWidth,
    },
  }

  return { html, componentConfig }
}
```

**Step 2-4: Register, verify, commit**

---

## Phase 2: Chart Components

### Task 6: Histogram Renderer

**Files:**
- Create: `lib/export/component-renderers/render-histogram.ts`
- Modify: `lib/export/component-renderers/index.ts`

**Step 1: Create the renderer file**

Follow `render-chart.ts` pattern. Generate Chart.js config with bar chart type, include statistics display.

**Step 2-4: Register, verify, commit**

---

### Task 7: ScatterPlot Renderer

**Files:**
- Create: `lib/export/component-renderers/render-scatterplot.ts`
- Modify: `lib/export/component-renderers/index.ts`

**Step 1: Create the renderer file**

Follow `render-chart.ts` pattern with scatter chart type and correlation display.

**Step 2-4: Register, verify, commit**

---

### Task 8: PassRateChart Renderer

**Files:**
- Create: `lib/export/component-renderers/render-passratechart.ts`
- Modify: `lib/export/component-renderers/index.ts`

**Step 1: Create the renderer file**

Generate either SVG-based donut/pie or bar visualization based on chartType prop.

**Step 2-4: Register, verify, commit**

---

## Phase 3: Complex Components

### Task 9: MeasurementTable Renderer

**Files:**
- Create: `lib/export/component-renderers/render-measurementtable.ts`
- Modify: `lib/export/component-renderers/index.ts`

**Step 1: Create the renderer file**

Generate HTML table with configurable columns, tolerance display, pass/fail status indicators.

**Step 2-4: Register, verify, commit**

---

### Task 10: TestSummaryBox Renderer

**Files:**
- Create: `lib/export/component-renderers/render-testsummarybox.ts`
- Modify: `lib/export/component-renderers/index.ts`

**Step 1: Create the renderer file**

Generate summary display with pass/fail counts, percentages, and status indicator.

**Step 2-4: Register, verify, commit**

---

### Task 11: RevisionBlock Renderer

**Files:**
- Create: `lib/export/component-renderers/render-revisionblock.ts`
- Modify: `lib/export/component-renderers/index.ts`

**Step 1: Create the renderer file**

Generate HTML table with version history rows.

**Step 2-4: Register, verify, commit**

---

### Task 12: SpecBox Renderer

**Files:**
- Create: `lib/export/component-renderers/render-specbox.ts`
- Modify: `lib/export/component-renderers/index.ts`

**Step 1: Create the renderer file**

Generate specification display with nominal, tolerance, measured values and pass/fail status.

**Step 2-4: Register, verify, commit**

---

### Task 13: ToleranceBand Renderer

**Files:**
- Create: `lib/export/component-renderers/render-tolerancetband.ts`
- Modify: `lib/export/component-renderers/index.ts`

**Step 1: Create the renderer file**

Generate SVG-based tolerance band visualization with markers for nominal and measured values.

**Step 2-4: Register, verify, commit**

---

## Phase 4: Final Verification

### Task 14: Run all tests and verify

**Step 1: TypeScript check**
```bash
npx tsc --noEmit
```
Expected: No errors

**Step 2: Run tests**
```bash
npm run test:run
```
Expected: All tests pass

**Step 3: Verify renderer count**
```bash
ls lib/export/component-renderers/render-*.ts | wc -l
```
Expected: 28 renderers (15 existing + 13 new)

**Step 4: Final commit**
```bash
git add .
git commit -m "feat: add all 13 missing export renderers

- QRCode, Barcode, Logo, Watermark, SignatureLine (simple)
- Histogram, ScatterPlot, PassRateChart (charts)
- MeasurementTable, TestSummaryBox, RevisionBlock, SpecBox, ToleranceBand (complex)

All 28 builder components now have export renderers."
```

---

## Success Criteria

- [ ] All 13 renderers implemented
- [ ] All renderers registered in index.ts
- [ ] TypeScript compiles without errors
- [ ] All existing tests pass
- [ ] Each task committed separately
