/**
 * Data Binding Utilities
 *
 * Provides functions for resolving {{data.path}} syntax in templates
 * with support for nested paths and graceful handling of missing data.
 */

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
