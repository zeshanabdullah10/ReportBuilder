import { describe, it, expect } from 'vitest'
import type { CanvasNode, CanvasState, ExportOptions } from './html-compiler'

describe('html-compiler types and interfaces', () => {
  describe('CanvasNode', () => {
    it('should accept string type', () => {
      const node: CanvasNode = {
        type: 'Text',
        props: { text: 'Hello' },
      }
      expect(node.type).toBe('Text')
    })

    it('should accept resolvedName type', () => {
      const node: CanvasNode = {
        type: { resolvedName: 'Container' },
        props: {},
        nodes: [],
      }
      expect((node.type as { resolvedName: string }).resolvedName).toBe('Container')
    })

    it('should support optional properties', () => {
      const node: CanvasNode = {
        id: 'node-1',
        type: 'Text',
        props: { text: 'Hello' },
        nodes: ['child-1'],
        custom: { displayName: 'My Text' },
      }
      expect(node.id).toBe('node-1')
      expect(node.nodes).toHaveLength(1)
      expect(node.custom?.displayName).toBe('My Text')
    })
  })

  describe('CanvasState', () => {
    it('should accept nodes record', () => {
      const state: CanvasState = {
        nodes: {
          'node-1': { type: 'Text', props: { text: 'Hello' } },
        },
      }
      expect(Object.keys(state.nodes)).toHaveLength(1)
    })

    it('should support optional rootNodeId', () => {
      const state: CanvasState = {
        nodes: {},
        rootNodeId: 'root',
      }
      expect(state.rootNodeId).toBe('root')
    })
  })

  describe('ExportOptions', () => {
    it('should define complete export options', () => {
      const options: ExportOptions = {
        filename: 'test-report',
        includeSampleData: true,
        pageSize: 'A4',
        margins: { top: 20, right: 20, bottom: 20, left: 20 },
        includeWatermark: false,
      }
      expect(options.pageSize).toBe('A4')
      expect(options.margins.top).toBe(20)
    })

    it('should support Letter page size', () => {
      const options: ExportOptions = {
        filename: 'test-report',
        includeSampleData: false,
        pageSize: 'Letter',
        margins: { top: 25, right: 25, bottom: 25, left: 25 },
        includeWatermark: true,
      }
      expect(options.pageSize).toBe('Letter')
      expect(options.includeWatermark).toBe(true)
    })
  })
})

describe('html-compiler utilities', () => {
  describe('getComponentType helper', () => {
    const getComponentType = (node: CanvasNode): string => {
      if (typeof node.type === 'string') {
        return node.type
      }
      if (node.type && typeof node.type === 'object' && 'resolvedName' in node.type) {
        return node.type.resolvedName
      }
      return 'Unknown'
    }

    it('should extract type from string type', () => {
      const node: CanvasNode = {
        type: 'Text',
        props: { text: 'Hello' },
      }
      expect(getComponentType(node)).toBe('Text')
    })

    it('should extract type from CraftTypeResolver', () => {
      const node: CanvasNode = {
        type: { resolvedName: 'Container' },
        props: {},
      }
      expect(getComponentType(node)).toBe('Container')
    })

    it('should return Unknown for null type', () => {
      const node: CanvasNode = {
        type: null as unknown as string,
      }
      expect(getComponentType(node)).toBe('Unknown')
    })
  })

  describe('escapeHtml helper', () => {
    const APOS = '\u0027'
    const ESCAPED_APOS = '\u0026\u0023\u0033\u0039\u003B'
    
    const escapeHtml = (text: unknown): string => {
      if (text == null) return ''
      const str = String(text)
      const htmlEscapes: Record<string, string> = {
        '&': '&',
        '<': '<',
        '>': '>',
        '"': '"',
      }
      return str.replace(/[&<>"']/g, (char) => {
        if (char === APOS) return ESCAPED_APOS
        return htmlEscapes[char] || char
      })
    }

    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '<script>alert("xss")</script>'
      )
    })

    it('should escape single quotes', () => {
      const input = `Hello ${APOS}world${APOS}`
      const expected = `Hello ${ESCAPED_APOS}world${ESCAPED_APOS}`
      expect(escapeHtml(input)).toBe(expected)
    })

    it('should escape ampersands', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom & Jerry')
    })

    it('should handle null', () => {
      expect(escapeHtml(null)).toBe('')
    })

    it('should handle undefined', () => {
      expect(escapeHtml(undefined)).toBe('')
    })

    it('should handle numbers', () => {
      expect(escapeHtml(42)).toBe('42')
    })

    it('should return empty string for empty input', () => {
      expect(escapeHtml('')).toBe('')
    })
  })

  describe('findRootNodes helper', () => {
    const findRootNodes = (nodes: Record<string, CanvasNode>): CanvasNode[] => {
      const childIds = new Set<string>()

      for (const node of Object.values(nodes)) {
        if (node.nodes) {
          node.nodes.forEach((childId) => childIds.add(childId))
        }
      }

      return Object.entries(nodes)
        .filter(([nodeId, node]) => !childIds.has(nodeId) && !childIds.has(node.id || ''))
        .map(([nodeId, node]) => ({ ...node, id: node.id || nodeId }))
    }

    it('should find root nodes (nodes not children of others)', () => {
      const nodes: Record<string, CanvasNode> = {
        root: { type: 'Page', props: {}, nodes: ['child-1'] },
        'child-1': { type: 'Text', props: { text: 'Hello' } },
      }

      const roots = findRootNodes(nodes)
      expect(roots).toHaveLength(1)
      expect(roots[0].type).toBe('Page')
    })

    it('should return all nodes when none are children', () => {
      const nodes: Record<string, CanvasNode> = {
        node1: { type: 'Text', props: {} },
        node2: { type: 'Text', props: {} },
      }

      const roots = findRootNodes(nodes)
      expect(roots).toHaveLength(2)
    })

    it('should add id from key if not present', () => {
      const nodes: Record<string, CanvasNode> = {
        root: { type: 'Page', props: {} },
      }

      const roots = findRootNodes(nodes)
      expect(roots[0].id).toBe('root')
    })
  })
})
