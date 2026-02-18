'use client'

import { Editor, Frame, Element } from '@craftjs/core'
import { useEffect, useState } from 'react'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { Page } from './Page'
import { Text } from '../components/Text'
import { Container } from '../components/Container'
import { Image } from '../components/Image'
import { Table } from '../components/Table'
import { Chart } from '../components/Chart'
import { Spacer } from '../components/Spacer'
import { PageBreak } from '../components/PageBreak'
import { Indicator } from '../components/Indicator'
import { Toolbox } from '../toolbox/Toolbox'
import { SettingsPanel } from '../settings/SettingsPanel'
import { BuilderTopbar } from '../topbar/BuilderTopbar'
import { GridOverlay } from '../layout/GridOverlay'
import { AlignmentGuides } from '../layout/AlignmentGuides'
import { DropPositionTracker } from '../layout/DropPositionTracker'
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
      <Editor
        resolver={{ Page, Text, Container, Image, Table, Chart, Spacer, PageBreak, Indicator }}
        enabled={!isPreviewMode}
        indicator={{
          success: '#00ffc8',
          error: '#e34850',
          transition: 'all 0.2s ease',
          thickness: 2,
        }}
        onNodesChange={handleNodesChange}
      >
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
          <main className={`flex-1 overflow-auto relative bg-oscilloscope-grid ${isPreviewMode ? '' : ''}`}>
            <div className="absolute inset-0 bg-mesh-gradient opacity-30 pointer-events-none" />

            {!isPreviewMode && <GridOverlay />}
            <AlignmentGuides />

            {/* Preview Mode Indicator */}
            {isPreviewMode && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#00ffc8] text-[#0a0f14] font-semibold text-sm shadow-lg shadow-[#00ffc8]/20">
                  <Eye className="w-4 h-4" />
                  Preview Mode - Data bindings are active
                </div>
              </div>
            )}

            <div className="relative h-full">
              {hasSavedState ? (
                <Frame data={JSON.stringify(template.canvas_state)} />
              ) : (
                <Frame>
                  <Element is={Page} canvas background="transparent" padding={20}>
                    <Text text="Welcome to the Template Builder" fontSize={28} fontWeight="bold" color="#ffffff" />
                    <Text text="Drag components from the left panel to start building your report template." fontSize={16} color="#9ca3af" />
                  </Element>
                </Frame>
              )}
            </div>
          </main>

          {/* Right Sidebar - Settings (hidden in preview mode) */}
          {!isPreviewMode && (
            <aside className="w-72 border-l border-[rgba(0,255,200,0.1)] bg-[#050810] overflow-y-auto">
              <SettingsPanel />
            </aside>
          )}
        </div>
      </Editor>
    </div>
  )
}
