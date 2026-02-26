/**
 * Data Binding Utilities
 *
 * Provides functions for resolving {{data.path}} syntax in templates
 * with support for nested paths and graceful handling of missing data.
 */

import { DataType, getDataType, validateBindingPath } from './data-paths'

/**
 * Status of a data binding
 */
export interface BindingStatus {
  isValid: boolean
  isUsingFallback: boolean
  error?: string
  expectedType?: DataType
  actualType?: DataType
  hasBinding: boolean
}

/**
 * Gets the status of a binding for runtime feedback
 * @param binding - The binding string (e.g., "{{data.field}}")
 * @param sampleData - The sample data to check against
 * @param expectedType - Optional expected type for type checking
 * @returns BindingStatus with validity and type information
 */
export function getBindingStatus(
  binding: string,
  sampleData: Record<string, unknown> | null,
  expectedType?: DataType
): BindingStatus {
  // No binding present
  if (!binding || !hasBindings(binding)) {
    return {
      isValid: true,
      isUsingFallback: false,
      hasBinding: false,
    }
  }

  // No sample data - can't validate but has binding
  if (!sampleData) {
    return {
      isValid: false,
      isUsingFallback: true,
      error: 'No sample data loaded',
      hasBinding: true,
    }
  }

  // Validate the binding
  const validation = validateBindingPath(binding, sampleData, expectedType)

  if (!validation.valid) {
    return {
      isValid: false,
      isUsingFallback: true,
      error: validation.error,
      expectedType,
      hasBinding: true,
    }
  }

  if (validation.typeMismatch) {
    return {
      isValid: false,
      isUsingFallback: true,
      error: validation.error,
      expectedType,
      actualType: validation.resolvedType,
      hasBinding: true,
    }
  }

  return {
    isValid: true,
    isUsingFallback: false,
    expectedType,
    actualType: validation.resolvedType,
    hasBinding: true,
  }
}

/**
 * Extracts field names from an array of objects for field mapping
 * @param data - Array of objects to extract fields from
 * @returns Array of unique field names found in the objects
 */
export function extractArrayFields(data: unknown[]): string[] {
  if (!Array.isArray(data) || data.length === 0) return []

  const fieldSet = new Set<string>()

  for (const item of data) {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      Object.keys(item as Record<string, unknown>).forEach((key) => fieldSet.add(key))
    }
  }

  return Array.from(fieldSet).sort()
}

/**
 * Auto-detects the best label field from an array of objects
 * @param fields - Available field names
 * @param sampleObject - Sample object to check field types
 * @returns Best field name to use for labels
 */
export function autoDetectLabelField(fields: string[], sampleObject?: Record<string, unknown>): string {
  // Priority order for label fields
  const labelCandidates = ['label', 'name', 'title', 'key', 'id', 'text']

  for (const candidate of labelCandidates) {
    if (fields.includes(candidate)) return candidate
  }

  // If we have a sample object, find the first string field
  if (sampleObject) {
    for (const field of fields) {
      const value = sampleObject[field]
      if (typeof value === 'string') return field
    }
  }

  // Fall back to first field
  return fields[0] || ''
}

/**
 * Auto-detects the best value field from an array of objects
 * @param fields - Available field names
 * @param sampleObject - Sample object to check field types
 * @returns Best field name to use for values
 */
export function autoDetectValueField(fields: string[], sampleObject?: Record<string, unknown>): string {
  // Priority order for value fields
  const valueCandidates = ['value', 'count', 'amount', 'total', 'y', 'score', 'number']

  for (const candidate of valueCandidates) {
    if (fields.includes(candidate)) return candidate
  }

  // If we have a sample object, find the first numeric field
  if (sampleObject) {
    for (const field of fields) {
      const value = sampleObject[field]
      if (typeof value === 'number') return field
    }
  }

  // Fall back to first field that's not likely a label
  const nonLabelFields = fields.filter(
    (f) => !['label', 'name', 'title', 'key', 'id', 'text'].includes(f)
  )

  return nonLabelFields[0] || fields[0] || ''
}

/**
 * Resolves a dot-notation path within a data object
 * @param path - Dot-notation path like "results.tests" or "data.value"
 * @param data - The data object to resolve the path from
 * @returns The resolved value or undefined if path not found
 */
export function resolveBinding(
  path: string,
  data: Record<string, unknown>
): unknown {
  if (!path || !data) return undefined

  // Remove 'data.' prefix if present (common pattern in templates)
  const normalizedPath = path.startsWith('data.') ? path.slice(5) : path

  const parts = normalizedPath.split('.')
  let current: unknown = data

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined
    }

    if (typeof current !== 'object') {
      return undefined
    }

    // Handle array index access (e.g., "items[0]" or "items.0")
    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/)
    if (arrayMatch) {
      const [, key, index] = arrayMatch
      current = (current as Record<string, unknown>)[key]
      if (Array.isArray(current)) {
        current = current[parseInt(index, 10)]
      } else {
        return undefined
      }
    } else {
      current = (current as Record<string, unknown>)[part]
    }
  }

  return current
}

/**
 * Interpolates {{data.path}} placeholders in text with resolved values
 * @param text - Text containing {{data.path}} placeholders
 * @param data - The data object to resolve paths from
 * @returns Text with placeholders replaced by resolved values
 */
export function interpolateText(
  text: string,
  data: Record<string, unknown>
): string {
  if (!text || !data) return text ?? ''

  // Match {{data.path}} or {{path}} patterns
  const bindingPattern = /\{\{([^}]+)\}\}/g

  return text.replace(bindingPattern, (match, path) => {
    const trimmedPath = path.trim()
    const value = resolveBinding(trimmedPath, data)

    if (value === undefined || value === null) {
      // Return empty string for missing values, or keep the placeholder
      // depending on preference - here we return empty string
      return ''
    }

    if (typeof value === 'object') {
      // For objects/arrays, return JSON string
      return JSON.stringify(value)
    }

    return String(value)
  })
}

/**
 * Checks if a string contains any binding placeholders
 * @param text - Text to check for bindings
 * @returns true if text contains {{...}} placeholders
 */
export function hasBindings(text: string): boolean {
  if (!text) return false
  return /\{\{[^}]+\}\}/.test(text)
}

/**
 * Extracts all binding paths from a string
 * @param text - Text containing {{data.path}} placeholders
 * @returns Array of paths found in the text
 */
export function extractBindings(text: string): string[] {
  if (!text) return []

  const bindingPattern = /\{\{([^}]+)\}\}/g
  const paths: string[] = []
  let match

  while ((match = bindingPattern.exec(text)) !== null) {
    paths.push(match[1].trim())
  }

  return paths
}

/**
 * Resolves a binding string or returns the original if not a binding
 * @param value - Value that might be a binding path like "{{data.path}}"
 * @param data - Data object to resolve bindings from
 * @returns Resolved value or original if not a binding
 */
export function resolveBindingOrValue<T>(
  value: T,
  data: Record<string, unknown>
): T | unknown {
  if (typeof value !== 'string') return value

  // Check if it's a single binding (entire string is one placeholder)
  const singleBindingMatch = value.match(/^\{\{([^}]+)\}\}$/)
  if (singleBindingMatch) {
    return resolveBinding(singleBindingMatch[1].trim(), data)
  }

  // Check if it contains any bindings
  if (hasBindings(value)) {
    return interpolateText(value, data)
  }

  return value
}
