import { describe, it, expect } from 'vitest'
import {
  resolveBinding,
  interpolateText,
  hasBindings,
  extractBindings,
  resolveBindingOrValue,
} from './binding'

describe('binding utilities', () => {
  describe('resolveBinding', () => {
    const data = {
      test: {
        name: 'Test Name',
        value: 42,
      },
      items: ['a', 'b', 'c'],
      nested: {
        deep: {
          value: 'deep value',
        },
      },
    }

    it('should resolve simple paths', () => {
      expect(resolveBinding('test.name', data)).toBe('Test Name')
      expect(resolveBinding('test.value', data)).toBe(42)
    })

    it('should resolve nested paths', () => {
      expect(resolveBinding('nested.deep.value', data)).toBe('deep value')
    })

    it('should handle data. prefix', () => {
      expect(resolveBinding('data.test.name', data)).toBe('Test Name')
    })

    it('should return undefined for missing paths', () => {
      expect(resolveBinding('missing.path', data)).toBeUndefined()
    })

    it('should return undefined for null/undefined data', () => {
      expect(resolveBinding('test', null as unknown as Record<string, unknown>)).toBeUndefined()
      expect(resolveBinding('test', undefined as unknown as Record<string, unknown>)).toBeUndefined()
    })

    it('should return undefined for empty path', () => {
      expect(resolveBinding('', data)).toBeUndefined()
    })

    it('should handle array index access', () => {
      expect(resolveBinding('items[0]', data)).toBe('a')
      expect(resolveBinding('items[2]', data)).toBe('c')
    })

    it('should return undefined for out of bounds array access', () => {
      expect(resolveBinding('items[10]', data)).toBeUndefined()
    })
  })

  describe('interpolateText', () => {
    const data = {
      name: 'John',
      age: 30,
      city: 'New York',
    }

    it('should interpolate single binding', () => {
      expect(interpolateText('Hello {{name}}!', data)).toBe('Hello John!')
    })

    it('should interpolate multiple bindings', () => {
      expect(interpolateText('{{name}} is {{age}} years old', data)).toBe('John is 30 years old')
    })

    it('should handle data. prefix in bindings', () => {
      expect(interpolateText('City: {{data.city}}', data)).toBe('City: New York')
    })

    it('should return empty string for missing values', () => {
      expect(interpolateText('Missing: {{unknown}}', data)).toBe('Missing: ')
    })

    it('should return original text for null/undefined data', () => {
      expect(interpolateText('Hello {{name}}', null as unknown as Record<string, unknown>)).toBe('Hello {{name}}')
      expect(interpolateText('Hello {{name}}', undefined as unknown as Record<string, unknown>)).toBe('Hello {{name}}')
    })

    it('should handle empty text', () => {
      expect(interpolateText('', data)).toBe('')
    })

    it('should handle text without bindings', () => {
      expect(interpolateText('Plain text', data)).toBe('Plain text')
    })
  })

  describe('hasBindings', () => {
    it('should return true for text with bindings', () => {
      expect(hasBindings('Hello {{name}}')).toBe(true)
      expect(hasBindings('{{data.value}}')).toBe(true)
    })

    it('should return false for text without bindings', () => {
      expect(hasBindings('Plain text')).toBe(false)
      expect(hasBindings('Use double braces: {not a binding}')).toBe(false)
    })

    it('should return false for empty text', () => {
      expect(hasBindings('')).toBe(false)
    })

    it('should return false for null/undefined', () => {
      expect(hasBindings(null as unknown as string)).toBe(false)
      expect(hasBindings(undefined as unknown as string)).toBe(false)
    })
  })

  describe('extractBindings', () => {
    it('should extract single binding', () => {
      expect(extractBindings('Hello {{name}}')).toEqual(['name'])
    })

    it('should extract multiple bindings', () => {
      expect(extractBindings('{{name}} is {{age}}')).toEqual(['name', 'age'])
    })

    it('should trim whitespace from paths', () => {
      expect(extractBindings('{{  name  }}')).toEqual(['name'])
    })

    it('should return empty array for text without bindings', () => {
      expect(extractBindings('Plain text')).toEqual([])
    })

    it('should return empty array for empty text', () => {
      expect(extractBindings('')).toEqual([])
    })
  })

  describe('resolveBindingOrValue', () => {
    const data = {
      name: 'John',
      age: 30,
    }

    it('should resolve single binding', () => {
      expect(resolveBindingOrValue('{{name}}', data)).toBe('John')
    })

    it('should interpolate text with bindings', () => {
      expect(resolveBindingOrValue('Hello {{name}}', data)).toBe('Hello John')
    })

    it('should return original value if not a string', () => {
      expect(resolveBindingOrValue(42, data)).toBe(42)
      expect(resolveBindingOrValue(true, data)).toBe(true)
      expect(resolveBindingOrValue(null, data)).toBeNull()
    })

    it('should return original string if no bindings', () => {
      expect(resolveBindingOrValue('Plain text', data)).toBe('Plain text')
    })
  })
})
