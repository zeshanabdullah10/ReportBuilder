/**
 * Page Component Renderer
 *
 * Renders the root Page container for template export.
 * The Page is the root element in Craft.js that contains all other components.
 */

import { ComponentRenderer, RendererResult } from './types'

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
  } = (props || {}) as PageProps

  const styles = `
    position: relative;
    width: 100%;
    min-height: 100%;
    background: ${background};
    padding: ${padding}px;
    box-sizing: border-box;
  `.replace(/\s+/g, ' ').trim()

  const html = `<div id="${id}" data-component="page" style="${styles}"></div>`

  // Page doesn't need runtime config
  return { html, componentConfig: null }
}
