'use client'

import { useNode } from '@craftjs/core'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { hasBindings, resolveBindingOrValue } from '@/lib/utils/binding'
import { ResizableBox } from '../layout/ResizableBox'
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Scatter } from 'react-chartjs-2'
import { useMemo } from 'react'

// Register Chart.js components
ChartJS.register(LinearScale, PointElement, Title, Tooltip, Legend)

interface ScatterPlotProps {
  // Data binding
  dataBinding?: string
  
  // Or static data
  points?: Array<{ x: number; y: number }>
  
  // Configuration
  showGridLines?: boolean
  pointRadius?: number
  
  // Axis configuration
  xAxisLabel?: string
  yAxisLabel?: string
  xAxisMin?: number
  xAxisMax?: number
  yAxisMin?: number
  yAxisMax?: number
  
  // Styling
  pointColor?: string
  gridColor?: string
  backgroundColor?: string
  
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

// Sample data for preview
const samplePoints = [
  { x: 1.0, y: 2.1 },
  { x: 2.0, y: 3.8 },
  { x: 3.0, y: 5.2 },
  { x: 4.0, y: 7.1 },
  { x: 5.0, y: 8.9 },
  { x: 6.0, y: 11.2 },
  { x: 7.0, y: 12.8 },
  { x: 8.0, y: 14.5 },
  { x: 9.0, y: 16.9 },
  { x: 10.0, y: 18.3 },
]

export const ScatterPlot = ({
  dataBinding = '',
  points = samplePoints,
  showGridLines = true,
  pointRadius = 4,
  xAxisLabel = 'X Axis',
  yAxisLabel = 'Y Axis',
  xAxisMin,
  xAxisMax,
  yAxisMin,
  yAxisMax,
  pointColor = '#00ffc8',
  gridColor = '#333',
  backgroundColor = 'transparent',
  title = 'Correlation Analysis',
  x = 0,
  y = 0,
  width = 400,
  height = 300,
  zIndex = 1,
  visible = true,
}: ScatterPlotProps) => {
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

  // Resolve data from binding or use provided/default points
  const getData = (): Array<{ x: number; y: number }> => {
    if (dataBinding && hasBindings(dataBinding) && sampleData) {
      const resolved = resolveBindingOrValue(dataBinding, sampleData as Record<string, unknown>)
      if (Array.isArray(resolved)) {
        return resolved
          .filter((p): p is { x: number; y: number } => 
            typeof p === 'object' && p !== null && 
            typeof (p as Record<string, unknown>).x === 'number' && 
            typeof (p as Record<string, unknown>).y === 'number'
          )
      }
    }
    return points
  }

  const data = getData()

  // Calculate correlation coefficient
  const correlation = useMemo(() => {
    if (data.length < 2) return 0

    const n = data.length
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0

    data.forEach(point => {
      sumX += point.x
      sumY += point.y
      sumXY += point.x * point.y
      sumX2 += point.x * point.x
      sumY2 += point.y * point.y
    })

    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

    return denominator === 0 ? 0 : numerator / denominator
  }, [data])

  if (!visible) return null

  const handlePositionChange = (newPos: { x?: number; y?: number; width?: number; height?: number }) => {
    setProp((props: ScatterPlotProps) => {
      if (newPos.x !== undefined) props.x = newPos.x
      if (newPos.y !== undefined) props.y = newPos.y
      if (newPos.width !== undefined) props.width = newPos.width
      if (newPos.height !== undefined) props.height = newPos.height
    })
  }

  const chartData = {
    datasets: [
      {
        label: 'Data Points',
        data: data,
        backgroundColor: pointColor,
        borderColor: pointColor,
        pointRadius: pointRadius,
        pointHoverRadius: pointRadius + 2,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: !!title,
        text: title,
        color: '#fff',
        font: { size: 14 },
      },
    },
    scales: {
      x: {
        type: 'linear' as const,
        position: 'bottom' as const,
        title: {
          display: !!xAxisLabel,
          text: xAxisLabel,
          color: '#999',
        },
        min: xAxisMin,
        max: xAxisMax,
        ticks: { color: '#999', font: { size: 10 } },
        grid: { color: gridColor, display: showGridLines },
      },
      y: {
        title: {
          display: !!yAxisLabel,
          text: yAxisLabel,
          color: '#999',
        },
        min: yAxisMin,
        max: yAxisMax,
        ticks: { color: '#999', font: { size: 10 } },
        grid: { color: gridColor, display: showGridLines },
      },
    },
  }

  return (
    <ResizableBox
      x={x}
      y={y}
      width={width}
      height={height}
      minWidth={200}
      minHeight={150}
      selected={selected}
      nodeId={id}
      onPositionChange={handlePositionChange}
      connectRef={(ref) => { if (ref) connect(ref) }}
      zIndex={zIndex}
    >
      <div
        className="w-full h-full flex flex-col p-2"
        style={{ backgroundColor, border: `1px solid ${gridColor}`, borderRadius: '4px' }}
      >
        <div className="flex-1">
          <Scatter data={chartData} options={chartOptions} />
        </div>
        
        <div
          className="flex justify-around text-xs mt-2 pt-2"
          style={{ borderTop: `1px solid ${gridColor}`, color: '#999' }}
        >
          <span>Correlation (r): {correlation.toFixed(4)}</span>
          <span>N: {data.length}</span>
        </div>
      </div>
    </ResizableBox>
  )
}

import { ScatterPlotSettings } from '../settings/ScatterPlotSettings'

ScatterPlot.craft = {
  displayName: 'Scatter Plot',
  props: {
    dataBinding: '',
    points: samplePoints,
    showGridLines: true,
    pointRadius: 4,
    xAxisLabel: 'X Axis',
    yAxisLabel: 'Y Axis',
    xAxisMin: undefined,
    xAxisMax: undefined,
    yAxisMin: undefined,
    yAxisMax: undefined,
    pointColor: '#00ffc8',
    gridColor: '#333',
    backgroundColor: 'transparent',
    title: 'Correlation Analysis',
    x: 0,
    y: 0,
    width: 400,
    height: 300,
    zIndex: 1,
    visible: true,
  },
  related: {
    settings: ScatterPlotSettings,
  },
  rules: {
    canDrag: () => true,
  },
}
