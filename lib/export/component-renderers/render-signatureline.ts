/**
 * SignatureLine Component Renderer
 *
 * Renders SignatureLine components with signature slots.
 */

import { ComponentRenderer, RendererResult } from './types'
import { generatePositionStyles, combineStyles } from '../utils/style-helpers'

interface SignatureSlot {
  label: string
  showDate?: boolean
  showName?: boolean
  nameBinding?: string
  dateBinding?: string
}

interface SignatureLineProps {
  layout?: 'horizontal' | 'vertical'
  signatureCount?: 1 | 2 | 3
  signatures?: SignatureSlot[]
  lineColor?: string
  lineWidth?: number
  labelFontSize?: number
  dateFontSize?: number
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
  visible?: boolean
}

const defaultSignatures: SignatureSlot[] = [
  { label: 'Test Engineer', showDate: true, showName: true },
  { label: 'Quality Manager', showDate: true, showName: true },
  { label: 'Supervisor', showDate: true, showName: true },
]

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Renders a SignatureLine component to HTML
 */
export const renderSignatureLine: ComponentRenderer = (id, props): RendererResult => {
  const {
    layout = 'horizontal',
    signatureCount = 1,
    signatures = defaultSignatures,
    lineColor = '#000000',
    lineWidth = 1,
    labelFontSize = 12,
    dateFontSize = 10,
    x = 0,
    y = 0,
    width = 400,
    height = 80,
    zIndex = 1,
    visible = true,
  } = props as SignatureLineProps

  if (visible === false) {
    return { html: '', componentConfig: null }
  }

  const positionStyles = generatePositionStyles({ x, y, width, height, zIndex })
  const flexDirection = layout === 'horizontal' ? 'row' : 'column'
  const containerStyles = `display: flex; flex-direction: ${flexDirection}; background-color: white; box-sizing: border-box;`
  const allStyles = combineStyles(positionStyles, containerStyles)

  const activeSignatures = signatures.slice(0, signatureCount)
  const slotWidth = layout === 'horizontal' ? `${100 / signatureCount}%` : '100%'

  const slotsHtml = activeSignatures.map((sig) => `
    <div style="min-width: ${slotWidth}; padding: 8px 16px; box-sizing: border-box;">
      <div style="font-size: ${labelFontSize}px; color: ${lineColor}; font-weight: 500; margin-bottom: 8px;">${escapeHtml(sig.label)}</div>
      <div style="border-bottom: ${lineWidth}px solid ${lineColor}; height: 30px; margin-bottom: 8px;"></div>
      ${sig.showName ? `<div style="display: flex; align-items: center; margin-bottom: 4px;">
        <span style="font-size: ${dateFontSize}px; color: ${lineColor}; margin-right: 4px;">Name:</span>
        <div style="flex: 1; border-bottom: ${lineWidth}px solid ${lineColor}; min-height: 18px; padding-left: 4px; font-size: ${dateFontSize}px;" data-binding="${escapeHtml(sig.nameBinding || '')}"></div>
      </div>` : ''}
      ${sig.showDate ? `<div style="display: flex; align-items: center;">
        <span style="font-size: ${dateFontSize}px; color: ${lineColor}; margin-right: 4px;">Date:</span>
        <div style="flex: 1; border-bottom: ${lineWidth}px solid ${lineColor}; min-height: 18px; padding-left: 4px; font-size: ${dateFontSize}px;" data-binding="${escapeHtml(sig.dateBinding || '')}"></div>
      </div>` : ''}
    </div>
  `).join('')

  const html = `<div id="${escapeHtml(id)}" data-component="signatureline" style="${allStyles}">
    ${slotsHtml}
  </div>`

  const componentConfig = {
    id,
    type: 'SignatureLine',
    props: {
      layout,
      signatureCount,
      signatures: activeSignatures,
      lineColor,
      lineWidth,
    },
  }

  return { html, componentConfig }
}
