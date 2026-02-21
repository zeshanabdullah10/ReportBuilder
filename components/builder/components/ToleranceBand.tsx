'use client'

import { useNode } from '@craftjs/core'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { hasBindings, resolveBindingOrValue } from '@/lib/utils/binding'
import { ResizableBox } from '../layout/ResizableBox'

interface ToleranceBandProps {
  // Values
  nominal?: number
  nominalBinding?: string
  tolerance?: number
  toleranceBinding?: string
  measured?: number
  measuredBinding?: string
  
  // Appearance
  bandColor?: string
  centerColor?: string
  measuredColor?: string
  showLabels?: boolean
  showValue?: boolean
  
  // Scale
  minScale?: number
  maxScale?: number
  autoScale?: boolean
  
  // Position
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
  visible?: boolean
}

export const ToleranceBand = ({
  nominal = 50,
  nominalBinding = '',
  tolerance = 5,
  toleranceBinding = '',
  measured = 52,
  measuredBinding = '',
  bandColor = '#22c55e',
  centerColor = '#3b82f6',
  measuredColor = '#ef4444',
  showLabels = true,
  showValue = true,
  minScale = 0,
  maxScale = 100,
  autoScale = true,
  x = 0,
  y = 0,
  width = 300,
  height = 60,
  zIndex = 1,
  visible = true,
}: ToleranceBandProps) => {
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
  const resolveNumber = (value: number, binding: string): number => {
    if (binding && hasBindings(binding) && sampleData) {
      const resolved = resolveBindingOrValue(binding, sampleData as Record<string, unknown>)
      return typeof resolved === 'number' ? resolved : parseFloat(String(resolved)) || value
    }
    return value
  }

  const resolvedNominal = resolveNumber(nominal, nominalBinding)
  const resolvedTolerance = resolveNumber(tolerance, toleranceBinding)
  const resolvedMeasured = resolveNumber(measured, measuredBinding)

  // Calculate scale
  const effectiveMin = autoScale
    ? Math.min(resolvedNominal - resolvedTolerance * 3, resolvedMeasured, minScale)
    : minScale
  const effectiveMax = autoScale
    ? Math.max(resolvedNominal + resolvedTolerance * 3, resolvedMeasured, maxScale)
    : maxScale
  const range = effectiveMax - effectiveMin

  // Calculate positions as percentages
  const toPercent = (value: number) => ((value - effectiveMin) / range) * 100
  const toleranceStart = toPercent(resolvedNominal - resolvedTolerance)
  const toleranceEnd = toPercent(resolvedNominal + resolvedTolerance)
  const nominalPos = toPercent(resolvedNominal)
  const measuredPos = toPercent(resolvedMeasured)

  // Check if measured is within tolerance
  const isWithinTolerance = Math.abs(resolvedMeasured - resolvedNominal) <= resolvedTolerance

  if (!visible) return null

  const handlePositionChange = (newPos: { x?: number; y?: number; width?: number; height?: number }) => {
    setProp((props: ToleranceBandProps) => {
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
      minWidth={150}
      minHeight={40}
      selected={selected}
      nodeId={id}
      onPositionChange={handlePositionChange}
      connectRef={(ref) => { if (ref) connect(ref) }}
      zIndex={zIndex}
    >
      <div className="w-full h-full flex flex-col justify-center p-2 bg-white border rounded">
        {/* Main band */}
        <div className="relative h-6 bg-gray-100 rounded overflow-hidden">
          {/* Tolerance band */}
          <div
            className="absolute h-full"
            style={{
              left: `${toleranceStart}%`,
              width: `${toleranceEnd - toleranceStart}%`,
              backgroundColor: bandColor,
              opacity: 0.4,
            }}
          />
          
          {/* Nominal center line */}
          <div
            className="absolute top-0 bottom-0 w-0.5"
            style={{
              left: `${nominalPos}%`,
              backgroundColor: centerColor,
            }}
          />
          
          {/* Measured value marker */}
          <div
            className="absolute top-0 bottom-0 w-1 rounded"
            style={{
              left: `${measuredPos}%`,
              backgroundColor: isWithinTolerance ? bandColor : measuredColor,
              transform: 'translateX(-50%)',
            }}
          />
          
          {/* Min/Max labels */}
          {showLabels && (
            <>
              <span className="absolute left-1 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                {effectiveMin.toFixed(1)}
              </span>
              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                {effectiveMax.toFixed(1)}
              </span>
            </>
          )}
        </div>
        
        {/* Value labels */}
        {showValue && (
          <div className="relative mt-1 text-xs">
            <span className="text-gray-500">
              Nominal: <span className="font-medium text-gray-700">{resolvedNominal.toFixed(2)}</span>
            </span>
            <span className="text-gray-500 ml-3">
              Tolerance: <span className="font-medium text-gray-700">±{resolvedTolerance.toFixed(2)}</span>
            </span>
            <span className={`ml-3 ${isWithinTolerance ? 'text-green-600' : 'text-red-600'}`}>
              Measured: <span className="font-medium">{resolvedMeasured.toFixed(2)}</span>
              <span className="ml-1">{isWithinTolerance ? '✓' : '✗'}</span>
            </span>
          </div>
        )}
      </div>
    </ResizableBox>
  )
}

import { ToleranceBandSettings } from '../settings/ToleranceBandSettings'

ToleranceBand.craft = {
  displayName: 'Tolerance Band',
  props: {
    nominal: 50,
    nominalBinding: '',
    tolerance: 5,
    toleranceBinding: '',
    measured: 52,
    measuredBinding: '',
    bandColor: '#22c55e',
    centerColor: '#3b82f6',
    measuredColor: '#ef4444',
    showLabels: true,
    showValue: true,
    minScale: 0,
    maxScale: 100,
    autoScale: true,
    x: 0,
    y: 0,
    width: 300,
    height: 60,
    zIndex: 1,
    visible: true,
  },
  related: {
    settings: ToleranceBandSettings,
  },
  rules: {
    canDrag: () => true,
  },
}
