# Additional Print-First Components Design

**Date:** 2026-02-21
**Status:** Planning
**Purpose:** Add 6 more high-value components for test engineering reports

---

## Component Specifications

### 1. Logo Component

**Purpose:** Company logo with proper sizing and alignment for branding.

**Props:**
```typescript
interface LogoProps {
  // Image source
  src?: string
  binding?: string        // {{data.companyLogo}}
  
  // Sizing
  width?: number          // Default: 150
  height?: number         // Default: auto
  maxHeight?: number      // Default: 80
  
  // Alignment
  align?: 'left' | 'center' | 'right'
  
  // Alt text
  alt?: string
  
  // Fallback
  fallbackText?: string   // Company name if no image
  
  // Position
  x?: number
  y?: number
  zIndex?: number
  visible?: boolean
}
```

---

### 2. Watermark Component

**Purpose:** Display document status watermarks like "DRAFT", "CONFIDENTIAL", "APPROVED".

**Props:**
```typescript
interface WatermarkProps {
  // Content
  text?: string           // Default: "DRAFT"
  binding?: string        // {{data.status}}
  
  // Presets
  preset?: 'draft' | 'confidential' | 'approved' | 'sample' | 'custom'
  
  // Styling
  color?: string          // Default: '#ff0000' (red)
  opacity?: number        // Default: 0.2
  rotation?: number       // Default: -45 (degrees)
  fontSize?: number       // Default: 48
  
  // Position
  position?: 'center' | 'tile' | 'diagonal'
  
  // Size
  width?: number
  height?: number
  x?: number
  y?: number
  zIndex?: number         // Default: 999 (on top)
  visible?: boolean
}
```

**Rendered Output:**
```
┌─────────────────────────────────────────────┐
│                                             │
│          DRAFT (rotated -45°, faded)        │
│                                             │
└─────────────────────────────────────────────┘
```

---

### 3. SpecBox Component

**Purpose:** Display specification limits visually with nominal, min, and max values.

**Props:**
```typescript
interface SpecBoxProps {
  // Data bindings
  nominalBinding?: string
  minBinding?: string
  maxBinding?: string
  unitBinding?: string
  
  // Static values
  nominal?: number
  min?: number
  max?: number
  unit?: string
  
  // Display
  showUnit?: boolean      // Default: true
  showTolerance?: boolean // Show ±tolerance
  layout?: 'horizontal' | 'vertical'
  
  // Styling
  borderColor?: string
  backgroundColor?: string
  labelColor?: string
  valueColor?: string
  
  // Title
  title?: string          // e.g., "Voltage Specification"
  
  // Position
  x?: number
  y?: number
  width?: number          // Default: 200
  height?: number         // Default: 100
  zIndex?: number
  visible?: boolean
}
```

**Rendered Output:**
```
┌─────────────────────────────────┐
│   Voltage Specification         │
├─────────────────────────────────┤
│  Min      Nominal     Max       │
│  4.8V     5.0V       5.2V       │
│  (─±0.2V ─)                    │
└─────────────────────────────────┘
```

---

### 4. ToleranceBand Component

**Purpose:** Visual indicator showing value position within tolerance zones (green/yellow/red).

**Props:**
```typescript
interface ToleranceBandProps {
  // Data bindings
  valueBinding?: string
  nominalBinding?: string
  toleranceBinding?: string
  
  // Static values
  value?: number
  nominal?: number
  tolerance?: number
  
  // Zone configuration
  greenZone?: number      // % of tolerance for green, default: 80
  yellowZone?: number     // % of tolerance for yellow, default: 100
  
  // Display
  showValue?: boolean     // Default: true
  showPercentage?: boolean// Show % of tolerance
  orientation?: 'horizontal' | 'vertical'
  
  // Styling
  greenColor?: string     // Default: '#22c55e'
  yellowColor?: string    // Default: '#f59e0b'
  redColor?: string       // Default: '#ef4444'
  backgroundColor?: string
  
  // Labels
  label?: string
  
  // Position
  x?: number
  y?: number
  width?: number          // Default: 200
  height?: number         // Default: 40
  zIndex?: number
  visible?: boolean
}
```

