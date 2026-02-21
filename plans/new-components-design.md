# New Print-First Components Design

**Date:** 2026-02-21
**Status:** Planning
**Purpose:** Add7 new components optimized for printed test reports

---

## Overview

All components are designed with **print-first** principles:
- No interactive elements (hover, click, animation)
- Static rendering for PDF export
- Data binding support via `{{data.path}}` syntax
- Consistent with existing component architecture

---

## Component Specifications

### 1. QRCode Component

**Purpose:** Add scannable QR codes for traceability and linking back to digital records.

**Props:**
```typescript
interface QRCodeProps {
  // Data source
  value: string              // Static value or binding like {{data.serialNumber}}
  binding?: string           // Alternative binding path
  
  // Display
  size: number               // Default: 100 (pixels)
  errorCorrection: 'L' | 'M' | 'Q' | 'H'  // Default: 'M'
  
  // Styling
  foregroundColor: string    // Default: '#000000'
  backgroundColor: string    // Default: '#FFFFFF'
  
  // Label
  showLabel: boolean         // Default: false
  label?: string            // Text below QR code
  labelPosition: 'top' | 'bottom'  // Default: 'bottom'
  
  // Position
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  visible: boolean
}
```

**Use Cases:**
- Link to test record URL
- Encode serial number
- Encode test parameters summary
- Link to calibration certificate

**Library:** `qrcode` (npm package, renders to canvas/svg)

---

### 2. Barcode Component

**Purpose:** Add scannable barcodes for part numbers, serial numbers, and test IDs.

**Props:**
```typescript
interface BarcodeProps {
  // Data source
  value: string              // Static value or binding
  binding?: string
  
  // Barcode format
  format: 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'UPC' | 'ITF14'
  // Default: 'CODE128' (most versatile for alphanumeric)
  
  // Display
  width: number              // Bar width, default: 2
  height: number             // Bar height, default: 100
  displayValue: boolean      // Show text below, default: true
  
  // Styling
  lineColor: string          // Default: '#000000'
  background: string         // Default: '#FFFFFF'
  fontSize: number           // Default: 14
  textAlign: 'left' | 'center' | 'right'  // Default: 'center'
  
  // Label
  label?: string            // Override displayed text
  
  // Position
  x: number
  y: number
  zIndex: number
  visible: boolean
}
```

**Use Cases:**
- Part number barcode
- Serial number barcode
- Test ID barcode
- Work order number

**Library:** `jsbarcode` (npm package, renders to canvas/svg)

---

### 3. SignatureLine Component

**Purpose:** Provide signature areas for approval workflows.

**Props:**
```typescript
interface SignatureLineProps {
  // Configuration
  layout: 'horizontal' | 'vertical'  // Default: 'horizontal'
  signatureCount: 1 | 2 | 3         // Number of signature slots, default: 1
  
  // Per-signature configuration
  signatures: SignatureSlot[]
  
  // Styling
  lineColor: string          // Default: '#000000'
  lineWidth: number          // Default: 1
  labelFont: string          // Default: '12px Inter'
  dateFont: string           // Default: '10px Inter'
  
  // Position
  x: number
  y: number
  width: number              // Default: 300
  height: number             // Default: 60
  zIndex: number
  visible: boolean
}

interface SignatureSlot {
  label: string              // e.g., "Test Engineer", "Quality Manager"
  showDate: boolean          // Show date line, default: true
  showName: boolean          // Show name line, default: true
  nameBinding?: string       // Bind to data for pre-filled name
  dateBinding?: string       // Bind to data for pre-filled date
}
```

**Layout Examples:**

Horizontal (1 signature):
```
Test Engineer                    Date: ____________
_______________________         ___________________

Signature: _____________________
```

Horizontal (2 signatures):
```
Test Engineer                    Quality Manager
_______________________         ___________________
Date: ____________              Date: ____________
```

Vertical:
```
Test Engineer
Signature: _____________________
Name: _________________________
Date: ____________

Quality Manager
Signature: _____________________
Name: _________________________
Date: ____________
```

---

### 4. TestSummaryBox Component

**Purpose:** Pre-formatted summary showing pass/fail counts and overall status.

