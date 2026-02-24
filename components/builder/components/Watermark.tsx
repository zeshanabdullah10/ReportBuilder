'use client'

import { useNode } from '@craftjs/core'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { hasBindings, resolveBindingOrValue } from '@/lib/utils/binding'
import { ResizableBox } from '../layout/ResizableBox'

interface WatermarkProps {
  // Content
  text?: string
  binding?: string
  
  // Appearance
  opacity?: number
  rotation?: number
  fontSize?: number
  fontFamily?: string
  color?: string
  
  // Repeat
  repeat?: boolean
  spacingX?: number
  spacingY?: number
  
  // Position
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
  visible?: boolean
}

export const Watermark = ({
  text = 'CONFIDENTIAL',
  binding = '',
  opacity = 0.1,
  rotation = -45,
  fontSize = 48,
  fontFamily = 'Arial, sans-serif',
  color = '#000000',
  repeat = true,
  spacingX = 200,
  spacingY = 150,
  x = 0,
  y = 0,
  width = 500,
  height = 300,
  zIndex = 0,
  visible = true,
}: WatermarkProps) => {
  const {
    id,
    connectors: { connect },
    selected,
    actions: { setProp },
  } = useNode((node) => ({
    id: node.id,
    selected: node.events.selected,
  }))

  const { sampleData } = useBuilderStore()

  // Resolve the text from binding or use static value
  const resolvedText = binding && hasBindings(binding) && sampleData
    ? String(resolveBindingOrValue(binding, sampleData as Record<string, unknown>) ?? text)
    : text

  if (!visible) return null

  const handlePositionChange = (newPos: { x?: number; y?: number; width?: number; height?: number }) => {
    setProp((props: WatermarkProps) => {
      if (newPos.x !== undefined) props.x = newPos.x
      if (newPos.y !== undefined) props.y = newPos.y
      if (newPos.width !== undefined) props.width = newPos.width
      if (newPos.height !== undefined) props.height = newPos.height
    })
  }

  // Generate repeated pattern
  const renderWatermarks = () => {
    if (!repeat) {
      return (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `rotate(${rotation}deg)`,
          }}
        >
          <span
            style={{
              fontSize: `${fontSize}px`,
              fontFamily,
              color,
              opacity,
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
            }}
          >
            {resolvedText}
          </span>
        </div>
      )
    }

    // Repeated pattern
    const items = []
    const cols = Math.ceil((width || 500) / (spacingX || 200)) + 1
    const rows = Math.ceil((height || 300) / (spacingY || 150)) + 1

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        items.push(
          <div
            key={`${row}-${col}`}
            className="absolute flex items-center justify-center"
            style={{
              left: col * (spacingX || 200),
              top: row * (spacingY || 150),
              width: spacingX,
              height: spacingY,
              transform: `rotate(${rotation}deg)`,
            }}
          >
            <span
              style={{
                fontSize: `${fontSize}px`,
                fontFamily,
                color,
                opacity,
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
              }}
            >
              {resolvedText}
            </span>
          </div>
        )
      }
    }

    return items
  }

  return (
    <ResizableBox
      x={x}
      y={y}
      width={width}
      height={height}
      minWidth={100}
      minHeight={50}
      selected={selected}
      nodeId={id}
      onPositionChange={handlePositionChange}
      connectRef={(ref) => { if (ref) connect(ref) }}
      zIndex={zIndex}
    >
      <div
        className="relative w-full h-full overflow-hidden pointer-events-none"
        style={{ opacity: selected ? 0.5 : 1 }}
      >
        {renderWatermarks()}
      </div>
    </ResizableBox>
  )
}

import { WatermarkSettings } from '../settings/WatermarkSettings'

Watermark.craft = {
  displayName: 'Watermark',
  props: {
    text: 'CONFIDENTIAL',
    binding: '',
    opacity: 0.1,
    rotation: -45,
    fontSize: 48,
    fontFamily: 'Arial, sans-serif',
    color: '#000000',
    repeat: true,
    spacingX: 200,
    spacingY: 150,
    x: 0,
    y: 0,
    width: 500,
    height: 300,
    zIndex: 0,
    visible: true,
  },
  related: {
    settings: WatermarkSettings,
  },
  rules: {
    canDrag: () => true,
  },
}
