'use client'

import { useNode } from '@craftjs/core'
import { TextSettings } from '../settings/TextSettings'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { interpolateText, hasBindings, resolveBindingOrValue } from '@/lib/utils/binding'
import { ResizableBox } from '../layout/ResizableBox'

interface TextProps {
  text?: string
  fontSize?: number
  fontWeight?: string
  color?: string
  textAlign?: 'left' | 'center' | 'right'
  binding?: string
  x?: number
  y?: number
  width?: number
  height?: number
}

export const Text = ({
  text = 'Edit this text',
  fontSize = 16,
  fontWeight = 'normal',
  color = '#000000',
  textAlign = 'left',
  binding = '',
  x = 0,
  y = 0,
  width = 200,
  height = 50,
}: TextProps) => {
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

  const { isPreviewMode, sampleData } = useBuilderStore()

  const handlePositionChange = (newPos: { x?: number; y?: number; width?: number; height?: number }) => {
    setProp((props: TextProps) => {
      if (newPos.x !== undefined) props.x = newPos.x
      if (newPos.y !== undefined) props.y = newPos.y
      if (newPos.width !== undefined) props.width = newPos.width
      if (newPos.height !== undefined) props.height = newPos.height
    })
  }

  // Resolve text content based on preview mode and bindings
  const getDisplayText = () => {
    if (!isPreviewMode || !sampleData) {
      return text
    }

    // If there's a binding path, try to resolve it
    if (binding && hasBindings(binding)) {
      const resolved = resolveBindingOrValue(binding, sampleData)
      if (typeof resolved === 'string') {
        return resolved
      }
      if (resolved !== undefined && resolved !== null) {
        return String(resolved)
      }
    }

    // Interpolate any {{data.path}} patterns in the text
    if (hasBindings(text)) {
      return interpolateText(text, sampleData)
    }

    return text
  }

  // Resolve color if it contains a binding
  const getDisplayColor = () => {
    if (isPreviewMode && sampleData && hasBindings(color)) {
      const resolved = resolveBindingOrValue(color, sampleData)
      return typeof resolved === 'string' ? resolved : color
    }
    return color
  }

  return (
    <ResizableBox
      x={x}
      y={y}
      width={width}
      height={height}
      minWidth={50}
      minHeight={30}
      selected={selected}
      nodeId={id}
      onPositionChange={handlePositionChange}
    >
      <p
        ref={(ref) => {
          if (ref) connect(drag(ref))
        }}
        style={{
          fontSize: `${fontSize}px`,
          fontWeight,
          color: getDisplayColor(),
          textAlign,
          margin: 0,
          padding: '4px 8px',
          outline: selected ? '2px solid #00ffc8' : hovered ? '1px dashed rgba(0,255,200,0.5)' : '1px dashed transparent',
          outlineOffset: '2px',
          borderRadius: '4px',
          transition: 'outline 0.15s ease',
          cursor: 'pointer',
          width: '100%',
          height: '100%',
          minWidth: '20px',
          minHeight: '20px',
          boxSizing: 'border-box',
        }}
      >
        {getDisplayText()}
      </p>
    </ResizableBox>
  )
}

Text.craft = {
  displayName: 'Text',
  props: {
    text: 'Edit this text',
    fontSize: 16,
    fontWeight: 'normal',
    color: '#000000',
    textAlign: 'left',
    binding: '',
    x: 0,
    y: 0,
    width: 200,
    height: 50,
  },
  related: {
    settings: TextSettings,
  },
}
