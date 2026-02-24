/**
 * Divider Component Renderer
 *
 * Renders Divider components to static HTML for template export.
 */

import { ComponentRenderer, RendererResult } from './types'
import { generatePositionStyles, combineStyles } from '../utils/style-helpers'

interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  style?: 'solid' | 'dashed' | 'dotted' | 'double'
  color?: string
  thickness?: number
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
  visible?: boolean
}

/**
 * Renders a Divider component to HTML
 *
 * @param id - Component ID
 * @param props - Divider component properties
 * @returns Renderer result with HTML
 */
export const renderDivider: ComponentRenderer = (id, props): RendererResult => {
  const {
    orientation = 'horizontal',
    style = 'solid',
    color = 'rgba(0, 0, 0, 0.3)',
    thickness = 1,
    x = 0,
    y = 0,
    width = 200,
    height = 20,
    zIndex = 1,
    visible = true,
  } = props as DividerProps

  // Return empty result if not visible
  if (visible === false) {
    return { html: '', componentConfig: null }
  }

  const isHorizontal = orientation === 'horizontal'

  // Generate position styles
  const positionStyles = generatePositionStyles({ x, y, width, height, zIndex })

  // Container styles for centering the line
  const containerStyles = `
    display: flex;
    align-items: center;
    justify-content: ${isHorizontal ? 'stretch' : 'center'};
    width: 100%;
    height: 100%;
  `.trim()

  // Line styles based on orientation
  let lineStyles: string
  if (isHorizontal) {
    lineStyles = `
      width: 100%;
      height: ${thickness}px;
      border-top: ${thickness}px ${style} ${color};
    `.trim()
  } else {
    lineStyles = `
      width: ${thickness}px;
      height: 100%;
      border-left: ${thickness}px ${style} ${color};
    `.trim()
  }

  // Combine all styles
  const allStyles = combineStyles(positionStyles, containerStyles)

  // Generate HTML
  const html = `<div id="${escapeHtml(id)}" data-component="divider" style="${allStyles}"><div style="${lineStyles}"></div></div>`

  return { html, componentConfig: null }
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
