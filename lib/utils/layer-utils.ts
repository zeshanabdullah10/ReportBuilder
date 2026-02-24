/**
 * Layer utility functions for managing z-index values
 */

/**
 * Get all z-index values from components on the canvas
 */
export function getAllZIndices(nodes: Record<string, any>): number[] {
  const zIndices: number[] = []

  if (!nodes) return [1]

  Object.values(nodes).forEach((node: any) => {
    if (node.props && typeof node.props.zIndex === 'number') {
      zIndices.push(node.props.zIndex)
    }
  })

  return zIndices.length > 0 ? zIndices : [1]
}

/**
 * Get the maximum z-index value (highest layer)
 */
export function getMaxZIndex(nodes: Record<string, any>): number {
  const zIndices = getAllZIndices(nodes)
  return Math.max(...zIndices, 1)
}

/**
 * Get the minimum z-index value (lowest layer)
 * Returns at least 1 (z-index should never be 0 or negative)
 */
export function getMinZIndex(nodes: Record<string, any>): number {
  const zIndices = getAllZIndices(nodes)
  return Math.min(...zIndices, 1)
}

/**
 * Calculate the next z-index for bringing a component to front
 */
export function getNextZIndex(nodes: Record<string, any>): number {
  return getMaxZIndex(nodes) + 1
}

/**
 * Calculate the z-index for sending a component to back
 * Returns 1 as the minimum
 */
export function getBackZIndex(): number {
  return 1
}
