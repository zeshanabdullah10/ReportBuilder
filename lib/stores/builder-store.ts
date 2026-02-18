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

// Page size presets in mm, converted to pixels at 96 DPI (1mm ≈ 3.7795px)
export const PAGE_SIZE_PRESETS = {
  A4: { width: 794, height: 1123, label: 'A4 (210 × 297mm)' },
  A3: { width: 1123, height: 1587, label: 'A3 (297 × 420mm)' },
  Letter: { width: 816, height: 1056, label: 'Letter (8.5 × 11in)' },
  Legal: { width: 816, height: 1344, label: 'Legal (8.5 × 14in)' },
  Custom: { width: 794, height: 1123, label: 'Custom' },
} as const

export type PageSizePreset = keyof typeof PAGE_SIZE_PRESETS

interface BuilderState {
  templateId: string | null
  templateName: string
  sampleData: Record<string, unknown> | null
  selectedNodeId: string | null
  isPreviewMode: boolean
  hasUnsavedChanges: boolean

  // Snap and drag state
  snapEnabled: boolean
  gridSize: number
  activeDrag: ActiveDrag | null

  // Zoom and pan state
  zoom: number
  panX: number
  panY: number
  isPanning: boolean

  setTemplateId: (id: string) => void
  setTemplateName: (name: string) => void
  setSampleData: (data: Record<string, unknown> | null) => void
  setSelectedNodeId: (id: string | null) => void
  togglePreviewMode: () => void
  setHasUnsavedChanges: (value: boolean) => void
  reset: () => void

  // Snap and drag actions
  toggleSnap: () => void
  setActiveDrag: (drag: ActiveDrag | null) => void
  updateDragPosition: (x: number, y: number) => void

  // Zoom and pan actions
  setZoom: (zoom: number) => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  setPan: (x: number, y: number) => void
  setIsPanning: (panning: boolean) => void
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
  zoom: 1,
  panX: 0,
  panY: 0,
  isPanning: false,
}

const ZOOM_LEVELS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 2, 2.5, 3, 4]
const MIN_ZOOM = 0.25
const MAX_ZOOM = 4

export const useBuilderStore = create<BuilderState>()((set) => ({
  ...initialState,

  setTemplateId: (id) => set({ templateId: id }),
  setTemplateName: (name) => set({ templateName: name }),
  setSampleData: (data) => set({ sampleData: data }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  togglePreviewMode: () => set((state) => ({ isPreviewMode: !state.isPreviewMode })),
  setHasUnsavedChanges: (value) => set({ hasUnsavedChanges: value }),
  reset: () => set(initialState),

  // Snap and drag
  toggleSnap: () => set((state) => ({ snapEnabled: !state.snapEnabled })),
  setActiveDrag: (drag) => set({ activeDrag: drag }),
  updateDragPosition: (x, y) => set((state) => ({
    activeDrag: state.activeDrag ? { ...state.activeDrag, currentX: x, currentY: y } : null,
  })),

  // Zoom and pan
  setZoom: (zoom) => set({ zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom)) }),
  zoomIn: () => set((state) => {
    const currentIndex = ZOOM_LEVELS.findIndex((z) => z >= state.zoom)
    const nextIndex = Math.min(currentIndex + 1, ZOOM_LEVELS.length - 1)
    return { zoom: ZOOM_LEVELS[nextIndex] }
  }),
  zoomOut: () => set((state) => {
    const currentIndex = ZOOM_LEVELS.findIndex((z) => z >= state.zoom)
    const prevIndex = Math.max(currentIndex - 1, 0)
    return { zoom: ZOOM_LEVELS[prevIndex] }
  }),
  resetZoom: () => set({ zoom: 1, panX: 0, panY: 0 }),
  setPan: (x, y) => set({ panX: x, panY: y }),
  setIsPanning: (panning) => set({ isPanning: panning }),
}))
