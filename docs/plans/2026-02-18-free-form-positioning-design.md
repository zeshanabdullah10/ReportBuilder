# Free-Form Positioning with Alignment Guides - Design Document

**Date:** 2026-02-18
**Status:** Approved
**Related:** 2026-02-17-template-builder-design.md

---

## Overview

Enable Figma-like free positioning for template builder components with smart alignment assistance. Components can be placed anywhere on the canvas with visual guides for precise alignment.

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Positioning | Guided free-form | Maximum flexibility with smart alignment cues |
| Grid | Always visible, 8px | Provides visual reference, precise control |
| Alignment | Edges + centers + spacing | Full alignment support like PowerPoint |
| Resize handles | 8 handles, contextual | Full control, clean canvas when not editing |
| Layering | Auto + manual controls | Best of both worlds |
| Minimum size | Uniform 50x30 | Simple, consistent |

---

## Architecture

### New Components

```
components/builder/layout/
├── ResizableBox.tsx      # Wrapper for position + resize + drag
├── AlignmentGuides.tsx   # Draws cyan alignment lines
└── GridOverlay.tsx       # 8px grid background
```

### Component Wrapping Pattern

Every builder component wraps its content with `ResizableBox`:

```
ResizableBox (position: absolute, handles)
└── Component Content (the actual Text, Chart, etc.)
```

### Data Model

Each component gains 4 new props stored in Craft.js state:

```typescript
interface PositionProps {
  x: number      // Left position (default: 0)
  y: number      // Top position (default: 0)
  width: number  // Width in pixels
  height: number // Height in pixels
  zIndex: number // Layer order (default: 1)
}
```

---

## Components

### ResizableBox

Wrapper component that handles positioning, resizing, and dragging.

**Props:**
```typescript
interface ResizableBoxProps {
  x: number
  y: number
  width: number
  height: number
  minWidth?: number       // Default: 50
  minHeight?: number      // Default: 30
  selected: boolean       // From Craft.js useNode
  snapToGrid: boolean     // From Zustand store
  gridSize: number        // Default: 8
  onPositionChange: (pos: { x, y, width, height }) => void
  children: React.ReactNode
}
```

**Resize Handles:**
```
  [NW]────[N]────[NE]
    │             │
   [W]   content  [E]
    │             │
  [SW]────[S]────[SE]
```

- Corner handles (8x8px): Resize both dimensions
- Edge handles (24x6px): Resize one dimension
- Handles visible only when `selected === true`
- Color: Cyan (#00ffc8) with dark border

### AlignmentGuides

Global overlay that calculates and draws alignment lines during drag/resize.

**Guide Types:**
| Type | Trigger | Visual |
|------|---------|--------|
| Left edge | left ≈ other.left | Vertical solid cyan |
| Right edge | right ≈ other.right | Vertical solid cyan |
| Top edge | top ≈ other.top | Horizontal solid cyan |
| Bottom edge | bottom ≈ other.bottom | Horizontal solid cyan |
| Center X | centerX ≈ other.centerX | Vertical dashed cyan |
| Center Y | centerY ≈ other.centerY | Horizontal dashed cyan |
| Equal spacing | Equal gaps between 3+ | Measurement label |

**Behavior:**
- Snap threshold: 4px
- Auto-snap when guide appears
- Hold `Alt` to disable snap temporarily

### GridOverlay

Background grid layer.

**Visual:**
- Grid lines: `rgba(255,255,255,0.05)` every 8px
- Major lines: `rgba(255,255,255,0.1)` every 80px
- Rendered below all components

### PositionSettings

Settings panel section for position/size control.

```
┌─────────────────────────┐
│ Position & Size         │
├──────────┬──────────────┤
│ X: [120] │ Y: [  64]    │
├──────────┼──────────────┤
│ W: [200] │ H: [  50]    │
└──────────┴──────────────┘
```

---

## Component Updates

### Page Component

Add `position: relative` to enable absolute positioning for children:

```typescript
<div style={{
  position: 'relative',  // NEW
  background,
  padding: `${padding}px`,
  minHeight: '100%',
  width: '100%',
}}>
  {children}
</div>
```

### Builder Components (7 total)

Each component follows this pattern:

```typescript
export const Text = ({
  text, fontSize,
  x = 0, y = 0, width = 200, height = 50,  // NEW
}: TextProps) => {

  const handlePositionChange = (pos) => {
    setProp(props => {
      props.x = pos.x
      props.y = pos.y
      props.width = pos.width
      props.height = pos.height
    })
  }

  return (
    <ResizableBox
      x={x} y={y} width={width} height={height}
      selected={selected}
      onPositionChange={handlePositionChange}
    >
      <p ref={connect(drag)}>{text}</p>
    </ResizableBox>
  )
}
```

### Default Sizes

| Component | Width | Height | Min Width | Min Height |
|-----------|-------|--------|-----------|------------|
| Text | 200 | 50 | 50 | 30 |
| Container | 300 | 200 | 80 | 60 |
| Image | 300 | 200 | 50 | 50 |
| Table | 400 | 150 | 200 | 100 |
| Chart | 400 | 300 | 200 | 150 |
| Indicator | 120 | 44 | 80 | 36 |
| Spacer | 100 | 40 | 20 | 20 |

---

## State Management

### Zustand Store Updates

```typescript
interface BuilderState {
  // Existing
  templateId: string
  templateName: string
  sampleData: object | null
  selectedNodeId: string | null
  isPreviewMode: boolean
  hasUnsavedChanges: boolean

  // NEW
  snapEnabled: boolean           // Snap-to-grid toggle
  activeDrag: {                  // Track during drag
    nodeId: string
    startX: number
    startY: number
    currentX: number
    currentY: number
  } | null
}
```

---

## Layer Controls

### Auto-Bring-Forward

When a component is selected, it automatically comes to front:

```typescript
onSelect: () => {
  const maxZ = getMaxZIndex()
  setProp(props => props.zIndex = maxZ + 1)
}
```

### Manual Controls

Add to SettingsPanel:

```
[⬆️ Bring Front] [⬇️ Send Back]
```

---

## Toolbar Addition

Add snap-to-grid toggle to BuilderTopbar:

```
[🔗 Snap to Grid]  <- Toggle button with on/off state
```

---

## Files Summary

### Create
- `components/builder/layout/ResizableBox.tsx`
- `components/builder/layout/AlignmentGuides.tsx`
- `components/builder/layout/GridOverlay.tsx`
- `components/builder/settings/PositionSettings.tsx`

### Modify
- `components/builder/canvas/Page.tsx`
- `components/builder/canvas/BuilderCanvas.tsx`
- `components/builder/topbar/BuilderTopbar.tsx`
- `components/builder/settings/SettingsPanel.tsx`
- `lib/stores/builder-store.ts`
- `components/builder/components/Text.tsx`
- `components/builder/components/Container.tsx`
- `components/builder/components/Image.tsx`
- `components/builder/components/Table.tsx`
- `components/builder/components/Chart.tsx`
- `components/builder/components/Indicator.tsx`
- `components/builder/components/Spacer.tsx`

---

## Visual Theme

All new UI elements use the oscilloscope theme:
- Primary color: `#00ffc8` (Phosphor Cyan)
- Handles, guides, grid: Cyan variations
- Background: `#0a0f14` (Grid Dark)
