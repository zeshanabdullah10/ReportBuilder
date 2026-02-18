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
