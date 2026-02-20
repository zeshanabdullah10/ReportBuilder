/**
 * Indicator Component Renderer
 *
 * Renders Indicator components to static HTML for template export.
 * Supports data binding for dynamic status values.
 */

import { ComponentRenderer, RendererResult } from './types'
import { generatePositionStyles, combineStyles } from '../utils/style-helpers'

type IndicatorStatus = 'pass' | 'fail' | 'warning' | 'neutral'

interface IndicatorProps {
  status?: IndicatorStatus
  label?: string
  passLabel?: string
  failLabel?: string
  warningLabel?: string
  binding?: string
  visibilityCondition?: string
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
  visible?: boolean
}

/**
 * Status configuration for colors and labels
 */
const STATUS_CONFIG: Record<IndicatorStatus, {
  bgColor: string
  borderColor: string
  textColor: string
  iconSymbol: string
  defaultLabel: string
}> = {
  pass: {
    bgColor: 'rgba(57, 255, 20, 0.15)',
    borderColor: '#39ff14',
    textColor: '#39ff14',
    iconSymbol: '&#10004;', // checkmark
    defaultLabel: 'PASS',
  },
  fail: {
    bgColor: 'rgba(255, 107, 107, 0.15)',
    borderColor: '#ff6b6b',
    textColor: '#ff6b6b',
    iconSymbol: '&#10008;', // X
    defaultLabel: 'FAIL',
  },
  warning: {
    bgColor: 'rgba(255, 176, 0, 0.15)',
    borderColor: '#ffb000',
    textColor: '#ffb000',
    iconSymbol: '&#9888;', // warning triangle
    defaultLabel: 'WARNING',
  },
  neutral: {
    bgColor: 'rgba(156, 163, 175, 0.15)',
    borderColor: '#9ca3af',
    textColor: '#9ca3af',
    iconSymbol: '&#8722;', // minus
    defaultLabel: 'N/A',
  },
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
 * Renders an Indicator component to HTML
 *
 * @param id - Component ID
 * @param props - Indicator component properties
 * @returns Renderer result with HTML and optional component config
 */
export const renderIndicator: ComponentRenderer = (id, props): RendererResult => {
  const {
    status = 'neutral',
    label = '',
    passLabel = 'PASS',
    failLabel = 'FAIL',
    warningLabel = 'WARNING',
    binding = '',
    visibilityCondition = '',
    x = 0,
    y = 0,
    width = 120,
    height = 44,
    zIndex = 1,
    visible = true,
  } = props as IndicatorProps

  // Return empty result if not visible
  if (visible === false) {
    return { html: '', componentConfig: null }
  }

  // Generate position styles
  const positionStyles = generatePositionStyles({ x, y, width, height, zIndex })

  // Get status configuration
  const config = STATUS_CONFIG[status]

  // Determine display label based on status
  const getDisplayLabel = () => {
    if (label) return label
    switch (status) {
      case 'pass':
        return passLabel
      case 'fail':
        return failLabel
      case 'warning':
        return warningLabel
      default:
        return config.defaultLabel
    }
  }

  const displayLabel = getDisplayLabel()

  // Badge styles
  const badgeStyles = `
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 8px;
    border: 2px solid ${config.borderColor};
    background: ${config.bgColor};
    box-sizing: border-box;
  `.trim().replace(/\s+/g, ' ')

  // Icon styles
  const iconStyles = `
    font-size: 18px;
    color: ${config.textColor};
    font-weight: bold;
  `.trim().replace(/\s+/g, ' ')

  // Label styles
  const labelStyles = `
    font-size: 14px;
    font-weight: 600;
    color: ${config.textColor};
    font-family: 'JetBrains Mono', monospace;
  `.trim().replace(/\s+/g, ' ')

  // Generate badge HTML
  const badgeHtml = `
    <div style="${badgeStyles}">
      <span style="${iconStyles}">${config.iconSymbol}</span>
      <span style="${labelStyles}">${escapeHtml(displayLabel)}</span>
    </div>
  `

  // Combine all styles
  const allStyles = combineStyles(positionStyles)

  // Add data-binding attribute if binding exists
  const dataBindingAttr = binding ? `data-binding="${escapeHtml(binding)}"` : ''
  
  // Add visibility condition attribute if present
  const visibilityAttr = visibilityCondition 
    ? `data-visibility-condition="${escapeHtml(visibilityCondition)}"` 
    : ''

  // Generate final HTML
  const html = `<div id="${escapeHtml(id)}" data-component="indicator" data-status="${status}" style="${allStyles}" ${dataBindingAttr} ${visibilityAttr}>${badgeHtml}</div>`

  // Return component config if binding exists
  const componentConfig = binding
    ? {
        id,
        type: 'Indicator',
        props: {
          status,
          label,
          passLabel,
          failLabel,
          warningLabel,
          binding,
        },
      }
    : null

  return { html, componentConfig }
}
