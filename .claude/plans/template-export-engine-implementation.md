# Template Export Engine - Implementation Plan

**Created:** 2026-02-19
**Based on:** `docs/plans/2026-02-19-template-export-engine-design.md`
**Phase:** 5 of 6

---

## Phase 0: Documentation Discovery (Completed)

### Allowed APIs & Patterns

| Category | Source | Key Findings |
|----------|--------|--------------|
| **Component Props** | `components/builder/components/*.tsx` | 14 components with consistent prop patterns (x, y, width, height, zIndex, visible, binding) |
| **Chart.js** | `package.json`, `Chart.tsx` | Chart.js v4.4.1, supports line/bar/pie, multi-dataset, dual Y-axis |
| **Data Binding** | `lib/utils/binding.ts` | `{{data.path}}` syntax, `resolveBinding()`, `interpolateText()` |
| **API Routes** | `app/api/templates/[id]/route.ts` | Auth via `supabase.auth.getUser()`, ownership check via `user_id` |
| **File Response** | Next.js `NextResponse` | `new NextResponse(content, { headers: {...} })` for file downloads |

### Canvas State Structure
```json
{
  "nodes": {
    "nodeId": {
      "id": "string",
      "type": "ComponentName",
      "props": { /* component-specific props */ },
      "nodes": { /* child nodes */ }
    }
  }
}
```

### Component Renderer Requirements
Each renderer must handle:
1. Position (x, y, width, height, zIndex)
2. Visibility (visible prop)
3. Data bindings (resolve `{{data.path}}` at runtime)
4. Print-specific styling

---

## Phase 1: Core Export Infrastructure

### What to Implement

1. **Create `lib/export/html-compiler.ts`**
   - Main compiler function that orchestrates HTML generation
   - Copy authentication/ownership pattern from `app/api/templates/[id]/route.ts:19-30`
   - Iterate through Craft.js nodes recursively
   - Delegate to component renderers

2. **Create `lib/export/utils/style-helpers.ts`**
   - CSS generation utilities for position, colors, fonts
   - Print-specific CSS (`@media print`, `@page`)
   - Copy color handling from `components/builder/components/Chart.tsx:15-25` (DEFAULT_COLORS array)

3. **Create `lib/export/utils/asset-helpers.ts`**
   - Fetch images from URLs
   - Convert to base64 for embedding
   - Handle both external URLs and Supabase Storage URLs

### Documentation References

| Task | Source File | Lines to Reference |
|------|-------------|-------------------|
| Position styling | `ResizableBox.tsx` | Component style pattern |
| Color array | `Chart.tsx` | Lines 15-25 (DEFAULT_COLORS) |
| CSS generation | `lib/utils/binding.ts` | Pattern for utility functions |
| Fetch pattern | `app/actions/assets.ts` | Supabase client usage |

### Verification Checklist
- [ ] `html-compiler.ts` exports `compileTemplate()` function
- [ ] `style-helpers.ts` exports position and print CSS generators
- [ ] `asset-helpers.ts` exports `imageToBase64()` function
- [ ] TypeScript compiles: `npx tsc --noEmit`

### Anti-Pattern Guards
- Do NOT use client-side React hooks in server-side code
- Do NOT import from `@craftjs/core` in server code (use JSON parsing instead)
- Do NOT use `fetch()` without error handling for images

---

## Phase 2: Component Renderers (Part 1 - Basic Components)

### What to Implement

Create `lib/export/component-renderers/` directory with:

1. **`render-text.ts`**
   - Render Text component to static HTML
   - Handle `binding` prop for `{{data.path}}` interpolation
   - Copy binding resolution from `lib/utils/binding.ts:resolveBinding()`
   - Props to handle: text, fontSize, fontWeight, fontFamily, color, textAlign, binding

2. **`render-image.ts`**
   - Render Image component with base64-embedded src
   - Handle objectFit styling
   - Call `imageToBase64()` from asset-helpers
   - Props: src, alt, objectFit

3. **`render-container.ts`**
   - Render Container div with children
   - Handle background, padding, border styling
   - Props: background, padding, borderRadius, borderWidth, borderColor

4. **`render-spacer.ts`**
   - Render empty div with height
   - Props: height, width

