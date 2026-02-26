'use client'

import { useNode } from '@craftjs/core'
import { ResizableBox } from '../layout/ResizableBox'
import { useBuilderStore, PAGE_SIZE_PRESETS } from '@/lib/stores/builder-store'

interface PageBreakProps {
  spanFullWidth?: boolean
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
  visible?: boolean
}

export const PageBreak = ({
  spanFullWidth = true,
  x = 0,
  y = 0,
  width = 400,
  height = 40,
  zIndex = 1,
  visible = true,
}: PageBreakProps) => {
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
  const activePage = pages.find(p => p.id === activePageId)
  const pageSettings = activePage?.settings
  const pageSize = pageSettings?.pageSize || 'A4'
  const preset = PAGE_SIZE_PRESETS[pageSize as keyof typeof PAGE_SIZE_PRESETS]
  const pageWidth = pageSize === 'Custom' ? (pageSettings?.customWidth || 794) : preset.width
  const padding = pageSettings?.padding || 40
  const contentWidth = pageWidth - (padding * 2)

  // Calculate actual dimensions based on spanFullWidth
  const actualX = spanFullWidth ? 0 : x
  const actualWidth = spanFullWidth ? contentWidth : width

  const handlePositionChange = (newPos: { x?: number; y?: number; width?: number; height?: number }) => {
    if (spanFullWidth) {
      // Only allow changing y position when spanning full width
      if (newPos.y !== undefined) {
        setProp((props: PageBreakProps) => {
          props.y = newPos.y
        })
      }
    } else {
      setProp((props: PageBreakProps) => {
        if (newPos.x !== undefined) props.x = newPos.x
        if (newPos.y !== undefined) props.y = newPos.y
        if (newPos.width !== undefined) props.width = newPos.width
        if (newPos.height !== undefined) props.height = newPos.height
      })
    }
  }

  return (
    <ResizableBox
      x={actualX}
      y={y}
      width={actualWidth}
      height={height}
      minWidth={spanFullWidth ? actualWidth : 100}
      minHeight={30}
      selected={selected}
      nodeId={id}
      onPositionChange={handlePositionChange}
      connectRef={(ref) => { if (ref) connect(ref) }}
      zIndex={zIndex}
      resizable={!spanFullWidth}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          outline: selected ? '2px solid #00ffc8' : '1px dashed transparent',
          outlineOffset: '2px',
          borderRadius: '4px',
        }}
      >
        <div className="flex items-center gap-4 w-full px-4">
          <div className="flex-1 border-t-2 border-dashed border-gray-400" />
          <span className="text-gray-500 text-xs font-medium px-3 py-1 bg-gray-100 rounded whitespace-nowrap">
            PAGE BREAK
          </span>
          <div className="flex-1 border-t-2 border-dashed border-gray-400" />
        </div>
      </div>
    </ResizableBox>
  )
}

PageBreak.craft = {
  displayName: 'Page Break',
  props: {
    spanFullWidth: true,
    x: 0,
    y: 0,
    width: 400,
    height: 40,
    zIndex: 1,
    visible: true,
  },
}
