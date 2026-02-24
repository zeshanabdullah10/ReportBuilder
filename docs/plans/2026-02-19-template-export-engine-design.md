# Template Export Engine - Phase 5 Design Document

**Date:** 2026-02-19
**Status:** Approved
**Phase:** 5 of 6

---

## Overview

Server-side compilation of Craft.js templates into standalone HTML files that work offline with LabVIEW. Users design templates in the visual builder, then export self-contained HTML files that LabVIEW can use with headless Chrome to generate PDFs.

### Key Value Proposition

- **Self-contained**: Single HTML file with all assets embedded
- **Offline capable**: No internet required for PDF generation
- **Simple integration**: LabVIEW writes JSON, opens HTML, PDF generates automatically

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Data loading | File-based (`report_data.json`) | LabVIEW workflow compatibility |
| PDF trigger | Auto-print on load | Seamless headless Chrome integration |
| Images | Base64 embedded | Fully self-contained, no external dependencies |
| Chart.js | Embedded minified (~200KB) | Offline capability, consistent rendering |
| Export UX | Modal with full options | Flexibility for different use cases |
| Compilation | Server-side | Reliable asset embedding, watermark control |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     BUILDER (Client)                         │
│  ┌─────────────┐    ┌──────────────────────────────────┐   │
│  │   Topbar    │───▶│       Export Modal               │   │
│  │ Export Btn  │    │  • Filename                      │   │
│  └─────────────┘    │  • Include sample data           │   │
│                     │  • Page size (A4/Letter)          │   │
│                     │  • Margins                        │   │
│                     │  • Watermark (free tier)          │   │
│                     │  [Download Button]                │   │
│                     └──────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────┘
                               │ POST /api/templates/[id]/export
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     SERVER (API Route)                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  1. Fetch template from Supabase                       │ │
│  │  2. Load canvas_state (Craft.js JSON)                  │ │
│  │  3. Fetch images, convert to base64                    │ │
│  │  4. Compile HTML template                              │ │
│  │  5. Embed Chart.js (minified)                          │ │
│  │  6. Add watermark if free tier                         │ │
│  │  7. Return HTML file                                   │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   EXPORTED HTML FILE                         │
│  ┌───────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │  report.html  │  │ Chart.js    │  │ Runtime JS:     │   │
│  │  (layout)     │  │ (embedded)  │  │ • Fetch JSON    │   │
│  │               │  │             │  │ • Bind data     │   │
│  │               │  │             │  │ • Render charts │   │
│  │               │  │             │  │ • Auto-print    │   │
│  └───────────────┘  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Export API Endpoint

**File:** `app/api/templates/[id]/export/route.ts`

### Request

```
POST /api/templates/[id]/export
Content-Type: application/json

{
  "filename": "My Report Template",
  "includeSampleData": false,
  "pageSize": "A4",
  "margins": {
    "top": 20,
    "right": 20,
    "bottom": 20,
    "left": 20
  }
}
```

### Response

```
Content-Type: text/html
Content-Disposition: attachment; filename="My Report Template.html"

<!DOCTYPE html>
<html>...</html>
```

### Error Responses

| Code | Description |
|------|-------------|
| 401 | Not authenticated |
| 404 | Template not found |
| 500 | Compilation error |

---

## Exported HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title><!-- Template Name --></title>

  <!-- Print-specific CSS -->
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    @page {
      size: <!-- A4 or Letter -->;
      margin: <!-- user-specified margins -->;
    }

    @media print {
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }

    /* Component styles generated from template */
  </style>

  <!-- Embedded Chart.js (minified ~200KB) -->
  <script>/* Chart.js v4.4.1 minified */</script>
</head>
<body>
  <div id="report">
    <!-- Compiled HTML from canvas_state -->
  </div>

  <!-- Watermark overlay (free tier only) -->

  <script>
    // Template configuration
    const TEMPLATE_CONFIG = {
      pageSize: 'A4',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      autoPrint: true,
      dataPath: './report_data.json'
    };

    // Component registry with bindings
    const COMPONENTS = [
      { id: 'node-1', type: 'text', props: {...} },
      { id: 'node-2', type: 'chart', props: {...} }
    ];

    // Embedded sample data (if includeSampleData: true)
    const SAMPLE_DATA = null;

    // Runtime: Load data, bind, render charts, auto-print
    async function init() { /* ... */ }

    window.onload = init;
  </script>
