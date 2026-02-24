/**
 * Types for Component Renderers
 *
 * Defines the interface for component renderers used in template export.
 */

/**
 * Result from rendering a component
 */
export interface RendererResult {
  /** The rendered HTML string */
  html: string
  /** Optional component configuration for runtime JavaScript */
  componentConfig?: object | null
}

/**
 * Component renderer function type
 *
 * @param id - The component's unique identifier
 * @param props - The component's properties
 * @returns The renderer result containing HTML and optional config
 */
export type ComponentRenderer = (id: string, props: Record<string, unknown>) => RendererResult
