import type { CanvasState, CanvasNode } from '@/lib/export/html-compiler'

/**
 * Result of template validation
 */
export interface ValidationResult {
  isValid: boolean
  warnings: ValidationWarning[]
  errors: ValidationError[]
}

/**
 * Non-blocking warnings (export can proceed)
 */
export interface ValidationWarning {
  type: 'empty_template' | 'missing_binding' | 'missing_sample_data' | 'large_template'
  message: string
  componentId?: string
  componentName?: string
  details?: Record<string, unknown>
}

/**
 * Blocking errors (export cannot proceed)
 */
export interface ValidationError {
  type: 'invalid_state' | 'corrupted_data'
  message: string
}

/**
 * Binding reference found in template
 */
interface BindingReference {
  path: string
  componentId: string
  componentName: string
  propertyName: string
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
 * Extract all data binding references from the canvas state
 */
function extractBindings(canvasState: CanvasState): BindingReference[] {
  const bindings: BindingReference[] = []
  const nodes = canvasState.nodes || (canvasState as unknown as Record<string, CanvasNode>)

  for (const [nodeId, node] of Object.entries(nodes)) {
    if (!node || typeof node !== 'object') continue

    const componentName = getComponentType(node)
    const props = node.props || {}

    // Check common binding properties
    const bindingProps = ['binding', 'dataBinding', 'textBinding', 'labelsBinding', 'dataPointsBinding']
    
    for (const propName of bindingProps) {
      const value = props[propName]
      if (typeof value === 'string' && value.startsWith('data.')) {
        bindings.push({
          path: value,
          componentId: nodeId,
          componentName,
          propertyName: propName,
        })
      }
    }

    // Check text content for interpolation patterns
    if (typeof props.text === 'string') {
      const matches = props.text.match(/\{\{([^}]+)\}\}/g)
      if (matches) {
        for (const match of matches) {
          const path = match.slice(2, -2).trim()
          if (path.startsWith('data.')) {
            bindings.push({
              path,
              componentId: nodeId,
              componentName,
              propertyName: 'text',
            })
          }
        }
      }
    }
  }

  return bindings
}

/**
 * Resolve a binding path to check if it exists in sample data
 */
function resolveBindingPath(path: string, data: Record<string, unknown>): boolean {
  const normalizedPath = path.startsWith('data.') ? path.slice(5) : path
  const parts = normalizedPath.split('.')
  let current: unknown = data

  for (const part of parts) {
    if (current == null || typeof current !== 'object') {
      return false
    }
    current = (current as Record<string, unknown>)[part]
  }

  return current !== undefined
}

/**
 * Count the number of component nodes in the canvas state
 */
function countComponents(canvasState: CanvasState): number {
  const nodes = canvasState.nodes || (canvasState as unknown as Record<string, CanvasNode>)
  let count = 0

  for (const node of Object.values(nodes)) {
    if (!node || typeof node !== 'object') continue
    const type = getComponentType(node)
    if (type !== 'Page' && type !== 'ROOT') {
      count++
    }
  }

  return count
}

/**
 * Validate a template before export
 * 
 * @param canvasState - The Craft.js canvas state
 * @param sampleData - Optional sample data to validate bindings against
 * @returns Validation result with warnings and errors
 */
export function validateTemplate(
  canvasState: CanvasState | null | undefined,
  sampleData: Record<string, unknown> | null
): ValidationResult {
  const warnings: ValidationWarning[] = []
  const errors: ValidationError[] = []

  // Check for null/undefined state
  if (!canvasState) {
    errors.push({
      type: 'invalid_state',
      message: 'Template state is missing or invalid',
    })
    return { isValid: false, warnings, errors }
  }

  // Check for empty state object
  const nodes = canvasState.nodes || (canvasState as unknown as Record<string, CanvasNode>)
  if (Object.keys(nodes).length === 0) {
    errors.push({
      type: 'invalid_state',
      message: 'Template has no nodes',
    })
    return { isValid: false, warnings, errors }
  }

  // Count components
  const componentCount = countComponents(canvasState)

  // Check for empty template (only Page component)
  if (componentCount === 0) {
    warnings.push({
      type: 'empty_template',
      message: 'This template appears to be empty. Add some components before exporting.',
    })
  }

  // Check for large template (performance warning)
  if (componentCount > 100) {
    warnings.push({
      type: 'large_template',
      message: `This template has ${componentCount} components. Large templates may take longer to export and render.`,
      details: { componentCount },
    })
  }

  // Extract and validate bindings
  const bindings = extractBindings(canvasState)

  if (bindings.length > 0 && !sampleData) {
    warnings.push({
      type: 'missing_sample_data',
      message: `Template has ${bindings.length} data bindings but no sample data is provided. Bindings will show placeholder values in the exported template.`,
      details: { bindingCount: bindings.length },
    })
  } else if (bindings.length > 0 && sampleData) {
    // Check each binding against sample data
    for (const binding of bindings) {
      const exists = resolveBindingPath(binding.path, sampleData)
      if (!exists) {
        warnings.push({
          type: 'missing_binding',
          message: `Data binding "${binding.path}" not found in sample data`,
          componentId: binding.componentId,
          componentName: binding.componentName,
          details: { path: binding.path },
        })
      }
    }
  }

  // Template is valid if there are no blocking errors
  const isValid = errors.length === 0

  return { isValid, warnings, errors }
}

/**
 * Get a summary of the validation result for display
 */
export function getValidationSummary(result: ValidationResult): string {
  const parts: string[] = []

  if (result.errors.length > 0) {
    parts.push(`${result.errors.length} error${result.errors.length !== 1 ? 's' : ''}`)
  }
  if (result.warnings.length > 0) {
    parts.push(`${result.warnings.length} warning${result.warnings.length !== 1 ? 's' : ''}`)
  }

  if (parts.length === 0) {
    return 'Template is ready for export'
  }

  return parts.join(', ')
}
