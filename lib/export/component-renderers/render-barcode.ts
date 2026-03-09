/**
 * Barcode Component Renderer
 *
 * Renders Barcode components to static HTML with SVG placeholder.
 */

import { ComponentRenderer, RendererResult } from './types'
import { generatePositionStyles, combineStyles } from '../utils/style-helpers'

type BarcodeFormat = 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'UPC' | 'ITF14' | 'pharmacode'

interface BarcodeProps {
  value?: string
  binding?: string
  format?: BarcodeFormat
  barWidth?: number
  barHeight?: number
  displayValue?: boolean
  lineColor?: string
  background?: string
  fontSize?: number
  textAlign?: 'left' | 'center' | 'right'
  label?: string
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
 * Renders a Barcode component to HTML
 */
export const renderBarcode: ComponentRenderer = (id, props): RendererResult => {
  const {
    value = '1234567890',
    binding = '',
    format = 'CODE128',
    barWidth = 2,
    barHeight = 100,
    displayValue = true,
    lineColor = '#000000',
    background = '#FFFFFF',
    fontSize = 14,
    textAlign = 'center',
    label = '',
    x = 0,
    y = 0,
    width = 200,
    height = 80,
    zIndex = 1,
    visible = true,
  } = props as BarcodeProps

  if (visible === false) {
    return { html: '', componentConfig: null }
  }

  const positionStyles = generatePositionStyles({ x, y, width, height, zIndex })
  const containerStyles = `display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4px; background-color: ${background}; box-sizing: border-box;`
  const allStyles = combineStyles(positionStyles, containerStyles)

  const labelHtml = label
    ? `<div style="font-size: 12px; text-align: center; margin-bottom: 4px; color: ${lineColor};">${escapeHtml(label)}</div>`
    : ''

  const html = `<div id="${escapeHtml(id)}" data-component="barcode" style="${allStyles}" data-value="${escapeHtml(value)}" data-binding="${escapeHtml(binding)}" data-format="${format}" data-bar-width="${barWidth}" data-bar-height="${barHeight}" data-display-value="${displayValue}" data-line-color="${lineColor}" data-font-size="${fontSize}" data-text-align="${textAlign}">
    ${labelHtml}
    <svg class="barcode-svg" style="max-width: 100%; max-height: 100%; overflow: visible;"></svg>
  </div>`

  const componentConfig = {
    id,
    type: 'Barcode',
    props: {
      value,
      binding: binding || undefined,
      format,
      barWidth,
      barHeight,
      displayValue,
      lineColor,
      background,
      fontSize,
      textAlign,
      label,
    },
  }

  return { html, componentConfig }
}
