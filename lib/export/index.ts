/**
 * Template Export Module
 *
 * Main entry point for the template export system.
 * Compiles Craft.js canvas states into standalone HTML files.
 */

// Main compiler
export {
  compileTemplate,
  compileMultiPageTemplate,
  escapeHtml,
  processNodes,
  findRootNodes,
  type ExportOptions,
  type CanvasState,
  type CanvasNode,
  type RendererResult,
  type ComponentRenderer,
  type PageState,
  type MultiPageExportOptions,
} from './html-compiler'

// Runtime template
export {
  RUNTIME_TEMPLATE,
  WATERMARK_HTML,
  getRuntimeTemplate,
  getWatermarkHtml,
} from './runtime-template'

// Component renderers
export {
  getRenderer,
  hasRenderer,
  getRegisteredTypes,
  type RendererResult as ComponentRendererResult,
} from './component-renderers'

// Individual renderers
export { renderText } from './component-renderers/render-text'
export { renderImage } from './component-renderers/render-image'
export { renderContainer } from './component-renderers/render-container'
export { renderSpacer } from './component-renderers/render-spacer'
export { renderDivider } from './component-renderers/render-divider'
export { renderPagebreak } from './component-renderers/render-pagebreak'
export { renderTable } from './component-renderers/render-table'
export { renderBulletList } from './component-renderers/render-bulletlist'
export { renderIndicator } from './component-renderers/render-indicator'
export { renderDateTime } from './component-renderers/render-datetime'
export { renderPageNumber } from './component-renderers/render-pagenumber'
export { renderGauge } from './component-renderers/render-gauge'
export { renderProgressBar } from './component-renderers/render-progressbar'
export { renderChart } from './component-renderers/render-chart'

// Utilities
export {
  generatePrintStyles,
  generatePositionStyles,
  generateInlineStyles,
  generateBorderStyles,
  generateFontStyles,
  combineStyles,
  hexToRgba,
  toHex,
  PAGE_SIZES,
  type PositionProps,
} from './utils/style-helpers'

export {
  imageToBase64,
  isDataUrl,
  isExternalUrl,
  isSupabaseStorageUrl,
  getMimeType,
  processImageUrl,
  processImageUrls,
  extractImageUrls,
  processCanvasAssets,
  type ProcessedAssets,
} from './utils/asset-helpers'

// Assets
export {
  CHART_JS_CDN_URL,
  CHART_JS_VERSION,
  CHART_JS_CDN_URLS,
  getChartJsScriptTag,
  DEFAULT_CHART_COLORS,
} from './assets/chart.min'
