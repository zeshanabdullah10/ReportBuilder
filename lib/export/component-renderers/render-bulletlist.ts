/**
 * BulletList Component Renderer
 *
 * Renders BulletList components to static HTML for template export.
 * Supports data binding for dynamic list content.
 */

import { ComponentRenderer, RendererResult } from './types'
import { generatePositionStyles, combineStyles, generateFontStyles } from '../utils/style-helpers'

interface BulletListProps {
  items?: string
  listStyle?: 'disc' | 'circle' | 'square' | 'decimal' | 'lower-roman' | 'upper-alpha'
  fontSize?: number
  fontFamily?: string
  color?: string
  lineHeight?: number
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
 * Renders a BulletList component to HTML
 *
 * @param id - Component ID
 * @param props - BulletList component properties
 * @returns Renderer result with HTML and optional component config
 */
export const renderBulletList: ComponentRenderer = (id, props): RendererResult => {
  const {
    items = 'Item 1\nItem 2\nItem 3',
    listStyle = 'disc',
    fontSize = 14,
    fontFamily = 'inherit',
    color = '#333333',
    lineHeight = 1.6,
    binding = '',
    x = 0,
    y = 0,
    width = 200,
    height = 100,
    zIndex = 1,
    visible = true,
  } = props as BulletListProps

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
    lineHeight,
  })

  // Container styles
  const containerStyles = 'overflow: auto; box-sizing: border-box; padding: 8px 12px'

  // Combine all styles
  const allStyles = combineStyles(positionStyles, fontStyles, containerStyles)

  // Parse items from newline-separated string
  const listItems = items.split('\n').filter((item) => item.trim())

  // Determine if ordered or unordered list
  const isOrdered = ['decimal', 'lower-roman', 'upper-alpha'].includes(listStyle)
  const listTag = isOrdered ? 'ol' : 'ul'

  // Generate list items HTML
  const listItemsHtml = listItems
    .map((item) => `<li style="margin-bottom: 4px;">${escapeHtml(item)}</li>`)
    .join('')

  // List styles
  const listStyles = `list-style-type: ${listStyle}; margin: 0; padding-left: 1.5em;`

  // Generate list HTML
  const listHtml = `<${listTag} style="${listStyles}">${listItemsHtml}</${listTag}>`

  // Add data-binding attribute if binding exists
  const dataBindingAttr = binding ? `data-binding="${escapeHtml(binding)}"` : ''

  // Generate final HTML
  const html = `<div id="${escapeHtml(id)}" data-component="bulletlist" style="${allStyles}" ${dataBindingAttr}>${listHtml}</div>`

  // Return component config if binding exists
  const componentConfig = binding
    ? {
        id,
        type: 'BulletList',
        props: {
          items,
          listStyle,
          fontSize,
          fontFamily,
          color,
          lineHeight,
          binding,
        },
      }
    : null

  return { html, componentConfig }
}
