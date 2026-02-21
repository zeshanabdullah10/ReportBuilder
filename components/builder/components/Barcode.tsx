'use client'

import { useNode } from '@craftjs/core'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { hasBindings, resolveBindingOrValue } from '@/lib/utils/binding'
import { ResizableBox } from '../layout/ResizableBox'
import JsBarcode from 'jsbarcode'
import { useEffect, useRef } from 'react'

type BarcodeFormat = 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'UPC' | 'ITF14' | 'pharmacode'

interface BarcodeProps {
  // Data source
  value?: string
  binding?: string
  
  // Barcode format
  format?: BarcodeFormat
  
  // Display
  barWidth?: number
  barHeight?: number
  displayValue?: boolean
  
  // Styling
  lineColor?: string
  background?: string
  fontSize?: number
  textAlign?: 'left' | 'center' | 'right'
  
  // Label
  label?: string
  
  // Position
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
  visible?: boolean
}

export const Barcode = ({
  value = '1234567890',
  binding = '',
  format = 'CODE128',
  barWidth = 2,
  barHeight = 100,
  displayValue = true,
  lineColor = '#000000',
  background = '#FFFFFF',
  fontSize = 14,
  textAlign = 'center',
  label = '',
  x = 0,
  y = 0,
  width = 200,
  height = 80,
  zIndex = 1,
  visible = true,
}: BarcodeProps) => {
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
  const svgRef = useRef<SVGSVGElement>(null)

  // Resolve the value from binding or use static value
  const resolvedValue = binding && hasBindings(binding) && sampleData
    ? String(resolveBindingOrValue(binding, sampleData as Record<string, unknown>) ?? value)
    : value

  // Generate barcode
  useEffect(() => {
    if (svgRef.current && resolvedValue) {
      try {
        JsBarcode(svgRef.current, String(resolvedValue), {
          format: format,
          width: barWidth,
          height: barHeight,
          displayValue: displayValue,
          lineColor: lineColor,
          background: background,
          fontSize: fontSize,
          textAlign: textAlign,
          margin: 5,
          valid: (valid) => {
            if (!valid) {
              console.warn('Invalid barcode value for format:', format)
            }
          },
        })
      } catch (err) {
        console.error('Barcode generation failed:', err)
      }
    }
  }, [resolvedValue, format, barWidth, barHeight, displayValue, lineColor, background, fontSize, textAlign])

  if (!visible) return null

  const handlePositionChange = (newPos: { x?: number; y?: number; width?: number; height?: number }) => {
    setProp((props: BarcodeProps) => {
      if (newPos.x !== undefined) props.x = newPos.x
      if (newPos.y !== undefined) props.y = newPos.y
      if (newPos.width !== undefined) props.width = newPos.width
      if (newPos.height !== undefined) {
        props.height = newPos.height
        props.barHeight = Math.max(30, newPos.height - 40)
      }
    })
  }

  return (
    <ResizableBox
      x={x}
      y={y}
      width={width}
      height={height}
      minWidth={100}
      minHeight={50}
      selected={selected}
      nodeId={id}
      onPositionChange={handlePositionChange}
      connectRef={(ref) => { if (ref) connect(ref) }}
      zIndex={zIndex}
    >
      <div
        className="w-full h-full flex flex-col items-center justify-center p-1"
        style={{ backgroundColor: background }}
      >
        {label && (
          <div
            className="text-xs text-center mb-1 truncate w-full"
            style={{ color: lineColor }}
          >
            {label}
          </div>
        )}
        <svg
          ref={svgRef}
          className="max-w-full max-h-full"
          style={{ overflow: 'visible' }}
        />
      </div>
    </ResizableBox>
  )
}

import { BarcodeSettings } from '../settings/BarcodeSettings'

Barcode.craft = {
  displayName: 'Barcode',
  props: {
    value: '1234567890',
    binding: '',
    format: 'CODE128',
    barWidth: 2,
    barHeight: 100,
    displayValue: true,
    lineColor: '#000000',
    background: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    label: '',
    x: 0,
    y: 0,
    width: 200,
    height: 80,
    zIndex: 1,
    visible: true,
  },
  related: {
    settings: BarcodeSettings,
  },
  rules: {
    canDrag: () => true,
  },
}
