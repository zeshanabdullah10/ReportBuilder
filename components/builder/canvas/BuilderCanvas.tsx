'use client'

import { Editor, Frame, Element } from '@craftjs/core'
import { useEffect, useState } from 'react'
import { useBuilderStore } from '@/lib/stores/builder-store'
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
import { Toolbox } from '../toolbox/Toolbox'
import { RightSidebar } from '../settings/RightSidebar'
import { BuilderTopbar } from '../topbar/BuilderTopbar'
import { GridOverlay } from '../layout/GridOverlay'
import { DropPositionTracker } from '../layout/DropPositionTracker'
import { CanvasViewport } from '../layout/CanvasViewport'
import { Eye } from 'lucide-react'

// Import the oscilloscope theme CSS
import '@/app/globals-marketing.css'

interface BuilderCanvasProps {
  template: {
    id: string
    name: string
    canvas_state: any
    sample_data: any
  }
}

// Inner component that uses keyboard shortcuts (must be inside Editor context)
function BuilderContent({ template, hasSavedState, isPreviewMode }: { 
  template: BuilderCanvasProps['template']
  hasSavedState: boolean
  isPreviewMode: boolean 
}) {
  // Enable keyboard shortcuts
  useKeyboardShortcuts()

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
            <div className="relative min-h-screen">
              {hasSavedState ? (
                <Frame data={JSON.stringify(template.canvas_state)} />
              ) : (
                <Frame>
                  <Element is={Page} canvas background="white" padding={40} pageSize="A4">
                    <Text text="Welcome to the Template Builder" fontSize={28} fontWeight="bold" color="#333333" />
                    <Text text="Drag components from the left panel to start building your report template." fontSize={16} color="#666666" />
                  </Element>
                </Frame>
              )}
            </div>
          </CanvasViewport>
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
  const { setTemplateId, setTemplateName, setSampleData, isPreviewMode, setHasUnsavedChanges } = useBuilderStore()
  const [loaded, setLoaded] = useState(false)

  // Initialize store with template data
  useEffect(() => {
    setTemplateId(template.id)
    setTemplateName(template.name)
    setSampleData(template.sample_data)
    setLoaded(true)
  }, [template.id, template.name, template.sample_data, setTemplateId, setTemplateName, setSampleData])

  // Track changes
  const handleNodesChange = () => {
    setHasUnsavedChanges(true)
  }

  if (!loaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0f14]">
        <div className="text-[#00ffc8]">Loading builder...</div>
      </div>
    )
  }

  // Check if we have valid saved state
  const hasSavedState = template.canvas_state &&
    typeof template.canvas_state === 'object' &&
    Object.keys(template.canvas_state).length > 0

  return (
    <div className="flex flex-col h-screen bg-[#0a0f14]">
      <ErrorBoundary>
        <Editor
          resolver={{ Page, Text, Container, Image, Table, Chart, Spacer, PageBreak, Indicator, Divider, PageNumber, DateTime, Gauge, ProgressBar, BulletList }}
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
