/**
 * Safe Expression Evaluator
 *
 * A restricted expression evaluator that safely evaluates simple
 * comparison and logical expressions without using eval() or Function().
 *
 * Supported operations:
 * - Comparisons: ===, !==, ==, !=, <, >, <=, >=
 * - Logical: &&, ||, !
 * - Literals: strings, numbers, booleans, null
 * - Property access: a.b, a.b.c
 * - Array access: a[0], a["key"]
 * - Parentheses for grouping
 * - Arithmetic: +, -, *, /
 *
 * NOT supported (intentionally blocked):
 * - Function calls
 * - eval, Function, require, import
 * - this, arguments, prototype
 * - Assignment operators
 * - new, delete, typeof, void
 */

// Blocked identifiers
const BLOCKED_IDENTIFIERS = new Set([
  'eval',
  'Function',
  'require',
  'import',
  'module',
  'exports',
  'process',
  'global',
  'window',
  'document',
  'this',
  'constructor',
  'prototype',
  '__proto__',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
])

interface Token {
  type: 'literal' | 'identifier' | 'operator' | 'punctuation'
  value: string | number | boolean | null
}

/**
 * Simple tokenizer for expressions
 */
function tokenize(expression: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < expression.length) {
    const char = expression[i]

    // Whitespace
    if (/\s/.test(char)) {
      i++
      continue
    }

    // String literals
    if (char === '"' || char === "'") {
      const quote = char
      i++
      let str = ''
      while (i < expression.length && expression[i] !== quote) {
        if (expression[i] === '\\') {
          i++
          if (i < expression.length) {
            str += expression[i]
          }
        } else {
          str += expression[i]
        }
        i++
      }
      i++ // closing quote
      tokens.push({ type: 'literal', value: str })
      continue
    }

    // Numbers
    if (/[0-9]/.test(char) || (char === '-' && /[0-9]/.test(expression[i + 1]))) {
      let num = char
      i++
      while (i < expression.length && /[0-9.]/.test(expression[i])) {
        num += expression[i]
        i++
      }
      tokens.push({ type: 'literal', value: parseFloat(num) })
      continue
    }

    // Multi-character operators
    const threeChar = expression.slice(i, i + 3)
    if (['===', '!=='].includes(threeChar)) {
      tokens.push({ type: 'operator', value: threeChar })
      i += 3
      continue
    }

    const twoCharOp = expression.slice(i, i + 2)
    if (['==', '!=', '<=', '>=', '&&', '||'].includes(twoCharOp)) {
      tokens.push({ type: 'operator', value: twoCharOp })
      i += 2
      continue
    }

    // Single character operators and punctuation
    if (['<', '>', '!', '+', '-', '*', '/'].includes(char)) {
      tokens.push({ type: 'operator', value: char })
      i++
      continue
    }

    // Block assignment operator
    if (char === '=') {
      throw new SecurityViolationError('Assignment operators are not allowed')
    }

    if (['(', ')', '[', ']', '.', ','].includes(char)) {
      tokens.push({ type: 'punctuation', value: char })
      i++
      continue
    }

    // Identifiers
    if (/[a-zA-Z_]/.test(char)) {
      let id = char
      i++
      while (i < expression.length && /[a-zA-Z0-9_]/.test(expression[i])) {
        id += expression[i]
        i++
      }

      // Check for blocked identifiers
      if (BLOCKED_IDENTIFIERS.has(id)) {
        throw new Error(`Blocked identifier: ${id}`)
      }

      // Convert boolean/null literals
      if (id === 'true') {
        tokens.push({ type: 'literal', value: true })
      } else if (id === 'false') {
        tokens.push({ type: 'literal', value: false })
      } else if (id === 'null') {
        tokens.push({ type: 'literal', value: null })
      } else {
        tokens.push({ type: 'identifier', value: id })
      }
      continue
    }

    throw new Error(`Unexpected character: ${char}`)
  }

  return tokens
}

/**
 * Simple recursive descent parser and evaluator
 */
class ExpressionEvaluator {
  private tokens: Token[]
  private pos: number = 0
  private context: Record<string, unknown>

  constructor(tokens: Token[], context: Record<string, unknown>) {
    this.tokens = tokens
    this.context = context
  }

  evaluate(): unknown {
    const result = this.parseOr()
    if (this.pos < this.tokens.length) {
      throw new Error('Unexpected token after expression')
    }
    return result
  }

  private current(): Token | null {
    return this.tokens[this.pos] || null
  }

  private consume(expected?: string): Token {
    const token = this.tokens[this.pos]
    if (!token) {
      throw new Error('Unexpected end of expression')
    }
    if (expected && token.value !== expected) {
      throw new Error(`Expected ${expected}, got ${token.value}`)
    }
    this.pos++
    return token
  }

  private parseOr(): unknown {
    let left = this.parseAnd()
    while (this.current()?.value === '||') {
      this.consume('||')
      const right = this.parseAnd()
      left = Boolean(left) || Boolean(right)
    }
    return left
  }

