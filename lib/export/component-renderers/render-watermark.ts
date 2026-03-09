/**
 * Watermark Component Renderer
 *
 * Renders Watermark components with CSS-based repeated text overlay.
 */

import { ComponentRenderer, RendererResult } from './types'
import { generatePositionStyles, combineStyles } from '../utils/style-helpers'

interface WatermarkProps {
  text?: string
  binding?: string
  opacity?: number
  rotation?: number
  fontSize?: number
  fontFamily?: string
  color?: string
  repeat?: boolean
  spacingX?: number
  spacingY?: number
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
 * Renders a Watermark component to HTML
 */
export const renderWatermark: ComponentRenderer = (id, props): RendererResult => {
  const {
    text = 'CONFIDENTIAL',
    binding = '',
    opacity = 0.1,
    rotation = -45,
    fontSize = 48,
    fontFamily = 'Arial, sans-serif',
    color = '#000000',
    repeat = true,
    spacingX = 200,
    spacingY = 150,
    x = 0,
    y = 0,
    width = 500,
    height = 300,
    zIndex = 0,
    visible = true,
  } = props as WatermarkProps

  if (visible === false) {
    return { html: '', componentConfig: null }
  }

  const positionStyles = generatePositionStyles({ x, y, width, height, zIndex })
  const containerStyles = 'position: relative; overflow: hidden; pointer-events: none; box-sizing: border-box;'
  const allStyles = combineStyles(positionStyles, containerStyles)

  // Generate repeated watermark pattern
  const cols = Math.ceil(width / spacingX) + 1
  const rows = Math.ceil(height / spacingY) + 1

  let watermarkItems = ''
  if (repeat) {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        watermarkItems += `<div style="position: absolute; display: flex; align-items: center; justify-content: center; left: ${col * spacingX}px; top: ${row * spacingY}px; width: ${spacingX}px; height: ${spacingY}px; transform: rotate(${rotation}deg);">
          <span style="font-size: ${fontSize}px; font-family: ${fontFamily}; color: ${color}; opacity: ${opacity}; font-weight: bold; white-space: nowrap;">${escapeHtml(text)}</span>
        </div>`
      }
    }
  } else {
    watermarkItems = `<div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; transform: rotate(${rotation}deg);">
      <span style="font-size: ${fontSize}px; font-family: ${fontFamily}; color: ${color}; opacity: ${opacity}; font-weight: bold; white-space: nowrap;">${escapeHtml(text)}</span>
    </div>`
  }

  const html = `<div id="${escapeHtml(id)}" data-component="watermark" style="${allStyles}" data-binding="${escapeHtml(binding)}">
    ${watermarkItems}
  </div>`

  const componentConfig = binding ? {
    id,
    type: 'Watermark',
    props: { text, binding, opacity, rotation, fontSize, fontFamily, color, repeat, spacingX, spacingY },
  } : null

  return { html, componentConfig }
}
