/**
 * Text Component Renderer
 *
 * Renders Text components to static HTML for template export.
 */

import { ComponentRenderer, RendererResult } from './types'
import { generatePositionStyles, combineStyles, generateFontStyles } from '../utils/style-helpers'

interface TextProps {
  text?: string
  fontSize?: number
  fontWeight?: string
  fontFamily?: string
  color?: string
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  binding?: string
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
  visible?: boolean
}

/**
 * Renders a Text component to HTML
 *
 * @param id - Component ID
 * @param props - Text component properties
 * @returns Renderer result with HTML
 */
export const renderText: ComponentRenderer = (id, props): RendererResult => {
  const {
    text = 'Edit this text',
    fontSize = 16,
    fontWeight = 'normal',
    fontFamily = 'inherit',
    color = '#000000',
    textAlign = 'left',
    binding = '',
    x = 0,
    y = 0,
    width = 200,
    height = 50,
    zIndex = 1,
    visible = true,
  } = props as TextProps

  // Return empty result if not visible
  if (visible === false) {
    return { html: '', componentConfig: null }
  }

  // Generate position styles
  const positionStyles = generatePositionStyles({ x, y, width, height, zIndex })

  // Generate font styles
  const fontStyles = generateFontStyles({
    fontSize,
    fontWeight,
    fontFamily,
    color,
    textAlign,
  })

  // Additional container styles
  const containerStyles = 'margin: 0; padding: 4px 8px; box-sizing: border-box'

  // Combine all styles
  const allStyles = combineStyles(positionStyles, fontStyles, containerStyles)

  // Determine content and if we need data-binding attribute
  let content: string
  let dataBindingAttr = ''

  if (binding && binding.trim() !== '') {
    // If there's a binding, wrap text in span with data-binding attribute
    // The text becomes the fallback/default value
    content = `<span data-binding="${escapeHtml(binding)}">${escapeHtml(text)}</span>`
    dataBindingAttr = `data-binding="${escapeHtml(binding)}"`
  } else {
    // Check for inline bindings in the text ({{data.path}} patterns)
    const hasInlineBindings = /\{\{[^}]+\}\}/.test(text)
    if (hasInlineBindings) {
      // Keep the text as-is with binding markers - will be processed at runtime
      content = escapeHtml(text)
      dataBindingAttr = `data-has-bindings="true"`
    } else {
      content = escapeHtml(text)
    }
  }

  // Generate HTML
  const html = `<div id="${escapeHtml(id)}" data-component="text" style="${allStyles}" ${dataBindingAttr}>${content}</div>`

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
