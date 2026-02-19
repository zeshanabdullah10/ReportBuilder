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
 * Individual node in the Craft.js tree
 */
export interface CanvasNode {
  id: string
  type: string
  props: Record<string, unknown>
  nodes?: string[] // Child node IDs (for containers)
  custom?: Record<string, unknown>
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
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char)
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
  return Object.values(nodes).filter((node) => !childIds.has(node.id))
}

/**
 * Process a single node and its children recursively
 */
function processNodeRecursive(
  node: CanvasNode,
  allNodes: Record<string, CanvasNode>,
  allConfigs: RendererResult['componentConfig'][]
): RendererResult {
  const renderer = getRenderer(node.type)

  if (!renderer) {
    // Fallback for unknown component types
    return {
      html: `<!-- Unknown component type: ${escapeHtml(node.type)} -->`,
      componentConfig: {
        id: node.id,
        type: node.type,
        props: node.props,
      },
    }
  }

  // Render this node
  const result = renderer(node.id, node.props)

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
    if (node.type === 'Container' && result.html) {
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
