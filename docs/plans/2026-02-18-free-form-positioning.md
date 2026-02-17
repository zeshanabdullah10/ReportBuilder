# Free-Form Positioning Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable Figma-like free positioning for template builder components with alignment guides and snap-to-grid functionality.

**Architecture:** Wrapper component approach - create `ResizableBox` that wraps all builder components, handling positioning, resizing, and drag-to-move. Alignment guides render as a global overlay that calculates positions during drag.

**Tech Stack:** React, TypeScript, Craft.js, Zustand, Tailwind CSS

---

## Task 1: Update Zustand Store

**Files:**
- Modify: `lib/stores/builder-store.ts`

**Step 1: Add new state properties and actions**

Replace the entire file content with:

```typescript
import { create } from 'zustand'

interface ActiveDrag {
  nodeId: string
  startX: number
  startY: number
  currentX: number
  currentY: number
  width: number
  height: number
}

interface BuilderState {
  templateId: string | null
  templateName: string
  sampleData: Record<string, unknown> | null
  selectedNodeId: string | null
  isPreviewMode: boolean
  hasUnsavedChanges: boolean

  // NEW: Snap and drag state
  snapEnabled: boolean
  gridSize: number
  activeDrag: ActiveDrag | null

  setTemplateId: (id: string) => void
  setTemplateName: (name: string) => void
  setSampleData: (data: Record<string, unknown> | null) => void
  setSelectedNodeId: (id: string | null) => void
  togglePreviewMode: () => void
  setHasUnsavedChanges: (value: boolean) => void
  reset: () => void

  // NEW: Snap and drag actions
  toggleSnap: () => void
  setActiveDrag: (drag: ActiveDrag | null) => void
  updateDragPosition: (x: number, y: number) => void
}

const initialState = {
  templateId: null,
  templateName: 'Untitled Template',
  sampleData: null,
  selectedNodeId: null,
  isPreviewMode: false,
  hasUnsavedChanges: false,
  snapEnabled: true,
  gridSize: 8,
  activeDrag: null,
}

export const useBuilderStore = create<BuilderState>()((set) => ({
  ...initialState,

  setTemplateId: (id) => set({ templateId: id }),
  setTemplateName: (name) => set({ templateName: name }),
  setSampleData: (data) => set({ sampleData: data }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  togglePreviewMode: () => set((state) => ({ isPreviewMode: !state.isPreviewMode })),
  setHasUnsavedChanges: (value) => set({ hasUnsavedChanges: value }),
  reset: () => set(initialState),

  // NEW
  toggleSnap: () => set((state) => ({ snapEnabled: !state.snapEnabled })),
  setActiveDrag: (drag) => set({ activeDrag: drag }),
  updateDragPosition: (x, y) => set((state) => ({
    activeDrag: state.activeDrag ? { ...state.activeDrag, currentX: x, currentY: y } : null,
  })),
}))
```

**Step 2: Run TypeScript validation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add lib/stores/builder-store.ts
git commit -m "feat: add snap and drag state to builder store"
```

---

## Task 2: Create GridOverlay Component

**Files:**
- Create: `components/builder/layout/GridOverlay.tsx`

**Step 1: Create the GridOverlay component**

```typescript
'use client'

interface GridOverlayProps {
  gridSize?: number
}

export function GridOverlay({ gridSize = 8 }: GridOverlayProps) {
  const majorGridSize = gridSize * 10 // 80px for major lines

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px),
          linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
        `,
        backgroundSize: `${gridSize}px ${gridSize}px, ${gridSize}px ${gridSize}px, ${majorGridSize}px ${majorGridSize}px, ${majorGridSize}px ${majorGridSize}px`,
      }}
    />
  )
}
```

**Step 2: Run TypeScript validation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/builder/layout/GridOverlay.tsx
git commit -m "feat: create GridOverlay component with 8px grid"
```

---

## Task 3: Create ResizableBox Component (Core)

**Files:**
- Create: `components/builder/layout/ResizableBox.tsx`

**Step 1: Create the ResizableBox component**

```typescript
'use client'

import React, { useCallback, useRef, useState, useEffect } from 'react'
import { useBuilderStore } from '@/lib/stores/builder-store'

