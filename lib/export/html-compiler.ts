/**
 * HTML Compiler for Template Export
 *
 * Compiles Craft.js canvas state into a standalone HTML file
 * that can be used offline with LabVIEW and headless Chrome.
 */

import { generatePrintStyles } from './utils/style-helpers'
import { getRenderer } from './component-renderers'
import type { RendererResult } from './component-renderers/types'
import { RUNTIME_TEMPLATE, WATERMARK_HTML } from './runtime-template'
import { getChartJsScriptTag } from './assets/chart.min'

/**
 * Export options for template compilation
 */
export interface ExportOptions {
  filename: string
  includeSampleData: boolean
  pageSize: 'A4' | 'Letter'
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
  includeWatermark: boolean
}

/**
 * Canvas state structure from Craft.js
 */
export interface CanvasState {
  nodes: Record<string, CanvasNode>
  rootNodeId?: string
}

/**
 * Craft.js type resolver structure
 */
interface CraftTypeResolver {
  resolvedName: string
}

/**
 * Individual node in the Craft.js tree
 */
export interface CanvasNode {
  id?: string
  type: string | CraftTypeResolver
  props?: Record<string, unknown>
  nodes?: string[] // Child node IDs (for containers)
  custom?: Record<string, unknown>
}

/**
 * Extract the component type name from a Craft.js node
 */
function getComponentType(node: CanvasNode): string {
  if (typeof node.type === 'string') {
    return node.type
  }
  if (node.type && typeof node.type === 'object' && 'resolvedName' in node.type) {
    return node.type.resolvedName
  }
  return 'Unknown'
}

/**
 * Result from processing all nodes
 */
interface ProcessNodesResult {
  html: string
  components: RendererResult['componentConfig'][]
}

/**
 * Component renderer function type (for external use)
 */
export type ComponentRenderer = (
  id: string,
  props: Record<string, unknown>
) => RendererResult

/**
 * Escape HTML special characters
 */
function escapeHtml(text: unknown): string {
  if (text == null) return ''
  const str = String(text)
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  return str.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char)
}

/**
 * Process all nodes recursively and generate HTML
 *
 * @param nodes - All canvas nodes
 * @param rootNodes - Nodes to process (usually root-level nodes)
 * @returns Processed HTML and component configs
 */
function processNodes(
  nodes: Record<string, CanvasNode>,
  rootNodes?: CanvasNode[]
): ProcessNodesResult {
  const components: RendererResult['componentConfig'][] = []
  const htmlParts: string[] = []

  // If no root nodes specified, find them
  const nodesToProcess = rootNodes || findRootNodes(nodes)

  for (const node of nodesToProcess) {
    const result = processNodeRecursive(node, nodes, components)
    htmlParts.push(result.html)
  }

  return {
    html: htmlParts.join('\n'),
    components,
  }
}

/**
 * Find root nodes (nodes that are not children of any other node)
 */
function findRootNodes(nodes: Record<string, CanvasNode>): CanvasNode[] {
  const childIds = new Set<string>()

  // Collect all child IDs
  for (const node of Object.values(nodes)) {
    if (node.nodes) {
      node.nodes.forEach((childId) => childIds.add(childId))
    }
  }

  // Return nodes that are not children of any other node
  // Also add the node id from the key if not present in the node object
  return Object.entries(nodes)
    .filter(([nodeId, node]) => !childIds.has(nodeId) && !childIds.has(node.id || ''))
    .map(([nodeId, node]) => ({ ...node, id: node.id || nodeId }))
}

/**
 * Process a single node and its children recursively
 */
function processNodeRecursive(
  node: CanvasNode,
  allNodes: Record<string, CanvasNode>,
  allConfigs: RendererResult['componentConfig'][]
): RendererResult {
  // Get the component type name
  const componentType = getComponentType(node)
  const renderer = getRenderer(componentType)

  // Ensure node has an id
  const nodeId = node.id || Object.keys(allNodes).find(k => allNodes[k] === node) || 'unknown'

  if (!renderer) {
    // Fallback for unknown component types
    return {
      html: `<!-- Unknown component type: ${escapeHtml(componentType)} -->`,
      componentConfig: {
        id: nodeId,
        type: componentType,
        props: node.props || {},
      },
    }
  }

  // Render this node
  const result = renderer(nodeId, node.props || {})

  // Add this node's config to the collection
  if (result.componentConfig) {
    allConfigs.push(result.componentConfig)
  }

  // If this node has children (container), render them and insert
  if (node.nodes && node.nodes.length > 0) {
    const childHtmlParts: string[] = []

    for (const childId of node.nodes) {
      const childNode = allNodes[childId]
      if (childNode) {
        const childResult = processNodeRecursive(childNode, allNodes, allConfigs)
        childHtmlParts.push(childResult.html)
      }
    }

    // For containers, insert child HTML inside the container element
    if ((componentType === 'Container' || componentType === 'Page') && result.html) {
      const childHtml = childHtmlParts.join('\n')
      // Insert children before the closing </div> of the container
      result.html = result.html.replace(/<\/div>\s*$/, `\n${childHtml}\n</div>`)
    }
  }

  return result
}

/**
 * Generate the configuration script for the runtime
 */
function generateConfigScript(
  componentConfigs: RendererResult['componentConfig'][],
  sampleData: Record<string, unknown> | null,
  options: ExportOptions
): string {
  // Filter out null configs
  const validConfigs = componentConfigs.filter(Boolean)

  return `
    // Template configuration
    window.TEMPLATE_CONFIG = {
      pageSize: '${options.pageSize}',
      margins: ${JSON.stringify(options.margins)},
      autoPrint: true,
      printDelay: 500,
      dataPath: './report_data.json'
    };

    // Component registry with bindings
    window.COMPONENTS = ${JSON.stringify(validConfigs, null, 2)};

    // Embedded sample data (if includeSampleData: true)
    window.SAMPLE_DATA = ${sampleData ? JSON.stringify(sampleData, null, 2) : 'null'};
  `
}

