/**
 * DateTime Component Renderer
 *
 * Renders DateTime components to static HTML for template export.
 * Supports data binding for dynamic date values.
 */

import { ComponentRenderer, RendererResult } from './types'
import { generatePositionStyles, combineStyles, generateFontStyles } from '../utils/style-helpers'

interface DateTimeProps {
  format?: string
  fontSize?: number
  fontFamily?: string
  color?: string
  textAlign?: 'left' | 'center' | 'right'
  binding?: string
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
  visible?: boolean
}

/**
 * Default format patterns
 */
const DEFAULT_FORMATS: Record<string, string> = {
  'date-short': 'MM/dd/yyyy',
  'date-long': 'MMMM dd, yyyy',
  'date-time': 'MM/dd/yyyy HH:mm',
  'time-only': 'HH:mm',
  'iso': 'yyyy-MM-dd',
  'custom': '',
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
 * Format a date according to a format string
 */
function formatDateTime(date: Date, formatStr: string): string {
  const pad = (n: number) => n.toString().padStart(2, '0')

  const replacements: Record<string, string> = {
    'yyyy': date.getFullYear().toString(),
    'MM': pad(date.getMonth() + 1),
    'dd': pad(date.getDate()),
    'HH': pad(date.getHours()),
    'mm': pad(date.getMinutes()),
    'ss': pad(date.getSeconds()),
    'MMMM': date.toLocaleString('default', { month: 'long' }),
    'MMM': date.toLocaleString('default', { month: 'short' }),
    'dddd': date.toLocaleString('default', { weekday: 'long' }),
    'ddd': date.toLocaleString('default', { weekday: 'short' }),
  }

  let result = formatStr
  // Sort by length descending to replace longer patterns first
  const sortedKeys = Object.keys(replacements).sort((a, b) => b.length - a.length)
  for (const key of sortedKeys) {
    result = result.replace(new RegExp(key, 'g'), replacements[key])
  }
  return result
}

/**
 * Renders a DateTime component to HTML
 *
 * @param id - Component ID
 * @param props - DateTime component properties
 * @returns Renderer result with HTML and optional component config
 */
export const renderDateTime: ComponentRenderer = (id, props): RendererResult => {
  const {
    format = 'date-long',
    fontSize = 12,
    fontFamily = 'inherit',
    color = '#666666',
    textAlign = 'center',
    binding = '',
    x = 0,
    y = 0,
    width = 150,
    height = 30,
    zIndex = 1,
    visible = true,
  } = props as DateTimeProps

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
    textAlign,
  })

  // Container styles
  const containerStyles = `
    display: flex;
    align-items: center;
    justify-content: ${textAlign};
    box-sizing: border-box;
    padding: 0 8px;
  `.trim().replace(/\s+/g, ' ')

  // Combine all styles
  const allStyles = combineStyles(positionStyles, fontStyles, containerStyles)

  // Get the format string (use format directly if not in DEFAULT_FORMATS)
  const formatStr = DEFAULT_FORMATS[format] || format

  // Format current date as placeholder
  const now = new Date()
  const displayText = formatDateTime(now, formatStr)

  // Add data-binding attribute if binding exists
  const dataBindingAttr = binding ? `data-binding="${escapeHtml(binding)}"` : ''

  // Generate final HTML
  const html = `<div id="${escapeHtml(id)}" data-component="datetime" data-format="${escapeHtml(format)}" style="${allStyles}" ${dataBindingAttr}>${escapeHtml(displayText)}</div>`

  // Return component config if binding exists
  const componentConfig = binding
    ? {
        id,
        type: 'DateTime',
        props: {
          format,
          fontSize,
          fontFamily,
          color,
          textAlign,
          binding,
        },
      }
    : null

  return { html, componentConfig }
}
