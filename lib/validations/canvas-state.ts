import { z } from 'zod';

/**
 * Security limits for canvas state validation
 */
export const SECURITY_LIMITS = {
  MAX_NODES: 1000,
  MAX_CHILDREN: 100,
  MAX_PROPS_SIZE: 10000,
  MAX_STRING_LENGTH: 50000,
  MAX_DEPTH: 100,
} as const;

/**
 * Sanitize a string by removing potentially dangerous content
 * - Removes <script> tags and their content
 * - Removes javascript: URLs
 * - Removes on* event handlers (including their values)
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') {
    return String(input);
  }

  let sanitized = input;

  // Remove <script> tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove on* event handlers (e.g., onclick="alert(1)", onerror="malicious()")
  // Matches: onXxx="value" or onXxx='value' including quoted strings
  sanitized = sanitized.replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '');
  // Also handle unquoted values (less common but possible)
  sanitized = sanitized.replace(/\bon\w+\s*=\s*\S+/gi, '');

  return sanitized;
}

/**
 * Recursively sanitize all string values in an object or array
 */
export function sanitizeProps<T = unknown>(props: T): T {
  if (props === null || props === undefined) {
    return props;
  }

  if (typeof props === 'string') {
    return sanitizeString(props) as T;
  }

  if (Array.isArray(props)) {
    return props.map(sanitizeProps) as T;
  }

  if (typeof props === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(props as Record<string, unknown>)) {
      result[key] = sanitizeProps(value);
    }
    return result as T;
  }

  return props;
}

/**
 * Schema for Craft.js type resolver object (actual Craft.js format)
 * type: { resolvedName: "ComponentName" }
 */
export const CraftTypeResolverSchema = z.object({
  resolvedName: z.string().max(200),
});

/**
 * Base schema for a canvas node (matches actual Craft.js serialize() output)
 *
 * Key differences from Craft.js internal format:
 * - id: Optional (node IDs are keys in the nodes object, not stored on the node itself)
 * - type: Object with resolvedName, not the CraftTypeResolverSchema format
 * - nodes: Array of child node IDs (for containers), not record of arrays
 * - linkedNodes: Object (mapping port names to node IDs), not array
 */
export const CanvasNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string().min(1).max(500).optional(),
    type: z.union([z.string().max(200), CraftTypeResolverSchema]),
    props: z
      .record(z.any())
      .refine(
        (props) => {
          // Check size limit for props
          const size = JSON.stringify(props).length;
          return size <= SECURITY_LIMITS.MAX_PROPS_SIZE;
        },
        {
          message: `Props size exceeds ${SECURITY_LIMITS.MAX_PROPS_SIZE} bytes`,
        }
      )
      .optional(),
    linkedNodes: z.record(z.string()).optional(),
    nodes: z.array(z.string()).max(SECURITY_LIMITS.MAX_CHILDREN).optional(),
    displayName: z.string().max(500).optional(),
    hidden: z.boolean().optional(),
    parent: z.string().max(500).optional(),
    isCanvas: z.boolean().optional(),
    custom: z.any().optional(),
  })
);

/**
 * Schema for the entire canvas state
 */
export const CanvasStateSchema = z.object({
  nodes: z
    .record(CanvasNodeSchema)
    .refine(
      (nodes) => {
        // Check total node count
        const nodeCount = Object.keys(nodes).length;
        return nodeCount <= SECURITY_LIMITS.MAX_NODES;
      },
      {
        message: `Total nodes exceeds ${SECURITY_LIMITS.MAX_NODES}`,
      }
    ),
  events: z.any().optional(),
});

/**
 * Type for validated canvas state
 */
export type ValidatedCanvasState = z.infer<typeof CanvasStateSchema>;

/**
 * Calculate the maximum depth of the node tree
 * Uses memoization to avoid redundant calculations
 */
function calculateMaxDepth(nodes: Record<string, any>, visited: Set<string> = new Set()): number {
  let maxDepth = 0;

  for (const nodeId in nodes) {
    if (visited.has(nodeId)) {
      // Circular reference detected, skip this path
      continue;
    }

    const node = nodes[nodeId];
    if (!node.parent) {
      // This is a root node, calculate depth from here
      const depth = calculateNodeDepth(nodeId, nodes, new Set());
      maxDepth = Math.max(maxDepth, depth);
    }
  }

  return maxDepth;
}

/**
 * Calculate depth for a specific node and all its children
 */
