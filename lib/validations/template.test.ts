import { describe, it, expect } from 'vitest'
import { validateTemplate, getValidationSummary } from './template'
import type { ValidationResult } from './template'

describe('template validation', () => {
  describe('validateTemplate', () => {
    it('should return error for null canvas state', () => {
      const result = validateTemplate(null, null)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          type: 'invalid_state',
        })
      )
    })

    it('should return error for empty canvas state', () => {
      const result = validateTemplate({ nodes: {} }, null)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          type: 'invalid_state',
        })
      )
    })

    it('should return warning for empty template (only Page component)', () => {
      const result = validateTemplate({
        nodes: {
          'node-root': {
            type: { resolvedName: 'Page' },
            props: {},
            nodes: [],
          },
        },
      }, null)

      expect(result.isValid).toBe(true) // Warnings do not block export
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          type: 'empty_template',
        })
      )
    })

    it('should return valid for canvas with components', () => {
      const result = validateTemplate({
        nodes: {
          'node-root': {
            type: { resolvedName: 'Page' },
            props: {},
            nodes: ['node-1'],
          },
          'node-1': {
            type: { resolvedName: 'Text' },
            props: { text: 'Hello World' },
          },
        },
      }, null)

      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(0)
    })

    it('should warn about components with data bindings but no sample data', () => {
      const result = validateTemplate({
        nodes: {
          'node-root': {
            type: { resolvedName: 'Page' },
            props: {},
            nodes: ['node-1'],
          },
          'node-1': {
            type: { resolvedName: 'Text' },
            props: {
              text: '{{data.test.name}}',
            },
          },
        },
      }, null)

      expect(result.isValid).toBe(true)
      expect(result.warnings.some(w => w.type === 'missing_sample_data')).toBe(true)
    })

    it('should warn about bindings not found in sample data', () => {
      const result = validateTemplate({
        nodes: {
          'node-root': {
            type: { resolvedName: 'Page' },
            props: {},
            nodes: ['node-1'],
          },
          'node-1': {
            type: { resolvedName: 'Text' },
            props: {
              binding: 'data.nonexistent.path',
            },
          },
        },
      }, { test: { name: 'Test' } })

      expect(result.isValid).toBe(true)
      expect(result.warnings.some(w => w.type === 'missing_binding')).toBe(true)
    })

    it('should warn about large templates', () => {
      interface TestNode {
        type: { resolvedName: string }
        props: Record<string, unknown>
        nodes?: string[]
      }
      
      const nodes: Record<string, TestNode> = {
        'node-root': {
          type: { resolvedName: 'Page' },
          props: {},
          nodes: [],
        },
      }

      for (let i = 0; i < 101; i++) {
        const nodeId = `node-${i}`
        nodes[nodeId] = {
          type: { resolvedName: 'Text' },
          props: { text: `Text ${i}` },
        }
        nodes['node-root'].nodes!.push(nodeId)
      }

      const result = validateTemplate({ nodes }, null)

      expect(result.isValid).toBe(true)
      expect(result.warnings.some(w => w.type === 'large_template')).toBe(true)
    })
  })

  describe('getValidationSummary', () => {
    it('should return success message for valid template with no warnings', () => {
      const result: ValidationResult = {
        isValid: true,
        warnings: [],
        errors: [],
      }

      expect(getValidationSummary(result)).toBe('Template is ready for export')
    })

    it('should count warnings correctly', () => {
      const result: ValidationResult = {
        isValid: true,
        warnings: [
          { type: 'empty_template', message: 'Empty' },
          { type: 'missing_sample_data', message: 'No data' },
        ],
        errors: [],
      }

      expect(getValidationSummary(result)).toBe('2 warnings')
    })

    it('should count errors correctly', () => {
      const result: ValidationResult = {
        isValid: false,
        warnings: [],
        errors: [
          { type: 'invalid_state', message: 'Invalid' },
        ],
      }

      expect(getValidationSummary(result)).toBe('1 error')
    })

    it('should combine errors and warnings', () => {
      const result: ValidationResult = {
        isValid: false,
        warnings: [
          { type: 'empty_template', message: 'Empty' },
        ],
        errors: [
          { type: 'invalid_state', message: 'Invalid' },
        ],
      }

      expect(getValidationSummary(result)).toBe('1 error, 1 warning')
    })
  })
})
