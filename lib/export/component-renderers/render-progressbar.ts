/**
 * ProgressBar Component Renderer
 *
 * Renders ProgressBar components to static HTML for template export.
 * Supports data binding for dynamic values.
 */

import { ComponentRenderer, RendererResult } from './types'
import { generatePositionStyles, combineStyles } from '../utils/style-helpers'

interface ProgressBarProps {
  value?: number
  min?: number
  max?: number
  label?: string
  showValue?: boolean
  fillColor?: string
  backgroundColor?: string
  textColor?: string
  borderRadius?: number
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
 * Renders a ProgressBar component to HTML
 *
 * @param id - Component ID
 * @param props - ProgressBar component properties
 * @returns Renderer result with HTML and optional component config
 */
export const renderProgressBar: ComponentRenderer = (id, props): RendererResult => {
  const {
    value = 50,
    min = 0,
    max = 100,
    label = '',
    showValue = true,
    fillColor = '#0066cc',
    backgroundColor = 'rgba(0, 0, 0, 0.1)',
    textColor = '#333333',
    borderRadius = 4,
    binding = '',
    x = 0,
    y = 0,
    width = 200,
    height = 40,
    zIndex = 1,
    visible = true,
  } = props as ProgressBarProps

  // Return empty result if not visible
  if (visible === false) {
    return { html: '', componentConfig: null }
  }

  // Generate position styles
  const positionStyles = generatePositionStyles({ x, y, width, height, zIndex })

  // Calculate percentage
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))

  // Container styles
  const containerStyles = `
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 4px 8px;
    box-sizing: border-box;
  `.trim().replace(/\s+/g, ' ')

  // Combine all styles
  const allStyles = combineStyles(positionStyles, containerStyles)

  // Label and value row
  const labelRowHtml = (label || showValue)
    ? `
      <div style="
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
        font-size: 12px;
        color: ${escapeHtml(textColor)};
      ">
        <span>${escapeHtml(label)}</span>
        ${showValue ? `<span>${value.toFixed(0)}%</span>` : ''}
      </div>
    `
    : ''

  // Progress bar container
  const barContainerStyles = `
    width: 100%;
    overflow: hidden;
    flex: 1;
    background: ${escapeHtml(backgroundColor)};
    border-radius: ${borderRadius}px;
    min-height: 6px;
  `.trim().replace(/\s+/g, ' ')

  // Progress bar fill
  const barFillStyles = `
    width: ${percentage}%;
    height: 100%;
    background: ${escapeHtml(fillColor)};
    border-radius: ${borderRadius}px;
    box-sizing: border-box;
  `.trim().replace(/\s+/g, ' ')

  // Progress bar HTML
  const progressBarHtml = `
    <div style="${barContainerStyles}">
      <div style="${barFillStyles}"></div>
    </div>
  `

  // Add data-binding attribute if binding exists
  const dataBindingAttr = binding ? `data-binding="${escapeHtml(binding)}"` : ''

  // Generate final HTML
  const html = `<div id="${escapeHtml(id)}" data-component="progressbar" data-value="${value}" style="${allStyles}" ${dataBindingAttr}>${labelRowHtml}${progressBarHtml}</div>`

  // Return component config if binding exists
  const componentConfig = binding
    ? {
        id,
        type: 'ProgressBar',
        props: {
          value,
          min,
          max,
          label,
          showValue,
          fillColor,
          backgroundColor,
          textColor,
          borderRadius,
          binding,
        },
      }
    : null

  return { html, componentConfig }
}