/**
 * Page state for multi-page templates
 */
export interface PageState {
  id: string
  name: string
  canvasState: CanvasState
  settings: {
    background?: string
    padding?: number
    pageSize?: string
    customWidth?: number
    customHeight?: number
  }
  order: number
}

/**
 * Multi-page export options
 */
export interface MultiPageExportOptions extends ExportOptions {
  pages: PageState[]
}

/**
 * Compile a single page's canvas state into HTML
 */
function compilePageContent(
  canvasState: CanvasState,
  pageIndex: number,
  totalPages: number
): { html: string; components: RendererResult['componentConfig'][] } {
  // Handle both wrapped and direct node structures
  const nodes = canvasState.nodes || (canvasState as unknown as Record<string, CanvasNode>)
  
  // Process all nodes recursively
  const result = processNodes(nodes)
  
  // Wrap in page container with page break
  const pageBreak = pageIndex < totalPages - 1 ? '<div class="page-break"></div>' : ''
  
  return {
    html: `<div class="report-page" data-page="${pageIndex + 1}">${result.html}</div>${pageBreak}`,
    components: result.components
  }
}

/**
 * Compile multiple pages into a single HTML file
 *
 * @param pages - Array of page states with canvas data
 * @param sampleData - Optional sample data to embed in the HTML
 * @param options - Export options (page size, margins, watermark, etc.)
 * @returns Complete HTML string ready to be saved as a file
 */
export async function compileMultiPageTemplate(
  pages: PageState[],
  sampleData: Record<string, unknown> | null,
  options: ExportOptions
): Promise<string> {
  // Sort pages by order
  const sortedPages = [...pages].sort((a, b) => a.order - b.order)
  
  // Compile each page
  const pageResults = sortedPages.map((page, index) =>
    compilePageContent(page.canvasState, index, sortedPages.length)
  )
  
  // Combine all page HTML
  const bodyHtml = pageResults.map(r => r.html).join('\n')
  
  // Combine all component configs
  const allComponents = pageResults.flatMap(r => r.components)
  
  // Generate print CSS
  const printCss = generatePrintStyles(options.pageSize, options.margins)
  
  // Get Chart.js script tag
  const chartJsScript = getChartJsScriptTag(false)
  
  // Generate runtime config script
  const configScript = generateConfigScript(allComponents, sampleData, options)
  
  // Get watermark HTML if needed
  const watermarkHtml = options.includeWatermark ? WATERMARK_HTML : ''
  
  // Assemble the complete HTML document
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(options.filename)}</title>

  <style>
    /* Reset and base styles */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #000;
      background: #fff;
    }

    /* Page container */
    #report {
      position: relative;
      width: 100%;
      min-height: 100vh;
    }

    /* Individual page wrapper */
    .report-page {
      position: relative;
      page-break-inside: avoid;
    }

    /* Page break between pages */
    .page-break {
      page-break-after: always;
      break-after: page;
      height: 0;
      margin: 0;
      padding: 0;
    }

${printCss}
  </style>

  ${chartJsScript}
</head>
<body>
  <div id="report">
${bodyHtml}
  </div>

${watermarkHtml}

  <script>
${configScript}
  </script>

  <script>
${RUNTIME_TEMPLATE}
  </script>
</body>
</html>`

  return html
}

/**
 * Compile a Craft.js canvas state into a standalone HTML file
 *
 * @param canvasState - The Craft.js canvas state to compile
 * @param sampleData - Optional sample data to embed in the HTML
 * @param options - Export options (page size, margins, watermark, etc.)
 * @returns Complete HTML string ready to be saved as a file
 */
export async function compileTemplate(
  canvasState: CanvasState,
  sampleData: Record<string, unknown> | null,
  options: ExportOptions
): Promise<string> {
  // Handle both wrapped and direct node structures
  // Craft.js serialize() returns nodes directly (not wrapped in { nodes: {...} })
  const nodes = canvasState.nodes || (canvasState as unknown as Record<string, CanvasNode>)

  // 1. Process all nodes recursively
  const { html: bodyHtml, components } = processNodes(nodes)

  // 2. Generate print CSS
  const printCss = generatePrintStyles(options.pageSize, options.margins)

  // 3. Get Chart.js script tag
  const chartJsScript = getChartJsScriptTag(false)

  // 4. Generate runtime config script
  const configScript = generateConfigScript(components, sampleData, options)

  // 5. Get watermark HTML if needed
  const watermarkHtml = options.includeWatermark ? WATERMARK_HTML : ''

  // 6. Assemble the complete HTML document
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(options.filename)}</title>

  <style>
    /* Reset and base styles */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #000;
      background: #fff;
    }

    /* Page container */
    #report {
      position: relative;
      width: 100%;
      min-height: 100vh;
    }

${printCss}
  </style>

  ${chartJsScript}
</head>
<body>
  <div id="report">
${bodyHtml}
  </div>

${watermarkHtml}

  <script>
${configScript}
  </script>

  <script>
${RUNTIME_TEMPLATE}
  </script>
</body>
</html>`

  return html
}

/**
 * Re-export types for external use
 */
export type { RendererResult } from './component-renderers/types'

/**
 * Export utility functions for external use
 */
export { escapeHtml, processNodes, findRootNodes }
