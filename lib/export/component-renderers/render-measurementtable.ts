/**
 * MeasurementTable Component Renderer
 *
 * Renders MeasurementTable components to static HTML tables for export.
 * Supports specialized measurement data display with column types for
 * text, numbers, units, tolerances, status indicators, and deviation calculations.
 */

import { RendererResult } from './types'
import { generatePositionStyles } from '../utils/style-helpers'

/**
 * Column type for measurement table
 */
type MeasurementColumnType = 'text' | 'number' | 'unit' | 'tolerance' | 'status' | 'deviation'

/**
 * Column configuration interface
 */
interface MeasurementColumn {
  key: string
  header: string
  type: MeasurementColumnType
  unit?: string
  width?: number
  format?: string
}

/**
 * MeasurementTable props interface
 */
interface MeasurementTableProps {
  // Data binding
  dataBinding?: string
  data?: Record<string, unknown>[]

  // Column configuration
  columns?: MeasurementColumn[]

  // Display options
  showHeader?: boolean
  showRowNumbers?: boolean
  stripeRows?: boolean

  // Styling
  headerBackgroundColor?: string
  passColor?: string
  failColor?: string
  borderColor?: string
  fontSize?: number

  // Position
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
  visible?: boolean
}

/**
 * Escape HTML special characters to prevent XSS
 *
 * @param text - Text to escape
 * @returns Escaped text safe for HTML output
 */
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char)
}

/**
 * Format a number based on format string like '0.00'
 *
 * @param value - Value to format
 * @param format - Format string (e.g., '0.00', '0.000')
 * @returns Formatted number string
 */
function formatNumber(value: unknown, format?: string): string {
  if (typeof value !== 'number' || isNaN(value)) {
    return String(value ?? '')
  }
  if (!format) {
    return value.toString()
  }

  // Extract decimal places from format like '0.00'
  const match = format.match(/0\.(0+)/)
  const decimals = match ? match[1].length : 0
  return value.toFixed(decimals)
}

/**
 * Render cell content based on column type
 *
 * @param row - Row data
 * @param column - Column configuration
 * @param passColor - Color for pass status
 * @param failColor - Color for fail status
 * @returns HTML string for cell content
 */
function renderCell(
  row: Record<string, unknown>,
  column: MeasurementColumn,
  passColor: string,
  failColor: string
): string {
  const value = row[column.key]

  switch (column.type) {
    case 'text':
      return `<span>${escapeHtml(String(value ?? ''))}</span>`

    case 'number':
      return `<span>${escapeHtml(formatNumber(value, column.format))}</span>`

    case 'unit':
      return `<span>${escapeHtml(column.unit || String(value ?? ''))}</span>`

    case 'tolerance': {
      const min = row.min
      const max = row.max
      if (typeof min === 'number' && typeof max === 'number') {
        const nominal = row.nominal
        if (typeof nominal === 'number') {
          const tolerance = Math.max(Math.abs(min - nominal), Math.abs(max - nominal))
          return `<span>±${escapeHtml(formatNumber(tolerance, '0.00'))}</span>`
        }
        return `<span>${escapeHtml(formatNumber(min, '0.00'))} - ${escapeHtml(formatNumber(max, '0.00'))}</span>`
      }
      return '<span>-</span>'
    }

    case 'status': {
      const status = String(value ?? '').toUpperCase()
      const isPass = status === 'PASS'
      const bgColor = isPass ? passColor : failColor
      const symbol = isPass ? '&#10003;' : '&#10007;'
      return `<span style="display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%; color: white; font-size: 11px; font-weight: bold; background-color: ${bgColor};">${symbol}</span>`
    }

    case 'deviation': {
      const measured = row.measured
      const nominalVal = row.nominal
      if (typeof measured === 'number' && typeof nominalVal === 'number') {
        const deviation = ((measured - nominalVal) / nominalVal) * 100
        const isPositive = deviation >= 0
        const color = Math.abs(deviation) > 5 ? failColor : passColor
        const sign = isPositive ? '+' : ''
        return `<span style="color: ${color};">${sign}${deviation.toFixed(2)}%</span>`
      }
      return '<span>-</span>'
    }

    default:
      return `<span>${escapeHtml(String(value ?? ''))}</span>`
  }
}

/**
 * Default columns for measurement table
 */
