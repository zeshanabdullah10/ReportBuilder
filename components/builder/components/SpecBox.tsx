'use client'

import { useNode } from '@craftjs/core'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { hasBindings, resolveBindingOrValue } from '@/lib/utils/binding'
import { ResizableBox } from '../layout/ResizableBox'

interface SpecBoxProps {
  // Title
  title?: string
  titleBinding?: string
  
  // Values
  nominal?: string
  nominalBinding?: string
  tolerance?: string
  toleranceBinding?: string
  unit?: string
  unitBinding?: string
  
  // Measured value
  measured?: string
  measuredBinding?: string
  
  // Appearance
  showStatus?: boolean
  passColor?: string
  failColor?: string
  
  // Layout
  layout?: 'horizontal' | 'vertical' | 'compact'
  
  // Position
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
  visible?: boolean
}

export const SpecBox = ({
  title = 'Specification',
  titleBinding = '',
  nominal = '0.00',
  nominalBinding = '',
  tolerance = '±0.01',
  toleranceBinding = '',
  unit = 'mm',
  unitBinding = '',
  measured = '0.005',
  measuredBinding = '',
  showStatus = true,
  passColor = '#22c55e',
  failColor = '#ef4444',
  layout = 'horizontal',
  x = 0,
  y = 0,
  width = 200,
  height = 80,
  zIndex = 1,
  visible = true,
}: SpecBoxProps) => {
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

  // Resolve values from bindings or use static values
  const resolveValue = (value: string, binding: string): string => {
    if (binding && hasBindings(binding) && sampleData) {
      return String(resolveBindingOrValue(binding, sampleData as Record<string, unknown>) ?? value)
    }
    return value
  }

  const resolvedTitle = resolveValue(title, titleBinding)
  const resolvedNominal = resolveValue(nominal, nominalBinding)
  const resolvedTolerance = resolveValue(tolerance, toleranceBinding)
  const resolvedUnit = resolveValue(unit, unitBinding)
  const resolvedMeasured = resolveValue(measured, measuredBinding)

  // Calculate pass/fail status
  const calculateStatus = (): boolean => {
    const nominalVal = parseFloat(resolvedNominal)
    const measuredVal = parseFloat(resolvedMeasured)
    
    if (isNaN(nominalVal) || isNaN(measuredVal)) return true
    
    // Parse tolerance (handles ±0.01, +0.02/-0.01, etc.)
    const toleranceMatch = resolvedTolerance.match(/[±+-]?\s*(\d+\.?\d*)/)
    if (!toleranceMatch) return true
    
    const toleranceVal = parseFloat(toleranceMatch[1])
    if (isNaN(toleranceVal)) return true
    
    return Math.abs(measuredVal - nominalVal) <= toleranceVal
  }

  const isPass = calculateStatus()

  if (!visible) return null

  const handlePositionChange = (newPos: { x?: number; y?: number; width?: number; height?: number }) => {
    setProp((props: SpecBoxProps) => {
      if (newPos.x !== undefined) props.x = newPos.x
      if (newPos.y !== undefined) props.y = newPos.y
      if (newPos.width !== undefined) props.width = newPos.width
      if (newPos.height !== undefined) props.height = newPos.height
    })
  }

  const renderHorizontal = () => (
    <div className="w-full h-full flex flex-col justify-center p-2 border rounded bg-white"
      style={{ borderColor: showStatus ? (isPass ? passColor : failColor) : '#e5e7eb' }}>
      <div className="text-xs text-gray-500 mb-1">{resolvedTitle}</div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-semibold">{resolvedNominal}</span>
          <span className="text-sm text-gray-500">{resolvedTolerance}</span>
          <span className="text-xs text-gray-400">{resolvedUnit}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium"
            style={{ color: showStatus ? (isPass ? passColor : failColor) : 'inherit' }}>
            {resolvedMeasured}
          </span>
          {showStatus && (
            <span className="text-lg"
              style={{ color: isPass ? passColor : failColor }}>
              {isPass ? '✓' : '✗'}
            </span>
          )}
        </div>
      </div>
    </div>
  )

  const renderVertical = () => (
    <div className="w-full h-full flex flex-col justify-between p-2 border rounded bg-white"
      style={{ borderColor: showStatus ? (isPass ? passColor : failColor) : '#e5e7eb' }}>
      <div className="text-xs text-gray-500">{resolvedTitle}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-semibold">{resolvedNominal}</span>
        <span className="text-sm text-gray-500">{resolvedTolerance}</span>
        <span className="text-xs text-gray-400">{resolvedUnit}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Measured:</span>
        <span className="text-sm font-medium"
          style={{ color: showStatus ? (isPass ? passColor : failColor) : 'inherit' }}>
          {resolvedMeasured} {resolvedUnit}
        </span>
      </div>
    </div>
  )

  const renderCompact = () => (
    <div className="w-full h-full flex items-center justify-between px-2 py-1 border rounded bg-white"
      style={{ borderColor: showStatus ? (isPass ? passColor : failColor) : '#e5e7eb' }}>
      <span className="text-xs text-gray-500">{resolvedTitle}:</span>
      <div className="flex items-baseline gap-1">
        <span className="text-sm font-semibold">{resolvedNominal}</span>
        <span className="text-xs text-gray-500">{resolvedTolerance}</span>
      </div>
      <span className="text-sm font-medium"
        style={{ color: showStatus ? (isPass ? passColor : failColor) : 'inherit' }}>
        {resolvedMeasured}
      </span>
      {showStatus && (
        <span className="text-sm"
          style={{ color: isPass ? passColor : failColor }}>
          {isPass ? '✓' : '✗'}
        </span>
      )}
    </div>
  )

  return (
    <ResizableBox
      x={x}
      y={y}
      width={width}
      height={height}
      minWidth={120}
      minHeight={40}
      selected={selected}
      nodeId={id}
      onPositionChange={handlePositionChange}
      connectRef={(ref) => { if (ref) connect(ref) }}
      zIndex={zIndex}
    >
      {layout === 'horizontal' && renderHorizontal()}
      {layout === 'vertical' && renderVertical()}
      {layout === 'compact' && renderCompact()}
    </ResizableBox>
  )
}

import { SpecBoxSettings } from '../settings/SpecBoxSettings'

SpecBox.craft = {
  displayName: 'Spec Box',
  props: {
    title: 'Specification',
    titleBinding: '',
    nominal: '0.00',
    nominalBinding: '',
    tolerance: '±0.01',
    toleranceBinding: '',
    unit: 'mm',
    unitBinding: '',
    measured: '0.005',
    measuredBinding: '',
    showStatus: true,
    passColor: '#22c55e',
    failColor: '#ef4444',
    layout: 'horizontal',
    x: 0,
    y: 0,
    width: 200,
    height: 80,
    zIndex: 1,
    visible: true,
  },
  related: {
    settings: SpecBoxSettings,
  },
  rules: {
    canDrag: () => true,
  },
}