</body>
</html>
```

---

## Component Rendering

Each builder component has a server-side renderer that converts Craft.js props to static HTML.

### File Structure

```
lib/export/
├── html-compiler.ts              # Main compiler
├── runtime-template.ts           # Embedded runtime JS
├── component-renderers/
│   ├── index.ts                  # Registry of all renderers
│   ├── render-text.ts
│   ├── render-image.ts
│   ├── render-container.ts
│   ├── render-table.ts
│   ├── render-chart.ts
│   ├── render-indicator.ts
│   ├── render-spacer.ts
│   ├── render-pagebreak.ts
│   ├── render-gauge.ts
│   ├── render-progressbar.ts
│   ├── render-bulletlist.ts
│   ├── render-datetime.ts
│   ├── render-pagenumber.ts
│   └── render-divider.ts
├── utils/
│   ├── asset-helpers.ts          # Image fetching, base64 conversion
│   └── style-helpers.ts          # CSS generation utilities
└── assets/
    └── chart.min.ts              # Embedded Chart.js bundle
```

### Renderer Pattern

Each renderer follows this interface:

```typescript
interface ComponentRenderer {
  (id: string, props: Record<string, any>): {
    html: string
    componentConfig?: object  // For runtime binding
  }
}
```

### Example: Text Renderer

```typescript
export function renderText(id: string, props: TextProps): RendererResult {
  const style = `
    position: absolute;
    left: ${props.x || 0}px;
    top: ${props.y || 0}px;
    width: ${props.width || 200}px;
    height: ${props.height || 50}px;
    font-size: ${props.fontSize || 16}px;
    font-weight: ${props.fontWeight || 'normal'};
    color: ${props.color || '#000000'};
    text-align: ${props.textAlign || 'left'};
  `.replace(/\s+/g, ' ').trim()

  const content = props.binding
    ? `<span data-binding="${props.binding}">${props.text}</span>`
    : props.text

  return {
    html: `<p id="${id}" data-component="text" style="${style}">${content}</p>`,
    componentConfig: {
      id,
      type: 'text',
      props
    }
  }
}
```

### Example: Chart Renderer

```typescript
export function renderChart(id: string, props: ChartProps): RendererResult {
  const style = `
    position: absolute;
    left: ${props.x || 0}px;
    top: ${props.y || 0}px;
    width: ${props.width || 400}px;
    height: ${props.height || 300}px;
  `.replace(/\s+/g, ' ').trim()

  return {
    html: `<canvas id="${id}" data-component="chart" style="${style}"></canvas>`,
    componentConfig: {
      id,
      type: 'chart',
      props: {
        chartType: props.chartType,
        title: props.title,
        binding: props.binding,
        datasets: props.datasets,
        labels: props.labels,
        primaryColor: props.primaryColor
      }
    }
  }
}
```

---

## Runtime JavaScript

The embedded runtime handles:

1. **Data Loading**: Fetch `report_data.json` or use embedded sample data
2. **Binding Resolution**: Replace `{{data.path}}` with actual values
3. **Chart Rendering**: Initialize Chart.js with resolved data
4. **Auto-print**: Trigger `window.print()` after rendering

### Data Binding Utilities

```javascript
function resolveBinding(path, data) {
  if (!path || !data) return undefined;
  const normalizedPath = path.startsWith('data.') ? path.slice(5) : path;
  const parts = normalizedPath.split('.');
  let current = data;

  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }
  return current;
}

function interpolateText(text, data) {
  return text.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const value = resolveBinding(path.trim(), data);
    return value != null ? String(value) : '';
  });
}
```

### Initialization Flow

```javascript
async function init() {
  // 1. Load data
  const data = window.SAMPLE_DATA || await fetch('./report_data.json').then(r => r.json());

  // 2. Bind all components
  for (const comp of window.COMPONENTS) {
    const el = document.getElementById(comp.id);
    // Apply bindings based on component type
  }

  // 3. Wait for charts, then auto-print
  setTimeout(() => {
    if (window.TEMPLATE_CONFIG.autoPrint) {
      window.print();
    }
  }, 500);
}
```

---

## Export Modal UI

**File:** `components/builder/export/ExportModal.tsx`

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Export Template                                    [X]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  File Name                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Test Report Template                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☑ Include sample data for testing                    │   │
│  │   (Embeds current sample data in the HTML file)      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Page Settings                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Size:     [ A4 ▼ ]                                  │   │
│  │  Margin:   [ 20 ] mm (all sides)                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ⚠ Free Plan: Watermark will be included             │   │
│  │   Upgrade to Pro for watermark-free exports          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│         [ Cancel ]              [ Download HTML ]          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Props

```typescript
interface ExportModalProps {
  templateId: string
  templateName: string
  isOpen: boolean
  onClose: () => void
}

