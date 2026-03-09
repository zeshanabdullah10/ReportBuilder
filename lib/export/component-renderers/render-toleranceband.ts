/**
 * ToleranceBand Export Renderer
 *
 * Renders a ToleranceBand component to static HTML with SVG visualization.
 * Shows a tolerance band with nominal line, measured value marker, and pass/fail indication.
 */

import { RendererResult } from './types'
import { generatePositionStyles } from '../utils/style-helpers'

interface ToleranceBandProps {
  // Values
  nominal?: number
  nominalBinding?: string
  tolerance?: number
  toleranceBinding?: string
  measured?: number
  measuredBinding?: string

  // Appearance
  bandColor?: string
  centerColor?: string
  measuredColor?: string
  showLabels?: boolean
  showValue?: boolean

  // Scale
  minScale?: number
  maxScale?: number
  autoScale?: boolean

  // Position
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
  visible?: boolean
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Resolve a value from bindings or use static value
 */
function resolveValue(staticValue: number | undefined, binding: string | undefined, data: Record<string, unknown> | null): number {
  if (binding && data) {
    const resolved = binding.split('.').reduce<unknown>((obj, key) => {
      if (obj && typeof obj === 'object' && key in obj) {
        return (obj as Record<string, unknown>)[key]
      }
      return undefined
    }, data as unknown)

    if (typeof resolved === 'number') {
      return resolved
    }
    if (typeof resolved === 'string') {
      const parsed = parseFloat(resolved)
      if (!isNaN(parsed)) {
        return parsed
      }
    }
  }
  return staticValue ?? 0
}

/**
 * Render a ToleranceBand component to static HTML
 */
export function renderToleranceBand(id: string, props: Record<string, unknown>): RendererResult {
  const typedProps: ToleranceBandProps = {
    nominal: props.nominal as number | undefined,
    nominalBinding: props.nominalBinding as string | undefined,
    tolerance: props.tolerance as number | undefined,
    toleranceBinding: props.toleranceBinding as string | undefined,
    measured: props.measured as number | undefined,
    measuredBinding: props.measuredBinding as string | undefined,
    bandColor: props.bandColor as string | undefined,
    centerColor: props.centerColor as string | undefined,
    measuredColor: props.measuredColor as string | undefined,
    showLabels: props.showLabels as boolean | undefined,
    showValue: props.showValue as boolean | undefined,
    minScale: props.minScale as number | undefined,
    maxScale: props.maxScale as number | undefined,
    autoScale: props.autoScale as boolean | undefined,
    x: props.x as number | undefined,
    y: props.y as number | undefined,
    width: props.width as number | undefined,
    height: props.height as number | undefined,
    zIndex: props.zIndex as number | undefined,
    visible: props.visible as boolean | undefined,
  }

  // Default values matching the builder component
  const visible = typedProps.visible !== false
  if (!visible) {
    return { html: '', componentConfig: null }
  }

  const bandColor = typedProps.bandColor || '#22c55e'
  const centerColor = typedProps.centerColor || '#3b82f6'
  const measuredColor = typedProps.measuredColor || '#ef4444'
  const showLabels = typedProps.showLabels !== false
  const showValue = typedProps.showValue !== false
  const autoScale = typedProps.autoScale !== false

  // Static defaults
  const staticNominal = typedProps.nominal ?? 50
  const staticTolerance = typedProps.tolerance ?? 5
  const staticMeasured = typedProps.measured ?? 52
  const staticMinScale = typedProps.minScale ?? 0
  const staticMaxScale = typedProps.maxScale ?? 100

  // For export, we use static values (binding resolution happens at runtime with data)
  const nominal = staticNominal
  const tolerance = staticTolerance
  const measured = staticMeasured

  // Calculate effective scale
  const effectiveMin = autoScale
    ? Math.min(nominal - tolerance * 3, measured, staticMinScale)
    : staticMinScale
  const effectiveMax = autoScale
    ? Math.max(nominal + tolerance * 3, measured, staticMaxScale)
    : staticMaxScale
  const range = effectiveMax - effectiveMin

  // Calculate positions as percentages
  const toPercent = (value: number): number => ((value - effectiveMin) / range) * 100
  const toleranceStart = toPercent(nominal - tolerance)
  const toleranceEnd = toPercent(nominal + tolerance)
  const nominalPos = toPercent(nominal)
  const measuredPos = toPercent(measured)

  // Check if measured is within tolerance
  const isWithinTolerance = Math.abs(measured - nominal) <= tolerance

  // Position styles
  const positionStyles = generatePositionStyles({
    x: typedProps.x ?? 0,
    y: typedProps.y ?? 0,
    width: typedProps.width ?? 300,
    height: typedProps.height ?? 60,
    zIndex: typedProps.zIndex ?? 1,
  })

  // Generate HTML
  const html = `<div id="${escapeHtml(id)}" class="tolerance-band-component" style="${positionStyles}; box-sizing: border-box;">
    <div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; padding: 8px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 4px; box-sizing: border-box;">
      <!-- Main band visualization -->
      <div style="position: relative; height: 24px; background: #f3f4f6; border-radius: 4px; overflow: hidden;">
        <!-- Gray background track -->
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: #f3f4f6;"></div>

        <!-- Tolerance band (semi-transparent) -->
        <div style="position: absolute; top: 0; height: 100%; left: ${toleranceStart}%; width: ${toleranceEnd - toleranceStart}%; background-color: ${bandColor}; opacity: 0.4;"></div>

        <!-- Nominal center line -->
        <div style="position: absolute; top: 0; bottom: 0; width: 2px; left: ${nominalPos}%; background-color: ${centerColor};"></div>

        <!-- Measured value marker -->
        <div style="position: absolute; top: 0; bottom: 0; width: 4px; left: ${measuredPos}%; background-color: ${isWithinTolerance ? bandColor : measuredColor}; border-radius: 2px; transform: translateX(-50%);"></div>

        <!-- Min/Max labels -->
        ${showLabels ? `
        <span style="position: absolute; left: 4px; top: 50%; transform: translateY(-50%); font-size: 10px; color: #6b7280; font-family: system-ui, sans-serif;">${effectiveMin.toFixed(1)}</span>
        <span style="position: absolute; right: 4px; top: 50%; transform: translateY(-50%); font-size: 10px; color: #6b7280; font-family: system-ui, sans-serif;">${effectiveMax.toFixed(1)}</span>
        ` : ''}
      </div>

      <!-- Value labels row -->
      ${showValue ? `
      <div style="position: relative; margin-top: 4px; font-size: 11px; font-family: system-ui, sans-serif;">
        <span style="color: #6b7280;">
          Nominal: <span style="font-weight: 500; color: #374151;">${nominal.toFixed(2)}</span>
        </span>
        <span style="color: #6b7280; margin-left: 12px;">
          Tolerance: <span style="font-weight: 500; color: #374151;">&plusmn;${tolerance.toFixed(2)}</span>
        </span>
        <span style="margin-left: 12px; color: ${isWithinTolerance ? '#16a34a' : '#dc2626'};">
          Measured: <span style="font-weight: 500;">${measured.toFixed(2)}</span>
          <span style="margin-left: 4px;">${isWithinTolerance ? '&#10003;' : '&#10007;'}</span>
        </span>
      </div>
      ` : ''}
    </div>
  </div>`

  // Component config for runtime JavaScript (if needed)
  const componentConfig = {
    id,
    type: 'ToleranceBand',
    props: {
      nominal: typedProps.nominal,
      nominalBinding: typedProps.nominalBinding,
      tolerance: typedProps.tolerance,
      toleranceBinding: typedProps.toleranceBinding,
      measured: typedProps.measured,
      measuredBinding: typedProps.measuredBinding,
      bandColor,
      centerColor,
      measuredColor,
      showLabels,
      showValue,
      minScale: typedProps.minScale,
      maxScale: typedProps.maxScale,
      autoScale,
      x: typedProps.x,
      y: typedProps.y,
      width: typedProps.width,
      height: typedProps.height,
      zIndex: typedProps.zIndex,
      visible,
    },
  }

  return { html, componentConfig }
}
