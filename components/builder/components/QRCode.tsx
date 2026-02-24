'use client'

import { useNode } from '@craftjs/core'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { hasBindings, resolveBindingOrValue } from '@/lib/utils/binding'
import { ResizableBox } from '../layout/ResizableBox'
import QRCodeLib from 'qrcode'
import { useEffect, useState } from 'react'

interface QRCodeProps {
  // Data source
  value?: string
  binding?: string
  
  // Display
  size?: number
  errorCorrection?: 'L' | 'M' | 'Q' | 'H'
  
  // Styling
  foregroundColor?: string
  backgroundColor?: string
  
  // Label
  showLabel?: boolean
  label?: string
  labelPosition?: 'top' | 'bottom'
  
  // Position
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
  visible?: boolean
}

export const QRCode = ({
  value = 'https://example.com',
  binding = '',
  size = 100,
  errorCorrection = 'M',
  foregroundColor = '#000000',
  backgroundColor = '#FFFFFF',
  showLabel = false,
  label = '',
  labelPosition = 'bottom',
  x = 0,
  y = 0,
  width = 120,
  height = 120,
  zIndex = 1,
  visible = true,
}: QRCodeProps) => {
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
  const [qrDataUrl, setQrDataUrl] = useState('')

  // Resolve the value from binding or use static value
  const resolvedValue = binding && hasBindings(binding) && sampleData
    ? String(resolveBindingOrValue(binding, sampleData as Record<string, unknown>) ?? value)
    : value

  // Generate QR code
  useEffect(() => {
    const generateQR = async () => {
      try {
        const dataUrl = await QRCodeLib.toDataURL(resolvedValue, {
          width: size,
          margin: 1,
          color: {
            dark: foregroundColor,
            light: backgroundColor,
          },
          errorCorrectionLevel: errorCorrection,
        })
        setQrDataUrl(dataUrl)
      } catch (err) {
        console.error('QR Code generation failed:', err)
        setQrDataUrl('')
      }
    }
    generateQR()
  }, [resolvedValue, size, foregroundColor, backgroundColor, errorCorrection])

  if (!visible) return null

  const displayLabel = label || resolvedValue

  const handlePositionChange = (newPos: { x?: number; y?: number; width?: number; height?: number }) => {
    setProp((props: QRCodeProps) => {
      if (newPos.x !== undefined) props.x = newPos.x
      if (newPos.y !== undefined) props.y = newPos.y
      if (newPos.width !== undefined) {
        props.width = newPos.width
        props.size = Math.min(newPos.width, newPos.height || height) - 20
      }
      if (newPos.height !== undefined) {
        props.height = newPos.height
        props.size = Math.min(width, newPos.height) - 20
      }
    })
  }

  return (
    <ResizableBox
      x={x}
      y={y}
      width={width}
      height={height}
      minWidth={60}
      minHeight={60}
      selected={selected}
      nodeId={id}
      onPositionChange={handlePositionChange}
      connectRef={(ref) => { if (ref) connect(ref) }}
      zIndex={zIndex}
    >
      <div
        className="w-full h-full flex flex-col items-center justify-center"
        style={{ backgroundColor }}
      >
        {showLabel && labelPosition === 'top' && (
          <div
            className="text-xs text-center mb-1 truncate w-full px-1"
            style={{ color: foregroundColor }}
          >
            {displayLabel}
          </div>
        )}
        
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt="QR Code"
            className="max-w-full max-h-full"
            style={{ imageRendering: 'pixelated' }}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-gray-400 text-xs">
            Generating...
          </div>
        )}
        
        {showLabel && labelPosition === 'bottom' && (
          <div
            className="text-xs text-center mt-1 truncate w-full px-1"
            style={{ color: foregroundColor }}
          >
            {displayLabel}
          </div>
        )}
      </div>
    </ResizableBox>
  )
}

import { QRCodeSettings } from '../settings/QRCodeSettings'

QRCode.craft = {
  displayName: 'QR Code',
  props: {
    value: 'https://example.com',
    binding: '',
    size: 100,
    errorCorrection: 'M',
    foregroundColor: '#000000',
    backgroundColor: '#FFFFFF',
    showLabel: false,
    label: '',
    labelPosition: 'bottom',
    x: 0,
    y: 0,
    width: 120,
    height: 120,
    zIndex: 1,
    visible: true,
  },
  related: {
    settings: QRCodeSettings,
  },
  rules: {
    canDrag: () => true,
  },
}