5. **`render-divider.ts`**
   - Render horizontal/vertical line
   - Props: orientation, style, color, thickness, length

6. **`render-pagebreak.ts`**
   - Render `div` with `page-break-before: always`
   - No special props needed

### Documentation References

| Task | Source File | Pattern to Copy |
|------|-------------|-----------------|
| Text rendering | `Text.tsx` | Props interface, binding pattern |
| Image rendering | `Image.tsx` | Props interface, objectFit |
| Container rendering | `Container.tsx` | Props interface, children pattern |
| Style generation | `Chart.tsx:245-265` | CSS object to string pattern |

### Interface Pattern
```typescript
// lib/export/component-renderers/types.ts
export interface RendererResult {
  html: string
  componentConfig?: object  // For runtime JS
}

export interface ComponentRenderer {
  (id: string, props: Record<string, any>): RendererResult
}
```

### Verification Checklist
- [ ] All 6 renderers created and export functions
- [ ] Each renderer returns `{ html, componentConfig }`
- [ ] Run `npx tsc --noEmit` - no errors

---

## Phase 3: Component Renderers (Part 2 - Data Components)

### What to Implement

1. **`render-table.ts`**
   - Render HTML table with headers and rows
   - Handle `binding` for dynamic table data
   - Props: columns, rows, headerColor, rowColor, borderColor, binding
   - Copy data parsing from `Table.tsx:handleTableData()`

2. **`render-bulletlist.ts`**
   - Render `<ul>` or `<ol>` with list items
   - Handle `binding` for array data
   - Props: items, listStyle, fontSize, fontFamily, color, binding

3. **`render-indicator.ts`**
   - Render status badge (pass/fail/warning/neutral)
   - Handle `binding` for dynamic status
   - Props: status, label, passLabel, failLabel, warningLabel, binding
   - Copy status colors from `Indicator.tsx:STATUS_CONFIG`

4. **`render-datetime.ts`**
   - Render formatted date/time
   - Handle `binding` for dynamic dates
   - Props: format, fontSize, fontFamily, color, textAlign, binding

5. **`render-pagenumber.ts`**
   - Render page number placeholder (runtime CSS handles actual numbers)
   - Props: format, fontSize, fontFamily, color, prefix, suffix

6. **`render-gauge.ts`**
   - Render SVG gauge with arc
   - Handle `binding` for dynamic value
   - Props: value, min, max, label, unit, primaryColor, backgroundColor, binding
   - Copy SVG arc calculation from `Gauge.tsx:polarToCartesian()` and `describeArc()`

7. **`render-progressbar.ts`**
   - Render progress bar div
   - Handle `binding` for dynamic value
   - Props: value, min, max, label, showValue, fillColor, backgroundColor, binding

### Documentation References

| Task | Source File | Pattern to Copy |
|------|-------------|-----------------|
| Table data binding | `Table.tsx:50-80` | Binding resolution, array parsing |
| Indicator status | `Indicator.tsx:10-20` | STATUS_CONFIG object |
| Gauge SVG | `Gauge.tsx:60-100` | SVG arc calculation |
| Progress calculation | `ProgressBar.tsx:25-35` | Percentage calculation |

### Verification Checklist
- [ ] All 7 renderers created
- [ ] Binding resolution works for each data component
- [ ] SVG rendering works for Gauge
- [ ] Run `npx tsc --noEmit` - no errors

---

## Phase 4: Component Renderers (Part 3 - Chart)

### What to Implement

1. **`render-chart.ts`**
   - Render `<canvas>` element for Chart.js
   - Generate `componentConfig` with chart options
   - Props: chartType, title, label, dataPoints, labels, binding, datasets, enableMultiAxis, primaryColor

2. **`lib/export/assets/chart.min.ts`**
   - Store minified Chart.js bundle as string
   - Will be embedded in HTML

3. **Update `html-compiler.ts`**
   - Embed Chart.js bundle in `<script>` tag
   - Generate chart initialization code

### Documentation References

| Task | Source File | Pattern to Copy |
|------|-------------|-----------------|
| Chart options | `Chart.tsx:245-265` | Chart options object |
| Dataset parsing | `Chart.tsx:100-150` | Data parsing logic |
| Multi-axis | `Chart.tsx:180-220` | Dual Y-axis configuration |
| Color handling | `Chart.tsx:15-25` | DEFAULT_COLORS, hexToRgba |

