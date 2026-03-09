/**
 * Histogram Component Renderer
 *
 * Renders Histogram components to static HTML with chart configuration
 * for runtime Chart.js initialization as a bar chart.
 */

import { ComponentRenderer, RendererResult } from './types'
import { generatePositionStyles, combineStyles, hexToRgba } from '../utils/style-helpers'

/**
 * Histogram component properties
 */
interface HistogramProps {
  // Data binding
  dataBinding?: string
  values?: number[]
  bins?: number
  // Statistics display
  showStatistics?: boolean
  // Color options
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
 * Calculate histogram statistics from values
 */
function calculateStatistics(values: number[]): { mean: number; stdDev: number; count: number } {
  if (!values || values.length === 0) {
    return { mean: 0, stdDev: 0, count: 0 }
  }

  const count = values.length
  const mean = values.reduce((sum, v) => sum + v, 0) / count
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2))
  const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / count
  const stdDev = Math.sqrt(variance)

  return { mean, stdDev, count }
}

/**
 * Generate histogram bins from values
 */
function generateBins(values: number[], binCount: number): { labels: string[]; counts: number[] } {
  if (!values || values.length === 0) {
    return { labels: [], counts: [] }
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const binWidth = (max - min) / binCount || 1

  const counts: number[] = new Array(binCount).fill(0)
  const labels: string[] = []

  // Generate bin labels
  for (let i = 0; i < binCount; i++) {
    const binStart = min + i * binWidth
    const binEnd = min + (i + 1) * binWidth
    labels.push(`${binStart.toFixed(1)}-${binEnd.toFixed(1)}`)
  }

  // Count values in each bin
  for (const value of values) {
    let binIndex = Math.floor((value - min) / binWidth)
    // Handle edge case where value equals max
    if (binIndex >= binCount) {
      binIndex = binCount - 1
    }
    counts[binIndex]++
  }

  return { labels, counts }
}

/**
 * Renders a Histogram component to HTML with configuration
 *
 * @param id - Component ID
 * @param props - Histogram component properties
 * @returns Renderer result with HTML and component config
 */
export const renderHistogram: ComponentRenderer = (id, props): RendererResult => {
  const histogramProps = props as HistogramProps

  const {
    dataBinding = '',
    values = [12, 15, 18, 22, 25, 28, 30, 32, 35, 38, 40, 42, 45, 48, 50, 52, 55, 58, 60, 62],
    bins = 5,
    showStatistics = true,
    barColor = '#00ffc8',
    borderColor = '#00ffc8',
    backgroundColor = 'rgba(0, 255, 200, 0.5)',
    title = 'Histogram',
    xAxisLabel = 'Value',
    yAxisLabel = 'Frequency',
    x = 0,
    y = 0,
    width = 400,
    height = 300,
    zIndex = 1,
    visible = true,
  } = histogramProps

  // Return empty result if not visible
  if (visible === false) {
    return { html: '', componentConfig: null }
  }

  // Generate position styles
  const positionStyles = generatePositionStyles({ x, y, width, height, zIndex })

  // Container styles - position: relative needed for placeholder positioning
  const containerStyles = 'position: relative; box-sizing: border-box; background: #fff; border-radius: 8px; padding: 16px'

  // Combine all styles
  const allStyles = combineStyles(positionStyles, containerStyles)

  // Calculate statistics for display
  const stats = calculateStatistics(values)

  // Generate bins for placeholder display
  const { labels, counts } = generateBins(values, bins)

  // Build statistics HTML if enabled
  const statsHtml = showStatistics
    ? `<div class="histogram-stats" style="display: flex; justify-content: space-around; margin-top: 8px; font-size: 11px; color: #666;">
        <span>Mean: ${stats.mean.toFixed(2)}</span>
        <span>Std Dev: ${stats.stdDev.toFixed(2)}</span>
        <span>Count: ${stats.count}</span>
      </div>`
    : ''

  // Generate final HTML with canvas element
  const html = `<div id="${escapeHtml(id)}" data-component="histogram" style="${allStyles}">
    <div class="chart-placeholder" style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #666; pointer-events: none;">
      <div style="font-size: 14px; font-weight: 500; margin-bottom: 8px;">${escapeHtml(title)}</div>
      <div style="font-size: 12px; color: #999;">Histogram will render when data is loaded</div>
    </div>
    <canvas id="${escapeHtml(id)}-canvas" style="width: 100%; height: 100%;"></canvas>
    ${statsHtml}
  </div>`

  // Build component config for runtime initialization
  // This config will be used by the runtime JavaScript to initialize Chart.js
  const componentConfig = {
    id,
    type: 'histogram',
    props: {
      chartType: 'bar',
      title,
      labels,
      datasets: [
        {
          label: 'Frequency',
          // Include binding for runtime resolution
          dataBinding: dataBinding || undefined,
          // Static data for placeholder
          data: counts,
          backgroundColor: backgroundColor || hexToRgba(barColor, 0.5),
          borderColor: borderColor || barColor,
          borderWidth: 1,
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
            display: true,
            text: title,
            color: '#333',
            font: { size: 16 },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: xAxisLabel,
              color: '#666',
            },
            ticks: { color: '#666' },
            grid: { color: 'rgba(0,0,0,0.1)' },
          },
          y: {
            title: {
              display: true,
              text: yAxisLabel,
              color: '#666',
            },
            beginAtZero: true,
            ticks: { color: '#666' },
            grid: { color: 'rgba(0,0,0,0.1)' },
          },
        },
      },
      // Histogram-specific configuration
      histogram: {
        bins,
        showStatistics,
        values,
        dataBinding: dataBinding || undefined,
      },
      // Include statistics for runtime display
      statistics: stats,
    },
  }

  return { html, componentConfig }
}
