/**
 * Data Path Utilities
 *
 * Provides functions for extracting and working with data paths
 * for the visual data binding picker.
 */

export type DataType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null' | 'undefined'

export interface DataPathInfo {
  path: string // "data.results.passCount"
  key: string // "passCount"
  type: DataType
  depth: number
  isArray: boolean
  preview?: string // First 50 chars of value
  children?: DataPathInfo[]
  childCount?: number // For arrays/objects
}

/**
 * Determines the data type of a value
 */
export function getDataType(value: unknown): DataType {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (Array.isArray(value)) return 'array'
  if (typeof value === 'object') return 'object'
  return typeof value as DataType
}

/**
 * Creates a preview string for a value (first 50 chars)
 */
export function createValuePreview(value: unknown, maxLength = 50): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'

  const type = getDataType(value)

  switch (type) {
    case 'string': {
      const str = value as string
      return str.length > maxLength ? str.slice(0, maxLength) + '...' : str
    }
    case 'number':
    case 'boolean':
      return String(value)
    case 'array': {
      const arr = value as unknown[]
      return `Array(${arr.length})`
    }
    case 'object': {
      const obj = value as Record<string, unknown>
      const keys = Object.keys(obj)
      return `Object{${keys.length}}`
    }
    default:
      return String(value)
  }
}

/**
 * Extracts all data paths from a data object in a hierarchical structure
 * @param data - The data object to extract paths from
 * @param prefix - Current path prefix (default: 'data')
 * @param maxDepth - Maximum depth to traverse (default: 5)
 * @param currentDepth - Current traversal depth
 */
export function extractDataPaths(
  data: Record<string, unknown>,
  prefix = 'data',
  maxDepth = 5,
  currentDepth = 0
): DataPathInfo[] {
  if (!data || typeof data !== 'object' || currentDepth >= maxDepth) {
    return []
  }

  const paths: DataPathInfo[] = []

  for (const [key, value] of Object.entries(data)) {
    const path = prefix ? `${prefix}.${key}` : key
    const type = getDataType(value)
    const isArray = Array.isArray(value)
    const preview = createValuePreview(value)

    const pathInfo: DataPathInfo = {
      path,
      key,
      type,
      depth: currentDepth,
      isArray,
      preview,
    }

    // For objects and arrays, extract children
    if ((type === 'object' || type === 'array') && value !== null && currentDepth < maxDepth - 1) {
      if (isArray) {
        // For arrays, show first few items and total count
        const arr = value as unknown[]
        pathInfo.childCount = arr.length
        pathInfo.children = []

        // Show first 10 items
        const itemsToShow = Math.min(arr.length, 10)
        for (let i = 0; i < itemsToShow; i++) {
          const itemPath = `${path}[${i}]`
          const itemType = getDataType(arr[i])
          const itemPreview = createValuePreview(arr[i])

          const itemInfo: DataPathInfo = {
            path: itemPath,
            key: `[${i}]`,
            type: itemType,
            depth: currentDepth + 1,
            isArray: Array.isArray(arr[i]),
            preview: itemPreview,
          }

          // If array item is object/array, recursively get children
          if ((itemType === 'object' || itemType === 'array') && arr[i] !== null) {
            itemInfo.children = extractDataPaths(
              arr[i] as Record<string, unknown>,
              itemPath,
              maxDepth,
              currentDepth + 2
            )
            itemInfo.childCount = Array.isArray(arr[i])
              ? (arr[i] as unknown[]).length
              : Object.keys(arr[i] as Record<string, unknown>).length
          }

          pathInfo.children.push(itemInfo)
        }

        // Indicate if there are more items
        if (arr.length > 10) {
          pathInfo.children.push({
            path: `${path}[...]`,
            key: '...',
            type: 'undefined',
            depth: currentDepth + 1,
            isArray: false,
            preview: `${arr.length - 10} more items`,
          })
        }
      } else {
        // For objects, recursively extract children
        const childPaths = extractDataPaths(
          value as Record<string, unknown>,
          path,
          maxDepth,
          currentDepth + 1
        )
        pathInfo.children = childPaths
        pathInfo.childCount = Object.keys(value as Record<string, unknown>).length
      }
    }

    paths.push(pathInfo)
  }

  // Sort: objects and arrays first, then alphabetically by key
  return paths.sort((a, b) => {
    const aIsContainer = a.type === 'object' || a.type === 'array'
    const bIsContainer = b.type === 'object' || b.type === 'array'

    if (aIsContainer && !bIsContainer) return -1
    if (!aIsContainer && bIsContainer) return 1
    return a.key.localeCompare(b.key)
  })
}

/**
 * Result of validating a binding path
 */
export interface ValidationResult {
  valid: boolean
  error?: string
  resolvedType?: DataType
  typeMismatch?: boolean  // True when type doesn't match expectedType
  suggestion?: string     // Suggested compatible path if type mismatch
}

/**
 * Checks if a data type is compatible with an expected type
 * Arrays are compatible with any type for their items
 */
