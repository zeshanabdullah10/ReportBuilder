'use client'

import { useNode, useEditor } from '@craftjs/core'
import { DividerSettings } from '../settings/DividerSettings'
import { ResizableBox } from '../layout/ResizableBox'
import { useBuilderStore, PAGE_SIZE_PRESETS } from '@/lib/stores/builder-store'

// Default content width for A4 with 40px padding
const DEFAULT_CONTENT_WIDTH = 794 - (40 * 2) // 714px

interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  style?: 'solid' | 'dashed' | 'dotted' | 'double'
  color?: string
  thickness?: number
  spanFullWidth?: boolean
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
  visible?: boolean
}

export const Divider = ({
  orientation = 'horizontal',
  style = 'solid',
  color = 'rgba(0, 0, 0, 0.3)',
  thickness = 1,
  spanFullWidth = true,
  x = 0,
  y = 0,
  width = 200,
  height = 20,
  zIndex = 1,
  visible = true,
}: DividerProps) => {
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
        setProp((props: DividerProps) => {
          props.y = newPos.y
        })
      }
    } else {
      setProp((props: DividerProps) => {
        if (newPos.x !== undefined) props.x = newPos.x
        if (newPos.y !== undefined) props.y = newPos.y
        if (newPos.width !== undefined) props.width = newPos.width
        if (newPos.height !== undefined) props.height = newPos.height
      })
    }
  }

  const isHorizontal = orientation === 'horizontal'

  const lineStyle = {
    width: isHorizontal ? '100%' : `${thickness}px`,
    height: isHorizontal ? `${thickness}px` : '100%',
    borderTop: isHorizontal ? 'none' : undefined,
    borderRight: isHorizontal ? undefined : 'none',
    borderBottom: isHorizontal ? 'none' : undefined,
    borderLeft: isHorizontal ? undefined : 'none',
    borderTopStyle: isHorizontal ? style : undefined,
    borderRightStyle: !isHorizontal ? style : undefined,
    borderBottomStyle: isHorizontal ? style : undefined,
    borderLeftStyle: !isHorizontal ? style : undefined,
    borderTopColor: isHorizontal ? color : undefined,
    borderRightColor: !isHorizontal ? color : undefined,
    borderBottomColor: isHorizontal ? color : undefined,
    borderLeftColor: !isHorizontal ? color : undefined,
    borderTopWidth: isHorizontal ? `${thickness}px` : undefined,
    borderRightWidth: !isHorizontal ? `${thickness}px` : undefined,
    borderBottomWidth: isHorizontal ? `${thickness}px` : undefined,
    borderLeftWidth: !isHorizontal ? `${thickness}px` : undefined,
  }

  return (
    <ResizableBox
      x={actualX}
      y={y}
      width={actualWidth}
      height={height}
      minWidth={spanFullWidth ? actualWidth : (isHorizontal ? 50 : 10)}
      minHeight={isHorizontal ? 10 : 50}
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
          justifyContent: isHorizontal ? 'stretch' : 'center',
          outline: selected ? '2px solid #00ffc8' : '1px dashed transparent',
          outlineOffset: '2px',
          borderRadius: '4px',
        }}
      >
        <div style={lineStyle} />
      </div>
    </ResizableBox>
  )
}

Divider.craft = {
  displayName: 'Divider',
  props: {
    orientation: 'horizontal',
    style: 'solid',
    color: 'rgba(0, 0, 0, 0.3)',
    thickness: 1,
    spanFullWidth: true,
    x: 0,
    y: 0,
    width: 714,
    height: 20,
    zIndex: 1,
    visible: true,
  },
  related: {
    settings: DividerSettings,
  },
}
