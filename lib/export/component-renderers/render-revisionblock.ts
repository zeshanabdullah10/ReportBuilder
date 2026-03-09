/**
 * RevisionBlock Renderer
 *
 * Renders RevisionBlock components as static HTML tables for export.
 * Displays revision history with customizable columns and styling.
 */

import { RendererResult } from './types'
import { generatePositionStyles, normalizeColor } from '../utils/style-helpers'

/**
 * Single revision entry
 */
interface RevisionEntry {
  version: string
  date: string
  author: string
  description: string
}

/**
 * RevisionBlock component properties
 */
interface RevisionBlockProps {
  // Revisions array binding
  revisionsBinding?: string

  // Static revisions (fallback)
  revisions?: RevisionEntry[]

  // Appearance
  title?: string
  showHeader?: boolean
  columns?: ('version' | 'date' | 'author' | 'description')[]
  dateFormat?: string

  // Styling
  headerColor?: string
  borderColor?: string

  // Position
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
  visible?: boolean
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char)
}

/**
 * Render a RevisionBlock component to static HTML
 *
 * @param id - Component unique identifier
 * @param props - RevisionBlock properties
 * @returns RendererResult with HTML and optional componentConfig
 */
export function renderRevisionBlock(
  id: string,
  props: Record<string, unknown>
): RendererResult {
  const {
    revisionsBinding = '',
    revisions = [
      { version: '1.0', date: '2024-01-15', author: 'John Doe', description: 'Initial release' },
      { version: '1.1', date: '2024-02-01', author: 'Jane Smith', description: 'Added new tests' },
    ],
    title = 'Revision History',
    showHeader = true,
    columns = ['version', 'date', 'author', 'description'],
    dateFormat = 'YYYY-MM-DD',
    headerColor = '#3b82f6',
    borderColor = '#e5e7eb',
    x = 0,
    y = 0,
    width = 400,
    height = 120,
    zIndex = 1,
    visible = true,
  } = props as RevisionBlockProps

  // Return empty if not visible
  if (!visible) {
    return { html: '', componentConfig: null }
  }

  // Resolve revisions from binding or use static
  // In export context, we use the static revisions directly
  // Binding resolution happens at a higher level in the export pipeline
  let resolvedRevisions = revisions
  if (revisionsBinding && typeof revisionsBinding === 'string' && revisionsBinding.includes('{{')) {
    // Binding will be resolved by the export pipeline
    // For now, use static revisions
  }

  // Column labels
  const columnLabels: Record<string, string> = {
    version: 'Rev',
    date: 'Date',
    author: 'Author',
    description: 'Description',
  }

  // Column widths
  const columnWidths: Record<string, string> = {
    version: '10%',
    date: '15%',
    author: '20%',
    description: '55%',
  }

  // Normalize colors
  const normalizedHeaderColor = normalizeColor(headerColor)
  const normalizedBorderColor = normalizeColor(borderColor)

  // Generate position styles
  const positionStyles = generatePositionStyles({ x, y, width, height, zIndex })

  // Build HTML
  const htmlParts: string[] = []

  // Container div with position styles
  htmlParts.push(
    `<div id="${id}" class="revision-block" style="${positionStyles}; display: flex; flex-direction: column; background-color: white; border: 1px solid ${normalizedBorderColor}; border-radius: 4px; overflow: hidden; box-sizing: border-box;">`
  )

  // Title row
  if (title) {
    htmlParts.push(
      `<div class="revision-title" style="padding: 4px 8px; font-size: 14px; font-weight: 600; background-color: ${normalizedHeaderColor}; color: white;">${escapeHtml(title)}</div>`
    )
  }

  // Table container
  htmlParts.push(
    `<div class="revision-table-container" style="flex: 1; overflow: auto;">`
  )

  // Table
  htmlParts.push(
    `<table class="revision-table" style="width: 100%; font-size: 12px; border-collapse: collapse;">`
  )

  // Header row
  if (showHeader) {
    htmlParts.push(
      `<thead><tr style="background-color: #f9fafb; border-bottom: 1px solid ${normalizedBorderColor};">`
    )
    for (const col of columns) {
      htmlParts.push(
        `<th style="width: ${columnWidths[col]}; padding: 4px 8px; text-align: left; font-weight: 500; color: #4b5563;">${columnLabels[col]}</th>`
      )
    }
    htmlParts.push(`</tr></thead>`)
  }

  // Body rows
  htmlParts.push(`<tbody>`)

  if (resolvedRevisions && resolvedRevisions.length > 0) {
    for (const rev of resolvedRevisions) {
      htmlParts.push(
        `<tr style="border-bottom: 1px solid ${normalizedBorderColor};">`
      )
      for (const col of columns) {
        const value = rev[col] || '-'
        htmlParts.push(
          `<td style="padding: 4px 8px; color: #374151;">${escapeHtml(value)}</td>`
        )
      }
      htmlParts.push(`</tr>`)
    }
  } else {
    // Empty state
    htmlParts.push(
      `<tr><td colspan="${columns.length}" style="padding: 8px; text-align: center; color: #9ca3af;">No revisions</td></tr>`
    )
  }

  htmlParts.push(`</tbody>`)
  htmlParts.push(`</table>`)
  htmlParts.push(`</div>`) // Close table container
  htmlParts.push(`</div>`) // Close container

  // Return result with componentConfig for potential runtime binding
  return {
    html: htmlParts.join(''),
    componentConfig: {
      type: 'RevisionBlock',
      revisionsBinding,
      dateFormat,
    },
  }
}