interface ResizableBoxProps {
  x: number
  y: number
  width: number
  height: number
  minWidth?: number
  minHeight?: number
  selected: boolean
  nodeId: string
  onPositionChange: (pos: { x?: number; y?: number; width?: number; height?: number }) => void
  children: React.ReactNode
}

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

interface ResizeState {
  isResizing: boolean
  handle: ResizeHandle | null
  startX: number
  startY: number
  startWidth: number
  startHeight: number
  startLeft: number
  startTop: number
}

interface DragState {
  isDragging: boolean
  startX: number
  startY: number
  startLeft: number
  startTop: number
}

export function ResizableBox({
  x,
  y,
  width,
  height,
  minWidth = 50,
  minHeight = 30,
  selected,
  nodeId,
  onPositionChange,
  children,
}: ResizableBoxProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const { snapEnabled, gridSize, setActiveDrag } = useBuilderStore()

  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    handle: null,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    startLeft: 0,
    startTop: 0,
  })

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
  })

  const [currentPos, setCurrentPos] = useState({ x, y, width, height })

  // Sync with props when they change externally
  useEffect(() => {
    if (!resizeState.isResizing && !dragState.isDragging) {
      setCurrentPos({ x, y, width, height })
    }
  }, [x, y, width, height, resizeState.isResizing, dragState.isDragging])

  // Snap helper
  const snapToGrid = useCallback(
    (value: number): number => {
      if (!snapEnabled) return value
      return Math.round(value / gridSize) * gridSize
    },
    [snapEnabled, gridSize]
  )

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, handle: ResizeHandle) => {
      e.preventDefault()
      e.stopPropagation()

      setResizeState({
        isResizing: true,
        handle,
        startX: e.clientX,
        startY: e.clientY,
        startWidth: currentPos.width as number,
        startHeight: currentPos.height as number,
        startLeft: currentPos.x,
        startTop: currentPos.y,
      })

      setActiveDrag({
        nodeId,
        startX: currentPos.x,
        startY: currentPos.y,
        currentX: currentPos.x,
        currentY: currentPos.y,
        width: currentPos.width as number,
        height: currentPos.height as number,
      })
    },
    [currentPos, nodeId, setActiveDrag]
  )

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      setDragState({
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        startLeft: currentPos.x,
        startTop: currentPos.y,
      })

      setActiveDrag({
        nodeId,
        startX: currentPos.x,
        startY: currentPos.y,
        currentX: currentPos.x,
        currentY: currentPos.y,
        width: currentPos.width as number,
        height: currentPos.height as number,
      })
    },
    [currentPos, nodeId, setActiveDrag]
  )

  // Resize mouse move handler
  useEffect(() => {
    if (!resizeState.isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeState.startX
      const deltaY = e.clientY - resizeState.startY
      const handle = resizeState.handle!

      let newWidth = resizeState.startWidth
      let newHeight = resizeState.startHeight
      let newX = resizeState.startLeft
      let newY = resizeState.startTop

      switch (handle) {
        case 'nw':
          newWidth = Math.max(minWidth, resizeState.startWidth - deltaX)
          newHeight = Math.max(minHeight, resizeState.startHeight - deltaY)
          if (newWidth > minWidth) newX = resizeState.startLeft + deltaX
          if (newHeight > minHeight) newY = resizeState.startTop + deltaY
          break
        case 'n':
          newHeight = Math.max(minHeight, resizeState.startHeight - deltaY)
          if (newHeight > minHeight) newY = resizeState.startTop + deltaY
          break
        case 'ne':
          newWidth = Math.max(minWidth, resizeState.startWidth + deltaX)
          newHeight = Math.max(minHeight, resizeState.startHeight - deltaY)
          if (newHeight > minHeight) newY = resizeState.startTop + deltaY
          break
        case 'e':
          newWidth = Math.max(minWidth, resizeState.startWidth + deltaX)
          break
        case 'se':
          newWidth = Math.max(minWidth, resizeState.startWidth + deltaX)
          newHeight = Math.max(minHeight, resizeState.startHeight + deltaY)
          break
        case 's':
          newHeight = Math.max(minHeight, resizeState.startHeight + deltaY)
          break
        case 'sw':
          newWidth = Math.max(minWidth, resizeState.startWidth - deltaX)
          newHeight = Math.max(minHeight, resizeState.startHeight + deltaY)
          if (newWidth > minWidth) newX = resizeState.startLeft + deltaX
          break
        case 'w':
          newWidth = Math.max(minWidth, resizeState.startWidth - deltaX)
          if (newWidth > minWidth) newX = resizeState.startLeft + deltaX
          break
      }

      const snappedX = snapToGrid(newX)
      const snappedY = snapToGrid(newY)
      const snappedWidth = snapToGrid(newWidth)
      const snappedHeight = snapToGrid(newHeight)

      setCurrentPos({
        x: snappedX,
        y: snappedY,
        width: snappedWidth,
        height: snappedHeight,
      })

      setActiveDrag({
        nodeId,
        startX: snappedX,
        startY: snappedY,
        currentX: snappedX,
        currentY: snappedY,
        width: snappedWidth,
        height: snappedHeight,
      })
    }

    const handleMouseUp = () => {
      onPositionChange({
        x: currentPos.x,
        y: currentPos.y,
        width: currentPos.width as number,
        height: currentPos.height as number,
      })
      setResizeState((prev) => ({ ...prev, isResizing: false, handle: null }))
      setActiveDrag(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizeState, currentPos, minWidth, minHeight, onPositionChange, snapToGrid, nodeId, setActiveDrag])

  // Drag mouse move handler
  useEffect(() => {
    if (!dragState.isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragState.startX
      const deltaY = e.clientY - dragState.startY

      const newX = snapToGrid(dragState.startLeft + deltaX)
      const newY = snapToGrid(dragState.startTop + deltaY)

      setCurrentPos((prev) => ({
        ...prev,
        x: newX,
        y: newY,
      }))

      setActiveDrag({
        nodeId,
        startX: newX,
        startY: newY,
        currentX: newX,
        currentY: newY,
        width: currentPos.width as number,
        height: currentPos.height as number,
      })
    }

    const handleMouseUp = () => {
      onPositionChange({
        x: currentPos.x,
        y: currentPos.y,
      })
      setDragState((prev) => ({ ...prev, isDragging: false }))
      setActiveDrag(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragState, currentPos, onPositionChange, snapToGrid, nodeId, setActiveDrag])

  // Handle positions
  const handlePositions: Record<ResizeHandle, React.CSSProperties> = {
    nw: { top: -4, left: -4, cursor: 'nwse-resize' },
    n: { top: -4, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' },
    ne: { top: -4, right: -4, cursor: 'nesw-resize' },
    e: { top: '50%', right: -4, transform: 'translateY(-50%)', cursor: 'ew-resize' },
    se: { bottom: -4, right: -4, cursor: 'nwse-resize' },
    s: { bottom: -4, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' },
    sw: { bottom: -4, left: -4, cursor: 'nesw-resize' },
    w: { top: '50%', left: -4, transform: 'translateY(-50%)', cursor: 'ew-resize' },
  }

  const isActive = resizeState.isResizing || dragState.isDragging

  return (
    <div
      ref={boxRef}
      className="relative"
      style={{
        position: 'absolute',
        left: `${currentPos.x}px`,
        top: `${currentPos.y}px`,
        width: `${currentPos.width}px`,
        height: `${currentPos.height}px`,
        userSelect: isActive ? 'none' : 'auto',
        zIndex: selected ? 10 : 1,
      }}
    >
      {/* Drag handle overlay - only when selected */}
      {selected && (
        <div
          className="absolute inset-0 cursor-move z-10"
          onMouseDown={handleDragStart}
          style={{ background: 'transparent' }}
        />
      )}

      {/* Content */}
      <div
        className="relative w-full h-full"
        style={{ pointerEvents: isActive ? 'none' : 'auto' }}
      >
        {children}
      </div>

      {/* Resize handles - only visible when selected */}
      {selected && (
        <>
          {(Object.keys(handlePositions) as ResizeHandle[]).map((handle) => (
            <div
              key={handle}
              className="absolute bg-[#00ffc8] border border-[#0a0f14] z-20"
              style={{
                ...handlePositions[handle],
                width: handle === 'n' || handle === 's' ? 24 : 8,
                height: handle === 'e' || handle === 'w' ? 24 : 8,
                borderRadius: 2,
              }}
              onMouseDown={(e) => handleResizeStart(e, handle)}
            />
          ))}
        </>
      )}
    </div>
  )
}
```

**Step 2: Run TypeScript validation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/builder/layout/ResizableBox.tsx
git commit -m "feat: create ResizableBox component with resize handles and drag"
```

---

## Task 4: Create AlignmentGuides Component

**Files:**
- Create: `components/builder/layout/AlignmentGuides.tsx`

**Step 1: Create the AlignmentGuides component**

```typescript
'use client'

import { useEditor } from '@craftjs/core'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { useMemo } from 'react'

interface Guide {
  type: 'vertical' | 'horizontal'
  position: number
  variant: 'solid' | 'dashed'
}

const SNAP_THRESHOLD = 4

export function AlignmentGuides() {
  const { activeDrag } = useBuilderStore()
  const { query } = useEditor()

  const guides = useMemo(() => {
    if (!activeDrag) return []

    const guides: Guide[] = []
    const state = query.getState()

    // Get all node IDs except the one being dragged
    const allNodeIds = Object.keys(state.nodes).filter(
      (id) => id !== activeDrag.nodeId && id !== 'ROOT'
    )

    // Calculate bounds of dragged element
    const dragLeft = activeDrag.currentX
    const dragTop = activeDrag.currentY
    const dragRight = activeDrag.currentX + activeDrag.width
    const dragBottom = activeDrag.currentY + activeDrag.height
    const dragCenterX = activeDrag.currentX + activeDrag.width / 2
    const dragCenterY = activeDrag.currentY + activeDrag.height / 2

    // Collect all other component bounds
    const otherBounds: Array<{
      left: number
      top: number
      right: number
      bottom: number
      centerX: number
      centerY: number
    }> = []

    for (const nodeId of allNodeIds) {
      const node = state.nodes[nodeId]
      const props = node.data.props
      if (props && typeof props.x === 'number' && typeof props.width === 'number') {
        otherBounds.push({
          left: props.x,
          top: props.y || 0,
          right: props.x + (props.width || 100),
          bottom: (props.y || 0) + (props.height || 50),
          centerX: props.x + (props.width || 100) / 2,
          centerY: (props.y || 0) + (props.height || 50) / 2,
        })
      }
    }

    // Check for alignment matches
    for (const bounds of otherBounds) {
      // Left edge alignment
      if (Math.abs(dragLeft - bounds.left) < SNAP_THRESHOLD) {
        guides.push({ type: 'vertical', position: bounds.left, variant: 'solid' })
      }
      // Right edge alignment
      if (Math.abs(dragRight - bounds.right) < SNAP_THRESHOLD) {
        guides.push({ type: 'vertical', position: bounds.right, variant: 'solid' })
      }
      // Top edge alignment
      if (Math.abs(dragTop - bounds.top) < SNAP_THRESHOLD) {
        guides.push({ type: 'horizontal', position: bounds.top, variant: 'solid' })
      }
      // Bottom edge alignment
      if (Math.abs(dragBottom - bounds.bottom) < SNAP_THRESHOLD) {
        guides.push({ type: 'horizontal', position: bounds.bottom, variant: 'solid' })
      }
      // Center X alignment
      if (Math.abs(dragCenterX - bounds.centerX) < SNAP_THRESHOLD) {
        guides.push({ type: 'vertical', position: bounds.centerX, variant: 'dashed' })
      }
      // Center Y alignment
      if (Math.abs(dragCenterY - bounds.centerY) < SNAP_THRESHOLD) {
        guides.push({ type: 'horizontal', position: bounds.centerY, variant: 'dashed' })
      }
    }

    // Remove duplicates
    const uniqueGuides = guides.filter(
      (guide, index, self) =>
        index ===
        self.findIndex(
          (g) => g.type === guide.type && g.position === guide.position && g.variant === guide.variant
        )
    )

    return uniqueGuides
  }, [activeDrag, query])

  if (!activeDrag || guides.length === 0) return null

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {guides.map((guide, index) =>
        guide.type === 'vertical' ? (
          <div
            key={`v-${index}`}
            className="absolute top-0 bottom-0 w-px bg-[#00ffc8]"
            style={{
              left: guide.position,
              borderLeftStyle: guide.variant,
            }}
          />
        ) : (
          <div
            key={`h-${index}`}
            className="absolute left-0 right-0 h-px bg-[#00ffc8]"
            style={{
              top: guide.position,
              borderTopStyle: guide.variant,
            }}
          />
        )
      )}
    </div>
  )
}
```

**Step 2: Run TypeScript validation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/builder/layout/AlignmentGuides.tsx
git commit -m "feat: create AlignmentGuides component for edge/center alignment"
```

---

## Task 5: Create PositionSettings Component

**Files:**
- Create: `components/builder/settings/PositionSettings.tsx`

**Step 1: Create the PositionSettings component**

```typescript
'use client'

import { useNode } from '@craftjs/core'
import { Input } from '@/components/ui/input'

export function PositionSettings() {
  const {
    actions: { setProp },
    x,
    y,
    width,
    height,
  } = useNode((node) => ({
    x: node.data.props.x,
    y: node.data.props.y,
    width: node.data.props.width,
    height: node.data.props.height,
  }))

  return (
    <div className="space-y-3">
      <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">
        Position & Size
      </label>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">X</label>
          <Input
            type="number"
            value={x ?? 0}
            onChange={(e) => setProp((props: any) => (props.x = parseInt(e.target.value) || 0))}
            className="text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Y</label>
          <Input
            type="number"
            value={y ?? 0}
            onChange={(e) => setProp((props: any) => (props.y = parseInt(e.target.value) || 0))}
            className="text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Width</label>
          <Input
            type="number"
            value={width ?? 100}
            onChange={(e) => setProp((props: any) => (props.width = parseInt(e.target.value) || 100))}
            className="text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Height</label>
          <Input
            type="number"
            value={height ?? 50}
            onChange={(e) => setProp((props: any) => (props.height = parseInt(e.target.value) || 50))}
            className="text-sm"
          />
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Run TypeScript validation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/builder/settings/PositionSettings.tsx
git commit -m "feat: create PositionSettings component for position/size control"
```

---

## Task 6: Update Page Component for Relative Positioning

**Files:**
- Modify: `components/builder/canvas/Page.tsx`

**Step 1: Add position: relative to Page component**

Find the style object in the return statement and add `position: 'relative'`:

```typescript
// Change from:
style={{
  background,
  padding: `${padding}px`,
  minHeight: '100%',
  width: '100%',
  outline: selected ? '2px solid #00ffc8' : hovered ? '1px dashed rgba(0,255,200,0.5)' : 'none',
  outlineOffset: '-2px',
}}

// Change to:
style={{
  position: 'relative',
  background,
  padding: `${padding}px`,
  minHeight: '100%',
  width: '100%',
  outline: selected ? '2px solid #00ffc8' : hovered ? '1px dashed rgba(0,255,200,0.5)' : 'none',
  outlineOffset: '-2px',
}}
```

**Step 2: Run TypeScript validation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/builder/canvas/Page.tsx
git commit -m "feat: add position:relative to Page for absolute child positioning"
```

---

## Task 7: Update BuilderCanvas with GridOverlay and AlignmentGuides

**Files:**
- Modify: `components/builder/canvas/BuilderCanvas.tsx`

**Step 1: Add imports**

Add to the top of the file:

```typescript
import { GridOverlay } from '../layout/GridOverlay'
import { AlignmentGuides } from '../layout/AlignmentGuides'
```

**Step 2: Add GridOverlay and AlignmentGuides to the canvas**

Find the `<main>` element and add the components inside, after the mesh gradient div:

```typescript
// Find this section:
<main className={`flex-1 overflow-auto relative bg-oscilloscope-grid ${isPreviewMode ? '' : ''}`}>
  <div className="absolute inset-0 bg-mesh-gradient opacity-30 pointer-events-none" />

  // ADD AFTER THE MESH GRADIENT:
  {!isPreviewMode && <GridOverlay />}
  <AlignmentGuides />

  // Rest of the component continues...
```

**Step 3: Run TypeScript validation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add components/builder/canvas/BuilderCanvas.tsx
git commit -m "feat: add GridOverlay and AlignmentGuides to BuilderCanvas"
```

---

## Task 8: Add Snap Toggle to BuilderTopbar

**Files:**
- Modify: `components/builder/topbar/BuilderTopbar.tsx`

**Step 1: Add import and use store**

Add `Magnet` icon to imports and `snapEnabled, toggleSnap` from store:

```typescript
// Update imports:
import { Save, Eye, EyeOff, Undo, Redo, ArrowLeft, Trash2, Magnet } from 'lucide-react'

// Update useBuilderStore destructuring:
const {
  templateId,
  templateName,
  hasUnsavedChanges,
  isPreviewMode,
  togglePreviewMode,
  setHasUnsavedChanges,
  sampleData,
  snapEnabled,      // ADD
  toggleSnap,       // ADD
} = useBuilderStore()
```

**Step 2: Add snap toggle button**

Add the snap toggle button in the right actions section, before the divider:

```typescript
// Find the divider before Preview button and add before it:
<Button
  variant={snapEnabled ? 'primary' : 'ghost'}
  size="icon"
  onClick={toggleSnap}
  title={snapEnabled ? 'Disable snap to grid' : 'Enable snap to grid'}
  disabled={isPreviewMode}
  className={snapEnabled ? 'bg-[#00ffc8] text-[#0a0f14]' : ''}
>
  <Magnet className="w-4 h-4" />
</Button>
```

**Step 3: Run TypeScript validation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add components/builder/topbar/BuilderTopbar.tsx
git commit -m "feat: add snap-to-grid toggle button to toolbar"
```

---

## Task 9: Update Text Component with ResizableBox

**Files:**
- Modify: `components/builder/components/Text.tsx`

**Step 1: Add imports and update interface**

```typescript
'use client'

import { useNode } from '@craftjs/core'
import { TextSettings } from '../settings/TextSettings'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { interpolateText, hasBindings, resolveBindingOrValue } from '@/lib/utils/binding'
import { ResizableBox } from '../layout/ResizableBox'

interface TextProps {
  text?: string
  fontSize?: number
  fontWeight?: string
  color?: string
  textAlign?: 'left' | 'center' | 'right'
  binding?: string
  x?: number
  y?: number
  width?: number
  height?: number
}
```

**Step 2: Update component function**

Replace the Text function with:

```typescript
export const Text = ({
  text = 'Edit this text',
  fontSize = 16,
  fontWeight = 'normal',
  color = '#000000',
  textAlign = 'left',
  binding = '',
  x = 0,
  y = 0,
  width = 200,
  height = 50,
}: TextProps) => {
  const {
    id,
    connectors: { connect, drag },
    selected,
    hovered,
    actions: { setProp },
  } = useNode((node) => ({
    id: node.id,
    selected: node.events.selected,
    hovered: node.events.hovered,
  }))

  const { isPreviewMode, sampleData } = useBuilderStore()

  const handlePositionChange = (newPos: { x?: number; y?: number; width?: number; height?: number }) => {
    setProp((props: TextProps) => {
      if (newPos.x !== undefined) props.x = newPos.x
      if (newPos.y !== undefined) props.y = newPos.y
      if (newPos.width !== undefined) props.width = newPos.width
      if (newPos.height !== undefined) props.height = newPos.height
    })
  }

  // ... keep existing getDisplayText and getDisplayColor functions ...

  return (
    <ResizableBox
      x={x}
      y={y}
      width={width}
      height={height}
      minWidth={50}
      minHeight={30}
      selected={selected}
      nodeId={id}
      onPositionChange={handlePositionChange}
    >
      <p
        ref={(ref) => {
          if (ref) connect(drag(ref))
        }}
        style={{
          fontSize: `${fontSize}px`,
          fontWeight,
          color: getDisplayColor(),
          textAlign,
          margin: 0,
          padding: '4px 8px',
          outline: selected ? '2px solid #00ffc8' : hovered ? '1px dashed rgba(0,255,200,0.5)' : '1px dashed transparent',
          outlineOffset: '2px',
          borderRadius: '4px',
          transition: 'outline 0.15s ease',
          cursor: 'pointer',
          width: '100%',
          height: '100%',
          minWidth: '20px',
          minHeight: '20px',
          boxSizing: 'border-box',
        }}
      >
        {getDisplayText()}
      </p>
    </ResizableBox>
  )
}
```

**Step 3: Update Text.craft props**

```typescript
Text.craft = {
  displayName: 'Text',
  props: {
    text: 'Edit this text',
    fontSize: 16,
    fontWeight: 'normal',
    color: '#000000',
    textAlign: 'left',
    binding: '',
    x: 0,
    y: 0,
    width: 200,
    height: 50,
  },
  related: {
    settings: TextSettings,
  },
}
```

**Step 4: Run TypeScript validation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add components/builder/components/Text.tsx
git commit -m "feat: wrap Text component with ResizableBox for free positioning"
```

---

## Task 10: Update TextSettings with PositionSettings

**Files:**
- Modify: `components/builder/settings/TextSettings.tsx`

**Step 1: Add import**

```typescript
import { PositionSettings } from './PositionSettings'
```

**Step 2: Add PositionSettings to the component**

Add before the closing `</div>`:

```typescript
<div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
  <PositionSettings />
</div>
```

**Step 3: Run TypeScript validation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add components/builder/settings/TextSettings.tsx
git commit -m "feat: add PositionSettings to TextSettings panel"
```

---

## Task 11: Update Remaining Components (Container, Image, Table, Chart, Indicator, Spacer)

**Files:**
- Modify: `components/builder/components/Container.tsx`
- Modify: `components/builder/components/Image.tsx`
- Modify: `components/builder/components/Table.tsx`
- Modify: `components/builder/components/Chart.tsx`
- Modify: `components/builder/components/Indicator.tsx`
- Modify: `components/builder/components/Spacer.tsx`

**Step 1: Update each component following the Text pattern**

For each component:
1. Add `ResizableBox` import
2. Add `x, y, width, height` to interface and props
3. Add `id` to useNode destructure
4. Add `handlePositionChange` function
5. Wrap content with `ResizableBox`
6. Update `craft.props` with position defaults

**Container.tsx defaults:** `x: 0, y: 0, width: 300, height: 200`
**Image.tsx defaults:** `x: 0, y: 0, width: 300, height: 200`
**Table.tsx defaults:** `x: 0, y: 0, width: 400, height: 150`
**Chart.tsx defaults:** `x: 0, y: 0, width: 400, height: 300`
**Indicator.tsx defaults:** `x: 0, y: 0, width: 120, height: 44`
**Spacer.tsx defaults:** `x: 0, y: 0, width: 100, height: 40`

**Step 2: Run TypeScript validation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/builder/components/*.tsx
git commit -m "feat: wrap all builder components with ResizableBox"
```

---

## Task 12: Update All Settings Components with PositionSettings

**Files:**
- Modify: `components/builder/settings/ContainerSettings.tsx`
- Modify: `components/builder/settings/ImageSettings.tsx`
- Modify: `components/builder/settings/TableSettings.tsx`
- Modify: `components/builder/settings/ChartSettings.tsx`
- Modify: `components/builder/settings/IndicatorSettings.tsx`
- Modify: `components/builder/settings/SpacerSettings.tsx`

**Step 1: Add PositionSettings to each settings component**

For each file:
1. Add import: `import { PositionSettings } from './PositionSettings'`
2. Add at the end before closing `</div>`:
   ```typescript
   <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
     <PositionSettings />
   </div>
   ```

**Step 2: Run TypeScript validation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/builder/settings/*.tsx
git commit -m "feat: add PositionSettings to all component settings panels"
```

---

## Task 13: Final Verification

**Step 1: Run full TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 2: Run lint check**

Run: `npm run lint`
Expected: No errors (or fixable warnings)

**Step 3: Manual test**

1. Start dev server: `npm run dev`
2. Open builder at `/builder/[id]`
3. Verify grid is visible
4. Drag a component - verify it moves freely
5. Verify alignment guides appear when edges align
6. Verify resize handles appear when selected
7. Verify snap toggle works
8. Verify Position settings update in real-time

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete free-form positioning with alignment guides"
```

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Update Zustand store with snap/drag state |
| 2 | Create GridOverlay component |
| 3 | Create ResizableBox component |
| 4 | Create AlignmentGuides component |
| 5 | Create PositionSettings component |
| 6 | Update Page for relative positioning |
| 7 | Add GridOverlay and AlignmentGuides to BuilderCanvas |
| 8 | Add snap toggle to BuilderTopbar |
| 9 | Update Text component with ResizableBox |
| 10 | Update TextSettings with PositionSettings |
| 11 | Update remaining 6 components with ResizableBox |
| 12 | Update remaining 6 settings with PositionSettings |
| 13 | Final verification and testing |
