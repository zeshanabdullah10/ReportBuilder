/**
 * Page Component Renderer
 *
 * Renders the root Page container for template export.
 * The Page is the root element in Craft.js that contains all other components.
 *
 * CRITICAL: Uses fixed pixel dimensions to ensure components positioned with
 * absolute pixels appear in the correct locations during print.
 */

import { ComponentRenderer, RendererResult } from './types'

// Page size presets in pixels at 96 DPI (1mm ≈ 3.7795px)
// Must match PAGE_SIZE_PRESETS in builder-store.ts
const PAGE_SIZE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  A4: { width: 794, height: 1123 },
  A3: { width: 1123, height: 1587 },
  Letter: { width: 816, height: 1056 },
  Legal: { width: 816, height: 1344 },
  Custom: { width: 794, height: 1123 }, // Default fallback
}

interface PageProps {
  background?: string
  padding?: number
  pageSize?: string
  customWidth?: number
  customHeight?: number
}

/**
 * Renders a Page component to HTML
 *
 * @param id - Component ID
 * @param props - Page component properties
 * @returns Renderer result with HTML (children will be inserted by compiler)
 */
export const renderPage: ComponentRenderer = (id, props): RendererResult => {
  const {
    background = '#ffffff',
    padding = 40,
    pageSize = 'A4',
    customWidth,
    customHeight,
  } = (props || {}) as PageProps

  // Determine page dimensions - use fixed pixel values for consistent print output
  let width: number
  let height: number

  if (pageSize === 'Custom' && customWidth && customHeight) {
    width = customWidth
    height = customHeight
  } else {
    const dimensions = PAGE_SIZE_DIMENSIONS[pageSize] || PAGE_SIZE_DIMENSIONS.A4
    width = dimensions.width
    height = dimensions.height
  }

  const styles = `
    position: relative;
    width: ${width}px;
    min-height: ${height}px;
    background: ${background};
    padding: ${padding}px;
    box-sizing: border-box;
  `.replace(/\s+/g, ' ').trim()

  const html = `<div id="${id}" data-component="page" data-page-size="${pageSize}" style="${styles}"></div>`

  // Page doesn't need runtime config
  return { html, componentConfig: null }
}
