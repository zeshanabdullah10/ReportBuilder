'use client'

import { useNode } from '@craftjs/core'
import { ContainerSettings } from '../settings/ContainerSettings'
import { ResizableBox } from '../layout/ResizableBox'

interface ContainerProps {
  background?: string
  padding?: number
  borderRadius?: number
  borderWidth?: number
  borderColor?: string
  children?: React.ReactNode
  x?: number
  y?: number
  width?: number
  height?: number
}

export const Container = ({
  background = '#f5f5f5',
  padding = 16,
  borderRadius = 8,
  borderWidth = 1,
  borderColor = '#e0e0e0',
  children,
  x = 0,
  y = 0,
  width = 300,
  height = 200,
}: ContainerProps) => {
  const {
    id,
    connectors: { connect, drag },
    selected,
    hovered,
    actions: { setProp },
  } = useNode((node) => ({
    id: node.id,
    selected: node.events.selected,
    hovered: node.events.hovered,
  }))

  const handlePositionChange = (newPos: { x?: number; y?: number; width?: number; height?: number }) => {
    setProp((props: ContainerProps) => {
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
      minHeight={60}
      selected={selected}
      nodeId={id}
      onPositionChange={handlePositionChange}
    >
      <div
        ref={(ref) => {
          if (ref) connect(drag(ref))
        }}
        style={{
          background,
          padding: `${padding}px`,
          borderRadius: `${borderRadius}px`,
          border: `${borderWidth}px solid ${borderColor}`,
          minHeight: '60px',
          outline: selected ? '2px solid #00ffc8' : hovered ? '1px dashed rgba(0,255,200,0.5)' : 'none',
          outlineOffset: '2px',
          transition: 'outline 0.15s ease',
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
        }}
      >
        {children}
      </div>
    </ResizableBox>
  )
}

Container.craft = {
  displayName: 'Container',
  props: {
    background: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    x: 0,
    y: 0,
    width: 300,
    height: 200,
  },
  rules: {
    canMoveIn: () => true,
  },
  related: {
    settings: ContainerSettings,
  },
}
