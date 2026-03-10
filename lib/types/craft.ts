/**
 * TypeScript types for Craft.js canvas state
 * These types represent the serialized state of a Craft.js canvas
 */

/**
 * Props that can be stored on a Craft.js node
 */
export interface CraftNodeProps {
  [key: string]: unknown
  width?: string | number
  height?: string | number
  x?: number
  y?: number
  zIndex?: number
  background?: string
  padding?: number
}

/**
 * A serialized Craft.js node
 */
export interface SerializedNode {
  type: string | { resolvedName: string }
  props: CraftNodeProps
  custom?: Record<string, unknown>
  hidden?: boolean
  parent?: string | null
  isCanvas?: boolean
  nodes?: string[]
  linkedNodes?: Record<string, string>
}

/**
 * The main Craft.js canvas state (result of craft.actions.serialize())
 */
export interface CraftCanvasState {
  [nodeId: string]: SerializedNode
}

/**
 * Node type used in layer utilities
 */
export interface CraftNode {
  props: CraftNodeProps
  custom?: Record<string, unknown>
  hidden?: boolean
}
