/**
 * PassRateChart Component Renderer
 *
 * Renders PassRateChart components to static HTML for export.
 * Uses SVG for donut/pie charts and CSS for bar charts.
 */

import { RendererResult } from './types'
import { generatePositionStyles } from '../utils/style-helpers'

/**
 * Properties for the PassRateChart component
 */
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

/**
 * Escape HTML special characters to prevent XSS
 *
 * @param str - String to escape
 * @returns Escaped string safe for HTML content
 */
function escapeHtml(str: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  return str.replace(/[&<>"']/g, (char) => htmlEntities[char] || char)
}

/**
 * Calculate SVG arc path for donut/pie segments
 *
 * @param x - Center X coordinate
 * @param y - Center Y coordinate
 * @param outerRadius - Outer radius of the arc
 * @param innerRadius - Inner radius (0 for pie, >0 for donut)
 * @param startAngle - Start angle in degrees (0 = top)
 * @param endAngle - End angle in degrees
 * @returns SVG path string
 */
function describeArc(
  x: number,
  y: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  const startOuter = {
    x: x + outerRadius * Math.cos((startAngle - 90) * (Math.PI / 180)),
    y: y + outerRadius * Math.sin((startAngle - 90) * (Math.PI / 180)),
  }
  const endOuter = {
    x: x + outerRadius * Math.cos((endAngle - 90) * (Math.PI / 180)),
    y: y + outerRadius * Math.sin((endAngle - 90) * (Math.PI / 180)),
  }
  const startInner = {
    x: x + innerRadius * Math.cos((endAngle - 90) * (Math.PI / 180)),
    y: y + innerRadius * Math.sin((endAngle - 90) * (Math.PI / 180)),
  }
  const endInner = {
    x: x + innerRadius * Math.cos((startAngle - 90) * (Math.PI / 180)),
    y: y + innerRadius * Math.sin((startAngle - 90) * (Math.PI / 180)),
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

/**
 * Render a PassRateChart component to static HTML
 *
 * @param id - Component's unique identifier
 * @param props - Component properties
 * @returns Renderer result with HTML and component config
 */
export function renderPassRateChart(id: string, props: Record<string, unknown>): RendererResult {
  const {
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
  } = props as PassRateChartProps

  // Return empty if not visible
  if (!visible) {
    return { html: '', componentConfig: null }
  }

  // Resolve counts from bindings (in export context, bindings are pre-resolved)
  const resolvedPassCount =
    typeof passCount === 'number' ? passCount : parseInt(String(passCount)) || 85
  const resolvedFailCount =
    typeof failCount === 'number' ? failCount : parseInt(String(failCount)) || 15

  // Calculate percentages
  const total = resolvedPassCount + resolvedFailCount
  const passPercent = total > 0 ? (resolvedPassCount / total) * 100 : 0
  const failPercent = total > 0 ? (resolvedFailCount / total) * 100 : 0

  // Position styles
  const positionStyles = generatePositionStyles({ x, y, width, height, zIndex })

  // SVG calculations for donut/pie
  const size = Math.min(width || 200, (height || 180) - (showLegend ? 50 : 20))
  const center = size / 2
  const radius = size / 2 - 10
  const innerRadius = chartType === 'donut' ? radius * 0.6 : 0
  const passAngle = (passPercent / 100) * 360

  let chartHtml: string

  if (chartType === 'bar') {
    // Render bar chart
    chartHtml = `
      <div style="width: 100%;">
        <div style="position: relative; height: 32px; background-color: #f3f4f6; border-radius: 4px; overflow: hidden;">
          <div style="position: absolute; left: 0; top: 0; bottom: 0; width: ${passPercent}%; background-color: ${passColor};"></div>
          <div style="position: absolute; top: 0; bottom: 0; left: ${passPercent}%; width: ${failPercent}%; background-color: ${failColor};"></div>
          ${
            showPercentage
              ? `<div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 500;">${passPercent.toFixed(0)}% Pass</div>`
              : ''
          }
        </div>
      </div>
    `
  } else {
    // Render donut/pie chart
    const passArcPath = describeArc(center, center, radius, innerRadius, 0, passAngle)
    const failArcPath = describeArc(center, center, radius, innerRadius, passAngle, 360)
    const fontSize = Math.max(12, size / 8)

    chartHtml = `
      <svg width="${size}" height="${size}" style="display: block; margin: 0 auto;">
        <path d="${passArcPath}" fill="${passColor}" />
        <path d="${failArcPath}" fill="${failColor}" />
        ${
          chartType === 'donut' && showPercentage
            ? `<text x="${center}" y="${center}" text-anchor="middle" dominant-baseline="middle" style="font-size: ${fontSize}px; font-weight: 600;">${passPercent.toFixed(0)}%</text>`
            : ''
        }
      </svg>
    `
  }

  // Build legend HTML
  let legendHtml = ''
  if (showLegend) {
    legendHtml = `
      <div style="display: flex; align-items: center; gap: 16px; margin-top: 8px; font-size: 12px;">
        <div style="display: flex; align-items: center; gap: 4px;">
          <div style="width: 12px; height: 12px; border-radius: 2px; background-color: ${passColor};"></div>
          <span>Pass</span>
          ${showCounts ? `<span style="color: #6b7280;">(${resolvedPassCount})</span>` : ''}
        </div>
        <div style="display: flex; align-items: center; gap: 4px;">
          <div style="width: 12px; height: 12px; border-radius: 2px; background-color: ${failColor};"></div>
          <span>Fail</span>
          ${showCounts ? `<span style="color: #6b7280;">(${resolvedFailCount})</span>` : ''}
        </div>
      </div>
    `
  }

  // Build title HTML
  const titleHtml = title
    ? `<div style="font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px;">${escapeHtml(title)}</div>`
    : ''

  // Combine all parts
  const html = `
    <div id="${id}" style="${positionStyles}; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 8px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 4px; box-sizing: border-box;">
      ${titleHtml}
      ${chartHtml}
      ${legendHtml}
    </div>
  `

  // Return component config with all props
  const componentConfig: PassRateChartProps = {
    passCount: resolvedPassCount,
    passCountBinding,
    failCount: resolvedFailCount,
    failCountBinding,
    chartType,
    passColor,
    failColor,
    showPercentage,
    showLegend,
    showCounts,
    title,
    x,
    y,
    width,
    height,
    zIndex,
    visible,
  }

  return { html, componentConfig }
}