### Chart Config Pattern (for runtime)
```javascript
{
  type: 'line' | 'bar' | 'pie',
  data: {
    labels: [...],
    datasets: [{
      label: '...',
      data: [...],
      borderColor: '...',
      backgroundColor: '...'
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { title: {...}, legend: {...} },
    scales: { x: {...}, y: {...} }
  }
}
```

### Verification Checklist
- [ ] Chart renderer creates valid canvas HTML
- [ ] Chart.js bundle embedded correctly
- [ ] Chart config JSON generated correctly
- [ ] Run `npx tsc --noEmit` - no errors

---

## Phase 5: Runtime JavaScript & Final Assembly

### What to Implement

1. **`lib/export/runtime-template.ts`**
   - JavaScript runtime for exported HTML
   - Functions:
     - `resolveBinding(path, data)` - Copy from `lib/utils/binding.ts`
     - `interpolateText(text, data)` - Copy from `lib/utils/binding.ts`
     - `renderCharts(components, data)` - Initialize Chart.js
     - `applyBindings(components, data)` - Update text, indicators, etc.
     - `init()` - Main initialization, auto-print trigger

2. **Update `html-compiler.ts`**
   - Assemble final HTML with:
     - Embedded CSS (print styles)
     - Embedded Chart.js
     - Rendered component HTML
     - Component configs (JSON)
     - Sample data (if requested)
     - Runtime script
     - Watermark (if free tier)

3. **`lib/export/component-renderers/index.ts`**
   - Registry mapping component types to renderers
   - Export `getRenderer(type)` function

### Documentation References

| Task | Source File | Pattern to Copy |
|------|-------------|-----------------|
| Binding resolution | `lib/utils/binding.ts:1-50` | Full file - copy logic |
| Auto-print trigger | Design doc | `window.print()` after chart render |
| Watermark HTML | Design doc lines 425-455 | Exact HTML/CSS from design |

### Runtime Init Pattern
```javascript
async function init() {
  // 1. Load data
  const data = window.SAMPLE_DATA || await fetch('./report_data.json').then(r => r.json());

  // 2. Apply bindings
  for (const comp of window.COMPONENTS) {
    // Update text, indicators, etc.
  }

  // 3. Render charts
  // Initialize Chart.js for each chart component

  // 4. Auto-print (delayed for chart rendering)
  setTimeout(() => {
    if (window.TEMPLATE_CONFIG.autoPrint) {
      window.print();
    }
  }, 500);
}

window.onload = init;
```

### Verification Checklist
- [ ] Runtime script handles data loading
- [ ] Bindings applied correctly
- [ ] Charts render before auto-print
- [ ] Run `npx tsc --noEmit` - no errors

---

## Phase 6: Export API Route

### What to Implement

1. **`app/api/templates/[id]/export/route.ts`**
   - POST endpoint for template export
   - Copy auth pattern from `app/api/templates/[id]/route.ts:19-30`
   - Copy ownership check from `app/api/templates/[id]/route.ts:35-45`
   - Parse request body for export options
   - Call `compileTemplate()` from html-compiler
   - Return HTML with download headers

### Documentation References

| Task | Source File | Pattern to Copy |
|------|-------------|-----------------|
| Auth check | `app/api/templates/[id]/route.ts` | Lines 19-30 |
| Ownership check | `app/api/templates/[id]/route.ts` | Lines 35-45 |
| File response | Design doc | `new NextResponse(html, { headers: {...} })` |

### API Pattern
```typescript
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Authenticate
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Get template and verify ownership
  const { data: template } = await supabase
    .from('templates')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  // 3. Parse options
  const options = await request.json()

  // 4. Compile
  const html = await compileTemplate(template.canvas_state, template.sample_data, options)

  // 5. Return file
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `attachment; filename="${options.filename || template.name}.html"`,
    },
  })
}
```

### Verification Checklist
- [ ] POST endpoint created
- [ ] Authentication works
- [ ] Ownership verified
- [ ] Returns HTML file with correct headers
- [ ] Run `npx tsc --noEmit` - no errors

---

## Phase 7: Export Modal UI

### What to Implement

