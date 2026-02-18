'use client'

import { useNode } from '@craftjs/core'
import { PageNumberSettings } from '../settings/PageNumberSettings'
import { ResizableBox } from '../layout/ResizableBox'

interface PageNumberProps {
  format?: 'page' | 'page-of' | 'slash'
  fontSize?: number
  fontFamily?: string
  color?: string
  prefix?: string
  suffix?: string
  x?: number
  y?: number
  width?: number
  height?: number
}

export const PageNumber = ({
  format = 'page-of',
  fontSize = 12,
  fontFamily = 'inherit',
  color = '#9ca3af',
  prefix = '',
  suffix = '',
  x = 0,
  y = 0,
  width = 100,
  height = 30,
}: PageNumberProps) => {
  const {
    id,
    connectors: { connect },
    selected,
    actions: { setProp },
  } = useNode((node) => ({
    id: node.id,
    selected: node.events.selected,
  }))

  const handlePositionChange = (newPos: { x?: number; y?: number; width?: number; height?: number }) => {
    setProp((props: PageNumberProps) => {
      if (newPos.x !== undefined) props.x = newPos.x
      if (newPos.y !== undefined) props.y = newPos.y
      if (newPos.width !== undefined) props.width = newPos.width
      if (newPos.height !== undefined) props.height = newPos.height
    })
  }

  // Preview display (shows placeholder values)
  const getDisplayText = () => {
    switch (format) {
      case 'page':
        return `${prefix}1${suffix}`
      case 'page-of':
        return `${prefix}1 of 5${suffix}`
      case 'slash':
        return `${prefix}1/5${suffix}`
      default:
        return `${prefix}1 of 5${suffix}`
    }
  }

  return (
    <ResizableBox
      x={x}
      y={y}
      width={width}
      height={height}
      minWidth={50}
      minHeight={20}
      selected={selected}
      nodeId={id}
      onPositionChange={handlePositionChange}
      connectRef={(ref) => { if (ref) connect(ref) }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: `${fontSize}px`,
          fontFamily,
          color,
          outline: selected ? '2px solid #00ffc8' : '1px dashed transparent',
          outlineOffset: '2px',
          borderRadius: '4px',
        }}
      >
        {getDisplayText()}
      </div>
    </ResizableBox>
  )
}

PageNumber.craft = {
  displayName: 'Page Number',
  props: {
    format: 'page-of',
    fontSize: 12,
    fontFamily: 'inherit',
    color: '#9ca3af',
    prefix: '',
    suffix: '',
    x: 0,
    y: 0,
    width: 100,
    height: 30,
  },
  related: {
    settings: PageNumberSettings,
  },
}
