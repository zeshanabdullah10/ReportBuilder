'use client'

import { useNode } from '@craftjs/core'
import { ProgressBarSettings } from '../settings/ProgressBarSettings'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { hasBindings, resolveBindingOrValue } from '@/lib/utils/binding'
import { ResizableBox } from '../layout/ResizableBox'

interface ProgressBarProps {
  value?: number
  min?: number
  max?: number
  label?: string
  showValue?: boolean
  fillColor?: string
  backgroundColor?: string
  textColor?: string
  borderRadius?: number
  binding?: string
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
  visible?: boolean
}

export const ProgressBar = ({
  value = 50,
  min = 0,
  max = 100,
  label = '',
  showValue = true,
  fillColor = '#00ffc8',
  backgroundColor = 'rgba(255, 255, 255, 0.1)',
  textColor = '#ffffff',
  borderRadius = 4,
  binding = '',
  x = 0,
  y = 0,
  width = 200,
  height = 40,
  zIndex = 1,
  visible = true,
}: ProgressBarProps) => {
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

  if (!visible) return null

  const handlePositionChange = (newPos: { x?: number; y?: number; width?: number; height?: number }) => {
    setProp((props: ProgressBarProps) => {
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

  return (
    <ResizableBox
      x={x}
      y={y}
      width={width}
      height={height}
      minWidth={80}
      minHeight={24}
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
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '4px 8px',
          outline: selected ? '2px solid #00ffc8' : '1px dashed transparent',
          outlineOffset: '2px',
          borderRadius: '4px',
        }}
      >
        {(label || showValue) && (
          <div
            className="flex justify-between mb-1 text-xs"
            style={{ color: textColor }}
          >
            <span>{label}</span>
            {showValue && <span>{displayValue.toFixed(0)}%</span>}
          </div>
        )}
        <div
          className="w-full overflow-hidden flex-1"
          style={{
            backgroundColor,
            borderRadius: `${borderRadius}px`,
            minHeight: '6px',
          }}
        >
          <div
            style={{
              width: `${percentage}%`,
              height: '100%',
              backgroundColor: fillColor,
              borderRadius: `${borderRadius}px`,
              transition: 'width 0.3s ease',
              boxShadow: `0 0 8px ${fillColor}40`,
            }}
          />
        </div>
      </div>
    </ResizableBox>
  )
}

ProgressBar.craft = {
  displayName: 'Progress Bar',
  props: {
    value: 50,
    min: 0,
    max: 100,
    label: '',
    showValue: true,
    fillColor: '#0066cc',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    textColor: '#333333',
    borderRadius: 4,
    binding: '',
    x: 0,
    y: 0,
    width: 200,
    height: 40,
    zIndex: 1,
    visible: true,
  },
  related: {
    settings: ProgressBarSettings,
  },
}
