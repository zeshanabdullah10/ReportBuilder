'use client'

import { Editor, Frame, Element, useEditor } from '@craftjs/core'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useBuilderStore, ReportPage } from '@/lib/stores/builder-store'
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Page } from './Page'
import { Text } from '../components/Text'
import { Container } from '../components/Container'
import { Image } from '../components/Image'
import { Table } from '../components/Table'
import { Chart } from '../components/Chart'
import { Spacer } from '../components/Spacer'
import { PageBreak } from '../components/PageBreak'
import { Indicator } from '../components/Indicator'
import { Divider } from '../components/Divider'
import { PageNumber } from '../components/PageNumber'
import { DateTime } from '../components/DateTime'
import { Gauge } from '../components/Gauge'
import { ProgressBar } from '../components/ProgressBar'
import { BulletList } from '../components/BulletList'
import { QRCode } from '../components/QRCode'
import { Barcode } from '../components/Barcode'
import { SignatureLine } from '../components/SignatureLine'
import { TestSummaryBox } from '../components/TestSummaryBox'
import { MeasurementTable } from '../components/MeasurementTable'
import { Histogram } from '../components/Histogram'
import { ScatterPlot } from '../components/ScatterPlot'
import { Logo } from '../components/Logo'
import { Watermark } from '../components/Watermark'
import { SpecBox } from '../components/SpecBox'
import { ToleranceBand } from '../components/ToleranceBand'
import { PassRateChart } from '../components/PassRateChart'
import { RevisionBlock } from '../components/RevisionBlock'
import { Toolbox } from '../toolbox/Toolbox'
import { RightSidebar } from '../settings/RightSidebar'
import { BuilderTopbar } from '../topbar/BuilderTopbar'
import { GridOverlay } from '../layout/GridOverlay'
import { DropPositionTracker } from '../layout/DropPositionTracker'
import { CanvasViewport } from '../layout/CanvasViewport'
import { PageNavigation } from '../navigation/PageNavigation'
import { Eye } from 'lucide-react'

// Import the oscilloscope theme CSS
import '@/app/globals-marketing.css'

interface BuilderCanvasProps {
  template: {
    id: string
    name: string
    canvas_state: any
    sample_data: any
    settings?: any // Json from database - can contain { pages: ReportPage[] }
  }
}

// Component to render the current page content
function PageContent({ hasSavedState, canvasState }: {
  hasSavedState: boolean
  canvasState: any
}) {
  if (hasSavedState && canvasState) {
    return <Frame data={JSON.stringify(canvasState)} />
  }

  // Empty page - the Page component will show "Drag components here" placeholder
  return (
    <Frame>
      <Element is={Page} canvas background="white" padding={40} pageSize="A4">
      </Element>
    </Frame>
  )
}

// Inner component that uses keyboard shortcuts (must be inside Editor context)
function BuilderContent({ template, hasSavedState, isPreviewMode }: {
  template: BuilderCanvasProps['template']
  hasSavedState: boolean
  isPreviewMode: boolean
}) {
  // Enable keyboard shortcuts
  useKeyboardShortcuts()

  // Use specific selectors to prevent unnecessary re-renders
  const pages = useBuilderStore((state) => state.pages)
  const activePageId = useBuilderStore((state) => state.activePageId)
  const updatePageCanvasState = useBuilderStore((state) => state.updatePageCanvasState)

  // Get the current active page
  const activePage = pages.find(p => p.id === activePageId) || pages[0]
  const currentPageState = activePage?.canvasState

  // Save canvas state when switching pages
  const { query } = useEditor()

  // Use ref to track if we're already saving to prevent loops
  const savingRef = useRef(false)

  // Callback to save current page state before switching
  const saveCurrentPageState = useCallback(() => {
    if (activePageId && !savingRef.current) {
      savingRef.current = true
      try {
        const currentState = query.serialize()
        updatePageCanvasState(activePageId, JSON.parse(currentState))
      } catch (error) {
        console.error('Error saving page state:', error)
      } finally {
        savingRef.current = false
      }
    }
  }, [activePageId, query, updatePageCanvasState])

  // Save state on unmount or page change
  useEffect(() => {
    return () => {
      saveCurrentPageState()
    }
  }, [activePageId]) // Re-run when page changes

  return (
    <>
      <DropPositionTracker />
      <BuilderTopbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Toolbox (hidden in preview mode) */}
        {!isPreviewMode && (
          <aside className="w-64 border-r border-[rgba(0,255,200,0.1)] bg-[#050810] overflow-y-auto">
            <Toolbox />
          </aside>
        )}

        {/* Center - Canvas */}
        <main className="flex-1 overflow-hidden relative bg-[#0a0f14]">
          {/* Grid background - fixed, doesn't zoom */}
          <GridOverlay />

          {/* Preview Mode Indicator */}
          {isPreviewMode && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#00ffc8] text-[#0a0f14] font-semibold text-sm shadow-lg shadow-[#00ffc8]/20">
                <Eye className="w-4 h-4" />
                Preview Mode - Data bindings are active
              </div>
            </div>
          )}

          <CanvasViewport>
            <div className="relative min-h-screen pb-14">
              <PageContent
                key={activePageId || 'default'}
                hasSavedState={hasSavedState}
                canvasState={currentPageState}
              />
            </div>
          </CanvasViewport>

          {/* Page Navigation - Bottom Bar */}
          <PageNavigation />
        </main>

        {/* Right Sidebar - Settings (hidden in preview mode) */}
        {!isPreviewMode && (
          <aside className="w-72 border-l border-[rgba(0,255,200,0.1)] bg-[#050810] overflow-hidden">
            <RightSidebar />
          </aside>
        )}
      </div>
    </>
  )
}

