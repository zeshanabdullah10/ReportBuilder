/**
 * QRCode Component Renderer
 *
 * Renders QRCode components to static HTML with embedded data URL.
 * Note: For export, we use a placeholder that gets rendered at runtime.
 */

import { ComponentRenderer, RendererResult } from './types'
import { generatePositionStyles, combineStyles } from '../utils/style-helpers'

interface QRCodeProps {
  value?: string
  binding?: string
  size?: number
  errorCorrection?: 'L' | 'M' | 'Q' | 'H'
  foregroundColor?: string
  backgroundColor?: string
  showLabel?: boolean
  label?: string
  labelPosition?: 'top' | 'bottom'
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
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Renders a QRCode component to HTML
 */
export const renderQRCode: ComponentRenderer = (id, props): RendererResult => {
  const {
    value = 'https://example.com',
    binding = '',
    size = 100,
    foregroundColor = '#000000',
    backgroundColor = '#FFFFFF',
    showLabel = false,
    label = '',
    labelPosition = 'bottom',
    x = 0,
    y = 0,
    width = 120,
    height = 120,
    zIndex = 1,
    visible = true,
  } = props as QRCodeProps

  if (visible === false) {
    return { html: '', componentConfig: null }
  }

  const positionStyles = generatePositionStyles({ x, y, width, height, zIndex })
  const containerStyles = `display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: ${backgroundColor}; box-sizing: border-box;`
  const allStyles = combineStyles(positionStyles, containerStyles)

  const displayLabel = label || value
  const labelHtml = showLabel
    ? `<div style="font-size: 12px; text-align: center; color: ${foregroundColor}; margin-${labelPosition === 'top' ? 'bottom' : 'top'}: 4px; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(displayLabel)}</div>`
    : ''

  const topLabel = labelPosition === 'top' ? labelHtml : ''
  const bottomLabel = labelPosition === 'bottom' ? labelHtml : ''

  // Use a placeholder div that will be replaced at runtime
  const html = `<div id="${escapeHtml(id)}" data-component="qrcode" style="${allStyles}" data-value="${escapeHtml(value)}" data-binding="${escapeHtml(binding)}" data-size="${size}" data-fg="${foregroundColor}" data-bg="${backgroundColor}">
    ${topLabel}
    <div class="qrcode-placeholder" style="width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; color: #999; font-size: 10px;">
      QR Code
    </div>
    ${bottomLabel}
  </div>`

  const componentConfig = {
    id,
    type: 'QRCode',
    props: {
      value,
      binding: binding || undefined,
      size,
      foregroundColor,
      backgroundColor,
      showLabel,
      label,
      labelPosition,
    },
  }

  return { html, componentConfig }
}
