/**
 * PageBreak Component Renderer
 *
 * Renders PageBreak components to static HTML for template export.
 * Page breaks create a page break before the element when printing.
 */

import { ComponentRenderer, RendererResult } from './types'
import { generatePositionStyles, combineStyles } from '../utils/style-helpers'

interface PageBreakProps {
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
  visible?: boolean
}

/**
 * Renders a PageBreak component to HTML
 *
 * @param id - Component ID
 * @param props - PageBreak component properties
 * @returns Renderer result with HTML
 */
export const renderPagebreak: ComponentRenderer = (id, props): RendererResult => {
  const {
    x = 0,
    y = 0,
    width = 400,
    height = 40,
    zIndex = 1,
    visible = true,
  } = props as PageBreakProps

  // Return empty result if not visible
  if (visible === false) {
    return { html: '', componentConfig: null }
  }

  // Generate position styles
  const positionStyles = generatePositionStyles({ x, y, width, height, zIndex })

  // Page break specific styles - the key is page-break-before: always
  const pageBreakStyles = `
    page-break-before: always;
  `.trim()

  // Combine all styles
  const allStyles = combineStyles(positionStyles, pageBreakStyles)

  // Generate HTML
  // Uses the 'page-break' class which is also defined in print styles
  const html = `<div id="${escapeHtml(id)}" data-component="pagebreak" class="page-break" style="${allStyles}"></div>`

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
