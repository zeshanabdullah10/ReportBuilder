/**
 * Container Component Renderer
 *
 * Renders Container components to static HTML for template export.
 * Note: Children are rendered separately by the compiler and inserted.
 */

import { ComponentRenderer, RendererResult } from './types'
import { generatePositionStyles, combineStyles } from '../utils/style-helpers'

interface ContainerProps {
  background?: string
  padding?: number
  borderRadius?: number
  borderWidth?: number
  borderColor?: string
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
  visible?: boolean
}

/**
 * Renders a Container component to HTML
 *
 * @param id - Component ID
 * @param props - Container component properties
 * @returns Renderer result with HTML
 */
export const renderContainer: ComponentRenderer = (id, props): RendererResult => {
  const {
    background = '#f5f5f5',
    padding = 16,
    borderRadius = 8,
    borderWidth = 1,
    borderColor = '#e0e0e0',
    x = 0,
    y = 0,
    width = 300,
    height = 200,
    zIndex = 1,
    visible = true,
  } = props as ContainerProps

  // Return empty result if not visible
  if (visible === false) {
    return { html: '', componentConfig: null }
  }

  // Generate position styles
  const positionStyles = generatePositionStyles({ x, y, width, height, zIndex })

  // Container-specific styles
  const containerStyles = `
    background: ${background};
    padding: ${padding}px;
    border-radius: ${borderRadius}px;
    border: ${borderWidth}px solid ${borderColor};
    box-sizing: border-box;
    min-height: 60px;
  `.trim()

  // Combine all styles
  const allStyles = combineStyles(positionStyles, containerStyles)

  // Generate HTML
  // Children will be rendered separately by the compiler and inserted inside
  const html = `<div id="${escapeHtml(id)}" data-component="container" style="${allStyles}"></div>`

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