  private parseAnd(): unknown {
    let left = this.parseEquality()
    while (this.current()?.value === '&&') {
      this.consume('&&')
      const right = this.parseEquality()
      left = Boolean(left) && Boolean(right)
    }
    return left
  }

  private parseEquality(): unknown {
    let left = this.parseComparison()
    while (['===', '!==', '==', '!='].includes(this.current()?.value as string)) {
      const op = this.consume().value as string
      const right = this.parseComparison()
      switch (op) {
        case '===':
          left = left === right
          break
        case '!==':
          left = left !== right
          break
        case '==':
          left = left == right
          break
        case '!=':
          left = left != right
          break
      }
    }
    return left
  }

  private parseComparison(): unknown {
    let left = this.parseAdditive()
    while (['<', '>', '<=', '>='].includes(this.current()?.value as string)) {
      const op = this.consume().value as string
      const right = this.parseAdditive()
      switch (op) {
        case '<':
          left = (left as number) < (right as number)
          break
        case '>':
          left = (left as number) > (right as number)
          break
        case '<=':
          left = (left as number) <= (right as number)
          break
        case '>=':
          left = (left as number) >= (right as number)
          break
      }
    }
    return left
  }

  private parseAdditive(): unknown {
    let left = this.parseMultiplicative()
    while (['+', '-'].includes(this.current()?.value as string)) {
      const op = this.consume().value as string
      const right = this.parseMultiplicative()
      if (op === '+') {
        left = (left as number) + (right as number)
      } else {
        left = (left as number) - (right as number)
      }
    }
    return left
  }

  private parseMultiplicative(): unknown {
    let left = this.parseUnary()
    while (['*', '/'].includes(this.current()?.value as string)) {
      const op = this.consume().value as string
      const right = this.parseUnary()
      if (op === '*') {
        left = (left as number) * (right as number)
      } else {
        left = (left as number) / (right as number)
      }
    }
    return left
  }

  private parseUnary(): unknown {
    if (this.current()?.value === '!') {
      this.consume('!')
      return !this.parseUnary()
    }
    return this.parsePrimary()
  }

  private parsePrimary(): unknown {
    const token = this.current()

    if (!token) {
      throw new Error('Unexpected end of expression')
    }

    // Literal
    if (token.type === 'literal') {
      this.consume()
      return token.value
    }

    // Parenthesized expression
    if (token.value === '(') {
      this.consume('(')
      const result = this.parseOr()
      this.consume(')')
      return result
    }

    // Identifier or property access
    if (token.type === 'identifier') {
      return this.parsePropertyAccess()
    }

    throw new Error(`Unexpected token: ${token.value}`)
  }

  private parsePropertyAccess(): unknown {
    let value: unknown

    // Start with the identifier
    const identifier = this.consume()
    value = this.context[identifier.value as string]

    // Handle chained property access
    while (this.current()?.value === '.' || this.current()?.value === '[') {
      if (this.current()?.value === '.') {
        this.consume('.')
        const prop = this.consume()
        if (prop.type !== 'identifier') {
          throw new Error('Expected identifier after dot')
        }
        value = (value as Record<string, unknown>)?.[prop.value as string]
      } else if (this.current()?.value === '[') {
        this.consume('[')
        const index = this.parseOr()
        this.consume(']')
        if (typeof index === 'number') {
          value = (value as unknown[])?.[index]
        } else {
          value = (value as Record<string, unknown>)?.[index as string]
        }
      }
    }

    return value
  }
}

/**
 * Check if an error is a security violation (should throw)
 * vs a parsing error (should return true)
 */
class SecurityViolationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SecurityViolationError'
  }
}

/**
 * Safely evaluate a boolean expression
 *
 * @param expression - The expression to evaluate
 * @param context - Data context for variable resolution
 * @returns The result of expression (defaults to true on error)
 * @throws {SecurityViolationError} When a blocked identifier is used
 */
export function safeEvaluate(
  expression: string | null | undefined,
  context: Record<string, unknown>
): boolean {
  // Empty expressions default to true (visible)
  if (!expression || expression.trim() === '') {
    return true
  }

  try {
    // Check for blocked patterns BEFORE tokenization
    const lowerExpr = expression.toLowerCase()
    for (const blocked of BLOCKED_IDENTIFIERS) {
      if (lowerExpr.includes(blocked.toLowerCase())) {
        // Only block if it's actually used as an identifier, not part of a string
        const regex = new RegExp(`\\b${blocked}\\b`, 'i')
        if (regex.test(expression)) {
          throw new SecurityViolationError(`Blocked identifier found: ${blocked}`)
        }
      }
    }

    const tokens = tokenize(expression)
    const evaluator = new ExpressionEvaluator(tokens, context)
    const result = evaluator.evaluate()

    return Boolean(result)
  } catch (error) {
    // Security violations should always throw
    if (error instanceof SecurityViolationError) {
      throw error
    }
    // Other errors (parsing, runtime) fail safely
    console.warn('[SafeEval] Expression evaluation failed:', expression, error)
    return true // Default to visible on error
  }
}
