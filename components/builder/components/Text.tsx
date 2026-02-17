'use client'

import { useNode } from '@craftjs/core'
import { TextSettings } from '../settings/TextSettings'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { interpolateText, hasBindings, resolveBindingOrValue } from '@/lib/utils/binding'

interface TextProps {
  text?: string
  fontSize?: number
  fontWeight?: string
  color?: string
  textAlign?: 'left' | 'center' | 'right'
  binding?: string
}

export const Text = ({
  text = 'Edit this text',
  fontSize = 16,
  fontWeight = 'normal',
  color = '#000000',
  textAlign = 'left',
  binding = '',
}: TextProps) => {
  const {
    connectors: { connect, drag },
    selected,
    hovered,
  } = useNode((node) => ({
    selected: node.events.selected,
    hovered: node.events.hovered,
  }))

  const { isPreviewMode, sampleData } = useBuilderStore()

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
    <p
      ref={(ref) => {
        if (ref) connect(drag(ref))
      }}
      style={{
        fontSize: `${fontSize}px`,
        fontWeight,
        color: getDisplayColor(),
        textAlign,
        margin: '0 0 12px 0',
        padding: '4px 8px',
        outline: selected ? '2px solid #00ffc8' : hovered ? '1px dashed rgba(0,255,200,0.5)' : '1px dashed transparent',
        outlineOffset: '2px',
        borderRadius: '4px',
        transition: 'outline 0.15s ease',
        cursor: 'pointer',
        minWidth: '20px',
        minHeight: '20px',
      }}
    >
      {getDisplayText()}
    </p>
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
  },
  related: {
    settings: TextSettings,
  },
}
