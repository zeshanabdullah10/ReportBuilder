'use client'

import { useNode } from '@craftjs/core'
import { useEffect, useMemo } from 'react'
import { AlertTriangle, AlertCircle } from 'lucide-react'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { getBindingStatus, hasBindings } from '@/lib/utils/binding'
import { DataType } from '@/lib/utils/data-paths'

// Mapping of component types to their binding properties and expected types
const BINDING_CONFIGS: Record<string, Array<{ prop: string; expectedType?: DataType }>> = {
  Chart: [
    { prop: 'binding', expectedType: 'array' },
    { prop: 'labelsBinding', expectedType: 'array' },
  ],
  Table: [
    { prop: 'binding', expectedType: 'array' },
  ],
  Text: [
    { prop: 'text', expectedType: 'string' },
  ],
  Indicator: [
    { prop: 'binding', expectedType: 'boolean' },
  ],
  Image: [
    { prop: 'src', expectedType: 'string' },
  ],
  ScatterPlot: [
    { prop: 'binding', expectedType: 'array' },
  ],
  Histogram: [
    { prop: 'binding', expectedType: 'array' },
  ],
  BulletList: [
    { prop: 'binding', expectedType: 'array' },
  ],
}

export const RenderNode = ({ render }: { render: React.ReactNode }) => {
  const { id, isActive, isHover, dom, displayName, props } = useNode((node) => ({
    isActive: node.events.selected,
    isHover: node.events.hovered,
    dom: node.dom,
    displayName: node.data.custom?.displayName || node.data.displayName,
    props: node.data.props,
  }))

  const { sampleData, isPreviewMode } = useBuilderStore()

  // Check for binding issues
  const hasBindingIssues = useMemo(() => {
    if (isPreviewMode) return false // Don't show warnings in preview mode

    const config = BINDING_CONFIGS[displayName]
    if (!config || !props) return false

    for (const { prop, expectedType } of config) {
      const value = (props as Record<string, unknown>)[prop]
      if (typeof value === 'string' && hasBindings(value)) {
        const status = getBindingStatus(value, sampleData, expectedType)
        if (!status.isValid || status.isUsingFallback) {
          return true
        }
      }
    }

    return false
  }, [displayName, props, sampleData, isPreviewMode])

  useEffect(() => {
    if (dom) {
      if (isActive) {
        dom.style.outline = '2px solid #00ffc8'
        dom.style.outlineOffset = '2px'
      } else if (isHover) {
        dom.style.outline = '1px dashed rgba(0,255,200,0.5)'
        dom.style.outlineOffset = '2px'
      } else {
        dom.style.outline = 'none'
      }
    }
  }, [isActive, isHover, dom])

  return (
    <div className="relative">
      {render}
      {/* Binding issue indicator - only show in edit mode when not selected */}
      {hasBindingIssues && !isActive && !isPreviewMode && (
        <div
          className="absolute top-1 right-1 z-50 pointer-events-none"
          title="This component has binding issues"
        >
          <div className="bg-[#0a0f14] rounded-full p-0.5 border border-[rgba(255,140,0,0.3)]">
            <AlertCircle className="w-3 h-3 text-[#ff8c00]" />
          </div>
        </div>
      )}
    </div>
  )
}
