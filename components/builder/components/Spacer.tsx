'use client'

import { useNode } from '@craftjs/core'
import { SpacerSettings } from '../settings/SpacerSettings'
import { ResizableBox } from '../layout/ResizableBox'

interface SpacerProps {
  height?: number
  x?: number
  y?: number
  width?: number
  zIndex?: number
  visible?: boolean
}

export const Spacer = ({
  height = 40,
  x = 0,
  y = 0,
  width = 714,
  zIndex = 1,
  visible = true
}: SpacerProps) => {
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
    setProp((props: SpacerProps) => {
      if (newPos.x !== undefined) props.x = newPos.x
      if (newPos.y !== undefined) props.y = newPos.y
      if (newPos.width !== undefined) props.width = newPos.width
    })
  }

  return (
    <ResizableBox
      x={x}
      y={y}
      width={width}
      height={height}
      minWidth={20}
      minHeight={10}
      selected={selected}
      nodeId={id}
      onPositionChange={handlePositionChange}
      connectRef={(ref) => { if (ref) connect(ref) }}
      zIndex={zIndex}
      fullWidth={true}
    >
      <div
        style={{ height: '100%', width: '100%' }}
        className="border-2 border-dashed border-gray-400 bg-gray-50 hover:border-[#00ffc8] flex items-center justify-center print:border-none print:bg-transparent"
      >
        <span className="text-gray-500 text-xs font-medium px-2 py-0.5 bg-white rounded shadow-sm print:hidden">
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