export function BuilderCanvas({ template }: BuilderCanvasProps) {
  const setTemplateId = useBuilderStore((state) => state.setTemplateId)
  const setTemplateName = useBuilderStore((state) => state.setTemplateName)
  const setSampleData = useBuilderStore((state) => state.setSampleData)
  const isPreviewMode = useBuilderStore((state) => state.isPreviewMode)
  const setHasUnsavedChanges = useBuilderStore((state) => state.setHasUnsavedChanges)
  const setPages = useBuilderStore((state) => state.setPages)
  const setActivePage = useBuilderStore((state) => state.setActivePage)
  const pages = useBuilderStore((state) => state.pages)
  const activePageId = useBuilderStore((state) => state.activePageId)
  
  const [loaded, setLoaded] = useState(false)
  const initRef = useRef<string | null>(null)

  // Initialize store with template data - only once per template ID
  useEffect(() => {
    // Only initialize if we haven't already for this template
    if (initRef.current === template.id) {
      return
    }
    initRef.current = template.id

    setTemplateId(template.id)
    setTemplateName(template.name)
    setSampleData(template.sample_data)

    // Initialize pages from template
    // Pages are stored in settings.pages in the database
    const savedPages = template.settings?.pages
    if (savedPages && savedPages.length > 0) {
      // Multi-page template
      setPages(savedPages)
      setActivePage(savedPages[0].id)
    } else if (template.canvas_state && Object.keys(template.canvas_state).length > 0) {
      // Legacy single-page template - convert to multi-page format
      const initialPage: ReportPage = {
        id: `page-${Date.now()}`,
        name: 'Page 1',
        canvasState: template.canvas_state,
        settings: {
          background: 'white',
          padding: 40,
          pageSize: 'A4',
        },
        order: 0,
      }
      setPages([initialPage])
      setActivePage(initialPage.id)
    } else {
      // New template - create default page
      const defaultPage: ReportPage = {
        id: `page-${Date.now()}`,
        name: 'Page 1',
        canvasState: null,
        settings: {
          background: 'white',
          padding: 40,
          pageSize: 'A4',
        },
        order: 0,
      }
      setPages([defaultPage])
      setActivePage(defaultPage.id)
    }

    setLoaded(true)
  }, [template.id]) // Only depend on template.id to prevent loops

  // Track changes - memoized to prevent infinite loops
  const handleNodesChange = useCallback(() => {
    setHasUnsavedChanges(true)
  }, [setHasUnsavedChanges])

  if (!loaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0f14]">
        <div className="text-[#00ffc8]">Loading builder...</div>
      </div>
    )
  }

  // Check if we have valid saved state for the current page
  const activePage = pages.find(p => p.id === activePageId) || pages[0]
  const hasSavedState = !!(activePage?.canvasState &&
    typeof activePage.canvasState === 'object' &&
    Object.keys(activePage.canvasState).length > 0)

  return (
    <div className="flex flex-col h-screen bg-[#0a0f14]">
      <ErrorBoundary>
        <Editor
          key={activePageId || 'default'}
          resolver={{ Page, Text, Container, Image, Table, Chart, Spacer, PageBreak, Indicator, Divider, PageNumber, DateTime, Gauge, ProgressBar, BulletList, QRCode, Barcode, SignatureLine, TestSummaryBox, MeasurementTable, Histogram, ScatterPlot, Logo, Watermark, SpecBox, ToleranceBand, PassRateChart, RevisionBlock }}
          enabled={!isPreviewMode}
          indicator={{
            success: 'transparent',
            error: 'transparent',
            thickness: 0,
          }}
          onNodesChange={handleNodesChange}
        >
          <BuilderContent
            template={template}
            hasSavedState={hasSavedState}
            isPreviewMode={isPreviewMode}
          />
        </Editor>
      </ErrorBoundary>
    </div>
  )
}
