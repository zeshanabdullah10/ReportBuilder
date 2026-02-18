'use client'

import { useNode } from '@craftjs/core'
import { ResizableBox } from '../layout/ResizableBox'

interface PageBreakProps {
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
  visible?: boolean
}

export const PageBreak = ({
  x = 0,
  y = 0,
  width = 400,
  height = 40,
  zIndex = 1,
  visible = true,
}: PageBreakProps) => {
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

  const handlePositionChange = (newPos: { x?: number; y?: number; width?: number; height?: number }) => {
    setProp((props: PageBreakProps) => {
      if (newPos.x !== undefined) props.x = newPos.x
      if (newPos.y !== undefined) props.y = newPos.y
      if (newPos.width !== undefined) props.width = newPos.width
      if (newPos.height !== undefined) props.height = newPos.height
    })
  }

  return (
    <ResizableBox
      x={x}
      y={y}
      width={width}
      height={height}
      minWidth={100}
      minHeight={30}
      selected={selected}
      nodeId={id}
      onPositionChange={handlePositionChange}
      connectRef={(ref) => { if (ref) connect(ref) }}
      zIndex={zIndex}
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
    x: 0,
    y: 0,
    width: 400,
    height: 40,
    zIndex: 1,
    visible: true,
  },
}
