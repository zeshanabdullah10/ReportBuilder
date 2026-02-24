/**
 * Gauge Component Renderer
 *
 * Renders Gauge components to static HTML with SVG for template export.
 * Supports data binding for dynamic values.
 */

import { ComponentRenderer, RendererResult } from './types'
import { generatePositionStyles, combineStyles } from '../utils/style-helpers'

interface GaugeProps {
  value?: number
  min?: number
  max?: number
  label?: string
  unit?: string
  primaryColor?: string
  backgroundColor?: string
  textColor?: string
  binding?: string
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
 * Renders a Gauge component to HTML with SVG
 *
 * @param id - Component ID
 * @param props - Gauge component properties
 * @returns Renderer result with HTML and optional component config
 */
export const renderGauge: ComponentRenderer = (id, props): RendererResult => {
  const {
    value = 50,
    min = 0,
    max = 100,
    label = '',
    unit = '%',
    primaryColor = '#0066cc',
    backgroundColor = 'rgba(0, 0, 0, 0.1)',
    textColor = '#333333',
    binding = '',
    x = 0,
    y = 0,
    width = 150,
    height = 150,
    zIndex = 1,
    visible = true,
  } = props as GaugeProps

  // Return empty result if not visible
  if (visible === false) {
    return { html: '', componentConfig: null }
  }

  // Generate position styles
  const positionStyles = generatePositionStyles({ x, y, width, height, zIndex })

  // Calculate percentage
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))

  // SVG gauge parameters
  const strokeWidth = 12
  const svgSize = Math.min(width, height) - 20
  const radius = (svgSize / 2) - strokeWidth
  const circumference = 2 * Math.PI * radius
  const arcLength = circumference * 0.75 // 270 degree arc
  const offset = arcLength - (arcLength * percentage / 100)
  const rotation = -225 // Start from bottom-left
  const centerX = svgSize / 2
  const centerY = svgSize / 2

  // Container styles
  const containerStyles = `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 8px;
  `.trim().replace(/\s+/g, ' ')

  // Combine all styles
  const allStyles = combineStyles(positionStyles, containerStyles)

  // Generate SVG arc for gauge
  const svgHtml = `
    <svg
      width="${svgSize}"
      height="${svgSize}"
      viewBox="0 0 ${svgSize} ${svgSize}"
      style="transform: rotate(${rotation}deg);"
    >
      <!-- Background arc -->
      <circle
        cx="${centerX}"
        cy="${centerY}"
        r="${radius}"
        fill="none"
        stroke="${escapeHtml(backgroundColor)}"
        stroke-width="${strokeWidth}"
        stroke-dasharray="${arcLength} ${circumference}"
        stroke-linecap="round"
      />
      <!-- Value arc -->
      <circle
        cx="${centerX}"
        cy="${centerY}"
        r="${radius}"
        fill="none"
        stroke="${escapeHtml(primaryColor)}"
        stroke-width="${strokeWidth}"
        stroke-dasharray="${arcLength - offset} ${circumference}"
        stroke-linecap="round"
      />
    </svg>
  `

  // Center value display
  const centerDisplaySize = svgSize * 0.18
  const labelSize = svgSize * 0.08

  const centerHtml = `
    <div style="
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      color: ${escapeHtml(textColor)};
    ">
      <span style="font-size: ${centerDisplaySize}px; font-weight: bold;">
        ${value.toFixed(0)}${escapeHtml(unit)}
      </span>
      ${label ? `<span style="font-size: ${labelSize}px; opacity: 0.7;">${escapeHtml(label)}</span>` : ''}
    </div>
  `

  // Wrap in relative container for center display positioning
  const innerContainerStyles = `
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  `.trim().replace(/\s+/g, ' ')

  // Add data-binding attribute if binding exists
  const dataBindingAttr = binding ? `data-binding="${escapeHtml(binding)}"` : ''

  // Generate final HTML
  const html = `<div id="${escapeHtml(id)}" data-component="gauge" data-value="${value}" style="${allStyles}" ${dataBindingAttr}><div style="${innerContainerStyles}">${svgHtml}${centerHtml}</div></div>`

  // Return component config if binding exists
  const componentConfig = binding
    ? {
        id,
        type: 'Gauge',
        props: {
          value,
          min,
          max,
          label,
          unit,
          primaryColor,
          backgroundColor,
          textColor,
          binding,
        },
      }
    : null

  return { html, componentConfig }
}
