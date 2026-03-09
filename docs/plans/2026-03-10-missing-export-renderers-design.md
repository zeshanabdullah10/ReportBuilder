# Missing Export Renderers Design

**Date**: 2026-03-10
**Status**: Approved
**Scope**: Add 13 missing export renderers for builder components

## Problem Statement

The LabVIEW Report Builder has 28 builder components for designing templates, but only 15 have corresponding export renderers. This means templates using the missing components will not export correctly to HTML/PDF.

### Missing Renderers (13)

| Group | Components | Complexity |
|-------|------------|------------|
| Simple | QRCode, Barcode, Logo, Watermark, SignatureLine | Library-based or static HTML |
| Medium | Histogram, ScatterPlot, PassRateChart | Chart.js visualizations |
| Complex | MeasurementTable, TestSummaryBox, RevisionBlock, SpecBox, ToleranceBand | Structured data with multiple bindings |

## Solution Design

### Architecture

The export system follows a renderer pattern where each component type has a corresponding `render-*.ts` file that:
1. Takes `id` and `props` as input
2. Returns `{ html: string, componentConfig: object }`
3. Registers in `lib/export/component-renderers/index.ts`

### Group 1: Simple Components

| Component | Implementation Strategy |
|-----------|------------------------|
| **QRCode** | Generate `<img>` with embedded SVG data URL |
| **Barcode** | Generate `<svg>` using inline SVG pattern |
| **Logo** | Render `<img>` tag with base64 or URL source |
| **Watermark** | CSS-based overlay with `position: fixed; opacity: 0.1` |
| **SignatureLine** | Simple `<div>` with border-bottom and label |

### Group 2: Medium Components (Chart.js)

| Component | Chart Type | Key Props |
|-----------|------------|-----------|
| **Histogram** | Bar chart with binning | `data`, `bins`, `color` |
| **ScatterPlot** | Scatter chart | `xData`, `yData`, `xLabel`, `yLabel` |
| **PassRateChart** | Doughnut/pie chart | `passed`, `failed`, `label` |

All three will:
1. Generate Chart.js configuration in `componentConfig.bindings`
2. Include inline Chart.js rendering script
3. Support data bindings like `{{data.measurements}}`

### Group 3: Complex Components

| Component | Structure | Key Features |
|-----------|-----------|--------------|
| **MeasurementTable** | `<table>` with rows | Tolerance columns, pass/fail coloring, unit display |
| **TestSummaryBox** | `<div>` grid | Summary stats, pass rate percentage, status indicators |
| **RevisionBlock** | `<table>` or `<div>` | Version history with date, author, description columns |
| **SpecBox** | `<div>` with borders | Specification limits, nominal value, tolerance display |
| **ToleranceBand** | SVG visualization | Visual band showing min/nominal/max with markers |

### Functional Bug Fixes

During implementation, also address:
1. Chart rendering issues - Ensure Chart.js configs match builder output
2. Data binding edge cases - Handle null/undefined values gracefully
3. Print CSS issues - Verify page breaks and sizing work correctly

## File Changes

### New Files (13)

```
lib/export/component-renderers/
├── render-qrcode.ts
├── render-barcode.ts
├── render-logo.ts
├── render-watermark.ts
├── render-signatureline.ts
├── render-histogram.ts
├── render-scatterplot.ts
├── render-passratechart.ts
├── render-measurementtable.ts
├── render-testsummarybox.ts
├── render-revisionblock.ts
├── render-specbox.ts
└── render-tolerancetband.ts
```

### Modified Files (1)

```
lib/export/component-renderers/index.ts  # Register all new renderers
```

## Implementation Order

1. **Phase 1**: Simple components (QRCode, Barcode, Logo, Watermark, SignatureLine)
2. **Phase 2**: Medium components (Histogram, ScatterPlot, PassRateChart)
3. **Phase 3**: Complex components (MeasurementTable, TestSummaryBox, RevisionBlock, SpecBox, ToleranceBand)
4. **Phase 4**: Testing and bug fixes

## Success Criteria

- All 13 missing renderers implemented
- Exported HTML correctly renders all component types
- Print output matches builder preview
- No TypeScript errors
- Existing tests continue to pass
