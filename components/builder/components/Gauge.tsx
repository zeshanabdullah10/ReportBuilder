'use client'

import { useNode } from '@craftjs/core'
import { GaugeSettings } from '../settings/GaugeSettings'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { hasBindings, resolveBindingOrValue } from '@/lib/utils/binding'
import { ResizableBox } from '../layout/ResizableBox'

interface GaugeProps {
  value?: number
  min?: number
  max?: number
  label?: string
  unit?: string
  size?: number
  primaryColor?: string
  backgroundColor?: string
  textColor?: string
  binding?: string
  x?: number
  y?: number
  width?: number
  height?: number
}

export const Gauge = ({
  value = 50,
  min = 0,
  max = 100,
  label = '',
  unit = '%',
  size = 120,
  primaryColor = '#00ffc8',
  backgroundColor = 'rgba(255, 255, 255, 0.1)',
  textColor = '#ffffff',
  binding = '',
  x = 0,
  y = 0,
  width = 150,
  height = 150,
}: GaugeProps) => {
  const {
    id,
    connectors: { connect },
    selected,
    actions: { setProp },
  } = useNode((node) => ({
    id: node.id,
    selected: node.events.selected,
  }))

  const { isPreviewMode, sampleData } = useBuilderStore()

  const handlePositionChange = (newPos: { x?: number; y?: number; width?: number; height?: number }) => {
    setProp((props: GaugeProps) => {
      if (newPos.x !== undefined) props.x = newPos.x
      if (newPos.y !== undefined) props.y = newPos.y
      if (newPos.width !== undefined) props.width = newPos.width
      if (newPos.height !== undefined) props.height = newPos.height
    })
  }

  // Get the display value
  const getDisplayValue = (): number => {
    if (isPreviewMode && sampleData && binding && hasBindings(binding)) {
      const resolved = resolveBindingOrValue(binding, sampleData)
      if (typeof resolved === 'number') return resolved
      if (typeof resolved === 'string') return parseFloat(resolved) || value
    }
    return value
  }

  const displayValue = getDisplayValue()
  const percentage = Math.min(100, Math.max(0, ((displayValue - min) / (max - min)) * 100))

  // SVG gauge parameters
  const strokeWidth = 12
  const radius = (Math.min(width, height) / 2) - strokeWidth - 10
  const circumference = 2 * Math.PI * radius
  const arcLength = circumference * 0.75 // 270 degree arc
  const offset = arcLength - (arcLength * percentage / 100)
  const rotation = -225 // Start from bottom-left

  return (
    <ResizableBox
      x={x}
      y={y}
      width={width}
      height={height}
      minWidth={80}
      minHeight={80}
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
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          outline: selected ? '2px solid #00ffc8' : '1px dashed transparent',
          outlineOffset: '2px',
          borderRadius: '8px',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
        }}
      >
        <svg
          width={Math.min(width, height) - 20}
          height={Math.min(width, height) - 20}
          viewBox={`0 0 ${Math.min(width, height) - 20} ${Math.min(width, height) - 20}`}
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* Background arc */}
          <circle
            cx={(Math.min(width, height) - 20) / 2}
            cy={(Math.min(width, height) - 20) / 2}
            r={radius}
            fill="none"
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Value arc */}
          <circle
            cx={(Math.min(width, height) - 20) / 2}
            cy={(Math.min(width, height) - 20) / 2}
            r={radius}
            fill="none"
            stroke={primaryColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength - offset} ${circumference}`}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dasharray 0.3s ease',
              filter: `drop-shadow(0 0 6px ${primaryColor})`,
            }}
          />
        </svg>
        {/* Center value */}
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            color: textColor,
          }}
        >
          <span style={{ fontSize: `${Math.min(width, height) * 0.18}px`, fontWeight: 'bold' }}>
            {displayValue.toFixed(0)}
            {unit}
          </span>
          {label && (
            <span style={{ fontSize: `${Math.min(width, height) * 0.08}px`, opacity: 0.7 }}>
              {label}
            </span>
          )}
        </div>
      </div>
    </ResizableBox>
  )
}

Gauge.craft = {
  displayName: 'Gauge',
  props: {
    value: 50,
    min: 0,
    max: 100,
    label: '',
    unit: '%',
    size: 120,
    primaryColor: '#00ffc8',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    textColor: '#ffffff',
    binding: '',
    x: 0,
    y: 0,
    width: 150,
    height: 150,
  },
  related: {
    settings: GaugeSettings,
  },
}
