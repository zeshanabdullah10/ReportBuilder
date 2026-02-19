/**
 * Image Component Renderer
 *
 * Renders Image components to static HTML for template export.
 */

import { ComponentRenderer, RendererResult } from './types'
import { generatePositionStyles, combineStyles } from '../utils/style-helpers'

interface ImageProps {
  src?: string
  alt?: string
  objectFit?: 'cover' | 'contain' | 'fill'
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
  visible?: boolean
}

/**
 * Renders an Image component to HTML
 *
 * @param id - Component ID
 * @param props - Image component properties
 * @returns Renderer result with HTML
 */
export const renderImage: ComponentRenderer = (id, props): RendererResult => {
  const {
    src = 'https://via.placeholder.com/300x200',
    alt = 'Image',
    objectFit = 'cover',
    x = 0,
    y = 0,
    width = 300,
    height = 200,
    zIndex = 1,
    visible = true,
  } = props as ImageProps

  // Return empty result if not visible
  if (visible === false) {
    return { html: '', componentConfig: null }
  }

  // Generate position styles
  const positionStyles = generatePositionStyles({ x, y, width, height, zIndex })

  // Image-specific styles
  const imageStyles = `
    width: 100%;
    height: 100%;
    object-fit: ${objectFit};
    display: block;
  `.trim()

  // Combine all styles
  const allStyles = combineStyles(positionStyles)

  // Escape attributes
  const escapedSrc = escapeHtml(src)
  const escapedAlt = escapeHtml(alt)

  // Generate HTML
  // Note: The image src will be processed by the asset pipeline (base64 conversion)
  // The outer div handles positioning, the inner img handles display
  const html = `<div id="${escapeHtml(id)}" data-component="image" style="${allStyles}"><img src="${escapedSrc}" alt="${escapedAlt}" style="${imageStyles}" /></div>`

  return { html, componentConfig: null }
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