**Props:**
```typescript
interface TestSummaryBoxProps {
  // Data bindings
  totalTestsBinding?: string     // {{data.summary.total}}
  passedBinding?: string         // {{data.summary.passed}}
  failedBinding?: string         // {{data.summary.failed}}
  skippedBinding?: string        // {{data.summary.skipped}}
  overallStatusBinding?: string  // {{data.summary.status}}
  
  // Static values (fallback)
  totalTests?: number
  passed?: number
  failed?: number
  skipped?: number
  overallStatus?: 'PASS' | 'FAIL' | 'INCOMPLETE'
  
  // Display options
  showSkipped: boolean           // Default: true
  showPercentage: boolean        // Default: true
  layout: 'horizontal' | 'vertical' | 'grid'  // Default: 'horizontal'
  
  // Styling
  passColor: string              // Default: '#22c55e'
  failColor: string              // Default: '#ef4444'
  skipColor: string              // Default: '#f59e0b'
  borderColor: string            // Default: '#00ffc8'
  backgroundColor: string        // Default: '#0a0f14'
  
  // Title
  title: string                  // Default: "Test Summary"
  showTitle: boolean             // Default: true
  
  // Position
  x: number
  y: number
  width: number                  // Default: 400
  height: number                 // Default: 120
  zIndex: number
  visible: boolean
}
```

**Layout Examples:**

Horizontal:
```
┌─────────────────────────────────────────────┐
│ TEST SUMMARY                         ✓ PASS │
├─────────────────────────────────────────────┤
│ Total: 150  │ Passed: 142  │ Failed: 8     │
│             │ (94.7%)      │ (5.3%)        │
└─────────────────────────────────────────────┘
```

Grid:
```
┌─────────────────────────────────────────────┐
│              TEST SUMMARY                   │
├─────────────┬─────────────┬────────────────┤
│   142       │      8      │      150       │
│  PASSED     │   FAILED    │    TOTAL       │
│  94.7%      │   5.3%      │               │
└─────────────┴─────────────┴────────────────┘
```

---

### 5. MeasurementTable Component

**Purpose:** Specialized table for measurement data with tolerances and pass/fail status.

**Props:**
```typescript
interface MeasurementTableProps {
  // Data binding
  dataBinding: string           // {{data.measurements}} - array of measurement objects
  
  // Column configuration
  columns: MeasurementColumn[]
  
  // Display options
  showHeader: boolean           // Default: true
  showRowNumbers: boolean       // Default: false
  stripeRows: boolean           // Default: true
  
  // Styling
  headerBackgroundColor: string // Default: '#1a1a2e'
  passColor: string             // Default: '#22c55e'
  failColor: string             // Default: '#ef4444'
  borderColor: string           // Default: '#333'
  
  // Position
  x: number
  y: number
  width: number                 // Default: 500
  zIndex: number
  visible: boolean
}

interface MeasurementColumn {
  key: string                   // Property key in data
  header: string                // Column header text
  type: 'text' | 'number' | 'unit' | 'tolerance' | 'status' | 'deviation'
  unit?: string                 // For unit type, e.g., 'V', 'A', '°C'
  width?: number                // Column width in pixels
  
  // For tolerance columns
  tolerance?: {
    nominal: number | string    // Nominal value or binding
    min: number | string        // Min acceptable or binding
    max: number | string        // Max acceptable or binding
  }
  
  // Formatting
  format?: string               // Number format, e.g., '0.00'
}
```

**Example Data Structure:**
```json
{
  "measurements": [
    {
      "parameter": "Voltage Output",
      "nominal": 5.0,
      "measured": 5.02,
      "unit": "V",
      "min": 4.9,
      "max": 5.1,
      "status": "PASS"
    },
    {
      "parameter": "Current Draw",
      "nominal": 0.5,
      "measured": 0.52,
      "unit": "A",
      "min": 0.45,
      "max": 0.55,
      "status": "PASS"
    }
  ]
}
```

**Rendered Output:**
```
┌──────────────────┬──────────┬──────────┬──────────┬────────┐
│ Parameter        │ Nominal  │ Measured │ Tolerance│ Status │
├──────────────────┼──────────┼──────────┼──────────┼────────┤
│ Voltage Output   │ 5.00 V   │ 5.02 V   │ ±0.10 V  │   ✓    │
│ Current Draw     │ 0.50 A   │ 0.52 A   │ ±0.05 A  │   ✓    │
│ Temperature      │ 25.0°C   │ 26.5°C   │ ±2.0°C   │   ✓    │
│ Frequency        │ 60.0 Hz  │ 61.2 Hz  │ ±1.0 Hz  │   ✗    │
└──────────────────┴──────────┴──────────┴──────────┴────────┘
```

---

### 6. Histogram Component

**Purpose:** Display statistical distribution of measurement data.