const defaultColumns: MeasurementColumn[] = [
  { key: 'parameter', header: 'Parameter', type: 'text', width: 150 },
  { key: 'nominal', header: 'Nominal', type: 'number', format: '0.00', width: 80 },
  { key: 'measured', header: 'Measured', type: 'number', format: '0.00', width: 80 },
  { key: 'unit', header: 'Unit', type: 'unit', width: 50 },
  { key: 'tolerance', header: 'Tolerance', type: 'tolerance', width: 100 },
  { key: 'status', header: 'Status', type: 'status', width: 60 },
]

/**
 * Sample data for preview
 */
const sampleMeasurements: Record<string, unknown>[] = [
  { parameter: 'Voltage Output', nominal: 5.0, measured: 5.02, unit: 'V', min: 4.9, max: 5.1, status: 'PASS' },
  { parameter: 'Current Draw', nominal: 0.5, measured: 0.52, unit: 'A', min: 0.45, max: 0.55, status: 'PASS' },
  { parameter: 'Temperature', nominal: 25.0, measured: 26.5, unit: '°C', min: 23.0, max: 27.0, status: 'PASS' },
  { parameter: 'Frequency', nominal: 60.0, measured: 61.2, unit: 'Hz', min: 59.0, max: 61.0, status: 'FAIL' },
]

/**
 * Render a MeasurementTable component to static HTML
 *
 * @param id - Component's unique identifier
 * @param props - Component properties
 * @returns Renderer result with HTML and optional component config
 */
export function renderMeasurementTable(
  id: string,
  props: Record<string, unknown>
): RendererResult {
  const {
    data,
    columns = defaultColumns,
    showHeader = true,
    showRowNumbers = false,
    stripeRows = true,
    headerBackgroundColor = '#1a1a2e',
    passColor = '#22c55e',
    failColor = '#ef4444',
    borderColor = '#333',
    fontSize = 12,
    x,
    y,
    width,
    height,
    zIndex,
    visible = true,
  } = props as MeasurementTableProps

  // Return empty if not visible
  if (!visible) {
    return { html: '', componentConfig: null }
  }

  // Use provided data or sample data
  const tableData = Array.isArray(data) && data.length > 0 ? data : sampleMeasurements
  const typedColumns = (columns as MeasurementColumn[]) || defaultColumns

  // Generate position styles
  const positionStyles = generatePositionStyles({ x, y, width, height, zIndex })

  // Build table HTML
  let tableHtml = `<div id="${id}" style="${positionStyles}; background-color: #fff; border: 1px solid ${borderColor}; border-radius: 4px; overflow: auto; box-sizing: border-box;">`

  // Table element
  tableHtml += `<table style="width: 100%; border-collapse: collapse; font-size: ${fontSize}px;">`

  // Header row
  if (showHeader) {
    tableHtml += '<thead>'
    tableHtml += `<tr style="background-color: ${headerBackgroundColor};">`

    // Row number column
    if (showRowNumbers) {
      tableHtml += `<th style="padding: 8px; text-align: left; color: white; font-weight: 600; border-right: 1px solid ${borderColor}; width: 40px;">#</th>`
    }

    // Data columns
    typedColumns.forEach((column, index) => {
      const borderStyle = index < typedColumns.length - 1 ? `border-right: 1px solid ${borderColor};` : ''
      const widthStyle = column.width ? `width: ${column.width}px; min-width: ${column.width}px;` : ''
      tableHtml += `<th style="padding: 8px; text-align: left; color: white; font-weight: 600; ${borderStyle} ${widthStyle}">${escapeHtml(column.header)}</th>`
    })

    tableHtml += '</tr></thead>'
  }

  // Table body
  tableHtml += '<tbody>'
  tableData.forEach((row, rowIndex) => {
    const rowBg = stripeRows && rowIndex % 2 === 1 ? '#f5f5f5' : '#fff'
    tableHtml += `<tr style="background-color: ${rowBg}; border-bottom: 1px solid ${borderColor};">`

    // Row number cell
    if (showRowNumbers) {
      tableHtml += `<td style="padding: 8px; color: #6b7280; border-right: 1px solid ${borderColor};">${rowIndex + 1}</td>`
    }

    // Data cells
    typedColumns.forEach((column, colIndex) => {
      const borderStyle = colIndex < typedColumns.length - 1 ? `border-right: 1px solid ${borderColor};` : ''
      const textAlign = column.type === 'number' ? 'text-align: right;' : 'text-align: left;'
      const cellContent = renderCell(row, column, passColor, failColor)
      tableHtml += `<td style="padding: 8px; ${textAlign} ${borderStyle}">${cellContent}</td>`
    })

    tableHtml += '</tr>'
  })
  tableHtml += '</tbody>'

  tableHtml += '</table></div>'

  return {
    html: tableHtml,
    componentConfig: null,
  }
}
