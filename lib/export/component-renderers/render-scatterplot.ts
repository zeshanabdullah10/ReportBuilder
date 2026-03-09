/**
 * ScatterPlot Component Renderer
 *
 * Renders ScatterPlot components to static HTML with chart configuration
 * for runtime Chart.js scatter chart initialization.
 */

import { ComponentRenderer, RendererResult } from './types'
import { generatePositionStyles, combineStyles } from '../utils/style-helpers'

/**
 * ScatterPlot component properties
 */
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
 * Calculate Pearson correlation coefficient from points
 *
 * @param points - Array of {x, y} data points
 * @returns Correlation coefficient (r) between -1 and 1
 */
function calculateCorrelation(points: Array<{ x: number; y: number }>): number {
  if (points.length < 2) return 0

  const n = points.length
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0

  points.forEach(point => {
    sumX += point.x
    sumY += point.y
    sumXY += point.x * point.y
    sumX2 += point.x * point.x
    sumY2 += point.y * point.y
  })

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

  return denominator === 0 ? 0 : numerator / denominator
}

/**
 * Renders a ScatterPlot component to HTML with configuration
 *
 * @param id - Component ID
 * @param props - ScatterPlot component properties
 * @returns Renderer result with HTML and component config
 */
export const renderScatterPlot: ComponentRenderer = (id, props): RendererResult => {
  const scatterProps = props as ScatterPlotProps

  const {
    dataBinding = '',
    points = [],
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
  } = scatterProps

  // Return empty result if not visible
  if (visible === false) {
    return { html: '', componentConfig: null }
  }

  // Generate position styles
  const positionStyles = generatePositionStyles({ x, y, width, height, zIndex })

  // Container styles
  const containerStyles = 'position: relative; box-sizing: border-box; padding: 8px; border-radius: 4px'

  // Combine all styles
  const allStyles = combineStyles(positionStyles, containerStyles)

  // Calculate correlation for display
  const correlation = calculateCorrelation(points)
  const pointCount = points.length

  // Generate final HTML with canvas element
  const html = `<div id="${escapeHtml(id)}" data-component="scatterplot" style="${allStyles}; background-color: ${escapeHtml(backgroundColor)}; border: 1px solid ${escapeHtml(gridColor)}">
    <div class="chart-placeholder" style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #666; pointer-events: none;">
      <div style="font-size: 14px; font-weight: 500; margin-bottom: 8px;">${escapeHtml(title)}</div>
      <div style="font-size: 12px; color: #999;">Scatter plot will render when data is loaded</div>
    </div>
    <canvas id="${escapeHtml(id)}-canvas" style="width: 100%; height: calc(100% - 30px);"></canvas>
    <div style="display: flex; justify-content: space-around; font-size: 12px; margin-top: 8px; padding-top: 8px; border-top: 1px solid ${escapeHtml(gridColor)}; color: #999;">
      <span>Correlation (r): ${correlation.toFixed(4)}</span>
      <span>N: ${pointCount}</span>
    </div>
  </div>`

  // Build component config for runtime initialization
  // This config will be used by the runtime JavaScript to initialize Chart.js scatter chart
  const componentConfig = {
    id,
    type: 'scatter',
    props: {
      chartType: 'scatter',
      title,
      dataBinding,
      points,
      showGridLines,
      pointRadius,
      xAxisLabel,
      yAxisLabel,
      xAxisMin,
      xAxisMax,
      yAxisMin,
      yAxisMax,
      pointColor,
      gridColor,
      backgroundColor,
      datasets: [
        {
          label: 'Data Points',
          data: points,
          backgroundColor: pointColor,
          borderColor: pointColor,
          pointRadius: pointRadius,
          pointHoverRadius: pointRadius + 2,
        },
      ],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: !!title,
            text: title,
            color: '#333',
            font: { size: 14 },
          },
        },
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            title: {
              display: !!xAxisLabel,
              text: xAxisLabel,
              color: '#666',
            },
            min: xAxisMin,
            max: xAxisMax,
            ticks: { color: '#666', font: { size: 10 } },
            grid: { color: gridColor, display: showGridLines },
          },
          y: {
            title: {
              display: !!yAxisLabel,
              text: yAxisLabel,
              color: '#666',
            },
            min: yAxisMin,
            max: yAxisMax,
            ticks: { color: '#666', font: { size: 10 } },
            grid: { color: gridColor, display: showGridLines },
          },
        },
      },
      // Include raw binding for runtime data resolution
      bindings: {
        dataBinding: dataBinding || undefined,
      },
    },
  }

  return { html, componentConfig }
}
