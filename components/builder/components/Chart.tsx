'use client'

import { useNode } from '@craftjs/core'
import { ChartSettings } from '../settings/ChartSettings'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { hasBindings, resolveBindingOrValue } from '@/lib/utils/binding'
import { ResizableBox } from '../layout/ResizableBox'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Bar, Pie } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler)

interface DatasetConfig {
  label?: string
  dataPoints?: string
  binding?: string
  chartType?: 'line' | 'bar'
  color?: string
  backgroundColor?: string
  yAxisID?: 'y' | 'y1'
  fill?: boolean
}

interface ChartProps {
  chartType?: 'line' | 'bar' | 'pie'
  title?: string
  // Single dataset (backward compatible)
  label?: string
  dataPoints?: string
  labels?: string
  binding?: string
  // Color options
  primaryColor?: string
  backgroundColor?: string
  borderColor?: string
  // Multi-dataset support
  datasets?: DatasetConfig[]
  enableMultiAxis?: boolean
  // Position
  x?: number
  y?: number
  width?: number
  height?: number
}

const DEFAULT_COLORS = [
  '#0066cc', '#28a745', '#fd7e14', '#dc3545', '#17a2b8',
  '#6f42c1', '#007bff', '#c82333', '#20c997', '#ffc107'
]

export const Chart = ({
  chartType = 'bar',
  title = 'Chart Title',
  label = 'Dataset',
  dataPoints = '65, 59, 80, 81, 56',
  labels = '',
  binding = '',
  primaryColor = '#00ffc8',
  backgroundColor = 'rgba(0, 255, 200, 0.5)',
  borderColor = '#00ffc8',
  datasets = [],
  enableMultiAxis = false,
  x = 0,
  y = 0,
  width = 400,
  height = 300,
}: ChartProps) => {
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

  // Parse data from string or binding
  const parseData = (points: string, bindPath: string): { values: number[], labels: string[] } => {
    // If in preview mode with binding, try to resolve
    if (isPreviewMode && sampleData && bindPath && hasBindings(bindPath)) {
      const resolved = resolveBindingOrValue(bindPath, sampleData)

      if (Array.isArray(resolved)) {
        if (resolved.length > 0 && typeof resolved[0] === 'object') {
          return {
            labels: resolved.map((item: any) => item.label ?? item.name ?? ''),
            values: resolved.map((item: any) => item.value ?? item.y ?? 0),
          }
        }
        return {
          labels: resolved.map((_: any, i: number) => `Item ${i + 1}`),
          values: resolved.map((item: any) => (typeof item === 'number' ? item : 0)),
        }
      }
    }

    // Parse static data points
    const values = points.split(',').map((d) => parseFloat(d.trim()) || 0)
    const dataLabels = values.map((_, i) => `Item ${i + 1}`)
    return { values, labels: dataLabels }
  }

  // Get chart labels (from primary dataset or provided labels)
  const getChartLabels = () => {
    if (labels && labels.trim()) {
      return labels.split(',').map((l) => l.trim())
    }
    // Get labels from first dataset or primary data
    if (datasets && datasets.length > 0) {
      const firstDataset = datasets[0]
      const parsed = parseData(firstDataset.dataPoints || '', firstDataset.binding || '')
      return parsed.labels
    }
    const parsed = parseData(dataPoints, binding)
    return parsed.labels
  }

  // Build datasets array
  const buildDatasets = () => {
    // If using multi-dataset mode
    if (datasets && datasets.length > 0) {
      return datasets.map((ds, index) => {
        const parsed = parseData(ds.dataPoints || '', ds.binding || '')
        const color = ds.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
        const bgColor = ds.backgroundColor || `${color}80`

        return {
          label: ds.label || `Dataset ${index + 1}`,
          data: parsed.values,
          type: ds.chartType || (chartType === 'pie' ? 'bar' : chartType),
          backgroundColor: chartType === 'pie' ? DEFAULT_COLORS : bgColor,
          borderColor: color,
          borderWidth: 2,
          yAxisID: enableMultiAxis && ds.yAxisID ? ds.yAxisID : 'y',
          fill: ds.fill || false,
          tension: ds.chartType === 'line' ? 0.3 : 0,
        }
      })
    }

    // Single dataset mode (backward compatible)
    const parsed = parseData(dataPoints, binding)

    return [{
      label,
      data: parsed.values,
      backgroundColor: chartType === 'pie' ? DEFAULT_COLORS : backgroundColor,
      borderColor: chartType === 'pie' ? '#ffffff' : borderColor,
      borderWidth: 2,
      yAxisID: 'y',
      fill: false,
      tension: chartType === 'line' ? 0.3 : 0,
    }]
  }

  // Resolve title if it contains a binding
  const getDisplayTitle = () => {
    if (isPreviewMode && sampleData && hasBindings(title)) {
      const resolved = resolveBindingOrValue(title, sampleData)
      return typeof resolved === 'string' ? resolved : title
    }
    return title
  }

  const chartConfig = {
    labels: getChartLabels(),
    datasets: buildDatasets(),
  } as any // Type assertion needed for mixed chart types

  // Build scales configuration
  const buildScales = () => {
    if (chartType === 'pie') return undefined

    const baseScale = {
      beginAtZero: true,
      ticks: { color: '#666' },
      grid: { color: 'rgba(0,0,0,0.1)' },
    }

    if (enableMultiAxis) {
      return {
        y: {
          ...baseScale,
          type: 'linear' as const,
          display: true,
          position: 'left' as const,
          title: {
            display: true,
            text: 'Primary Axis',
            color: '#666',
          },
        },
        y1: {
          ...baseScale,
          type: 'linear' as const,
          display: true,
          position: 'right' as const,
          title: {
            display: true,
            text: 'Secondary Axis',
            color: '#666',
          },
          grid: {
            drawOnChartArea: false,
          },
        },
        x: {
          ticks: { color: '#666' },
          grid: { color: 'rgba(0,0,0,0.1)' },
        },
      }
    }

    return {
      y: baseScale,
      x: {
        ticks: { color: '#666' },
        grid: { color: 'rgba(0,0,0,0.1)' },
      },
    }
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#666' },
      },
      title: {
        display: true,
        text: getDisplayTitle(),
        color: '#333',
        font: { size: 16 },
      },
    },
    scales: buildScales(),
  }

  const ChartComponent = chartType === 'line' ? Line : chartType === 'pie' ? Pie : Bar

  const handlePositionChange = (newPos: { x?: number; y?: number; width?: number; height?: number }) => {
    setProp((props: ChartProps) => {
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
      minWidth={200}
      minHeight={150}
      selected={selected}
      nodeId={id}
      onPositionChange={handlePositionChange}
      connectRef={(ref) => { if (ref) connect(ref) }}
    >
      <div
        style={{ width: '100%', height: '100%' }}
        className="bg-white p-4 rounded-lg"
      >
        <ChartComponent data={chartConfig} options={options} />
      </div>
    </ResizableBox>
  )
}

Chart.craft = {
  displayName: 'Chart',
  props: {
    chartType: 'bar',
    title: 'Chart Title',
    label: 'Dataset',
    dataPoints: '65, 59, 80, 81, 56',
    labels: '',
    binding: '',
    primaryColor: '#0066cc',
    backgroundColor: 'rgba(0, 102, 204, 0.5)',
    borderColor: '#0066cc',
    datasets: [],
    enableMultiAxis: false,
    x: 0,
    y: 0,
    width: 400,
    height: 300,
  },
  related: {
    settings: ChartSettings,
  },
}
