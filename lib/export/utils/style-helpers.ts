/**
 * Style Helper Utilities for Template Export
 *
 * Provides CSS generation utilities for component positioning
 * and print-specific styles.
 */

/**
 * Position properties for components
 */
export interface PositionProps {
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
}

/**
 * Page size dimensions in mm
 */
export const PAGE_SIZES: Record<'A4' | 'Letter', { width: number; height: number }> = {
  A4: { width: 210, height: 297 },
  Letter: { width: 215.9, height: 279.4 },
}

/**
 * Generate CSS for absolute positioning
 *
 * @param props - Position properties (x, y, width, height, zIndex)
 * @returns CSS string with absolute positioning styles
 */
export function generatePositionStyles(props: PositionProps): string {
  const styles: string[] = ['position: absolute']

  if (props.x !== undefined) {
    styles.push(`left: ${props.x}px`)
  }

  if (props.y !== undefined) {
    styles.push(`top: ${props.y}px`)
  }

  if (props.width !== undefined) {
    styles.push(`width: ${props.width}px`)
  }

  if (props.height !== undefined) {
    styles.push(`height: ${props.height}px`)
  }

  if (props.zIndex !== undefined) {
    styles.push(`z-index: ${props.zIndex}`)
  }

  return styles.join('; ')
}

/**
 * Generate inline style string from a style object
 *
 * @param styles - Object with CSS property-value pairs
 * @returns CSS string suitable for inline style attribute
 */
export function generateInlineStyles(
  styles: Record<string, string | number | undefined>
): string {
  return Object.entries(styles)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => {
      // Convert camelCase to kebab-case
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
      return `${cssKey}: ${value}`
    })
    .join('; ')
}

/**
 * Generate @page and @media print CSS
 *
 * @param pageSize - Page size ('A4' or 'Letter')
 * @param margins - Margin values in mm
 * @returns CSS string with print-specific styles
 */
export function generatePrintStyles(
  pageSize: 'A4' | 'Letter',
  margins: { top: number; right: number; bottom: number; left: number }
): string {
  const pageDimensions = PAGE_SIZES[pageSize]

  return `
    @page {
      size: ${pageDimensions.width}mm ${pageDimensions.height}mm;
      margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .no-print {
        display: none !important;
      }

      .page-break {
        page-break-before: always;
      }

      .avoid-break {
        page-break-inside: avoid;
      }

      #report {
        width: 100%;
      }
    }

    @media screen {
      body {
        background: #f0f0f0;
      }

      #report {
        max-width: ${pageDimensions.width}mm;
        min-height: ${pageDimensions.height}mm;
        margin: 20px auto;
        background: #fff;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      }
    }
  `.trim()
}

/**
 * Convert hex color to rgba string
 *
 * @param hex - Hex color string (e.g., '#00ffc8' or '00ffc8')
 * @param alpha - Alpha value between 0 and 1
 * @returns rgba color string (e.g., 'rgba(0, 255, 200, 0.5)')
 */
export function hexToRgba(hex: string, alpha: number): string {
  // Remove # if present
  const cleanHex = hex.replace('#', '')

  // Parse hex values
  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)

  // Validate alpha
  const clampedAlpha = Math.max(0, Math.min(1, alpha))

  return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`
}

/**
 * Convert a color to a hex string (handles various input formats)
 *
 * @param color - Color in any format (hex, rgb, rgba, named)
 * @returns Hex color string or original if conversion not possible
 */
export function toHex(color: string): string {
  // Already hex
  if (color.startsWith('#')) {
    return color
  }

  // RGB format
  const rgbMatch = color.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/)
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, '0')
    const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, '0')
    const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, '0')
    return `#${r}${g}${b}`
  }

  // RGBA format - just extract RGB
  const rgbaMatch = color.match(/rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*[\d.]+\s*\)/)
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1], 10).toString(16).padStart(2, '0')
    const g = parseInt(rgbaMatch[2], 10).toString(16).padStart(2, '0')
    const b = parseInt(rgbaMatch[3], 10).toString(16).padStart(2, '0')
    return `#${r}${g}${b}`
  }

  // Return original if we can't convert
  return color
}

/**
 * Generate border styles string
 *
 * @param width - Border width in pixels
 * @param style - Border style (solid, dashed, dotted, etc.)
 * @param color - Border color
 * @returns CSS border string
 */
export function generateBorderStyles(
  width: number = 1,
  style: 'solid' | 'dashed' | 'dotted' | 'none' = 'solid',
  color: string = '#000000'
): string {
  if (style === 'none' || width === 0) {
    return 'border: none'
  }
  return `border: ${width}px ${style} ${color}`
}

/**
 * Generate font styles string
 *
 * @param options - Font styling options
 * @returns CSS font-related styles string
 */
export function generateFontStyles(options: {
  fontSize?: number
  fontWeight?: string | number
  fontFamily?: string
  fontStyle?: 'normal' | 'italic'
  lineHeight?: number | string
  color?: string
  textAlign?: 'left' | 'center' | 'right' | 'justify'
}): string {
  const styles: string[] = []

  if (options.fontSize !== undefined) {
    styles.push(`font-size: ${options.fontSize}px`)
  }

  if (options.fontWeight !== undefined) {
    styles.push(`font-weight: ${options.fontWeight}`)
  }

  if (options.fontFamily !== undefined) {
    styles.push(`font-family: ${options.fontFamily}`)
  }

  if (options.fontStyle !== undefined) {
    styles.push(`font-style: ${options.fontStyle}`)
  }

  if (options.lineHeight !== undefined) {
    styles.push(`line-height: ${options.lineHeight}`)
  }

  if (options.color !== undefined) {
    styles.push(`color: ${options.color}`)
  }

  if (options.textAlign !== undefined) {
    styles.push(`text-align: ${options.textAlign}`)
  }

  return styles.join('; ')
}

/**
 * Combine multiple style strings, removing duplicates and empty values
 *
 * @param styleStrings - Array of style strings to combine
 * @returns Combined and deduplicated style string
 */
export function combineStyles(...styleStrings: (string | undefined)[]): string {
  const styleMap = new Map<string, string>()

  for (const styleStr of styleStrings) {
    if (!styleStr) continue

    const declarations = styleStr.split(';').map((s) => s.trim()).filter(Boolean)

    for (const declaration of declarations) {
      const colonIndex = declaration.indexOf(':')
      if (colonIndex > 0) {
        const property = declaration.substring(0, colonIndex).trim().toLowerCase()
        const value = declaration.substring(colonIndex + 1).trim()
        styleMap.set(property, value)
      }
    }
  }

  return Array.from(styleMap.entries())
    .map(([prop, value]) => `${prop}: ${value}`)
    .join('; ')
}
