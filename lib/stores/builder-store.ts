import { create } from 'zustand'

interface BuilderState {
  templateId: string | null
  templateName: string
  sampleData: Record<string, unknown> | null
  selectedNodeId: string | null
  isPreviewMode: boolean
  hasUnsavedChanges: boolean

  setTemplateId: (id: string) => void
  setTemplateName: (name: string) => void
  setSampleData: (data: Record<string, unknown> | null) => void
  setSelectedNodeId: (id: string | null) => void
  togglePreviewMode: () => void
  setHasUnsavedChanges: (value: boolean) => void
  reset: () => void
}

const initialState = {
  templateId: null,
  templateName: 'Untitled Template',
  sampleData: null,
  selectedNodeId: null,
  isPreviewMode: false,
  hasUnsavedChanges: false,
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
}))
