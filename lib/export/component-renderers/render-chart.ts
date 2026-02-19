/**
 * Chart Component Renderer
 *
 * Renders Chart components to static HTML with chart configuration
 * for runtime Chart.js initialization.
 */

import { ComponentRenderer, RendererResult } from './types'
import { generatePositionStyles, combineStyles, hexToRgba } from '../utils/style-helpers'
import { DEFAULT_CHART_COLORS } from '../assets/chart.min'

/**
 * Dataset configuration for multi-dataset charts
 */
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

/**
 * Chart component properties
 */
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
  zIndex?: number
  visible?: boolean
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Parse data points from comma-separated string
 *
 * @param points - Comma-separated data values
 * @returns Object with values array and generated labels
 */
function parseDataPoints(points: string): { values: number[]; labels: string[] } {
  const values = points
    .split(',')
    .map((d) => parseFloat(d.trim()))
    .filter((d) => !isNaN(d))

  const labels = values.map((_, i) => `Item ${i + 1}`)
  return { values, labels }
}

/**
 * Parse labels from comma-separated string
 *
 * @param labelsStr - Comma-separated label values
 * @param fallbackCount - Number of labels to generate if no labels provided
 * @returns Array of labels
 */
function parseLabels(labelsStr: string, fallbackCount: number): string[] {
  if (labelsStr && labelsStr.trim()) {
    return labelsStr.split(',').map((l) => l.trim())
  }
  return Array.from({ length: fallbackCount }, (_, i) => `Item ${i + 1}`)
}

/**
 * Build Chart.js datasets configuration
 */
function buildDatasetsConfig(props: ChartProps): object[] {
  const {
    chartType = 'bar',
    label = 'Dataset',
    dataPoints = '65, 59, 80, 81, 56',
    binding = '',
    primaryColor = '#00ffc8',
    backgroundColor = 'rgba(0, 255, 200, 0.5)',
    borderColor = '#00ffc8',
    datasets = [],
    enableMultiAxis = false,
  } = props

  // If using multi-dataset mode
  if (datasets && datasets.length > 0) {
    return datasets.map((ds, index) => {
      const color = ds.color || DEFAULT_CHART_COLORS[index % DEFAULT_CHART_COLORS.length]
      const bgColor = ds.backgroundColor || hexToRgba(color, 0.5)

      return {
        label: ds.label || `Dataset ${index + 1}`,
        // Data will be resolved at runtime from dataPoints or binding
        dataPoints: ds.dataPoints,
        binding: ds.binding,
        // Static data for placeholder
        data: ds.dataPoints ? parseDataPoints(ds.dataPoints).values : [],
        type: ds.chartType || (chartType === 'pie' ? 'bar' : chartType),
        backgroundColor: chartType === 'pie' ? DEFAULT_CHART_COLORS : bgColor,
        borderColor: color,
        borderWidth: 2,
        yAxisID: enableMultiAxis && ds.yAxisID ? ds.yAxisID : 'y',
        fill: ds.fill || false,
        tension: ds.chartType === 'line' || chartType === 'line' ? 0.3 : 0,
      }
    })
  }

  // Single dataset mode (backward compatible)
  const parsed = parseDataPoints(dataPoints)

  return [
    {
      label,
      // Include binding for runtime resolution
      binding: binding || undefined,
      dataPoints: dataPoints,
      // Static data for placeholder
      data: parsed.values,
      backgroundColor: chartType === 'pie' ? DEFAULT_CHART_COLORS : backgroundColor,
      borderColor: chartType === 'pie' ? '#ffffff' : borderColor,
      borderWidth: 2,
      yAxisID: 'y',
      fill: false,
      tension: chartType === 'line' ? 0.3 : 0,
    },
  ]
}

/**
 * Build Chart.js scales configuration for line/bar charts
 */
function buildScalesConfig(chartType: string, enableMultiAxis: boolean): object | undefined {
  if (chartType === 'pie') {
    return undefined
  }

  const baseScale = {
    beginAtZero: true,
    ticks: { color: '#666' },
    grid: { color: 'rgba(0,0,0,0.1)' },
  }

  if (enableMultiAxis) {
    return {
      y: {
        ...baseScale,
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Primary Axis',
          color: '#666',
        },
      },
      y1: {
        ...baseScale,
        type: 'linear',
        display: true,
        position: 'right',
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

/**
 * Build Chart.js options configuration
 */
function buildOptionsConfig(props: ChartProps): object {
  const { chartType = 'bar', title = 'Chart Title', enableMultiAxis = false } = props

  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#666' },
      },
      title: {
        display: true,
        text: title,
        color: '#333',
        font: { size: 16 },
      },
    },
    scales: buildScalesConfig(chartType, enableMultiAxis),
  }
}

/**
 * Renders a Chart component to HTML with configuration
 *
 * @param id - Component ID
 * @param props - Chart component properties
 * @returns Renderer result with HTML and component config
 */
export const renderChart: ComponentRenderer = (id, props): RendererResult => {
  const chartProps = props as ChartProps

  const {
    chartType = 'bar',
    title = 'Chart Title',
    labels: labelsStr = '',
    dataPoints = '65, 59, 80, 81, 56',
    binding = '',
    datasets = [],
    x = 0,
    y = 0,
    width = 400,
    height = 300,
    zIndex = 1,
    visible = true,
  } = chartProps

  // Return empty result if not visible
  if (visible === false) {
    return { html: '', componentConfig: null }
  }

  // Generate position styles
  const positionStyles = generatePositionStyles({ x, y, width, height, zIndex })

  // Container styles
  const containerStyles = 'box-sizing: border-box; background: #fff; border-radius: 8px; padding: 16px'

  // Combine all styles
  const allStyles = combineStyles(positionStyles, containerStyles)

  // Parse labels
  const primaryDataPoints = datasets && datasets.length > 0
    ? (datasets[0].dataPoints || dataPoints)
    : dataPoints
  const parsedData = parseDataPoints(primaryDataPoints)
  const labels = parseLabels(labelsStr, parsedData.values.length)

  // Build placeholder content (shown before Chart.js initializes)
  const placeholderHtml = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #666;">
      <div style="font-size: 14px; font-weight: 500; margin-bottom: 8px;">${escapeHtml(title)}</div>
      <div style="font-size: 12px; color: #999;">Chart will render when data is loaded</div>
    </div>
  `

  // Generate final HTML with canvas element
  const html = `<div id="${escapeHtml(id)}" data-component="chart" style="${allStyles}">
    <canvas id="${escapeHtml(id)}-canvas" style="width: 100%; height: 100%;">${placeholderHtml}</canvas>
  </div>`

  // Build component config for runtime initialization
  // This config will be used by the runtime JavaScript to initialize Chart.js
  const componentConfig = {
    id,
    type: 'chart',
    props: {
      chartType,
      title,
      labels,
      datasets: buildDatasetsConfig(chartProps),
      options: buildOptionsConfig(chartProps),
      enableMultiAxis: chartProps.enableMultiAxis || false,
      // Include raw bindings for runtime data resolution
      bindings: {
        title: hasBinding(title) ? title : undefined,
        datasets: datasets.map((ds) => ({
          binding: ds.binding,
          dataPoints: ds.dataPoints,
        })),
        primaryBinding: binding || undefined,
      },
    },
  }

  return { html, componentConfig }
}

/**
 * Check if a string contains a data binding pattern
 */
function hasBinding(value: string): boolean {
  return !!(value && value.includes('{{') && value.includes('}}'))
}
