'use client'

import { useNode, useEditor } from '@craftjs/core'
import { PageSettings } from '../settings/PageSettings'
import { DropIndicator } from '../layout/DropIndicator'
import { AlignmentGuides } from '../layout/AlignmentGuides'
import { PAGE_SIZE_PRESETS, PageSizePreset, useBuilderStore } from '@/lib/stores/builder-store'

interface PageProps {
  background?: string
  padding?: number
  pageSize?: PageSizePreset
  customWidth?: number
  customHeight?: number
  children?: React.ReactNode
}

export const Page = ({
  background = 'white',
  padding = 40,
  pageSize = 'A4',
  customWidth = 794,
  customHeight = 1123,
  children
}: PageProps) => {
  const { isPreviewMode } = useBuilderStore()

  const {
    connectors: { connect },
    selected,
    hovered,
  } = useNode((node) => ({
    selected: node.events.selected,
    hovered: node.events.hovered,
  }))

  // Calculate page dimensions - ensure pageSize has a valid value
  const effectivePageSize = pageSize || 'A4'
  const preset = PAGE_SIZE_PRESETS[effectivePageSize]
  const width = effectivePageSize === 'Custom' ? (customWidth || 794) : preset.width
  const height = effectivePageSize === 'Custom' ? (customHeight || 1123) : preset.height

  // Calculate content area dimensions (excluding padding)
  const contentWidth = width - (padding * 2)
  const contentHeight = height - (padding * 2)
  const centerX = contentWidth / 2
  const centerY = contentHeight / 2

  return (
    <div className="flex justify-center py-8">
      <div
        ref={(ref) => {
          if (ref) connect(ref)
        }}
        data-craft-page="true"
        style={{
          position: 'relative',
          // Always show actual background color (white paper preview)
          background: background,
          padding: `${padding}px`,
          width: width,
          minHeight: height,
          // Selection/hover outline in edit mode
          outline: !isPreviewMode && selected ? '2px solid #00ffc8' : !isPreviewMode && hovered ? '1px dashed rgba(0,255,200,0.5)' : 'none',
          outlineOffset: '-2px',
          // Border style: dashed in edit mode, none in preview
          border: isPreviewMode ? 'none' : selected ? '2px solid #00ffc8' : hovered ? '2px dashed rgba(0,255,200,0.5)' : '2px dashed rgba(0,255,200,0.2)',
          boxShadow: isPreviewMode ? 'none' : '0 4px 20px rgba(0,0,0,0.3)',
        }}
        className="transition-all duration-200"
      >
        {/* Page size indicator in edit mode */}
        {!isPreviewMode && (
          <div className="absolute -top-6 left-0 text-xs text-[#00ffc8]/60 font-mono">
            {preset.label.split(' ')[0]} • {width}×{height}px
          </div>
        )}

        {/* Page guides - center lines and thirds (only in edit mode) */}
        {!isPreviewMode && (
          <div className="absolute inset-0 pointer-events-none" style={{ padding: `${padding}px` }}>
            {/* Vertical center line */}
            <div
              className="absolute top-0 bottom-0 w-px"
              style={{
                left: padding + centerX,
                background: 'linear-gradient(to bottom, rgba(0,255,200,0.15), rgba(0,255,200,0.3), rgba(0,255,200,0.15))',
              }}
            />
            {/* Horizontal center line */}
            <div
              className="absolute left-0 right-0 h-px"
              style={{
                top: padding + centerY,
                background: 'linear-gradient(to right, rgba(0,255,200,0.15), rgba(0,255,200,0.3), rgba(0,255,200,0.15))',
              }}
            />
            {/* Vertical third lines */}
            <div
              className="absolute top-0 bottom-0 w-px bg-[rgba(0,255,200,0.08)]"
              style={{ left: padding + contentWidth / 3 }}
            />
            <div
              className="absolute top-0 bottom-0 w-px bg-[rgba(0,255,200,0.08)]"
              style={{ left: padding + (contentWidth * 2) / 3 }}
            />
            {/* Horizontal third lines */}
            <div
              className="absolute left-0 right-0 h-px bg-[rgba(0,255,200,0.08)]"
              style={{ top: padding + contentHeight / 3 }}
            />
            <div
              className="absolute left-0 right-0 h-px bg-[rgba(0,255,200,0.08)]"
              style={{ top: padding + (contentHeight * 2) / 3 }}
            />
          </div>
        )}

        {/* Alignment guides - positioned relative to page content */}
        <AlignmentGuides />

        {!children && (
          <div className="flex items-center justify-center h-full min-h-[500px] text-gray-400 border-2 border-dashed border-gray-600 rounded-lg m-4">
            <p className="text-center p-8">
              <span className="block text-3xl mb-3 text-[#00ffc8]/50">+</span>
              Drag components here to build your template
            </p>
          </div>
        )}
        {children}
        <DropIndicator />
      </div>
    </div>
  )
}

Page.craft = {
  displayName: 'Page',
  props: {
    background: 'white',
    padding: 40,
    pageSize: 'A4',
    customWidth: 794,
    customHeight: 1123,
  },
  rules: {
    canMoveIn: () => true,
    canDrag: () => false, // Prevent dragging/deleting the root canvas
  },
  related: {
    settings: PageSettings,
  },
}
