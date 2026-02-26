'use client'

import { useNode } from '@craftjs/core'
import { DividerSettings } from '../settings/DividerSettings'
import { ResizableBox } from '../layout/ResizableBox'

interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  style?: 'solid' | 'dashed' | 'dotted' | 'double'
  color?: string
  thickness?: number
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
  x = 0,
  y = 0,
  width = 714,
  height = 20,
  zIndex = 1,
  visible = true,
}: DividerProps) => {
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
    setProp((props: DividerProps) => {
      if (newPos.x !== undefined) props.x = newPos.x
      if (newPos.y !== undefined) props.y = newPos.y
      if (newPos.width !== undefined) props.width = newPos.width
      if (newPos.height !== undefined) props.height = newPos.height
    })
  }

  const isHorizontal = orientation === 'horizontal'

  const lineStyle = {
    width: isHorizontal ? '100%' : `${thickness}px`,
    height: isHorizontal ? `${thickness}px` : '100%',
    borderTop: isHorizontal ? `${thickness}px ${style} ${color}` : undefined,
    borderLeft: !isHorizontal ? `${thickness}px ${style} ${color}` : undefined,
  }

  return (
    <ResizableBox
      x={x}
      y={y}
      width={width}
      height={height}
      minWidth={isHorizontal ? 50 : 10}
      minHeight={isHorizontal ? 10 : 50}
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
