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

  // Snap and drag state
  snapEnabled: boolean
  gridSize: number
  activeDrag: ActiveDrag | null

  // Drop position for new components
  dropPosition: { x: number; y: number } | null

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

  // Drop position actions
  setDropPosition: (pos: { x: number; y: number } | null) => void
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
  dropPosition: null,
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

  // Snap and drag
  toggleSnap: () => set((state) => ({ snapEnabled: !state.snapEnabled })),
  setActiveDrag: (drag) => set({ activeDrag: drag }),
  updateDragPosition: (x, y) => set((state) => ({
    activeDrag: state.activeDrag ? { ...state.activeDrag, currentX: x, currentY: y } : null,
  })),

  // Drop position
  setDropPosition: (pos) => set({ dropPosition: pos }),
}))
