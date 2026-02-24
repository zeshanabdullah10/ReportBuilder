'use client'

import { useNode } from '@craftjs/core'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { hasBindings, resolveBindingOrValue } from '@/lib/utils/binding'
import { ResizableBox } from '../layout/ResizableBox'

interface PassRateChartProps {
  // Values
  passCount?: number
  passCountBinding?: string
  failCount?: number
  failCountBinding?: string
  
  // Appearance
  chartType?: 'donut' | 'pie' | 'bar'
  passColor?: string
  failColor?: string
  showPercentage?: boolean
  showLegend?: boolean
  showCounts?: boolean
  
  // Title
  title?: string
  
  // Position
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
  visible?: boolean
}

export const PassRateChart = ({
  passCount = 85,
  passCountBinding = '',
  failCount = 15,
  failCountBinding = '',
  chartType = 'donut',
  passColor = '#22c55e',
  failColor = '#ef4444',
  showPercentage = true,
  showLegend = true,
  showCounts = true,
  title = 'Pass Rate',
  x = 0,
  y = 0,
  width = 200,
  height = 180,
  zIndex = 1,
  visible = true,
}: PassRateChartProps) => {
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
      return typeof resolved === 'number' ? resolved : parseInt(String(resolved)) || value
    }
    return value
  }

  const resolvedPassCount = resolveNumber(passCount, passCountBinding)
  const resolvedFailCount = resolveNumber(failCount, failCountBinding)
  const total = resolvedPassCount + resolvedFailCount
  const passPercent = total > 0 ? (resolvedPassCount / total) * 100 : 0
  const failPercent = total > 0 ? (resolvedFailCount / total) * 100 : 0

  if (!visible) return null

  const handlePositionChange = (newPos: { x?: number; y?: number; width?: number; height?: number }) => {
    setProp((props: PassRateChartProps) => {
      if (newPos.x !== undefined) props.x = newPos.x
      if (newPos.y !== undefined) props.y = newPos.y
      if (newPos.width !== undefined) props.width = newPos.width
      if (newPos.height !== undefined) props.height = newPos.height
    })
  }

  // SVG calculations for donut/pie
  const size = Math.min(width || 200, (height || 180) - (showLegend ? 50 : 20))
  const center = size / 2
  const radius = size / 2 - 10
  const innerRadius = chartType === 'donut' ? radius * 0.6 : 0

  // Calculate arc paths
  const describeArc = (x: number, y: number, outerRadius: number, innerRadius: number, startAngle: number, endAngle: number): string => {
    const startOuter = {
      x: x + outerRadius * Math.cos((startAngle - 90) * Math.PI / 180),
      y: y + outerRadius * Math.sin((startAngle - 90) * Math.PI / 180),
    }
    const endOuter = {
      x: x + outerRadius * Math.cos((endAngle - 90) * Math.PI / 180),
      y: y + outerRadius * Math.sin((endAngle - 90) * Math.PI / 180),
    }
    const startInner = {
      x: x + innerRadius * Math.cos((endAngle - 90) * Math.PI / 180),
      y: y + innerRadius * Math.sin((endAngle - 90) * Math.PI / 180),
    }
    const endInner = {
      x: x + innerRadius * Math.cos((startAngle - 90) * Math.PI / 180),
      y: y + innerRadius * Math.sin((startAngle - 90) * Math.PI / 180),
    }

    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0

    if (innerRadius > 0) {
      return [
        `M ${startOuter.x} ${startOuter.y}`,
        `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}`,
        `L ${startInner.x} ${startInner.y}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${endInner.x} ${endInner.y}`,
        'Z',
      ].join(' ')
    } else {
      return [
        `M ${x} ${y}`,
        `L ${startOuter.x} ${startOuter.y}`,
        `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}`,
        'Z',
      ].join(' ')
    }
  }

  const passAngle = (passPercent / 100) * 360

  const renderDonutPie = () => (
    <svg width={size} height={size} className="mx-auto">
      {/* Pass segment */}
      <path
        d={describeArc(center, center, radius, innerRadius, 0, passAngle)}
        fill={passColor}
      />
      {/* Fail segment */}
      <path
        d={describeArc(center, center, radius, innerRadius, passAngle, 360)}
        fill={failColor}
      />
      {/* Center text for donut */}
      {chartType === 'donut' && showPercentage && (
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-lg font-semibold"
          style={{ fontSize: `${Math.max(12, size / 8)}px` }}
        >
          {passPercent.toFixed(0)}%
        </text>
      )}
    </svg>
  )

  const renderBar = () => (
    <div className="w-full">
      <div className="relative h-8 bg-gray-100 rounded overflow-hidden">
        <div
          className="absolute left-0 top-0 bottom-0"
          style={{
            width: `${passPercent}%`,
            backgroundColor: passColor,
          }}
        />
        <div
          className="absolute top-0 bottom-0"
          style={{
            left: `${passPercent}%`,
            width: `${failPercent}%`,
            backgroundColor: failColor,
          }}
        />
        {showPercentage && (
          <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
            {passPercent.toFixed(0)}% Pass
          </div>
        )}
      </div>
    </div>
  )

  return (
    <ResizableBox
      x={x}
      y={y}
      width={width}
      height={height}
      minWidth={120}
      minHeight={80}
      selected={selected}
      nodeId={id}
      onPositionChange={handlePositionChange}
      connectRef={(ref) => { if (ref) connect(ref) }}
      zIndex={zIndex}
    >
      <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-white border rounded">
        {/* Title */}
        {title && (
          <div className="text-sm font-medium text-gray-700 mb-2">{title}</div>
        )}
        
        {/* Chart */}
        {chartType === 'bar' ? renderBar() : renderDonutPie()}
        
        {/* Legend */}
        {showLegend && (
          <div className="flex items-center gap-4 mt-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: passColor }} />
              <span>Pass</span>
              {showCounts && <span className="text-gray-500">({resolvedPassCount})</span>}
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: failColor }} />
              <span>Fail</span>
              {showCounts && <span className="text-gray-500">({resolvedFailCount})</span>}
            </div>
          </div>
        )}
      </div>
    </ResizableBox>
  )
}

import { PassRateChartSettings } from '../settings/PassRateChartSettings'

PassRateChart.craft = {
  displayName: 'Pass Rate Chart',
  props: {
    passCount: 85,
    passCountBinding: '',
    failCount: 15,
    failCountBinding: '',
    chartType: 'donut',
    passColor: '#22c55e',
    failColor: '#ef4444',
    showPercentage: true,
    showLegend: true,
    showCounts: true,
    title: 'Pass Rate',
    x: 0,
    y: 0,
    width: 200,
    height: 180,
    zIndex: 1,
    visible: true,
  },
  related: {
    settings: PassRateChartSettings,
  },
  rules: {
    canDrag: () => true,
  },
}
