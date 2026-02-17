'use client'

import { useNode } from '@craftjs/core'
import { ContainerSettings } from '../settings/ContainerSettings'

interface ContainerProps {
  background?: string
  padding?: number
  borderRadius?: number
  borderWidth?: number
  borderColor?: string
  children?: React.ReactNode
}

export const Container = ({
  background = '#f5f5f5',
  padding = 16,
  borderRadius = 8,
  borderWidth = 1,
  borderColor = '#e0e0e0',
  children,
}: ContainerProps) => {
  const {
    connectors: { connect, drag },
    selected,
    hovered,
  } = useNode((node) => ({
    selected: node.events.selected,
    hovered: node.events.hovered,
  }))

  return (
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
      }}
    >
      {children}
    </div>
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
  },
  rules: {
    canMoveIn: () => true,
  },
  related: {
    settings: ContainerSettings,
  },
}