1. **`components/builder/export/ExportModal.tsx`**
   - Modal with export options form
   - Fields: filename, includeSampleData, pageSize, margins
   - Free tier watermark warning
   - Download button that calls API

2. **`components/builder/export/ExportButton.tsx`**
   - Button component to trigger modal
   - Uses templateId from props or store

3. **Update `components/builder/topbar/BuilderTopbar.tsx`**
   - Add ExportButton next to Save button
   - Wire up modal state

### Documentation References

| Task | Source File | Pattern to Copy |
|------|-------------|-----------------|
| Modal pattern | `SampleDataLoader.tsx:237-275` | Modal overlay structure |
| Form inputs | `components/ui/input.tsx` | Input styling |
| Button styling | `components/ui/button.tsx` | Button variants |
| Store access | `BuilderTopbar.tsx` | useBuilderStore usage |

### Modal Layout (from design doc)
```
┌─────────────────────────────────────────────────────────────┐
│  Export Template                                    [X]     │
├─────────────────────────────────────────────────────────────┤
│  File Name: [Test Report Template                    ]      │
│  [x] Include sample data for testing                        │
│  Page Settings:                                             │
│    Size: [A4 ▼]    Margin: [20] mm                          │
│  [⚠ Free Plan: Watermark will be included]                  │
│         [ Cancel ]              [ Download HTML ]           │
└─────────────────────────────────────────────────────────────┘
```

### Verification Checklist
- [ ] Modal opens from topbar button
- [ ] Form options work correctly
- [ ] Download triggers file save
- [ ] Modal closes after download
- [ ] Run `npx tsc --noEmit` - no errors

---

## Phase 8: Verification & Testing

### Manual Verification

1. **Create test template**
   - Add all component types
   - Set up data bindings
   - Add sample data

2. **Test export**
   - Click Export button
   - Configure options
   - Download HTML file

3. **Test exported HTML**
   - Open in browser
   - Verify data bindings work
   - Verify charts render
   - Test print preview (Ctrl+P)

4. **Test with LabVIEW workflow**
   - Create `report_data.json` file
   - Open HTML in same directory
   - Verify data loads from JSON
   - Verify auto-print triggers

### Automated Checks

```bash
# TypeScript check
npx tsc --noEmit

# Lint check
npm run lint

# Grep for anti-patterns
grep -r "useNode" lib/export/  # Should be empty (no client hooks)
grep -r "@craftjs/core" lib/export/  # Should be empty (no craft imports)
```

### Test Cases

| Test | Expected Result |
|------|-----------------|
| Export with sample data | HTML contains embedded JSON |
| Export without sample data | HTML fetches from report_data.json |
| Free tier user | Watermark appears in HTML |
| Pro tier user | No watermark |
| Text with binding | Runtime replaces `{{data.path}}` |
| Chart component | Canvas renders with Chart.js |
| Page break | CSS page-break-before applied |

---

## Files Summary

### New Files (17 files)

```
lib/export/
├── html-compiler.ts
├── runtime-template.ts
├── component-renderers/
│   ├── index.ts
│   ├── types.ts
│   ├── render-text.ts
│   ├── render-image.ts
│   ├── render-container.ts
│   ├── render-table.ts
│   ├── render-chart.ts
│   ├── render-indicator.ts
│   ├── render-bulletlist.ts
│   ├── render-gauge.ts
│   ├── render-progressbar.ts
│   ├── render-datetime.ts
│   ├── render-pagenumber.ts
│   ├── render-divider.ts
│   ├── render-spacer.ts
│   └── render-pagebreak.ts
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

### Modified Files (1 file)

```
components/builder/topbar/BuilderTopbar.tsx  # Add export button
```

---

## Estimated Effort

| Phase | Tasks | Complexity |
|-------|-------|------------|
| Phase 1 | Core infrastructure | Medium |
| Phase 2 | Basic renderers (6) | Low |
| Phase 3 | Data renderers (7) | Medium |
| Phase 4 | Chart renderer | High |
| Phase 5 | Runtime & assembly | Medium |
| Phase 6 | API route | Low |
| Phase 7 | UI modal | Low |
| Phase 8 | Verification | Medium |

**Recommendation:** Implement in order. Phases 2-3 can be parallelized. Phase 4 (Chart) is the most complex and may need iteration.