function isTypeCompatible(actual: DataType, expected: DataType): boolean {
  if (actual === expected) return true

  // Arrays are flexible - they can contain any type
  if (expected === 'array') {
    return actual === 'array'
  }

  // Numbers can accept numeric strings
  if (expected === 'number' && actual === 'string') {
    return true
  }

  // Strings can accept numbers
  if (expected === 'string' && actual === 'number') {
    return true
  }

  return false
}

/**
 * Validates a binding path against sample data
 * @param path - The binding path to validate
 * @param data - The sample data to validate against
 * @param expectedType - Optional expected type for type checking
 */
export function validateBindingPath(
  path: string,
  data: Record<string, unknown> | null,
  expectedType?: DataType
): ValidationResult {
  if (!path) {
    return { valid: false, error: 'Path is empty' }
  }

  if (!data) {
    return { valid: false, error: 'No sample data loaded' }
  }

  // Remove {{ }} wrapper if present
  let normalizedPath = path.trim()
  if (normalizedPath.startsWith('{{') && normalizedPath.endsWith('}}')) {
    normalizedPath = normalizedPath.slice(2, -2).trim()
  }

  // Remove 'data.' prefix if present
  if (normalizedPath.startsWith('data.')) {
    normalizedPath = normalizedPath.slice(5)
  }

  if (!normalizedPath) {
    return { valid: false, error: 'Path is empty' }
  }

  // Navigate the path
  const parts = normalizedPath.split(/[.[\]]+/).filter(Boolean)
  let current: unknown = data

  for (const part of parts) {
    if (current === null || current === undefined) {
      return { valid: false, error: `Path not found: ${path}` }
    }

    if (typeof current !== 'object') {
      return { valid: false, error: `Cannot access property "${part}" on non-object` }
    }

    if (Array.isArray(current)) {
      const index = parseInt(part, 10)
      if (isNaN(index) || index < 0 || index >= current.length) {
        return { valid: false, error: `Array index out of bounds: ${part}` }
      }
      current = current[index]
    } else {
      current = (current as Record<string, unknown>)[part]
    }
  }

  if (current === undefined) {
    return { valid: false, error: `Path not found: ${path}` }
  }

  const resolvedType = getDataType(current)

  // Check type compatibility if expectedType is provided
  if (expectedType && !isTypeCompatible(resolvedType, expectedType)) {
    // Try to find a suggestion
    const suggestion = findCompatiblePath(data, expectedType, normalizedPath)

    return {
      valid: true, // Path exists, but type doesn't match
      resolvedType,
      typeMismatch: true,
      error: `Type mismatch: expected ${expectedType}, got ${resolvedType}`,
      suggestion,
    }
  }

  return { valid: true, resolvedType }
}

/**
 * Finds a compatible path in the data for the expected type
 */
function findCompatiblePath(
  data: Record<string, unknown>,
  expectedType: DataType,
  excludePath: string
): string | undefined {
  const paths = extractDataPaths(data)
  const flatPaths = flattenPaths(paths)

  // Find first path that matches the expected type
  const compatible = flatPaths.find(
    (p) => p.type === expectedType && p.path !== excludePath && !p.path.includes('[...]')
  )

  return compatible?.path
}

/**
 * Formats a path as a binding expression {{data.path}}
 */
export function formatAsBinding(path: string): string {
  // Remove existing {{ }} wrapper if present
  let normalizedPath = path.trim()
  if (normalizedPath.startsWith('{{') && normalizedPath.endsWith('}}')) {
    normalizedPath = normalizedPath.slice(2, -2).trim()
  }

  // Ensure data. prefix
  if (!normalizedPath.startsWith('data.')) {
    normalizedPath = `data.${normalizedPath}`
  }

  return `{{${normalizedPath}}}`
}

/**
 * Extracts the raw path from a binding expression
 */
export function extractRawPath(binding: string): string {
  if (!binding) return ''

  // Remove {{ }} wrapper if present
  let path = binding.trim()
  if (path.startsWith('{{') && path.endsWith('}}')) {
    path = path.slice(2, -2).trim()
  }

  return path
}

/**
 * Flattens hierarchical paths into a flat array for searching
 */
export function flattenPaths(paths: DataPathInfo[]): DataPathInfo[] {
  const result: DataPathInfo[] = []

  function traverse(items: DataPathInfo[]) {
    for (const item of items) {
      result.push(item)
      if (item.children && item.children.length > 0) {
        traverse(item.children)
      }
    }
  }

  traverse(paths)
  return result
}

/**
 * Searches paths by key or path string
 */
export function searchPaths(paths: DataPathInfo[], query: string): DataPathInfo[] {
  if (!query.trim()) return paths

  const flatPaths = flattenPaths(paths)
  const lowerQuery = query.toLowerCase()

  return flatPaths.filter(
    (item) =>
      item.key.toLowerCase().includes(lowerQuery) || item.path.toLowerCase().includes(lowerQuery)
  )
}
