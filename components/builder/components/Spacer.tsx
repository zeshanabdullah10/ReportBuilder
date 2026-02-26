'use client'

import { useNode } from '@craftjs/core'
import { SpacerSettings } from '../settings/SpacerSettings'
import { ResizableBox } from '../layout/ResizableBox'
import { useBuilderStore, PAGE_SIZE_PRESETS } from '@/lib/stores/builder-store'

// Default content width for A4 with 40px padding
const DEFAULT_CONTENT_WIDTH = 794 - (40 * 2) // 714px

interface SpacerProps {
  height?: number
  spanFullWidth?: boolean
  x?: number
  y?: number
  width?: number
  zIndex?: number
  visible?: boolean
}

export const Spacer = ({
  height = 40,
  spanFullWidth = true,
  x = 0,
  y = 0,
  width = 714,
  zIndex = 1,
  visible = true
}: SpacerProps) => {
  const { pages, activePageId } = useBuilderStore()

  const {
    id,
    connectors: { connect },
    selected,
    actions: { setProp },
  } = useNode((node) => ({
    id: node.id,
    selected: node.events.selected,
  }))

  if (!visible) return null

  // Get page dimensions for spanFullWidth
  let contentWidth = DEFAULT_CONTENT_WIDTH
  try {
    const activePage = pages.find(p => p.id === activePageId)
    if (activePage?.settings) {
      const pageSettings = activePage.settings
      const pageSize = pageSettings.pageSize || 'A4'
      const preset = PAGE_SIZE_PRESETS[pageSize as keyof typeof PAGE_SIZE_PRESETS]
      const pageWidth = pageSize === 'Custom' ? (pageSettings.customWidth || 794) : preset.width
      const padding = pageSettings.padding || 40
      contentWidth = pageWidth - (padding * 2)
    }
  } catch (e) {
    // Use default if there's any error
  }

  // Calculate actual dimensions based on spanFullWidth
  const actualX = spanFullWidth ? 0 : x
  const actualWidth = spanFullWidth ? contentWidth : width

  const handlePositionChange = (newPos: { x?: number; y?: number; width?: number; height?: number }) => {
    if (spanFullWidth) {
      // Only allow changing y position when spanning full width
      if (newPos.y !== undefined) {
        setProp((props: SpacerProps) => {
          props.y = newPos.y
        })
      }
    } else {
      setProp((props: SpacerProps) => {
        if (newPos.x !== undefined) props.x = newPos.x
        if (newPos.y !== undefined) props.y = newPos.y
        if (newPos.width !== undefined) props.width = newPos.width
      })
    }
  }

  return (
    <ResizableBox
      x={actualX}
      y={y}
      width={actualWidth}
      height={height}
      minWidth={spanFullWidth ? actualWidth : 20}
      minHeight={10}
      selected={selected}
      nodeId={id}
      onPositionChange={handlePositionChange}
      connectRef={(ref) => { if (ref) connect(ref) }}
      zIndex={zIndex}
      resizable={!spanFullWidth}
    >
      <div
        style={{ height: '100%', width: '100%' }}
        className="border border-dashed border-gray-300 hover:border-[#00ffc8] flex items-center justify-center group"
      >
        <span className="text-gray-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
          Spacer ({height}px)
        </span>
      </div>
    </ResizableBox>
  )
}

Spacer.craft = {
  displayName: 'Spacer',
  props: {
    height: 40,
    spanFullWidth: true,
    x: 0,
    y: 0,
    width: 714,
    zIndex: 1,
    visible: true,
  },
  related: {
    settings: SpacerSettings,
  },
}
