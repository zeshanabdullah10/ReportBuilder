# Template Builder - Phase 3 Design Document

**Date:** 2026-02-17
**Status:** Approved
**Phase:** 3 of 6

---

## Overview

A visual drag-drop template builder using Craft.js that allows users to design report templates with data binding, charts, and styling. Templates are saved to Supabase and will later be exportable as standalone HTML files.

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | @craftjs/core | Purpose-built for page builders, accelerates development |
| Scope | Full builder with Charts | Complete solution for test report templates |
| Data Binding | `{{data.path}}` syntax | Simple for users who know their JSON structure |
| State Management | Craft.js + Zustand | Craft.js for canvas, Zustand for UI state |
| Charts | Chart.js + react-chartjs-2 | Covers 90% of test report needs |

---

## Architecture

### 3-Panel Layout

```
/builder/[id] page
├── BuilderLayout (3-panel layout)
│   ├── Left Sidebar - Component Toolbox
│   │   ├── Text, Image, Container
│   │   ├── Table, Chart, Indicator
│   │   └── Spacer, Page Break
│   │
│   ├── Center - Craft.js Canvas
│   │   └── Drag-drop report design area
│   │
│   └── Right Sidebar - Properties Panel
│       ├── Selected component settings
│       ├── Data binding ({{data.path}})
│       ├── Styling (font, color, padding)
│       └── Conditional visibility
│
└── Top Bar
    ├── Template name, Save button
    ├── Preview toggle, Download button
    └── Sample data loader
```

---

## Components

### Available Components

| Component | Description | Features |
|-----------|-------------|----------|
| **Text** | Rich text with variable interpolation | `{{bindings}}`, font/color styling |
| **Image** | Static images or data-driven | Upload or URL, sizing options |
| **Container** | Grouping, layout control | Background, borders, padding |
| **Table** | Dynamic tables from arrays | Bind to array, auto-columns, styling |
| **Chart** | Line, Bar, Pie charts | Chart.js integration, data binding |
| **Indicator** | Pass/Fail status badges | Conditional colors based on value |
| **Spacer** | Layout spacing | Height control |
| **Page Break** | Force new page for PDF | Print control |

---

## Data Flow

### Craft.js State (Serialized to JSON)

```typescript
// Stored in Supabase templates.canvas_state column
{
  ROOT: { type: 'Page', props: {}, nodes: ['header', 'content'] },
  header: { type: 'Container', props: { background: '#fff' }, nodes: ['logo', 'title'] },
  title: { type: 'Text', props: { text: '{{data.testName}}', fontSize: 24 } },
  chart1: { type: 'Chart', props: { chartType: 'line', binding: 'data.charts.voltage' } }
}
```

### Builder State (Zustand)

```typescript
interface BuilderState {
  templateId: string
  templateName: string
  sampleData: object | null  // For preview
  selectedNodeId: string | null
  isPreviewMode: boolean
  hasUnsavedChanges: boolean
}
```

### Save Flow

1. User clicks Save
2. `craftState = query.serialize()` from Craft.js
3. POST to `/api/templates/[id]` with `{ canvas_state: craftState, settings, sample_data }`
4. Update Supabase `templates` table

---

## Data Binding

### Syntax

Simple path binding using `{{data.path}}` syntax:

```typescript
// Text content
"Test Name: {{data.meta.testName}}"

// Chart data binding
binding: "data.charts.voltageOverTime"

// Table array binding
binding: "data.results.tests"

// Conditional visibility
showIf: "data.results.overallStatus === 'PASS'"
```

### Runtime Resolution

The exported template will resolve bindings at runtime:

```javascript
function resolveBinding(path, data) {
  const keys = path.replace('data.', '').split('.')
  return keys.reduce((obj, key) => obj?.[key], data)
}
```

---

## File Structure

```
components/builder/
├── canvas/
│   ├── BuilderCanvas.tsx      # Main Craft.js canvas wrapper
│   ├── Page.tsx               # Root page component
│   └── RenderNode.tsx         # Selected node indicator + drag handle
│
├── components/                 # Craft.js user components
│   ├── Text.tsx               # Rich text with {{bindings}}
│   ├── Image.tsx              # Image upload/URL
│   ├── Container.tsx          # Grouping container
│   ├── Table.tsx              # Dynamic table from array
│   ├── Chart.tsx              # Chart.js integration
│   ├── Indicator.tsx          # Pass/Fail badges
│   ├── Spacer.tsx             # Layout spacing
│   └── PageBreak.tsx          # Force page break
│
├── settings/                   # Properties panel components
│   ├── SettingsPanel.tsx      # Main settings container
│   ├── TextSettings.tsx       # Text component settings
│   ├── ChartSettings.tsx      # Chart config + binding
│   ├── TableSettings.tsx      # Table binding + columns
│   └── StyleSettings.tsx      # Font, color, padding
│
├── toolbox/
│   └── Toolbox.tsx            # Draggable component palette
│
└── topbar/
    └── BuilderTopbar.tsx      # Save, preview, download buttons
```

---

## Dependencies

| Package | Purpose |
|---------|---------|
| @craftjs/core | Page builder framework |
| chart.js | Chart rendering |
| react-chartjs-2 | React wrapper for Chart.js |
| zustand | Builder UI state management |

---

## Implementation Steps

### Step 1: Foundation
- Install dependencies
- Create builder page route `/builder/[id]`
- Set up Zustand store for builder state

### Step 2: Canvas Setup
- BuilderCanvas with Craft.js Provider
- Page root component
- RenderNode with selection indicator

### Step 3: Core Components
- Text component with binding support
- Container component
- Image component

### Step 4: Toolbox
- Draggable component palette
- Component categories

### Step 5: Settings Panel
- SettingsPanel container
- Per-component settings forms
- Style controls

### Step 6: Data Components
- Table with array binding
- Chart with Chart.js integration
- Indicator (Pass/Fail)

### Step 7: Save/Load
- Template save to Supabase
- Template load from Supabase
- Auto-save indication

### Step 8: Preview Mode
- Toggle preview/edit
- Render with sample data
- Live binding preview

---

## Future Phases

This design covers Phase 3. Subsequent phases will add:

- **Phase 4**: Template management (list, delete, duplicate)
- **Phase 5**: Template export engine (standalone HTML generation)
- **Phase 6**: Billing & subscription (Stripe integration)
