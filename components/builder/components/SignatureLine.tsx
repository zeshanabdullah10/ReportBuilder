'use client'

import { useNode } from '@craftjs/core'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { hasBindings, resolveBindingOrValue } from '@/lib/utils/binding'
import { ResizableBox } from '../layout/ResizableBox'

interface SignatureSlot {
  label: string
  showDate?: boolean
  showName?: boolean
  nameBinding?: string
  dateBinding?: string
}

interface SignatureLineProps {
  // Configuration
  layout?: 'horizontal' | 'vertical'
  signatureCount?: 1 | 2 | 3
  
  // Per-signature configuration
  signatures?: SignatureSlot[]
  
  // Styling
  lineColor?: string
  lineWidth?: number
  labelFontSize?: number
  dateFontSize?: number
  
  // Position
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

export const SignatureLine = ({
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
}: SignatureLineProps) => {
  const {
    id,
    connectors: { connect },
    selected,
    actions: { setProp },
  } = useNode((node) => ({
    id: node.id,
    selected: node.events.selected,
  }))

  const { sampleData } = useBuilderStore()

  // Get the signatures to display based on count
  const activeSignatures = signatures.slice(0, signatureCount)

  // Resolve a binding value
  const resolveValue = (binding: string | undefined, fallback: string): string => {
    if (!binding || !hasBindings(binding) || !sampleData) return fallback
    const resolved = resolveBindingOrValue(binding, sampleData as Record<string, unknown>)
    return typeof resolved === 'string' ? resolved : fallback
  }

  if (!visible) return null

  const handlePositionChange = (newPos: { x?: number; y?: number; width?: number; height?: number }) => {
    setProp((props: SignatureLineProps) => {
      if (newPos.x !== undefined) props.x = newPos.x
      if (newPos.y !== undefined) props.y = newPos.y
      if (newPos.width !== undefined) props.width = newPos.width
      if (newPos.height !== undefined) props.height = newPos.height
    })
  }

  // Render a single signature slot
  const renderSignatureSlot = (sig: SignatureSlot, index: number) => {
    const nameValue = sig.nameBinding ? resolveValue(sig.nameBinding, '') : ''
    const dateValue = sig.dateBinding ? resolveValue(sig.dateBinding, '') : ''

    return (
      <div
        key={index}
        className="flex flex-col"
        style={{
          minWidth: layout === 'horizontal' ? `${100 / signatureCount}%` : '100%',
          padding: '8px 16px',
        }}
      >
        {/* Label */}
        <div
          className="font-medium mb-2"
          style={{ fontSize: `${labelFontSize}px`, color: lineColor }}
        >
          {sig.label}
        </div>

        {/* Signature Line */}
        <div
          className="mb-2"
          style={{
            borderBottom: `${lineWidth}px solid ${lineColor}`,
            height: '30px',
          }}
        />

        {/* Name Line */}
        {sig.showName && (
          <div className="flex items-center mb-1">
            <span style={{ fontSize: `${dateFontSize}px`, color: lineColor, marginRight: '4px' }}>
              Name:
            </span>
            <div
              className="flex-1"
              style={{
                borderBottom: `${lineWidth}px solid ${lineColor}`,
                minHeight: '18px',
                paddingLeft: '4px',
                fontSize: `${dateFontSize}px`,
              }}
            >
              {nameValue}
            </div>
          </div>
        )}

        {/* Date Line */}
        {sig.showDate && (
          <div className="flex items-center">
            <span style={{ fontSize: `${dateFontSize}px`, color: lineColor, marginRight: '4px' }}>
              Date:
            </span>
            <div
              className="flex-1"
              style={{
                borderBottom: `${lineWidth}px solid ${lineColor}`,
                minHeight: '18px',
                paddingLeft: '4px',
                fontSize: `${dateFontSize}px`,
              }}
            >
              {dateValue}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <ResizableBox
      x={x}
      y={y}
      width={width}
      height={height}
      minWidth={200}
      minHeight={60}
      selected={selected}
      nodeId={id}
      onPositionChange={handlePositionChange}
      connectRef={(ref) => { if (ref) connect(ref) }}
      zIndex={zIndex}
    >
      <div
        className="w-full h-full bg-white"
        style={{
          display: 'flex',
          flexDirection: layout === 'horizontal' ? 'row' : 'column',
        }}
      >
        {activeSignatures.map((sig, index) => renderSignatureSlot(sig, index))}
      </div>
    </ResizableBox>
  )
}

import { SignatureLineSettings } from '../settings/SignatureLineSettings'

SignatureLine.craft = {
  displayName: 'Signature Line',
  props: {
    layout: 'horizontal',
    signatureCount: 1,
    signatures: defaultSignatures,
    lineColor: '#000000',
    lineWidth: 1,
    labelFontSize: 12,
    dateFontSize: 10,
    x: 0,
    y: 0,
    width: 400,
    height: 80,
    zIndex: 1,
    visible: true,
  },
  related: {
    settings: SignatureLineSettings,
  },
  rules: {
    canDrag: () => true,
  },
}
