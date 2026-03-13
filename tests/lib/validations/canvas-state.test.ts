import { describe, it, expect } from 'vitest';
import {
  SECURITY_LIMITS,
  sanitizeString,
  sanitizeProps,
  CanvasStateSchema,
  validateCanvasState,
  type ValidatedCanvasState,
} from '@/lib/validations/canvas-state';

describe('Canvas State Validation', () => {
  describe('sanitizeString', () => {
    it('removes script tags', () => {
      const input = '<script>alert("xss")</script>hello world';
      const result = sanitizeString(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toContain('hello world');
    });

    it('removes javascript: URLs', () => {
      const input = 'Click <a href="javascript:alert(1)">here</a>';
      const result = sanitizeString(input);
      expect(result).not.toContain('javascript:');
    });

    it('removes on* event handlers', () => {
      const input = '<div onclick="alert(1)" onload="malicious()">text</div>';
      const result = sanitizeString(input);
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('onload');
      expect(result).not.toContain('alert(1)');
      expect(result).not.toContain('malicious()');
    });

    it('handles non-string inputs', () => {
      expect(sanitizeString(123)).toBe('123');
      expect(sanitizeString(null)).toBe('null');
      expect(sanitizeString(undefined)).toBe('undefined');
      expect(sanitizeString(true)).toBe('true');
    });

    it('leaves safe content intact', () => {
      const input = 'Hello world <p>Paragraph</p> <span>Text</span>';
      const result = sanitizeString(input);
      expect(result).toBe(input);
    });
  });

  describe('sanitizeProps', () => {
    it('sanitizes string values', () => {
      const input = {
        text: '<script>alert(1)</script>',
      };
      const result = sanitizeProps(input);
      expect(result.text).not.toContain('<script>');
    });

    it('recursively sanitizes nested objects', () => {
      const input = {
        nested: {
          deep: {
            value: 'javascript:alert(1)',
          },
        },
      };
      const result = sanitizeProps(input);
      expect(result.nested.deep.value).not.toContain('javascript:');
    });

    it('sanitizes arrays', () => {
      const input = ['safe', '<script>danger</script>', 'also safe'];
      const result = sanitizeProps(input);
      expect(result[0]).toBe('safe');
      expect(result[1]).not.toContain('<script>');
      expect(result[2]).toBe('also safe');
    });

    it('handles null and undefined', () => {
      expect(sanitizeProps(null)).toBe(null);
      expect(sanitizeProps(undefined)).toBe(undefined);
    });

    it('preserves non-string values', () => {
      const input = {
        number: 42,
        boolean: true,
        array: [1, 2, 3],
      };
      const result = sanitizeProps(input);
      expect(result).toEqual(input);
    });
  });

  describe('CanvasStateSchema', () => {
    it('accepts valid minimal canvas state', () => {
      const state = {
        nodes: {
          'root': {
            id: 'root',
            type: 'div',
          },
        },
      };

      const result = CanvasStateSchema.parse(state);
      expect(result).toBeDefined();
      expect(result.nodes.root.id).toBe('root');
    });

    it('accepts canvas state with Craft.js type resolver', () => {
      const state = {
        nodes: {
          'root': {
            id: 'root',
            type: {
              component: 'Container',
              props: { padding: 16 },
            },
          },
        },
      };

      const result = CanvasStateSchema.parse(state);
      expect(result.nodes.root.type.component).toBe('Container');
    });

    it('accepts canvas state with props', () => {
      const state = {
        nodes: {
          'root': {
            id: 'root',
            type: 'div',
            props: {
              className: 'test-class',
              style: { color: 'red' },
            },
          },
        },
      };

      const result = CanvasStateSchema.parse(state);
      expect(result.nodes.root.props?.className).toBe('test-class');
    });

    it('rejects empty node id', () => {
      const state = {
        nodes: {
          '': {
            id: '',
            type: 'div',
          },
        },
      };

      expect(() => CanvasStateSchema.parse(state)).toThrow();
    });

    it('rejects node id over 500 characters', () => {
      const state = {
        nodes: {
          ['x'.repeat(501)]: {
            id: 'x'.repeat(501),
            type: 'div',
          },
        },
      };

      expect(() => CanvasStateSchema.parse(state)).toThrow();
    });

    it('rejects too many total nodes', () => {
      const nodes: Record<string, any> = {};
      for (let i = 0; i <= SECURITY_LIMITS.MAX_NODES; i++) {
        nodes[`node-${i}`] = {
          id: `node-${i}`,
          type: 'div',
        };
      }

      const state = { nodes };
      expect(() => CanvasStateSchema.parse(state)).toThrow();
    });

    it('rejects too many children in linkedNodes array', () => {
      const state = {
        nodes: {
          'root': {
            id: 'root',
            type: 'div',
            linkedNodes: Array(SECURITY_LIMITS.MAX_CHILDREN + 1).fill('child'),
          },
        },
      };

      expect(() => CanvasStateSchema.parse(state)).toThrow();
    });

    it('rejects props that exceed size limit', () => {
      const state = {
        nodes: {
          'root': {
            id: 'root',
            type: 'div',
            props: {
              huge: 'x'.repeat(SECURITY_LIMITS.MAX_PROPS_SIZE + 1),
            },
          },
        },
      };

      expect(() => CanvasStateSchema.parse(state)).toThrow();
    });

    it('rejects nodes that exceed depth through nested structure', () => {
      // Create a chain of 150 nodes (exceeds MAX_DEPTH of 100)
      const nodes: Record<string, any> = {};

      // Create a deep parent chain where each node has a single child
      // In Craft.js, children are tracked in linkedNodes or nodes containers
      for (let i = 0; i < 150; i++) {
        const childId = i < 149 ? `node-${i + 1}` : undefined;
        nodes[`node-${i}`] = {
          id: `node-${i}`,
          type: 'div',
          linkedNodes: childId ? [childId] : [],
        };
      }

      const state = { nodes };
      const result = validateCanvasState(state);

      // Should fail due to excessive depth (150 > 100)
      expect(result.success).toBe(false);
      expect(result.error).toContain('exceeds 100 levels');
    });

    it('accepts nodes within depth limit', () => {
      // Create a chain of 50 nodes (within MAX_DEPTH of 100)
      const nodes: Record<string, any> = {};

      // Create a chain where each node has a single child
      for (let i = 0; i < 50; i++) {
        const childId = i < 49 ? `node-${i + 1}` : undefined;
        nodes[`node-${i}`] = {
          id: `node-${i}`,
          type: 'div',
          linkedNodes: childId ? [childId] : [],
        };
      }

      const state = { nodes };
      const result = validateCanvasState(state);

      // Should pass (50 < 100)
      expect(result.success).toBe(true);
    });
  });

  describe('validateCanvasState', () => {
    it('validates and sanitizes a minimal valid canvas state', () => {
      const state = {
        nodes: {
          'root': {
            id: 'root',
            type: 'div',
          },
        },
      };

      const result = validateCanvasState(state);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.nodes.root.id).toBe('root');
    });

    it('rejects null input', () => {
      const result = validateCanvasState(null);
      expect(result.success).toBe(false);
      expect(result.error).toContain('null or undefined');
    });

    it('rejects undefined input', () => {
      const result = validateCanvasState(undefined);
      expect(result.success).toBe(false);
      expect(result.error).toContain('null or undefined');
    });

    it('rejects non-object input', () => {
      const result = validateCanvasState('not an object');
      expect(result.success).toBe(false);
      expect(result.error).toContain('must be an object');
    });

    it('rejects input that cannot be serialized', () => {
      const circular: any = { foo: 'bar' };
      circular.self = circular;

      const result = validateCanvasState(circular);
      expect(result.success).toBe(false);
    });

    it('rejects input that exceeds size limit', () => {
      const hugeState = {
        nodes: {
          'root': {
            id: 'root',
            type: 'div',
            props: {
              huge: 'x'.repeat(11_000_000), // 11MB
            },
          },
        },
      };

      const result = validateCanvasState(hugeState);
      expect(result.success).toBe(false);
      expect(result.error).toContain('too large');
    });

    it('sanitizes props in validated state', () => {
      const state = {
        nodes: {
          'root': {
            id: 'root',
            type: 'div',
            props: {
              text: '<script>alert(1)</script>',
              link: 'javascript:alert(2)',
              handler: 'onclick="malicious()"',
            },
          },
        },
      };

      const result = validateCanvasState(state);
      expect(result.success).toBe(true);

      const sanitizedProps = result.data?.nodes.root.props;
      expect(sanitizedProps?.text).not.toContain('<script>');
      expect(sanitizedProps?.link).not.toContain('javascript:');
      expect(sanitizedProps?.handler).not.toContain('malicious()');
    });

    it('sanitizes props in nested nodes', () => {
      const state = {
        nodes: {
          'root': {
            id: 'root',
            type: 'div',
            props: { text: '<script>bad</script>' },
            nodes: { container: ['child'] },
          },
          'child': {
            id: 'child',
            type: 'span',
            props: { html: 'javascript:evil()' },
          },
        },
      };

      const result = validateCanvasState(state);
      expect(result.success).toBe(true);

      expect(result.data?.nodes.root.props?.text).not.toContain('<script>');
      expect(result.data?.nodes.child.props?.html).not.toContain('javascript:');
    });

    it('returns detailed validation errors', () => {
      const state = {
        nodes: {
          '': {
            id: '',
            type: 'div',
          },
        },
      };

      const result = validateCanvasState(state);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Validation failed');
    });

    it('accepts canvas state with all optional fields', () => {
      const state = {
        nodes: {
          'root': {
            id: 'root',
            type: 'div',
            props: { className: 'test' },
            linkedNodes: ['linked-1'],
            nodes: { 'container': ['child-1'] },
            displayName: 'Root Element',
            hidden: false,
            isCanvas: true,
          },
          'linked-1': {
            id: 'linked-1',
            type: 'span',
            parent: 'root',
          },
          'child-1': {
            id: 'child-1',
            type: 'p',
            parent: 'root',
          },
        },
        events: {},
      };

      const result = validateCanvasState(state);
      expect(result.success).toBe(true);
      expect(result.data?.nodes.root.displayName).toBe('Root Element');
      expect(result.data?.nodes.root.isCanvas).toBe(true);
    });

    it('rejects when children exceed limit in nodes record', () => {
      const children = Array(SECURITY_LIMITS.MAX_CHILDREN + 1).fill('child').map((_, i) => `child-${i}`);

      const state = {
        nodes: {
          'root': {
            id: 'root',
            type: 'div',
            nodes: { 'container': children },
          },
          ...children.reduce((acc, id) => ({
            ...acc,
            [id]: { id, type: 'span', parent: 'root' },
          }), {}),
        },
      };

      const result = validateCanvasState(state);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Validation failed');
    });
  });
});
