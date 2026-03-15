import { describe, it, expect } from 'vitest'
import { safeEvaluate } from '@/lib/security/safe-eval'

describe('Safe Expression Evaluator', () => {
  it('should evaluate simple comparisons', () => {
    expect(safeEvaluate('true', {})).toBe(true)
    expect(safeEvaluate('false', {})).toBe(false)
    expect(safeEvaluate('1 === 1', {})).toBe(true)
    expect(safeEvaluate('1 === 2', {})).toBe(false)
  })

  it('should evaluate string comparisons', () => {
    expect(safeEvaluate("'pass' === 'pass'", {})).toBe(true)
    expect(safeEvaluate("'pass' === 'fail'", {})).toBe(false)
  })

  it('should access data from context', () => {
    expect(safeEvaluate('status === "pass"', { status: 'pass' })).toBe(true)
    expect(safeEvaluate('status === "pass"', { status: 'fail' })).toBe(false)
  })

  it('should handle numeric comparisons', () => {
    expect(safeEvaluate('value > 10', { value: 15 })).toBe(true)
    expect(safeEvaluate('value > 10', { value: 5 })).toBe(false)
    expect(safeEvaluate('value >= 10 && value <= 20', { value: 15 })).toBe(true)
  })

  it('should reject dangerous code', () => {
    expect(() => safeEvaluate('eval("1+1")', {})).toThrow()
    expect(() => safeEvaluate('Function("return 1")()', {})).toThrow()
    expect(() => safeEvaluate('this.constructor.constructor("return 1")()', {})).toThrow()
    expect(() => safeEvaluate('require("fs")', {})).toThrow()
    expect(() => safeEvaluate('process.exit(1)', {})).toThrow()
  })

  it('should reject assignment operations', () => {
    expect(() => safeEvaluate('x = 1', {})).toThrow()
  })

  it('should handle nested data access', () => {
    expect(safeEvaluate('data.status === "pass"', { data: { status: 'pass' } })).toBe(true)
    expect(safeEvaluate('result.count > 0', { result: { count: 5 } })).toBe(true)
  })

  it('should return true for empty/invalid expressions (fail-safe)', () => {
    expect(safeEvaluate('', {})).toBe(true)
    expect(safeEvaluate(null as any, {})).toBe(true)
  })

  it('should handle logical OR operations', () => {
    expect(safeEvaluate('true || false', {})).toBe(true)
    expect(safeEvaluate('false || true', {})).toBe(true)
    expect(safeEvaluate('false || false', {})).toBe(false)
    expect(safeEvaluate('status === "pass" || status === "warn"', { status: 'pass' })).toBe(true)
    expect(safeEvaluate('status === "pass" || status === "warn"', { status: 'warn' })).toBe(true)
    expect(safeEvaluate('status === "pass" || status === "warn"', { status: 'fail' })).toBe(false)
  })

  it('should handle logical AND operations', () => {
    expect(safeEvaluate('true && true', {})).toBe(true)
    expect(safeEvaluate('true && false', {})).toBe(false)
    expect(safeEvaluate('false && true', {})).toBe(false)
    expect(safeEvaluate('count > 0 && count < 10', { count: 5 })).toBe(true)
    expect(safeEvaluate('count > 0 && count < 10', { count: 15 })).toBe(false)
  })

  it('should handle NOT operator', () => {
    expect(safeEvaluate('!true', {})).toBe(false)
    expect(safeEvaluate('!false', {})).toBe(true)
    expect(safeEvaluate('!(count > 10)', { count: 5 })).toBe(true)
    expect(safeEvaluate('!(count > 10)', { count: 15 })).toBe(false)
  })

  it('should handle complex expressions', () => {
    expect(safeEvaluate('(count > 0) && (count < 10)', { count: 5 })).toBe(true)
    expect(safeEvaluate('status === "pass" && count > 0', { status: 'pass', count: 5 })).toBe(true)
    expect(safeEvaluate('(status === "pass" || status === "warn") && count > 0', {
      status: 'pass',
      count: 5,
    })).toBe(true)
  })

  it('should handle array access', () => {
    expect(safeEvaluate('items[0] === "first"', { items: ['first', 'second'] })).toBe(true)
    expect(safeEvaluate('items[1] === "second"', { items: ['first', 'second'] })).toBe(true)
  })

  it('should handle arithmetic operations', () => {
    expect(safeEvaluate('1 + 1 === 2', {})).toBe(true)
    expect(safeEvaluate('2 * 3 === 6', {})).toBe(true)
    expect(safeEvaluate('10 - 5 === 5', {})).toBe(true)
    expect(safeEvaluate('10 / 2 === 5', {})).toBe(true)
  })

  it('should block window access', () => {
    expect(() => safeEvaluate('window.location', {})).toThrow()
  })

  it('should block document access', () => {
    expect(() => safeEvaluate('document.cookie', {})).toThrow()
  })

  it('should block constructor access', () => {
    expect(() => safeEvaluate('"".constructor', {})).toThrow()
  })

  it('should block prototype access', () => {
    expect(() => safeEvaluate('obj.prototype', {})).toThrow()
  })

  it('should block __proto__ access', () => {
    expect(() => safeEvaluate('obj.__proto__', {})).toThrow()
  })

  it('should block arguments identifier', () => {
    expect(() => safeEvaluate('arguments[0]', {})).toThrow()
  })

  it('should block new operator', () => {
    expect(() => safeEvaluate('new Date()', {})).toThrow()
    expect(() => safeEvaluate('new Function()', {})).toThrow()
  })

  it('should block typeof operator', () => {
    expect(() => safeEvaluate('typeof x', {})).toThrow()
    expect(() => safeEvaluate('typeof "string"', {})).toThrow()
  })

  it('should block void operator', () => {
    expect(() => safeEvaluate('void 0', {})).toThrow()
    expect(() => safeEvaluate('void x', {})).toThrow()
  })

  it('should block delete operator', () => {
    expect(() => safeEvaluate('delete obj.prop', {})).toThrow()
    expect(() => safeEvaluate('delete arr[0]', {})).toThrow()
  })

  it('should handle undefined parameter', () => {
    expect(safeEvaluate(undefined as any, {})).toBe(true)
  })

  it('should handle != operator', () => {
    expect(safeEvaluate('1 != 2', {})).toBe(true)
    expect(safeEvaluate('1 != 1', {})).toBe(false)
    expect(safeEvaluate('"pass" != "fail"', {})).toBe(true)
    expect(safeEvaluate('"pass" != "pass"', {})).toBe(false)
  })

  it('should handle !== operator', () => {
    expect(safeEvaluate('1 !== "1"', {})).toBe(true)
    expect(safeEvaluate('1 !== 1', {})).toBe(false)
    expect(safeEvaluate('null !== undefined', {})).toBe(true)
  })

  it('should handle <= operator', () => {
    expect(safeEvaluate('value <= 10', { value: 5 })).toBe(true)
    expect(safeEvaluate('value <= 10', { value: 10 })).toBe(true)
    expect(safeEvaluate('value <= 10', { value: 15 })).toBe(false)
  })

  it('should block prototype access even if prototype exists in context', () => {
    // Even if context has a 'prototype' property, it should be blocked
    expect(() => safeEvaluate('obj.prototype.method', { obj: { prototype: { method: () => {} } } })).toThrow()
    expect(() => safeEvaluate('obj["prototype"]', { obj: { prototype: { method: () => {} } } })).toThrow()
  })
})
