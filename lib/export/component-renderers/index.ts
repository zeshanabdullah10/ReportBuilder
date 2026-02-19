/**
 * Component Renderers Registry
 *
 * Maps component types to their renderer functions.
 * This is the main entry point for component rendering in the export system.
 */

import { ComponentRenderer } from './types'
import { renderText } from './render-text'
import { renderImage } from './render-image'
import { renderContainer } from './render-container'
import { renderSpacer } from './render-spacer'
import { renderDivider } from './render-divider'
import { renderPagebreak } from './render-pagebreak'
import { renderTable } from './render-table'
import { renderBulletList } from './render-bulletlist'
import { renderIndicator } from './render-indicator'
import { renderDateTime } from './render-datetime'
import { renderPageNumber } from './render-pagenumber'
import { renderGauge } from './render-gauge'
import { renderProgressBar } from './render-progressbar'
import { renderChart } from './render-chart'

/**
 * Registry mapping component type names to their renderer functions
 */
const renderers: Record<string, ComponentRenderer> = {
  Text: renderText,
  Image: renderImage,
  Container: renderContainer,
  Spacer: renderSpacer,
  Divider: renderDivider,
  PageBreak: renderPagebreak,
  Table: renderTable,
  BulletList: renderBulletList,
  Indicator: renderIndicator,
  DateTime: renderDateTime,
  PageNumber: renderPageNumber,
  Gauge: renderGauge,
  ProgressBar: renderProgressBar,
  Chart: renderChart,
}

/**
 * Get the renderer function for a component type
 *
 * @param type - Component type name (e.g., 'Text', 'Image')
 * @returns The renderer function or undefined if not found
 */
export function getRenderer(type: string): ComponentRenderer | undefined {
  return renderers[type]
}

/**
 * Check if a renderer exists for a component type
 *
 * @param type - Component type name
 * @returns true if a renderer exists
 */
export function hasRenderer(type: string): boolean {
  return type in renderers
}

/**
 * Get all registered component types
 *
 * @returns Array of component type names
 */
export function getRegisteredTypes(): string[] {
  return Object.keys(renderers)
}

// Re-export individual renderers for direct access
export { renderText } from './render-text'
export { renderImage } from './render-image'
export { renderContainer } from './render-container'
export { renderSpacer } from './render-spacer'
export { renderDivider } from './render-divider'
export { renderPagebreak } from './render-pagebreak'
export { renderTable } from './render-table'
export { renderBulletList } from './render-bulletlist'
export { renderIndicator } from './render-indicator'
export { renderDateTime } from './render-datetime'
export { renderPageNumber } from './render-pagenumber'
export { renderGauge } from './render-gauge'
export { renderProgressBar } from './render-progressbar'
export { renderChart } from './render-chart'

// Re-export types
export type { RendererResult, ComponentRenderer } from './types'
