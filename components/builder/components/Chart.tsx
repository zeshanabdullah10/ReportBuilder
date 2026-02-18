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
} from 'chart.js'
import { Line, Bar, Pie } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend)

interface ChartProps {
  chartType?: 'line' | 'bar' | 'pie'
  title?: string
  label?: string
  dataPoints?: string
  labels?: string
  binding?: string
  x?: number
  y?: number
  width?: number
  height?: number
}

interface ChartDataPoint {
  label?: string
  value: number
}

export const Chart = ({
  chartType = 'bar',
  title = 'Chart Title',
  label = 'Dataset',
  dataPoints = '65, 59, 80, 81, 56',
  labels = '',
  binding = '',
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

  // Get chart data based on preview mode and bindings
  const getChartData = () => {
    // If in preview mode with binding, try to resolve the binding
    if (isPreviewMode && sampleData && binding && hasBindings(binding)) {
      const resolved = resolveBindingOrValue(binding, sampleData)

      // Support array of objects with { label, value } structure
      if (Array.isArray(resolved)) {
        if (resolved.length > 0 && typeof resolved[0] === 'object') {
          return {
            labels: resolved.map((item: any) => item.label ?? item.name ?? ''),
            values: resolved.map((item: any) => item.value ?? item.y ?? 0),
          }
        }
        // Simple array of numbers
        return {
          labels: resolved.map((_: any, i: number) => `Item ${i + 1}`),
          values: resolved.map((item: any) => (typeof item === 'number' ? item : 0)),
        }
      }
    }

    // Parse static data points
    const dataValues = dataPoints.split(',').map((d) => parseFloat(d.trim()) || 0)

    // Parse static labels if provided
    let dataLabels: string[]
    if (labels && labels.trim()) {
      dataLabels = labels.split(',').map((l) => l.trim())
    } else {
      dataLabels = dataValues.map((_, i) => `Item ${i + 1}`)
    }

    return {
      labels: dataLabels,
      values: dataValues,
    }
  }

  // Resolve title if it contains a binding
  const getDisplayTitle = () => {
    if (isPreviewMode && sampleData && hasBindings(title)) {
      const resolved = resolveBindingOrValue(title, sampleData)
      return typeof resolved === 'string' ? resolved : title
    }
    return title
  }

  const chartData = getChartData()

  const chartConfig = {
    labels: chartData.labels,
    datasets: [
      {
        label,
        data: chartData.values,
        backgroundColor:
          chartType === 'pie'
            ? ['#00ffc8', '#39ff14', '#ffb000', '#ff6b6b', '#4ecdc4', '#9b59b6', '#3498db']
            : 'rgba(0, 255, 200, 0.5)',
        borderColor: '#00ffc8',
        borderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
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
    scales:
      chartType !== 'pie'
        ? {
            y: { beginAtZero: true, ticks: { color: '#666' } },
            x: { ticks: { color: '#666' } },
          }
        : undefined,
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
        style={{ width: '100%', height: '100%', minHeight: '200px' }}
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
    x: 0,
    y: 0,
    width: 400,
    height: 300,
  },
  related: {
    settings: ChartSettings,
  },
}