**Props:**
```typescript
interface HistogramProps {
  // Data binding
  dataBinding: string           // {{data.values}} - array of numbers
  
  // Or static data
  values?: number[]
  
  // Configuration
  bins: number                  // Number of bins, default: 10
  showNormalCurve: boolean      // Overlay normal distribution, default: true
  showStatistics: boolean       // Show mean, std dev, default: true
  
  // Styling
  barColor: string              // Default: '#00ffc8'
  curveColor: string            // Default: '#ffb000'
  borderColor: string           // Default: '#333'
  backgroundColor: string       // Default: 'transparent'
  
  // Labels
  title?: string
  xAxisLabel?: string
  yAxisLabel?: string
  
  // Position
  x: number
  y: number
  width: number                 // Default: 400
  height: number                // Default: 300
  zIndex: number
  visible: boolean
}
```

**Example Data:**
```json
{
  "values": [5.02, 4.98, 5.01, 5.03, 4.99, 5.00, 5.02, 4.97, 5.01, 5.04]
}
```

**Rendered Output:**
```
┌─────────────────────────────────────────────┐
│           Measurement Distribution          │
├─────────────────────────────────────────────┤
│     ▓▓▓                                     │
│     ▓▓▓  ▓▓▓                                │
│▓▓▓  ▓▓▓  ▓▓▓  ▓▓▓                          │
│▓▓▓  ▓▓▓  ▓▓▓  ▓▓▓  ▓▓▓                     │
├─────────────────────────────────────────────┤
│ Mean: 5.007  |  Std Dev: 0.023  |  N: 10   │
└─────────────────────────────────────────────┘
```

---

### 7. ScatterPlot Component

**Purpose:** Display correlation between two variables.

**Props:**
```typescript
interface ScatterPlotProps {
  // Data binding
  dataBinding: string           // {{data.points}} - array of {x, y} objects
  
  // Or static data
  points?: Array<{ x: number; y: number }>
  
  // Configuration
  showTrendLine: boolean        // Default: true
  showGridLines: boolean        // Default: true
  pointRadius: number           // Default: 4
  
  // Axis configuration
  xAxisLabel?: string
  yAxisLabel?: string
  xAxisMin?: number
  xAxisMax?: number
  yAxisMin?: number
  yAxisMax?: number
  
  // Styling
  pointColor: string            // Default: '#00ffc8'
  trendLineColor: string        // Default: '#ffb000'
  gridColor: string             // Default: '#333'
  backgroundColor: string       // Default: 'transparent'
  
  // Title
  title?: string
  
  // Position
  x: number
  y: number
  width: number                 // Default: 400
  height: number                // Default: 300
  zIndex: number
  visible: boolean
}
```

**Example Data:**
```json
{
  "points": [
    { "x": 1.0, "y": 2.1 },
    { "x": 2.0, "y": 3.8 },
    { "x": 3.0, "y": 5.2 },
    { "x": 4.0, "y": 7.1 },
    { "x": 5.0, "y": 8.9 }
  ]
}
```

---

## Implementation Plan

### Phase 1: Quick Wins (Low Complexity)
1. **QRCode** - Use `qrcode` npm package
2. **Barcode** - Use `jsbarcode` npm package
3. **SignatureLine** - Pure CSS/HTML implementation
4. **TestSummaryBox** - Pure CSS/HTML implementation

### Phase 2: Medium Complexity
5. **MeasurementTable** - Extends existing Table component patterns
6. **Histogram** - Use Chart.js (already installed)
7. **ScatterPlot** - Use Chart.js scatter chart type

---

## File Structure

```
components/builder/components/
├── QRCode.tsx
├── Barcode.tsx
├── SignatureLine.tsx
├── TestSummaryBox.tsx
├── MeasurementTable.tsx
├── Histogram.tsx
└── ScatterPlot.tsx

components/builder/settings/
├── QRCodeSettings.tsx
├── BarcodeSettings.tsx
├── SignatureLineSettings.tsx
├── TestSummaryBoxSettings.tsx
├── MeasurementTableSettings.tsx
├── HistogramSettings.tsx
└── ScatterPlotSettings.tsx
```

---

## Dependencies

| Package | Purpose | Size |
|---------|---------|------|
| `qrcode` | QR code generation | ~50KB |
| `jsbarcode` | Barcode generation | ~30KB |
| `chart.js` | Already installed | - |

---

## Next Steps

1. Review and approve this design
2. Switch to Code mode for implementation
3. Implement Phase 1 components first
4. Add to Toolbox component
5. Update TypeScript types
6. Test with print preview
