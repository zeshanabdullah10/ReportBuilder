# New Components Design Document

**Date:** 2026-03-11
**Author:** Claude Code
**Status:** Approved

## Overview

This document defines 6 new components for the LabVIEW Report Builder, focused on enhancing printed validation and measurement data reports.

## Goals

- Add document structure components for professional multi-page reports
- Enhance validation report capabilities with comparison and traceability features
- Provide SPC/statistical visualization for measurement data analysis
- Support formal approval workflows in printed reports

## Components

### 1. HeaderFooter

**Purpose:** Repeatable block appearing on every page of exported PDF.

**Visual Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│ [Logo]  Company Name         Report Title          Page X/Y │  ← Header
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                     [Report Content]                         │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ Generated: 2026-03-11 14:30    Confidential    Rev: 1.0     │  ← Footer
└──────────────────────────────────────────────────────────────┘
```

**Props Interface:**
```typescript
interface HeaderFooterProps {
  position: 'header' | 'footer'
  leftContent: string
  leftBinding?: string
  centerContent: string
  centerBinding?: string
  rightContent: string
  rightBinding?: string
  showLogo: boolean
  logoBinding?: string
  showPageNumber: boolean
  showTotalPages: boolean
  showDateTime: boolean
  borderStyle: 'none' | 'line' | 'double'
  fontSize: number
  height: number
  backgroundColor: string
  textColor: string
  borderColor: string
  x: number
  y: number
  width: number
  zIndex: number
  visible: boolean
}
```

**Data Bindings:**
- `{{report.title}}` - Report title
- `{{report.revision}}` - Document revision
- `{{report.generatedBy}}` - Author/generator
- `{{page.number}}` - Current page number
- `{{page.total}}` - Total pages
- `{{date.generated}}` - Generation timestamp

**Files to Create:**
- `components/builder/components/HeaderFooter.tsx`
- `components/builder/settings/HeaderFooterSettings.tsx`
- `lib/export/component-renderers/render-headerfooter.ts`

---

### 2. ComparisonTable

**Purpose:** Side-by-side comparison of expected vs actual values with pass/fail indication.

**Visual Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│                    Measurement Comparison                    │
├─────────────┬────────────┬────────────┬───────────┬─────────┤
│ Parameter   │ Expected   │ Tolerance  │ Actual    │ Status  │
├─────────────┼────────────┼────────────┼───────────┼─────────┤
│ Voltage     │ 5.00 V     │ ±0.10 V    │ 5.02 V    │    ✓    │
│ Current     │ 100 mA     │ ±5 mA      │ 103 mA    │    ✓    │
│ Frequency   │ 60 Hz      │ ±1 Hz      │ 62 Hz     │    ✗    │
└─────────────┴────────────┴────────────┴───────────┴─────────┘
```

**Props Interface:**
```typescript
interface ComparisonTableProps {
  title: string
  dataBinding: string
  columns: ('parameter' | 'expected' | 'tolerance' | 'actual' | 'status' | 'deviation')[]
  showTolerance: boolean
  showDeviation: boolean
  showPercentage: boolean
  unitInHeader: boolean
  passColor: string
  failColor: string
  headerColor: string
  zebraStriping: boolean
  compactMode: boolean
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  visible: boolean
}
```

**Data Binding Structure:**
```json
{
  "comparisons": [
    {
      "parameter": "Voltage",
      "expected": 5.0,
      "tolerance": 0.1,
      "toleranceType": "absolute",
      "actual": 5.02,
      "unit": "V"
    }
  ]
}
```

**Files to Create:**
- `components/builder/components/ComparisonTable.tsx`
- `components/builder/settings/ComparisonTableSettings.tsx`
- `lib/export/component-renderers/render-comparisontable.ts`

---

### 3. EquipmentInfo

**Purpose:** Traceability block showing test equipment used for validation reports.