interface ExportOptions {
  filename: string
  includeSampleData: boolean
  pageSize: 'A4' | 'Letter'
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
}
```

### Integration

- Add "Export" button to `BuilderTopbar.tsx`
- Button opens modal on click
- Modal handles API call and file download

---

## Watermark Logic

Free tier exports include a watermark.

### HTML

```html
<div id="watermark" style="
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 8px 16px;
  background: rgba(0,0,0,0.7);
  color: white;
  font-size: 12px;
  border-radius: 4px;
  z-index: 9999;
">
  Generated with LabVIEW Report Builder (Free Plan)
</div>
```

### Print CSS

```css
@media print {
  #watermark {
    position: fixed;
    bottom: 10px;
    right: 10px;
    font-size: 10px;
    background: rgba(200,200,200,0.3);
    color: #666;
  }
}
```

### Server-Side Check

```typescript
const { data: subscription } = await supabase
  .from('subscriptions')
  .select('plan_type')
  .eq('user_id', user.id)
  .single()

const includeWatermark = subscription?.plan_type === 'free'
```

---

## Main HTML Compiler

**File:** `lib/export/html-compiler.ts`

### Interface

```typescript
interface ExportOptions {
  filename: string
  includeSampleData: boolean
  pageSize: 'A4' | 'Letter'
  margins: { top: number; right: number; bottom: number; left: number }
  includeWatermark: boolean
}

async function compileTemplate(
  canvasState: CanvasState,
  sampleData: object | null,
  options: ExportOptions
): Promise<string>
```

### Compilation Steps

1. Parse Craft.js canvas state recursively
2. Delegate to component renderers for each node
3. Fetch external images and convert to base64
4. Collect component configs for runtime binding
5. Generate page-level CSS from options
6. Assemble final HTML with:
   - Embedded styles
   - Embedded Chart.js bundle
   - Rendered component HTML
   - Component configs (JSON)
   - Sample data (if requested)
   - Runtime script
   - Watermark (if applicable)
7. Return complete HTML string

---

## Files Summary

### New Files to Create

```
lib/export/
├── html-compiler.ts              # Main compiler
├── runtime-template.ts           # Embedded runtime JS
├── component-renderers/
│   ├── index.ts                  # Registry
│   ├── render-text.ts
│   ├── render-image.ts
│   ├── render-container.ts
│   ├── render-table.ts
│   ├── render-chart.ts
│   ├── render-indicator.ts
│   ├── render-spacer.ts
│   ├── render-pagebreak.ts
│   ├── render-gauge.ts
│   ├── render-progressbar.ts
│   ├── render-bulletlist.ts
│   ├── render-datetime.ts
│   ├── render-pagenumber.ts
│   └── render-divider.ts
├── utils/
│   ├── asset-helpers.ts
│   └── style-helpers.ts
└── assets/
    └── chart.min.ts

app/api/templates/[id]/export/
└── route.ts

components/builder/export/
├── ExportModal.tsx
└── ExportButton.tsx
```

### Files to Modify

```
components/builder/topbar/BuilderTopbar.tsx  # Add export button
```

---

## LabVIEW Integration

### Usage Flow

1. User exports template from builder → downloads `report.html`
2. LabVIEW writes test data to `report_data.json`
3. LabVIEW opens HTML with headless Chrome:
   ```
   chrome --headless --disable-gpu --print-to-pdf="output.pdf" "report.html"
   ```
4. HTML auto-loads JSON, renders charts, triggers print
5. PDF is generated at specified location

### JSON Data Format

```json
{
  "meta": {
    "reportTitle": "Unit Test Report",
    "testDate": "2026-02-19T14:30:00Z",
    "testId": "TEST-2026-001",
    "operator": "John Smith"
  },
  "results": {
    "overallStatus": "PASS",
    "tests": [
      { "name": "Voltage Test", "measured": 5.02, "unit": "V", "status": "PASS" }
    ]
  },
  "charts": {
    "voltageOverTime": {
      "labels": [0, 10, 20, 30, 40, 50],
      "datasets": [
        { "label": "Channel 1", "data": [4.95, 5.0, 5.02, 4.98, 5.01, 5.0] }
      ]
    }
  }
}
```
