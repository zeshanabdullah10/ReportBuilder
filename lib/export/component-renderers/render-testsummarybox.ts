/**
 * TestSummaryBox Component Renderer
 *
 * Renders TestSummaryBox components to static HTML for template export.
 * Supports data bindings for dynamic test summary values.
 */

import { ComponentRenderer, RendererResult } from './types'
import { generatePositionStyles, combineStyles } from '../utils/style-helpers'

interface TestSummaryBoxProps {
  // Data bindings
  totalTestsBinding?: string
  passedBinding?: string
  failedBinding?: string
  skippedBinding?: string
  overallStatusBinding?: string

  // Static values (fallback)
  totalTests?: number
  passed?: number
  failed?: number
  skipped?: number
  overallStatus?: 'PASS' | 'FAIL' | 'INCOMPLETE'

  // Display options
  showSkipped?: boolean
  showPercentage?: boolean
  layout?: 'horizontal' | 'vertical' | 'grid'

  // Styling
  passColor?: string
  failColor?: string
  skipColor?: string
  borderColor?: string
  backgroundColor?: string

  // Title
  title?: string
  showTitle?: boolean

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
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Renders a TestSummaryBox component to HTML
 *
 * @param id - Component ID
 * @param props - TestSummaryBox component properties
 * @returns Renderer result with HTML and optional component config
 */
export const renderTestSummaryBox: ComponentRenderer = (id, props): RendererResult => {
  const {
    totalTestsBinding = '',
    passedBinding = '',
    failedBinding = '',
    skippedBinding = '',
    overallStatusBinding = '',
    totalTests = 100,
    passed = 95,
    failed = 5,
    skipped = 0,
    overallStatus = 'PASS',
    showSkipped = true,
    showPercentage = true,
    layout = 'horizontal',
    passColor = '#22c55e',
    failColor = '#ef4444',
    skipColor = '#f59e0b',
    borderColor = '#00ffc8',
    backgroundColor = '#0a0f14',
    title = 'Test Summary',
    showTitle = true,
    x = 0,
    y = 0,
    width = 400,
    height = 120,
    zIndex = 1,
    visible = true,
  } = props as TestSummaryBoxProps

  // Return empty result if not visible
  if (visible === false) {
    return { html: '', componentConfig: null }
  }

  // Generate position styles
  const positionStyles = generatePositionStyles({ x, y, width, height, zIndex })

  // Calculate percentages
  const total = totalTests
  const passedCount = passed
  const failedCount = failed
  const skippedCount = skipped
  const status = overallStatus

  const passedPercent = total > 0 ? ((passedCount / total) * 100).toFixed(1) : '0'
  const failedPercent = total > 0 ? ((failedCount / total) * 100).toFixed(1) : '0'
  const skippedPercent = total > 0 ? ((skippedCount / total) * 100).toFixed(1) : '0'

  const isPass = status === 'PASS'

  // Container styles
  const containerStyles = `
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background-color: ${backgroundColor};
    border: 2px solid ${borderColor};
    border-radius: 8px;
    overflow: hidden;
    box-sizing: border-box;
  `.trim().replace(/\s+/g, ' ')

  // Header styles
  const headerStyles = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    background-color: ${isPass ? `rgba(34, 197, 94, 0.125)` : `rgba(239, 68, 68, 0.125)`};
    border-bottom: 1px solid ${borderColor};
  `.trim().replace(/\s+/g, ' ')

  // Title styles
  const titleStyles = `
    font-weight: 600;
    color: white;
    font-size: 14px;
  `.trim().replace(/\s+/g, ' ')

  // Status badge styles
  const badgeStyles = `
    font-weight: bold;
    font-size: 14px;
    padding: 2px 8px;
    border-radius: 4px;
    background-color: ${isPass ? passColor : failColor};
    color: white;
  `.trim().replace(/\s+/g, ' ')

  // Content container styles
  const contentStyles = `
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
  `.trim().replace(/\s+/g, ' ')

  // Generate HTML based on layout
  let contentHtml = ''

  if (layout === 'horizontal') {
    // Horizontal layout: flex row with items side by side
    const rowStyles = `
      display: flex;
      align-items: center;
      justify-content: space-around;
      width: 100%;
      gap: 16px;
    `.trim().replace(/\s+/g, ' ')

    const itemStyles = `
      text-align: center;
    `.trim().replace(/\s+/g, ' ')

    const totalValueStyles = `
      font-size: 24px;
      font-weight: bold;
      color: white;
    `.trim().replace(/\s+/g, ' ')

    const passedValueStyles = `
      font-size: 24px;
      font-weight: bold;
      color: ${passColor};
    `.trim().replace(/\s+/g, ' ')

    const failedValueStyles = `
      font-size: 24px;
      font-weight: bold;
      color: ${failColor};
    `.trim().replace(/\s+/g, ' ')

    const skippedValueStyles = `
      font-size: 24px;
      font-weight: bold;
      color: ${skipColor};
    `.trim().replace(/\s+/g, ' ')

    const labelStyles = `
      font-size: 12px;
      color: #9ca3af;
    `.trim().replace(/\s+/g, ' ')

    contentHtml = `
      <div style="${rowStyles}">
        <div style="${itemStyles}">
          <div style="${totalValueStyles}">${total}</div>
          <div style="${labelStyles}">Total</div>
        </div>
        <div style="${itemStyles}">
          <div style="${passedValueStyles}">${passedCount}</div>
          <div style="${labelStyles}">Passed${showPercentage ? ` (${passedPercent}%)` : ''}</div>
        </div>
        <div style="${itemStyles}">
          <div style="${failedValueStyles}">${failedCount}</div>
          <div style="${labelStyles}">Failed${showPercentage ? ` (${failedPercent}%)` : ''}</div>
        </div>
        ${showSkipped ? `
        <div style="${itemStyles}">
          <div style="${skippedValueStyles}">${skippedCount}</div>
          <div style="${labelStyles}">Skipped${showPercentage ? ` (${skippedPercent}%)` : ''}</div>
        </div>
        ` : ''}
      </div>
    `
  } else if (layout === 'vertical') {
    // Vertical layout: flex column with items stacked
    const columnStyles = `
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
    `.trim().replace(/\s+/g, ' ')

    const rowItemStyles = `
      display: flex;
      justify-content: space-between;
      align-items: center;
    `.trim().replace(/\s+/g, ' ')

    const labelTextStyles = `
      font-size: 14px;
      color: #9ca3af;
    `.trim().replace(/\s+/g, ' ')

    const passedValueStyles = `
      font-weight: bold;
      color: ${passColor};
    `.trim().replace(/\s+/g, ' ')

    const failedValueStyles = `
      font-weight: bold;
      color: ${failColor};
    `.trim().replace(/\s+/g, ' ')

    const skippedValueStyles = `
      font-weight: bold;
      color: ${skipColor};
    `.trim().replace(/\s+/g, ' ')

    const totalValueStyles = `
      font-weight: bold;
      color: white;
    `.trim().replace(/\s+/g, ' ')

    const dividerStyles = `
      border-top: 1px solid #4b5563;
      padding-top: 4px;
      margin-top: 4px;
    `.trim().replace(/\s+/g, ' ')

    contentHtml = `
      <div style="${columnStyles}">
        <div style="${rowItemStyles}">
          <span style="${labelTextStyles}">Passed:</span>
          <span style="${passedValueStyles}">${passedCount}${showPercentage ? ` (${passedPercent}%)` : ''}</span>
        </div>
        <div style="${rowItemStyles}">
          <span style="${labelTextStyles}">Failed:</span>
          <span style="${failedValueStyles}">${failedCount}${showPercentage ? ` (${failedPercent}%)` : ''}</span>
        </div>
        ${showSkipped ? `
        <div style="${rowItemStyles}">
          <span style="${labelTextStyles}">Skipped:</span>
          <span style="${skippedValueStyles}">${skippedCount}${showPercentage ? ` (${skippedPercent}%)` : ''}</span>
        </div>
        ` : ''}
        <div style="${combineStyles(rowItemStyles, dividerStyles)}">
          <span style="${labelTextStyles}">Total:</span>
          <span style="${totalValueStyles}">${total}</span>
        </div>
      </div>
    `
  } else if (layout === 'grid') {
    // Grid layout: 3-column grid
    const gridStyles = `
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      width: 100%;
    `.trim().replace(/\s+/g, ' ')

    const gridItemStyles = (bgColor: string) => `
      text-align: center;
      padding: 8px;
      border-radius: 4px;
      background-color: ${bgColor};
    `.trim().replace(/\s+/g, ' ')

    const valueStyles = (color: string) => `
      font-size: 20px;
      font-weight: bold;
      color: ${color};
    `.trim().replace(/\s+/g, ' ')

    const labelTextStyles = `
      font-size: 12px;
      color: #9ca3af;
    `.trim().replace(/\s+/g, ' ')

    const percentStyles = (color: string) => `
      font-size: 12px;
      color: ${color};
    `.trim().replace(/\s+/g, ' ')

    contentHtml = `
      <div style="${gridStyles}">
        <div style="${gridItemStyles(`rgba(34, 197, 94, 0.125)`)}">
          <div style="${valueStyles(passColor)}">${passedCount}</div>
          <div style="${labelTextStyles}">PASSED</div>
          ${showPercentage ? `<div style="${percentStyles(passColor)}">${passedPercent}%</div>` : ''}
        </div>
        <div style="${gridItemStyles(`rgba(239, 68, 68, 0.125)`)}">
          <div style="${valueStyles(failColor)}">${failedCount}</div>
          <div style="${labelTextStyles}">FAILED</div>
          ${showPercentage ? `<div style="${percentStyles(failColor)}">${failedPercent}%</div>` : ''}
        </div>
        <div style="${gridItemStyles(`rgba(245, 158, 11, 0.125)`)}">
          <div style="${valueStyles(skipColor)}">${total}</div>
          <div style="${labelTextStyles}">TOTAL</div>
        </div>
      </div>
    `
  }

  // Generate header HTML
  const headerHtml = showTitle
    ? `
      <div style="${headerStyles}">
        <span style="${titleStyles}">${escapeHtml(title)}</span>
        <span style="${badgeStyles}">${isPass ? '&#10004; PASS' : '&#10008; FAIL'}</span>
      </div>
    `
    : ''

  // Generate final container HTML
  const innerHtml = `
    ${headerHtml}
    <div style="${contentStyles}">
      ${contentHtml}
    </div>
  `

  // Combine all styles
  const allStyles = combineStyles(positionStyles)

  // Add data-binding attributes if bindings exist
  const dataBindings: string[] = []
  if (totalTestsBinding) dataBindings.push(`data-total-binding="${escapeHtml(totalTestsBinding)}"`)
  if (passedBinding) dataBindings.push(`data-passed-binding="${escapeHtml(passedBinding)}"`)
  if (failedBinding) dataBindings.push(`data-failed-binding="${escapeHtml(failedBinding)}"`)
  if (skippedBinding) dataBindings.push(`data-skipped-binding="${escapeHtml(skippedBinding)}"`)
  if (overallStatusBinding) dataBindings.push(`data-status-binding="${escapeHtml(overallStatusBinding)}"`)

  // Generate final HTML
  const html = `<div id="${escapeHtml(id)}" data-component="testsummarybox" data-layout="${layout}" style="${allStyles}" ${dataBindings.join(' ')}><div style="${containerStyles}">${innerHtml}</div></div>`

  // Return component config if any bindings exist
  const hasBindings = totalTestsBinding || passedBinding || failedBinding || skippedBinding || overallStatusBinding

  const componentConfig = hasBindings
    ? {
        id,
        type: 'TestSummaryBox',
        props: {
          totalTestsBinding,
          passedBinding,
          failedBinding,
          skippedBinding,
          overallStatusBinding,
          totalTests,
          passed,
          failed,
          skipped,
          overallStatus,
          showSkipped,
          showPercentage,
          layout,
          passColor,
          failColor,
          skipColor,
          borderColor,
          backgroundColor,
          title,
          showTitle,
        },
      }
    : null

  return { html, componentConfig }
}