**Visual Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│                      Test Equipment Used                     │
├───────────────────┬────────────────┬─────────────┬──────────┤
│ Instrument        │ Model          │ Serial No   │ Cal Date │
├───────────────────┼────────────────┼─────────────┼──────────┤
│ Multimeter        │ Fluke 87V      │ SN12345678  │ 2026-01-15│
│ Oscilloscope      │ Keysight DSOX  │ SN87654321  │ 2025-12-20│
└───────────────────┴────────────────┴─────────────┴──────────┘
            Calibration Status: All instruments within cal period
```

**Props Interface:**
```typescript
interface EquipmentInfoProps {
  title: string
  dataBinding: string
  columns: ('name' | 'model' | 'serial' | 'calDate' | 'calDue' | 'status')[]
  showCalStatus: boolean
  showCalDue: boolean
  warnIfExpired: boolean
  compactMode: boolean
  validColor: string
  expiredColor: string
  warningColor: string
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  visible: boolean
}
```

**Data Binding Structure:**
```json
{
  "equipment": [
    {
      "name": "Multimeter",
      "model": "Fluke 87V",
      "serial": "SN12345678",
      "calDate": "2026-01-15",
      "calDue": "2027-01-15",
      "status": "valid"
    }
  ]
}
```

**Files to Create:**
- `components/builder/components/EquipmentInfo.tsx`
- `components/builder/settings/EquipmentInfoSettings.tsx`
- `lib/export/component-renderers/render-equipmentinfo.ts`

---

### 4. ControlChart

**Purpose:** Statistical Process Control (SPC) chart with control limits.

**Visual Layout:**
```
    UCL = 105
    ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
    ┌─────────────────────────────────────────────────────────┐
    │           •  •     •     •                              │
100│─────────•─────────────────────────────────────•─────────│ CL
    │       •   •  •        •  •     •    •  •               │
    │     •              •           •        •    •         │
 95 │────────────────────────────────────────────────────────│ LCL
    └─────────────────────────────────────────────────────────┘
    ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
    LCL = 95
```

**Props Interface:**
```typescript
interface ControlChartProps {
  dataBinding: string
  centerLineBinding?: string
  uclBinding?: string
  lclBinding?: string
  centerLine: number
  ucl: number
  lcl: number
  showLimits: boolean
  showCenterLine: boolean
  showLimitLabels: boolean
  limitColor: string
  centerLineColor: string
  pointColor: string
  lineColor: string
  connectPoints: boolean
  highlightOOCL: boolean
  oocColor: string
  xAxisLabel: string
  yAxisLabel: string
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  visible: boolean
}
```

**Data Binding Structure:**
```json
{
  "measurements": [98.2, 99.1, 100.5, 101.2, 99.8],
  "spc": {
    "mean": 100,
    "ucl": 105,
    "lcl": 95
  }
}
```

**Files to Create:**
- `components/builder/components/ControlChart.tsx`
- `components/builder/settings/ControlChartSettings.tsx`
- `lib/export/component-renderers/render-controlchart.ts`

---

### 5. CapabilityIndex

**Purpose:** Display process capability metrics (Cp, Cpk, Pp, Ppk) with visual indicator.

**Visual Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│                  Process Capability Index                    │
├─────────────────────────────────────────────────────────────┤
│    Specification: 100 ± 5 (USL: 105, LSL: 95)              │
│    ┌──────────────────────────────────────────────────┐    │
│    │   Cp  │  1.67  │  ████████████████░░░░  │ Excellent  │    │
│    │  Cpk  │  1.52  │  ███████████████░░░░░   │ Good       │    │
│    └──────────────────────────────────────────────────┘    │
│    Interpretation: Process is capable (Cpk > 1.33)         │
└─────────────────────────────────────────────────────────────┘
```

**Props Interface:**
```typescript
interface CapabilityIndexProps {
  title: string
  dataBinding: string
  showCp: boolean
  showCpk: boolean
  showPp: boolean
  showPpk: boolean
  showSpecLimits: boolean
  showInterpretation: boolean
  showBar: boolean
  thresholdGood: number
  thresholdExcellent: number
  layout: 'horizontal' | 'vertical'
  excellentColor: string
  goodColor: string
  marginalColor: string
  poorColor: string
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  visible: boolean
}
```

