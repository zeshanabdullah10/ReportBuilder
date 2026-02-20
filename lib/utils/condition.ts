/**
 * Condition Evaluation Utilities
 *
 * Used for conditional rendering of components based on data values.
 */

/**
 * Evaluate a visibility condition against data
 * 
 * @param condition - The condition string (e.g., "data.status === 'PASS'" or "data.count > 0")
 * @param data - The data object to evaluate against
 * @returns boolean - Whether the condition is true
 * 
 * @example
 * evaluateCondition("data.status === 'PASS'", { status: 'PASS' }) // true
 * evaluateCondition("data.count > 5", { count: 3 }) // false
 */
export function evaluateCondition(condition: string | undefined | null, data: Record<string, unknown> | null): boolean {
  // No condition means always visible
  if (!condition || condition.trim() === '') {
    return true
  }

  // No data means we can't evaluate - show by default
  if (!data) {
    return true
  }

  try {
    // Normalize the condition - replace 'data.' prefix for evaluation
    let normalizedCondition = condition.trim()
    
    // Create a safe evaluation context
    // We'll use the Function constructor for a controlled evaluation
    const evalFunction = new Function('data', `
      try {
        return ${normalizedCondition}
      } catch (e) {
        return true // Show on error
      }
    `)
    
    return evalFunction(data)
  } catch (error) {
    console.warn('Condition evaluation failed:', error)
    return true // Show by default on error
  }
}

/**
 * Check if a condition string is valid syntax
 * 
 * @param condition - The condition string to validate
 * @returns { valid: boolean, error?: string }
 */
export function validateCondition(condition: string): { valid: boolean; error?: string } {
  if (!condition || condition.trim() === '') {
    return { valid: true }
  }

  try {
    // Try to create a function with the condition
    new Function('data', `return ${condition}`)
    return { valid: true }
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Invalid condition syntax'
    }
  }
}

/**
 * Get example conditions for help text
 */
export const CONDITION_EXAMPLES = [
  { label: 'Status is PASS', condition: "data.status === 'PASS'" },
  { label: 'Count greater than 0', condition: 'data.count > 0' },
  { label: 'Has items', condition: 'data.items && data.items.length > 0' },
  { label: 'Is calibrated', condition: 'data.calibration?.isCalibrated === true' },
  { label: 'Temperature in range', condition: 'data.temperature >= 20 && data.temperature <= 30' },
  { label: 'Not empty', condition: 'data.value !== null && data.value !== undefined' },
]