**Rendered Output:**
```
┌─────────────────────────────────────────────┐
│ ████████████████████░░░░░░░░░░░░░░░░░░░░░░░ │
│ ▲                                  ▲        │
│ -Tol                              +Tol      │
│                    ● (value marker)         │
└─────────────────────────────────────────────┘
```

---

### 5. PassRateChart Component

**Purpose:** Donut chart showing pass/fail ratio with percentage.

**Props:**
```typescript
interface PassRateChartProps {
  // Data bindings
  passedBinding?: string
  failedBinding?: string
  totalBinding?: string
  
  // Static values
  passed?: number
  failed?: number
  total?: number
  
  // Display
  showPercentage?: boolean    // Default: true
  showCounts?: boolean        // Default: true
  showLegend?: boolean        // Default: true
  
  // Size
  size?: number               // Diameter in pixels, default: 120
  
  // Styling
  passColor?: string          // Default: '#22c55e'
  failColor?: string          // Default: '#ef4444'
  backgroundColor?: string
  textColor?: string
  
  // Title
  title?: string
  
  // Position
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
  visible?: boolean
}
```

**Rendered Output:**
```
        ╭──────╮
      ╭──────────╮
     │   95%    │
     │  PASS    │
      ╰──────────╯
        ╰──────╯
     ─────── ─────
     Pass    Fail
     142      8
```

---

### 6. RevisionBlock Component

**Purpose:** Document revision history table for version tracking.

**Props:**
```typescript
interface RevisionBlockProps {
  // Data binding
  dataBinding?: string     // {{data.revisions}} - array of revision objects
  
  // Static data
  revisions?: Revision[]
  
  // Display
  showAuthor?: boolean     // Default: true
  showDate?: boolean       // Default: true
  showDescription?: boolean// Default: true
  maxRows?: number         // Limit displayed rows
  
  // Styling
  headerBackgroundColor?: string
  borderColor?: string
  fontSize?: number
  
  // Title
  title?: string           // Default: "Revision History"
  showTitle?: boolean
  
  // Position
  x?: number
  y?: number
  width?: number           // Default: 400
  height?: number          // Default: 150
  zIndex?: number
  visible?: boolean
}

interface Revision {
  version: string          // e.g., "1.0", "1.1", "2.0"
  date: string             // ISO date string
  author: string
  description: string
}
```

**Example Data:**
```json
{
  "revisions": [
    { "version": "1.0", "date": "2026-01-15", "author": "John Smith", "description": "Initial release" },
    { "version": "1.1", "date": "2026-02-01", "author": "Jane Doe", "description": "Added tolerance specs" },
    { "version": "2.0", "date": "2026-02-21", "author": "John Smith", "description": "Major update for new product" }
  ]
}
```

**Rendered Output:**
```
┌─────────────────────────────────────────────────────┐
│ REVISION HISTORY                                    │
├─────────┬────────────┬───────────┬─────────────────┤
│ Version │ Date       │ Author    │ Description     │
├─────────┼────────────┼───────────┼─────────────────┤
│ 1.0     │ 2026-01-15 │ J. Smith  │ Initial release │
│ 1.1     │ 2026-02-01 │ J. Doe    │ Added specs     │
│ 2.0     │ 2026-02-21 │ J. Smith  │ Major update    │
└─────────┴────────────┴───────────┴─────────────────┘
```

---

## Implementation Plan

### Phase 1: Simple Components
1. **Logo** - Extends Image component patterns
2. **Watermark** - CSS-based overlay

### Phase 2: Data Components
3. **SpecBox** - New component with layout logic
4. **ToleranceBand** - Visual indicator component
5. **PassRateChart** - Uses Chart.js doughnut

### Phase 3: Table Component
6. **RevisionBlock** - Table-based component

---

## File Structure

```
components/builder/components/
├── Logo.tsx
├── Watermark.tsx
├── SpecBox.tsx
├── ToleranceBand.tsx
├── PassRateChart.tsx
└── RevisionBlock.tsx

components/builder/settings/
├── LogoSettings.tsx
├── WatermarkSettings.tsx
├── SpecBoxSettings.tsx
├── ToleranceBandSettings.tsx
├── PassRateChartSettings.tsx
└── RevisionBlockSettings.tsx
```

---

## Next Steps

1. Review and approve this design
2. Switch to Code mode for implementation
3. Add to Toolbox under "Test Reports" category
4. Update resolver in BuilderCanvas
5. Test with print preview
