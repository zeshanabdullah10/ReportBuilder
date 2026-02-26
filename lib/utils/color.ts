/**
 * Color parsing and conversion utilities for the LabVIEW Report Builder
 * Supports hex (#RRGGBB, #RGB) and rgba(r, g, b, a) formats
 */

export interface ParsedColor {
  r: number
  g: number
  b: number
  a: number
}

/**
 * Parse a color string into RGBA components
 * Supports: #RRGGBB, #RGB, rgb(r,g,b), rgba(r,g,b,a)
 */
export function parseColor(color: string | undefined | null): ParsedColor {
  // Default to black if no color provided
  if (!color) {
    return { r: 0, g: 0, b: 0, a: 1 }
  }

  const trimmed = color.trim().toLowerCase()

  // Handle transparent
  if (trimmed === 'transparent') {
    return { r: 0, g: 0, b: 0, a: 0 }
  }

  // Handle rgba format
  const rgbaMatch = trimmed.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)$/)
  if (rgbaMatch) {
    return {
      r: Math.min(255, Math.max(0, parseInt(rgbaMatch[1], 10))),
      g: Math.min(255, Math.max(0, parseInt(rgbaMatch[2], 10))),
      b: Math.min(255, Math.max(0, parseInt(rgbaMatch[3], 10))),
      a: rgbaMatch[4] !== undefined ? Math.min(1, Math.max(0, parseFloat(rgbaMatch[4]))) : 1,
    }
  }

  // Handle hex format #RRGGBB or #RGB
  const hexMatch = trimmed.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/)
  if (hexMatch) {
    const hex = hexMatch[1]
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: 1,
      }
    }
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: 1,
    }
  }

  // Fallback to black for unrecognized formats
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
 * Convert parsed color to hex string (loses alpha info)
 */
export function toHex(color: ParsedColor): string {
  const toHexComponent = (n: number) => n.toString(16).padStart(2, '0')
  return `#${toHexComponent(color.r)}${toHexComponent(color.g)}${toHexComponent(color.b)}`
}

/**
 * Check if a color is fully transparent
 */
export function isTransparent(color: string | undefined | null): boolean {
  if (!color) return false
  const parsed = parseColor(color)
  return parsed.a === 0
}

/**
 * Check if a color has transparency (alpha < 1)
 */
export function hasTransparency(color: string | undefined | null): boolean {
  if (!color) return false
  const parsed = parseColor(color)
  return parsed.a < 1
}

/**
 * Normalize any color input to rgba format
 * Handles hex, rgb, rgba, and named colors (transparent only)
 */
export function normalizeColor(color: string | undefined | null): string {
  if (!color) return 'rgba(0, 0, 0, 1)'
  const trimmed = color.trim()

  // Already in rgba format
  if (trimmed.startsWith('rgba')) {
    return trimmed
  }

  // Already in rgb format - convert to rgba
  if (trimmed.startsWith('rgb')) {
    const parsed = parseColor(trimmed)
    return toRgba(parsed)
  }

  // Convert hex or other formats
  const parsed = parseColor(trimmed)
  return toRgba(parsed)
}

/**
 * Mix two colors with optional weight
 * @param color1 - First color
 * @param color2 - Second color
 * @param weight - Weight of first color (0-1, default 0.5)
 */
export function mixColors(color1: string, color2: string, weight: number = 0.5): string {
  const c1 = parseColor(color1)
  const c2 = parseColor(color2)

  const w = Math.min(1, Math.max(0, weight))

  return toRgba({
    r: Math.round(c1.r * w + c2.r * (1 - w)),
    g: Math.round(c1.g * w + c2.g * (1 - w)),
    b: Math.round(c1.b * w + c2.b * (1 - w)),
    a: c1.a * w + c2.a * (1 - w),
  })
}

/**
 * Lighten a color by a percentage
 */
export function lighten(color: string, amount: number = 0.1): string {
  return mixColors(color, '#ffffff', 1 - amount)
}

/**
 * Darken a color by a percentage
 */
export function darken(color: string, amount: number = 0.1): string {
  return mixColors(color, '#000000', 1 - amount)
}

/**
 * Set the alpha/opacity of a color
 */
export function setAlpha(color: string, alpha: number): string {
  const parsed = parseColor(color)
  parsed.a = Math.min(1, Math.max(0, alpha))
  return toRgba(parsed)
}

/**
 * Convert hex color to rgba with specified alpha
 */
export function hexToRgba(hex: string, alpha: number = 1): string {
  const parsed = parseColor(hex)
  parsed.a = Math.min(1, Math.max(0, alpha))
  return toRgba(parsed)
}

/**
 * Get a readable text color (black or white) based on background
 */
export function getContrastColor(backgroundColor: string): string {
  const parsed = parseColor(backgroundColor)

  // Calculate relative luminance
  const luminance = (0.299 * parsed.r + 0.587 * parsed.g + 0.114 * parsed.b) / 255

  // Return black for light backgrounds, white for dark
  return luminance > 0.5 ? 'rgba(0, 0, 0, 1)' : 'rgba(255, 255, 255, 1)'
}
