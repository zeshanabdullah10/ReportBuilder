/**
 * Table Component Renderer
 *
 * Renders Table components to static HTML for template export.
 * Supports data binding for dynamic table content.
 */

import { ComponentRenderer, RendererResult } from './types'
import { generatePositionStyles, combineStyles } from '../utils/style-helpers'

interface TableProps {
  columns?: string[]
  rows?: number
  headerColor?: string
  rowColor?: string
  borderColor?: string
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
 * Renders a Table component to HTML
 *
 * @param id - Component ID
 * @param props - Table component properties
 * @returns Renderer result with HTML and optional component config
 */
export const renderTable: ComponentRenderer = (id, props): RendererResult => {
  const {
    columns = ['Column 1', 'Column 2', 'Column 3'],
    rows = 3,
    headerColor = '#1a1a2e',
    rowColor = '#ffffff',
    borderColor = '#e0e0e0',
    binding = '',
    x = 0,
    y = 0,
    width = 400,
    height = 150,
    zIndex = 1,
    visible = true,
  } = props as TableProps

  // Return empty result if not visible
  if (visible === false) {
    return { html: '', componentConfig: null }
  }

  // Generate position styles
  const positionStyles = generatePositionStyles({ x, y, width, height, zIndex })

  // Container styles for overflow handling
  const containerStyles = 'overflow: auto; box-sizing: border-box'

  // Combine all styles
  const allStyles = combineStyles(positionStyles, containerStyles)

  // Generate table header
  const headerCells = columns
    .map((col) => `<th style="border: 1px solid ${escapeHtml(borderColor)}; padding: 8px; text-align: left; color: #fff;">${escapeHtml(col)}</th>`)
    .join('')

  // Generate placeholder rows for export
  const tableRows = Array(rows)
    .fill(null)
    .map(
      (_, i) => `
      <tr style="background: ${i % 2 === 0 ? escapeHtml(rowColor) : '#f5f5f5'};">
        ${columns.map((col) => `<td style="border: 1px solid ${escapeHtml(borderColor)}; padding: 8px; color: #333;">Data ${i + 1}</td>`).join('')}
      </tr>
    `
    )
    .join('')

  // Table HTML structure
  const tableHtml = `
    <table class="w-full" style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <thead>
        <tr style="background: ${escapeHtml(headerColor)};">
          ${headerCells}
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  `

  // Add data-binding attribute if binding exists
  const dataBindingAttr = binding ? `data-binding="${escapeHtml(binding)}"` : ''

  // Generate final HTML
  const html = `<div id="${escapeHtml(id)}" data-component="table" style="${allStyles}" ${dataBindingAttr}>${tableHtml}</div>`

  // Return component config if binding exists
  const componentConfig = binding
    ? {
        id,
        type: 'Table',
        props: {
          columns,
          rows,
          headerColor,
          rowColor,
          borderColor,
          binding,
        },
      }
    : null

  return { html, componentConfig }
}
