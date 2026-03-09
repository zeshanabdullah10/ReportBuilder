/**
 * Logo Component Renderer
 *
 * Renders Logo components to static HTML with img tag.
 */

import { ComponentRenderer, RendererResult } from './types'
import { generatePositionStyles, combineStyles } from '../utils/style-helpers'

interface LogoProps {
  src?: string
  binding?: string
  width?: number
  height?: number
  maxHeight?: number
  align?: 'left' | 'center' | 'right'
  alt?: string
  fallbackText?: string
  x?: number
  y?: number
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
 * Renders a Logo component to HTML
 */
export const renderLogo: ComponentRenderer = (id, props): RendererResult => {
  const {
    src = '',
    binding = '',
    width = 150,
    height = 80,
    maxHeight = 80,
    align = 'left',
    alt = 'Company Logo',
    fallbackText = 'Company Name',
    x = 0,
    y = 0,
    zIndex = 1,
    visible = true,
  } = props as LogoProps

  if (visible === false) {
    return { html: '', componentConfig: null }
  }

  const positionStyles = generatePositionStyles({ x, y, width, height, zIndex })
  const justifyContent = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'
  const containerStyles = `display: flex; align-items: center; justify-content: ${justifyContent}; box-sizing: border-box;`
  const allStyles = combineStyles(positionStyles, containerStyles)

  const content = src
    ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" style="max-width: 100%; max-height: ${maxHeight}px; object-fit: contain;" />`
    : `<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; color: #6b7280; font-weight: 600; font-size: ${Math.min(maxHeight / 3, 16)}px;">${escapeHtml(fallbackText)}</div>`

  const html = `<div id="${escapeHtml(id)}" data-component="logo" style="${allStyles}" data-binding="${escapeHtml(binding)}">
    ${content}
  </div>`

  const componentConfig = binding ? {
    id,
    type: 'Logo',
    props: {
      src,
      binding,
      alt,
      maxHeight,
    },
  } : null

  return { html, componentConfig }
}
