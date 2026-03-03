/**
 * Color parsing and conversion utilities
 */

export interface ParsedColor {
  r: number
  g: number
  b: number
  a: number
}

// CSS named colors mapping
const NAMED_COLORS: Record<string, ParsedColor> = {
  'white': { r: 255, g: 255, b: 255, a: 1 },
  'black': { r: 0, g: 0, b: 0, a: 1 },
  'red': { r: 239, g: 68, b: 68, a: 1 },
  'green': { r: 34, g: 197, b: 94, a: 1 },
  'blue': { r: 59, g: 130, b: 246, a: 1 },
  'yellow': { r: 234, g: 179, b: 8, a: 1 },
  'cyan': { r: 6, g: 182, b: 212, a: 1 },
  'magenta': { r: 217, g: 70, b: 239, a: 1 },
  'orange': { r: 249, g: 115, b: 22, a: 1 },
  'purple': { r: 168, g: 85, b: 247, a: 1 },
  'pink': { r: 236, g: 72, b: 153, a: 1 },
  'gray': { r: 107, g: 114, b: 128, a: 1 },
  'grey': { r: 107, g: 114, b: 128, a: 1 },
  'transparent': { r: 0, g: 0, b: 0, a: 0 },
}

/**
 * Parse a color string into RGBA components
 */
export function parseColor(color: string | undefined | null): ParsedColor {
  if (!color) {
    return { r: 0, g: 0, b: 0, a: 1 }
  }

  const trimmed = color.trim().toLowerCase()

  // Handle named colors
  if (NAMED_COLORS[trimmed]) {
    return { ...NAMED_COLORS[trimmed] }
  }

  // Handle transparent
  if (trimmed === 'transparent' || trimmed === 'rgba(0, 0, 0, 0)') {
    return { r: 0, g: 0, b: 0, a: 0 }
  }

  // Handle hex colors
  if (trimmed.startsWith('#')) {
    const hex = trimmed.slice(1)
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: 1,
      }
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: 1,
      }
    }
    if (hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: parseInt(hex.slice(6, 8), 16) / 255,
      }
    }
  }

  // Handle rgb/rgba
  const rgbaMatch = trimmed.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/)
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1], 10),
      g: parseInt(rgbaMatch[2], 10),
      b: parseInt(rgbaMatch[3], 10),
      a: rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1,
    }
  }

  // Default to black if parsing fails
  console.warn(`Unrecognized color format: ${color}`)
  return { r: 0, g: 0, b: 0, a: 1 }
}

/**
 * Convert parsed color to rgba string
 */
export function toRgba(color: ParsedColor): string {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
}

/**
 * Convert parsed color to hex string (without alpha)
 */
export function toHex(color: ParsedColor): string {
  const r = Math.round(color.r).toString(16).padStart(2, '0')
  const g = Math.round(color.g).toString(16).padStart(2, '0')
  const b = Math.round(color.b).toString(16).padStart(2, '0')
  return `#${r}${g}${b}`
}

/**
 * Normalize a color string to a consistent format
 */
export function normalizeColor(color: string | undefined | null): string {
  const parsed = parseColor(color)
  return toRgba(parsed)
}
