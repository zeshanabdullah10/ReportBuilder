'use client'

import { useNode } from '@craftjs/core'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { hasBindings, resolveBindingOrValue } from '@/lib/utils/binding'
import { ResizableBox } from '../layout/ResizableBox'

interface LogoProps {
  // Image source
  src?: string
  binding?: string
  
  // Sizing
  width?: number
  height?: number
  maxHeight?: number
  
  // Alignment
  align?: 'left' | 'center' | 'right'
  
  // Alt text
  alt?: string
  
  // Fallback
  fallbackText?: string
  
  // Position
  x?: number
  y?: number
  zIndex?: number
  visible?: boolean
}

export const Logo = ({
  src = '',
  binding = '',
  width = 150,
  height = 80,
  maxHeight = 80,
  align = 'left',
  alt = 'Company Logo',
  fallbackText = 'Company Name',
  x = 0,
  y = 0,
  zIndex = 1,
  visible = true,
}: LogoProps) => {
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

  // Resolve the src from binding or use static value
  const resolvedSrc = binding && hasBindings(binding) && sampleData
    ? String(resolveBindingOrValue(binding, sampleData as Record<string, unknown>) ?? src)
    : src

  if (!visible) return null

  const handlePositionChange = (newPos: { x?: number; y?: number; width?: number; height?: number }) => {
    setProp((props: LogoProps) => {
      if (newPos.x !== undefined) props.x = newPos.x
      if (newPos.y !== undefined) props.y = newPos.y
      if (newPos.width !== undefined) props.width = newPos.width
      if (newPos.height !== undefined) {
        props.height = newPos.height
        props.maxHeight = newPos.height
      }
    })
  }

  const justifyContent = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'

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
      connectRef={(ref) => { if (ref) connect(ref) }}
      zIndex={zIndex}
    >
      <div
        className="w-full h-full flex items-center"
        style={{ justifyContent }}
      >
        {resolvedSrc ? (
          <img
            src={resolvedSrc}
            alt={alt}
            className="max-w-full object-contain"
            style={{ maxHeight: `${maxHeight}px` }}
          />
        ) : (
          <div
            className="flex items-center justify-center w-full h-full text-gray-500 font-semibold"
            style={{ fontSize: `${Math.min(maxHeight / 3, 16)}px` }}
          >
            {fallbackText}
          </div>
        )}
      </div>
    </ResizableBox>
  )
}

import { LogoSettings } from '../settings/LogoSettings'

Logo.craft = {
  displayName: 'Logo',
  props: {
    src: '',
    binding: '',
    width: 150,
    height: 80,
    maxHeight: 80,
    align: 'left',
    alt: 'Company Logo',
    fallbackText: 'Company Name',
    x: 0,
    y: 0,
    zIndex: 1,
    visible: true,
  },
  related: {
    settings: LogoSettings,
  },
  rules: {
    canDrag: () => true,
  },
}