**Rating Scale:**
- Excellent: Cpk ≥ 1.67
- Good: Cpk ≥ 1.33
- Marginal: Cpk ≥ 1.00
- Poor: Cpk < 1.00

**Data Binding Structure:**
```json
{
  "capability": {
    "target": 100,
    "usl": 105,
    "lsl": 95,
    "cp": 1.67,
    "cpk": 1.52,
    "pp": 1.45,
    "ppk": 1.38
  }
}
```

**Files to Create:**
- `components/builder/components/CapabilityIndex.tsx`
- `components/builder/settings/CapabilityIndexSettings.tsx`
- `lib/export/component-renderers/render-capabilityindex.ts`

---

### 6. ApprovalBlock

**Purpose:** Multi-signature approval section for formal sign-off workflows.

**Visual Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│                      Report Approval                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐│
│  │ Prepared By:    │  │ Reviewed By:    │  │ Approved By:││
│  │ ______________  │  │ ______________  │  │ ___________ ││
│  │ John Smith      │  │ Jane Doe        │  │             ││
│  │ Date: 2026-03-11│  │ Date: 2026-03-12│  │Date:        ││
│  └─────────────────┘  └─────────────────┘  └─────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Props Interface:**
```typescript
interface ApprovalBlockProps {
  title: string
  dataBinding: string
  approvers: ApproverConfig[]
  layout: 'horizontal' | 'vertical' | 'grid'
  showSignatureLine: boolean
  showDate: boolean
  showTitle: boolean
  showStatus: boolean
  emptyDatePlaceholder: string
  approvedColor: string
  pendingColor: string
  rejectedColor: string
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  visible: boolean
}

interface ApproverConfig {
  role: string
  nameBinding?: string
  dateBinding?: string
  statusBinding?: string
}
```

**Data Binding Structure:**
```json
{
  "approvals": [
    {
      "role": "Prepared By",
      "name": "John Smith",
      "title": "Test Engineer",
      "date": "2026-03-11",
      "status": "approved"
    },
    {
      "role": "Reviewed By",
      "name": "Jane Doe",
      "title": "Quality Manager",
      "date": "2026-03-12",
      "status": "approved"
    },
    {
      "role": "Approved By",
      "name": "",
      "title": "Engineering Director",
      "date": "",
      "status": "pending"
    }
  ]
}
```

**Files to Create:**
- `components/builder/components/ApprovalBlock.tsx`
- `components/builder/settings/ApprovalBlockSettings.tsx`
- `lib/export/component-renderers/render-approvalblock.ts`

---

## Implementation Priority

| Priority | Component | Rationale |
|----------|-----------|-----------|
| 1 | EquipmentInfo | Low complexity, high value for traceability |
| 2 | ComparisonTable | Core validation report feature |
| 3 | HeaderFooter | Essential for multi-page reports |
| 4 | ApprovalBlock | Common workflow requirement |
| 5 | CapabilityIndex | Medium complexity, specific use case |
| 6 | ControlChart | High complexity, Chart.js integration needed |

## Architecture Notes

### Component Pattern
All components follow the existing pattern:
- `ResizableBox` wrapper for drag/resize
- `useNode` hook for Craft.js integration
- `useBuilderStore` for sample data access
- `craft` static object with displayName, props, settings, rules

### Export Renderer Pattern
All renderers follow the `ComponentRenderer` type:
```typescript
type ComponentRenderer = (props: ComponentProps) => string
```

### Data Binding
All components support `{{data.path}}` syntax via the existing binding utilities in `lib/utils/binding.ts`.

## Testing Requirements

Each component requires:
1. Unit tests for the React component
2. Unit tests for the export renderer
3. Integration test with sample data binding
4. Visual regression test for PDF export

## Dependencies

- No new external dependencies required
- ControlChart can use existing Chart.js integration
- All components use existing Tailwind utilities and project theme
