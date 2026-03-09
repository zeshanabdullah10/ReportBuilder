/**
 * SpecBox Export Renderer
 *
 * Renders a SpecBox component to static HTML for export.
 * Displays specification with nominal, tolerance, and measured values.
 */

import { RendererResult, ComponentRenderer } from './types'
import { generatePositionStyles } from '../utils/style-helpers'

/**
 * Props for the SpecBox component
 */
interface SpecBoxProps {
  // Title
  title?: string
  titleBinding?: string

  // Values
  nominal?: string
  nominalBinding?: string
  tolerance?: string
  toleranceBinding?: string
  unit?: string
  unitBinding?: string

  // Measured value
  measured?: string
  measuredBinding?: string

  // Appearance
  showStatus?: boolean
  passColor?: string
  failColor?: string

  // Layout
  layout?: 'horizontal' | 'vertical' | 'compact'

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
 */
function escapeHtml(str: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  return str.replace(/[&<>"']/g, (char) => htmlEntities[char] || char)
}

/**
 * Calculate pass/fail status based on nominal, tolerance, and measured values
 *
 * @param nominal - The nominal/target value
 * @param tolerance - The tolerance string (e.g., "±0.01", "+0.02/-0.01")
 * @param measured - The measured value
 * @returns true if within tolerance (pass), false otherwise (fail)
 */
function calculateStatus(nominal: string, tolerance: string, measured: string): boolean {
  const nominalVal = parseFloat(nominal)
  const measuredVal = parseFloat(measured)

  if (isNaN(nominalVal) || isNaN(measuredVal)) return true

  // Parse tolerance (handles ±0.01, +0.02/-0.01, etc.)
  const toleranceMatch = tolerance.match(/[±+-]?\s*(\d+\.?\d*)/)
  if (!toleranceMatch) return true

  const toleranceVal = parseFloat(toleranceMatch[1])
  if (isNaN(toleranceVal)) return true

  return Math.abs(measuredVal - nominalVal) <= toleranceVal
}

/**
 * Render a SpecBox component to static HTML
 *
 * @param id - The component's unique identifier
 * @param props - The component's properties
 * @returns The renderer result containing HTML and optional config
 */
export const renderSpecBox: ComponentRenderer = (
  id: string,
  props: Record<string, unknown>
): RendererResult => {
  const {
    title = 'Specification',
    titleBinding,
    nominal = '0.00',
    nominalBinding,
    tolerance = '±0.01',
    toleranceBinding,
    unit = 'mm',
    unitBinding,
    measured = '0.005',
    measuredBinding,
    showStatus = true,
    passColor = '#22c55e',
    failColor = '#ef4444',
    layout = 'horizontal',
    x = 0,
    y = 0,
    width = 200,
    height = 80,
    zIndex = 1,
    visible = true,
  } = props as SpecBoxProps

  // Return empty if not visible
  if (!visible) {
    return { html: '', componentConfig: null }
  }

  // Resolve all bindings to values (for export, we use the static values)
  const resolvedTitle = titleBinding ? (props[titleBinding] as string) ?? title : title
  const resolvedNominal = nominalBinding ? (props[nominalBinding] as string) ?? nominal : nominal
  const resolvedTolerance = toleranceBinding ? (props[toleranceBinding] as string) ?? tolerance : tolerance
  const resolvedUnit = unitBinding ? (props[unitBinding] as string) ?? unit : unit
  const resolvedMeasured = measuredBinding ? (props[measuredBinding] as string) ?? measured : measured

  // Calculate pass/fail status
  const isPass = calculateStatus(resolvedNominal, resolvedTolerance, resolvedMeasured)
  const borderColor = showStatus ? (isPass ? passColor : failColor) : '#e5e7eb'

  // Generate position styles
  const positionStyles = generatePositionStyles({ x, y, width, height, zIndex })

  // Escape values for HTML output
  const safeTitle = escapeHtml(resolvedTitle)
  const safeNominal = escapeHtml(resolvedNominal)
  const safeTolerance = escapeHtml(resolvedTolerance)
  const safeUnit = escapeHtml(resolvedUnit)
  const safeMeasured = escapeHtml(resolvedMeasured)

  let contentHtml: string

  if (layout === 'horizontal') {
    // Horizontal layout: title on top, values in row with measured + checkmark
    contentHtml = `
      <div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; padding: 8px; border: 1px solid ${borderColor}; border-radius: 4px; background: white; box-sizing: border-box;">
        <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">${safeTitle}</div>
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <div style="display: flex; align-items: baseline; gap: 4px;">
            <span style="font-size: 18px; font-weight: 600;">${safeNominal}</span>
            <span style="font-size: 14px; color: #6b7280;">${safeTolerance}</span>
            <span style="font-size: 12px; color: #9ca3af;">${safeUnit}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 4px;">
            <span style="font-size: 14px; font-weight: 500; color: ${showStatus ? (isPass ? passColor : failColor) : 'inherit'};">${safeMeasured}</span>
            ${showStatus ? `<span style="font-size: 18px; color: ${isPass ? passColor : failColor};">${isPass ? '✓' : '✗'}</span>` : ''}
          </div>
        </div>
      </div>
    `
  } else if (layout === 'vertical') {
    // Vertical layout: title, nominal/tolerance/unit, measured row
    contentHtml = `
      <div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: space-between; padding: 8px; border: 1px solid ${borderColor}; border-radius: 4px; background: white; box-sizing: border-box;">
        <div style="font-size: 12px; color: #6b7280;">${safeTitle}</div>
        <div style="display: flex; align-items: baseline; gap: 4px;">
          <span style="font-size: 20px; font-weight: 600;">${safeNominal}</span>
          <span style="font-size: 14px; color: #6b7280;">${safeTolerance}</span>
          <span style="font-size: 12px; color: #9ca3af;">${safeUnit}</span>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 14px; color: #6b7280;">Measured:</span>
          <span style="font-size: 14px; font-weight: 500; color: ${showStatus ? (isPass ? passColor : failColor) : 'inherit'};">${safeMeasured} ${safeUnit}</span>
        </div>
      </div>
    `
  } else {
    // Compact layout: inline with title, nominal, tolerance, measured, status
    contentHtml = `
      <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: space-between; padding: 4px 8px; border: 1px solid ${borderColor}; border-radius: 4px; background: white; box-sizing: border-box;">
        <span style="font-size: 12px; color: #6b7280;">${safeTitle}:</span>
        <div style="display: flex; align-items: baseline; gap: 4px;">
          <span style="font-size: 14px; font-weight: 600;">${safeNominal}</span>
          <span style="font-size: 12px; color: #6b7280;">${safeTolerance}</span>
        </div>
        <span style="font-size: 14px; font-weight: 500; color: ${showStatus ? (isPass ? passColor : failColor) : 'inherit'};">${safeMeasured}</span>
        ${showStatus ? `<span style="font-size: 14px; color: ${isPass ? passColor : failColor};">${isPass ? '✓' : '✗'}</span>` : ''}
      </div>
    `
  }

  const html = `
    <div id="${id}" style="${positionStyles}">
      ${contentHtml}
    </div>
  `

  return {
    html: html.trim(),
    componentConfig: null,
  }
}
