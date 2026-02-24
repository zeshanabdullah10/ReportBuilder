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

// Multi-page support types
export interface PageSettings {
  background: string
  padding: number
  pageSize: PageSizePreset
  customWidth?: number
  customHeight?: number
}

export interface ReportPage {
  id: string
  name: string
  canvasState: any // Craft.js serialized state
  settings: PageSettings
  order: number
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

  // Zoom and pan state
  zoom: number
  panX: number
  panY: number
  isPanning: boolean

  // Hand tool state
  handToolEnabled: boolean

  // Multi-page state
  pages: ReportPage[]
  activePageId: string | null

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

  // Hand tool actions
  toggleHandTool: () => void
  setHandTool: (enabled: boolean) => void

  // Multi-page actions
  setPages: (pages: ReportPage[]) => void
  setActivePage: (pageId: string) => void
  addPage: (afterPageId?: string) => string
  duplicatePage: (pageId: string) => string | null
  deletePage: (pageId: string) => void
  reorderPages: (fromIndex: number, toIndex: number) => void
  updatePageSettings: (pageId: string, settings: Partial<PageSettings>) => void
  updatePageCanvasState: (pageId: string, canvasState: any) => void
  getActivePage: () => ReportPage | null
  getPageById: (pageId: string) => ReportPage | null
  goToPreviousPage: () => void
  goToNextPage: () => void
}

// Helper function to generate unique IDs
const generatePageId = () => `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Default page settings
const defaultPageSettings: PageSettings = {
  background: 'white',
  padding: 40,
  pageSize: 'A4',
  customWidth: 794,
  customHeight: 1123,
}

// Create initial page
const createInitialPage = (order: number = 0): ReportPage => ({
  id: generatePageId(),
  name: `Page ${order + 1}`,
  canvasState: null,
  settings: { ...defaultPageSettings },
  order,
})

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
  handToolEnabled: false,
  pages: [createInitialPage(0)],
  activePageId: null, // Will be set to first page on init
}

const ZOOM_LEVELS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 2, 2.5, 3, 4]
const MIN_ZOOM = 0.25
const MAX_ZOOM = 4

export const useBuilderStore = create<BuilderState>()((set, get) => ({
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

  // Hand tool
  toggleHandTool: () => set((state) => ({ handToolEnabled: !state.handToolEnabled })),
  setHandTool: (enabled) => set({ handToolEnabled: enabled }),

  // Multi-page actions
  setPages: (pages) => set((state) => {
    const activePageId = state.activePageId || (pages.length > 0 ? pages[0].id : null)
    return { pages, activePageId, hasUnsavedChanges: true }
  }),

  setActivePage: (pageId) => set((state) => {
    if (state.pages.some(p => p.id === pageId)) {
      return { activePageId: pageId }
    }
    return {}
  }),

  addPage: (afterPageId) => {
    const state = get()
    const newPageId = generatePageId()
    
    set((state) => {
      let insertIndex = state.pages.length
      if (afterPageId) {
        const afterIndex = state.pages.findIndex(p => p.id === afterPageId)
        if (afterIndex !== -1) {
          insertIndex = afterIndex + 1
        }
      }

      const newPage: ReportPage = {
        id: newPageId,
        name: `Page ${state.pages.length + 1}`,
        canvasState: null,
        settings: { ...defaultPageSettings },
        order: insertIndex,
      }

      const updatedPages = [...state.pages]
      updatedPages.splice(insertIndex, 0, newPage)

      // Reorder all pages
      const reorderedPages = updatedPages.map((page, index) => ({
        ...page,
        order: index,
        name: page.id === newPageId ? newPage.name : page.name,
      }))

      return {
        pages: reorderedPages,
        activePageId: newPageId,
        hasUnsavedChanges: true,
      }
    })

    return newPageId
  },

  duplicatePage: (pageId) => {
    const state = get()
    const pageIndex = state.pages.findIndex(p => p.id === pageId)
    if (pageIndex === -1) return null

    const originalPage = state.pages[pageIndex]
    const newPageId = generatePageId()

    set((state) => {
      const newPage: ReportPage = {
        id: newPageId,
        name: `${originalPage.name} (Copy)`,
        canvasState: originalPage.canvasState ? JSON.parse(JSON.stringify(originalPage.canvasState)) : null,
        settings: { ...originalPage.settings },
        order: pageIndex + 1,
      }

      const updatedPages = [...state.pages]
      updatedPages.splice(pageIndex + 1, 0, newPage)

      // Reorder all pages
      const reorderedPages = updatedPages.map((page, index) => ({
        ...page,
        order: index,
      }))

      return {
        pages: reorderedPages,
        activePageId: newPageId,
        hasUnsavedChanges: true,
      }
    })

    return newPageId
  },

  deletePage: (pageId) => {
    set((state) => {
      if (state.pages.length <= 1) {
        // Don't delete the last page
        return {}
      }

      const pageIndex = state.pages.findIndex(p => p.id === pageId)
      if (pageIndex === -1) return {}

      const updatedPages = state.pages.filter(p => p.id !== pageId)
      
      // Reorder remaining pages
      const reorderedPages = updatedPages.map((page, index) => ({
        ...page,
        order: index,
      }))

      // Determine new active page
      let newActivePageId = state.activePageId
      if (state.activePageId === pageId) {
        // Select the next page, or the previous one if deleting the last page
        newActivePageId = reorderedPages[Math.min(pageIndex, reorderedPages.length - 1)]?.id || null
      }

      return {
        pages: reorderedPages,
        activePageId: newActivePageId,
        hasUnsavedChanges: true,
      }
    })
  },

  reorderPages: (fromIndex, toIndex) => {
    set((state) => {
      if (fromIndex === toIndex) return {}
      if (fromIndex < 0 || fromIndex >= state.pages.length) return {}
      if (toIndex < 0 || toIndex >= state.pages.length) return {}

      const updatedPages = [...state.pages]
      const [movedPage] = updatedPages.splice(fromIndex, 1)
      updatedPages.splice(toIndex, 0, movedPage)

      // Reorder all pages
      const reorderedPages = updatedPages.map((page, index) => ({
        ...page,
        order: index,
      }))

      return {
        pages: reorderedPages,
        hasUnsavedChanges: true,
      }
    })
  },

  updatePageSettings: (pageId, settings) => {
    set((state) => ({
      pages: state.pages.map(page =>
        page.id === pageId
          ? { ...page, settings: { ...page.settings, ...settings } }
          : page
      ),
      hasUnsavedChanges: true,
    }))
  },

  updatePageCanvasState: (pageId, canvasState) => {
    set((state) => ({
      pages: state.pages.map(page =>
        page.id === pageId
          ? { ...page, canvasState }
          : page
      ),
      hasUnsavedChanges: true,
    }))
  },

  getActivePage: () => {
    const state = get()
    return state.pages.find(p => p.id === state.activePageId) || null
  },

  getPageById: (pageId) => {
    const state = get()
    return state.pages.find(p => p.id === pageId) || null
  },

  goToPreviousPage: () => {
    set((state) => {
      const currentIndex = state.pages.findIndex(p => p.id === state.activePageId)
      if (currentIndex > 0) {
        return { activePageId: state.pages[currentIndex - 1].id }
      }
      return {}
    })
  },

  goToNextPage: () => {
    set((state) => {
      const currentIndex = state.pages.findIndex(p => p.id === state.activePageId)
      if (currentIndex < state.pages.length - 1) {
        return { activePageId: state.pages[currentIndex + 1].id }
      }
      return {}
    })
  },
}))
