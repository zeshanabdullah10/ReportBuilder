'use client'

import { useNode } from '@craftjs/core'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { hasBindings, resolveBindingOrValue } from '@/lib/utils/binding'
import { ResizableBox } from '../layout/ResizableBox'
import {
  Chart as ChartJS,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { useMemo } from 'react'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface HistogramProps {
  // Data binding
  dataBinding?: string
  
  // Or static data
  values?: number[]
  
  // Configuration
  bins?: number
  showStatistics?: boolean
  
  // Styling
  barColor?: string
  borderColor?: string
  backgroundColor?: string
  
  // Labels
  title?: string
  xAxisLabel?: string
  yAxisLabel?: string
  
  // Position
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
  visible?: boolean
}

// Sample data for preview
const sampleValues = [5.02, 4.98, 5.01, 5.03, 4.99, 5.00, 5.02, 4.97, 5.01, 5.04,4.96, 5.05, 4.98, 5.00, 5.02, 5.01, 4.99, 5.03, 5.00, 5.02]

export const Histogram = ({
  dataBinding = '',
  values = sampleValues,
  bins = 10,
  showStatistics = true,
  barColor = '#00ffc8',
  borderColor = '#333',
  backgroundColor = 'transparent',
  title = 'Measurement Distribution',
  xAxisLabel = 'Value',
  yAxisLabel = 'Frequency',
  x = 0,
  y = 0,
  width = 400,
  height = 300,
  zIndex = 1,
  visible = true,
}: HistogramProps) => {
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

  // Resolve data from binding or use provided/default values
  const getData = (): number[] => {
    if (dataBinding && hasBindings(dataBinding) && sampleData) {
      const resolved = resolveBindingOrValue(dataBinding, sampleData as Record<string, unknown>)
      if (Array.isArray(resolved)) {
        return resolved.filter((v): v is number => typeof v === 'number')
      }
    }
    return values
  }

  const data = getData()

  // Calculate histogram data
  const histogramData = useMemo(() => {
    if (data.length === 0) {
      return { labels: [], frequencies: [] }
    }

    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    const binWidth = range / bins

    // Create bins
    const binEdges: number[] = []
    for (let i = 0; i <= bins; i++) {
      binEdges.push(min + i * binWidth)
    }

    // Count frequencies
    const frequencies: number[] = new Array(bins).fill(0)
    data.forEach(value => {
      for (let i = 0; i < bins; i++) {
        if (value >= binEdges[i] && (value < binEdges[i + 1] || (i === bins - 1 && value <= binEdges[i + 1]))) {
          frequencies[i]++
          break
        }
      }
    })

    // Create labels (bin centers)
    const labels = binEdges.slice(0, -1).map((edge, i) => {
      const center = edge + binWidth / 2
      return center.toFixed(2)
    })

    return { labels, frequencies }
  }, [data, bins])

  // Calculate statistics
  const statistics = useMemo(() => {
    if (data.length === 0) return { mean: 0, stdDev: 0, min: 0, max: 0, count: 0 }
    
    const mean = data.reduce((a, b) => a + b, 0) / data.length
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length
    const stdDev = Math.sqrt(variance)
    
    return {
      mean,
      stdDev,
      min: Math.min(...data),
      max: Math.max(...data),
      count: data.length,
    }
  }, [data])

  if (!visible) return null

  const handlePositionChange = (newPos: { x?: number; y?: number; width?: number; height?: number }) => {
    setProp((props: HistogramProps) => {
      if (newPos.x !== undefined) props.x = newPos.x
      if (newPos.y !== undefined) props.y = newPos.y
      if (newPos.width !== undefined) props.width = newPos.width
      if (newPos.height !== undefined) props.height = newPos.height
    })
  }

  const chartData = {
    labels: histogramData.labels,
    datasets: [
      {
        label: 'Frequency',
        data: histogramData.frequencies,
        backgroundColor: barColor + '80',
        borderColor: barColor,
        borderWidth: 1,
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
        title: {
          display: !!xAxisLabel,
          text: xAxisLabel,
          color: '#999',
        },
        ticks: { color: '#999', font: { size: 10 } },
        grid: { color: '#333' },
      },
      y: {
        title: {
          display: !!yAxisLabel,
          text: yAxisLabel,
          color: '#999',
        },
        ticks: { color: '#999', font: { size: 10 } },
        grid: { color: '#333' },
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
        style={{ backgroundColor, border: `1px solid ${borderColor}`, borderRadius: '4px' }}
      >
        <div className="flex-1">
          <Bar data={chartData} options={chartOptions} />
        </div>
        
        {showStatistics && (
          <div
            className="flex justify-around text-xs mt-2 pt-2"
            style={{ borderTop: `1px solid ${borderColor}`, color: '#999' }}
          >
            <span>Mean: {statistics.mean.toFixed(3)}</span>
            <span>Std Dev: {statistics.stdDev.toFixed(3)}</span>
            <span>N: {statistics.count}</span>
          </div>
        )}
      </div>
    </ResizableBox>
  )
}

import { HistogramSettings } from '../settings/HistogramSettings'

Histogram.craft = {
  displayName: 'Histogram',
  props: {
    dataBinding: '',
    values: sampleValues,
    bins: 10,
    showStatistics: true,
    barColor: '#00ffc8',
    borderColor: '#333',
    backgroundColor: 'transparent',
    title: 'Measurement Distribution',
    xAxisLabel: 'Value',
    yAxisLabel: 'Frequency',
    x: 0,
    y: 0,
    width: 400,
    height: 300,
    zIndex: 1,
    visible: true,
  },
  related: {
    settings: HistogramSettings,
  },
  rules: {
    canDrag: () => true,
  },
}
