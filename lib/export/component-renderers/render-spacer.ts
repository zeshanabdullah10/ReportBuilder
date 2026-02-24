/**
 * Spacer Component Renderer
 *
 * Renders Spacer components to static HTML for template export.
 */

import { ComponentRenderer, RendererResult } from './types'
import { generatePositionStyles, combineStyles } from '../utils/style-helpers'

interface SpacerProps {
  height?: number
  width?: number
  x?: number
  y?: number
  zIndex?: number
  visible?: boolean
}

/**
 * Renders a Spacer component to HTML
 *
 * @param id - Component ID
 * @param props - Spacer component properties
 * @returns Renderer result with HTML
 */
export const renderSpacer: ComponentRenderer = (id, props): RendererResult => {
  const {
    height = 40,
    width = 100,
    x = 0,
    y = 0,
    zIndex = 1,
    visible = true,
  } = props as SpacerProps

  // Return empty result if not visible
  if (visible === false) {
    return { html: '', componentConfig: null }
  }

  // Generate position styles
  const positionStyles = generatePositionStyles({ x, y, width, height, zIndex })

  // Spacer has no visible content, just occupies space
  const spacerStyles = `
    width: 100%;
    height: 100%;
  `.trim()

  // Combine all styles
  const allStyles = combineStyles(positionStyles, spacerStyles)

  // Generate HTML
  const html = `<div id="${escapeHtml(id)}" data-component="spacer" style="${allStyles}"></div>`

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
