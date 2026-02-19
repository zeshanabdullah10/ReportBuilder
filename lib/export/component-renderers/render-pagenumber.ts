/**
 * PageNumber Component Renderer
 *
 * Renders PageNumber components to static HTML for template export.
 * Uses CSS counters for page numbering in printed output.
 */

import { ComponentRenderer, RendererResult } from './types'
import { generatePositionStyles, combineStyles, generateFontStyles } from '../utils/style-helpers'

interface PageNumberProps {
  format?: 'page' | 'page-of' | 'slash'
  fontSize?: number
  fontFamily?: string
  color?: string
  prefix?: string
  suffix?: string
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
 * Renders a PageNumber component to HTML
 *
 * @param id - Component ID
 * @param props - PageNumber component properties
 * @returns Renderer result with HTML
 */
export const renderPageNumber: ComponentRenderer = (id, props): RendererResult => {
  const {
    format = 'page-of',
    fontSize = 12,
    fontFamily = 'inherit',
    color = '#666666',
    prefix = '',
    suffix = '',
    x = 0,
    y = 0,
    width = 100,
    height = 30,
    zIndex = 1,
    visible = true,
  } = props as PageNumberProps

  // Return empty result if not visible
  if (visible === false) {
    return { html: '', componentConfig: null }
  }

  // Generate position styles
  const positionStyles = generatePositionStyles({ x, y, width, height, zIndex })

  // Generate font styles
  const fontStyles = generateFontStyles({
    fontSize,
    fontFamily,
    color,
    textAlign: 'center',
  })

  // Container styles
  const containerStyles = `
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  `.trim().replace(/\s+/g, ' ')

  // Combine all styles
  const allStyles = combineStyles(positionStyles, fontStyles, containerStyles)

  // Generate page number content based on format
  // Using CSS page counters for print media
  let content: string

  switch (format) {
    case 'page':
      // Just page number: "1"
      content = `${prefix}<span class="page-number"></span>${suffix}`
      break
    case 'page-of':
      // Page of total: "1 of 5"
      content = `${prefix}<span class="page-number"></span> of <span class="page-count"></span>${suffix}`
      break
    case 'slash':
      // Slash format: "1/5"
      content = `${prefix}<span class="page-number"></span>/<span class="page-count"></span>${suffix}`
      break
    default:
      content = `${prefix}<span class="page-number"></span> of <span class="page-count"></span>${suffix}`
  }

  // Generate final HTML with page number class for CSS targeting
  const html = `<div id="${escapeHtml(id)}" data-component="pagenumber" data-format="${escapeHtml(format)}" class="page-number-container" style="${allStyles}">${content}</div>`

  // PageNumber components don't need runtime config - handled by CSS counters
  return { html, componentConfig: null }
}