function calculateNodeDepth(
  nodeId: string,
  nodes: Record<string, any>,
  visited: Set<string>
): number {
  if (visited.has(nodeId)) {
    // Circular reference detected
    return 0;
  }

  const node = nodes[nodeId];
  if (!node) {
    return 0;
  }

  visited.add(nodeId);
  let maxChildDepth = 0;

  // Check linked nodes
  if (node.linkedNodes && Array.isArray(node.linkedNodes)) {
    for (const childId of node.linkedNodes) {
      const childDepth = calculateNodeDepth(childId, nodes, new Set(visited));
      maxChildDepth = Math.max(maxChildDepth, childDepth);
    }
  }

  // Check nodes in containers
  if (node.nodes && typeof node.nodes === 'object') {
    for (const container in node.nodes) {
      const children = node.nodes[container];
      if (Array.isArray(children)) {
        for (const childId of children) {
          const childDepth = calculateNodeDepth(childId, nodes, new Set(visited));
          maxChildDepth = Math.max(maxChildDepth, childDepth);
        }
      }
    }
  }

  return 1 + maxChildDepth;
}

/**
 * Validate and sanitize canvas state
 */
export interface ValidateCanvasStateResult {
  success: boolean;
  data?: ValidatedCanvasState;
  error?: string;
}

export function validateCanvasState(input: unknown): ValidateCanvasStateResult {
  // Quick size check before parsing
  if (input === null || input === undefined) {
    return {
      success: false,
      error: 'Canvas state is null or undefined',
    };
  }

  // Check if input is an object
  if (typeof input !== 'object') {
    return {
      success: false,
      error: 'Canvas state must be an object',
    };
  }

  const obj = input as Record<string, unknown>;

  // Check serialized size
  try {
    const serialized = JSON.stringify(input);
    if (serialized.length > 10_000_000) {
      // 10MB limit
      return {
        success: false,
        error: 'Canvas state too large (exceeds 10MB)',
      };
    }
  } catch {
    return {
      success: false,
      error: 'Failed to serialize canvas state',
    };
  }

  // Determine format: wrapped (has 'nodes' property) or direct (IS the nodes object)
  let nodes: Record<string, unknown>;
  let rootNodeId: string | undefined;

  if ('nodes' in obj && obj.nodes && typeof obj.nodes === 'object') {
    // Wrapped format: { nodes: {...}, rootNodeId: '...' }
    nodes = obj.nodes as Record<string, unknown>;
    rootNodeId = obj.rootNodeId as string | undefined;
  } else {
    // Direct format: { nodeId1: {...}, nodeId2: {...} }
    // Validate that this looks like a nodes object (has node-like keys)
    const keys = Object.keys(obj);
    if (keys.length === 0) {
      return {
        success: false,
        error: 'Canvas state is empty',
      };
    }

    // Check if this looks like a Craft.js nodes object
    // by checking a sample key for node-like structure
    const sampleKey = keys[0];
    const sampleValue = obj[sampleKey];
    if (!sampleValue || typeof sampleValue !== 'object') {
      return {
        success: false,
        error: 'Canvas state does not contain valid nodes',
      };
    }

    nodes = obj;
  }

  // Create wrapped format for validation
  const wrappedInput = { nodes, events: obj.events };

  // Parse with Zod schema
  const parseResult = CanvasStateSchema.safeParse(wrappedInput);

  if (!parseResult.success) {
    const errors = parseResult.error.errors.map((err) => {
      const path = err.path.join('.');
      return `${path ? path + ': ' : ''}${err.message}`;
    }).join('; ');

    return {
      success: false,
      error: `Validation failed: ${errors}`,
    };
  }

  // Check maximum depth of the node tree
  const parsedNodes = parseResult.data.nodes;
  const maxDepth = calculateMaxDepth(parsedNodes);

  if (maxDepth > SECURITY_LIMITS.MAX_DEPTH) {
    return {
      success: false,
      error: `Node depth exceeds ${SECURITY_LIMITS.MAX_DEPTH} levels (actual: ${maxDepth})`,
    };
  }

  // Sanitize props in all nodes
  const sanitizedData = parseResult.data;

  for (const nodeId in parsedNodes) {
    if (parsedNodes[nodeId].props) {
      parsedNodes[nodeId].props = sanitizeProps(parsedNodes[nodeId].props);
    }
  }

  // If the original was in direct format, preserve that structure
  // Otherwise, return the wrapped format
  const result = ('nodes' in obj && obj.nodes)
    ? sanitizedData
    : { ...sanitizedData, nodes: sanitizedData.nodes };

  return {
    success: true,
    data: result,
  };
}
