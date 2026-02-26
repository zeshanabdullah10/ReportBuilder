'use client'

import { useNode } from '@craftjs/core'
import { Input } from '@/components/ui/input'
import { ColorPicker } from '@/components/ui/color-picker'
import { DataBindingInput } from '@/components/builder/data-binding'
import { PositionSettings } from './PositionSettings'

export function BarcodeSettings() {
  const {
    actions: { setProp },
    value,
    binding,
    format,
    barWidth,
    barHeight,
    displayValue,
    lineColor,
    background,
    fontSize,
    textAlign,
    label,
  } = useNode((node) => ({
    value: node.data.props.value,
    binding: node.data.props.binding,
    format: node.data.props.format,
    barWidth: node.data.props.barWidth,
    barHeight: node.data.props.barHeight,
    displayValue: node.data.props.displayValue,
    lineColor: node.data.props.lineColor,
    background: node.data.props.background,
    fontSize: node.data.props.fontSize,
    textAlign: node.data.props.textAlign,
    label: node.data.props.label,
  }))

  return (
    <div className="space-y-4">
      {/* Value */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Value (or use binding)</label>
        <Input
          type="text"
          value={value}
          onChange={(e) => setProp((props: any) => props.value = e.target.value)}
          placeholder="1234567890"
        />
      </div>

      {/* Binding */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Data Binding</label>
        <DataBindingInput
          value={binding}
          onChange={(value) => setProp((props: any) => props.binding = value)}
          placeholder="{{data.serialNumber}}"
          expectedType="string"
        />
      </div>

      {/* Format */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Barcode Format</label>
        <select
          value={format}
          onChange={(e) => setProp((props: any) => props.format = e.target.value)}
          className="w-full bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg p-2 text-white text-sm"
        >
          <option value="CODE128">CODE128 (Alphanumeric)</option>
          <option value="CODE39">CODE39</option>
          <option value="EAN13">EAN-13 (13 digits)</option>
          <option value="EAN8">EAN-8 (8 digits)</option>
          <option value="UPC">UPC (12 digits)</option>
          <option value="ITF14">ITF-14 (14 digits)</option>
        </select>
      </div>

      {/* Bar Width */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Bar Width: {barWidth}px</label>
        <input
          type="range"
          min="1"
          max="5"
          value={barWidth}
          onChange={(e) => setProp((props: any) => props.barWidth = parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Bar Height */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Bar Height: {barHeight}px</label>
        <input
          type="range"
          min="30"
          max="150"
          value={barHeight}
          onChange={(e) => setProp((props: any) => props.barHeight = parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Display Value */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={displayValue}
          onChange={(e) => setProp((props: any) => props.displayValue = e.target.checked)}
          className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#050810] text-[#00ffc8] focus:ring-[#00ffc8]"
        />
        <span className="text-sm text-gray-400">Display Value Below Barcode</span>
      </label>

      {/* Font Size */}
      {displayValue && (
        <div>
          <label className="block text-sm text-gray-400 mb-1">Font Size: {fontSize}px</label>
          <input
            type="range"
            min="10"
            max="24"
            value={fontSize}
            onChange={(e) => setProp((props: any) => props.fontSize = parseInt(e.target.value))}
            className="w-full"
          />
        </div>
      )}

      {/* Text Align */}
      {displayValue && (
        <div>
          <label className="block text-sm text-gray-400 mb-1">Text Alignment</label>
          <select
            value={textAlign}
            onChange={(e) => setProp((props: any) => props.textAlign = e.target.value)}
            className="w-full bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg p-2 text-white text-sm"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      )}

      {/* Colors */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Line Color</label>
          <ColorPicker
            value={lineColor}
            onChange={(value) => setProp((props: any) => props.lineColor = value)}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Background</label>
          <ColorPicker
            value={background}
            onChange={(value) => setProp((props: any) => props.background = value)}
          />
        </div>
      </div>

      {/* Label */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Label (optional)</label>
        <Input
          type="text"
          value={label}
          onChange={(e) => setProp((props: any) => props.label = e.target.value)}
          placeholder="Part Number"
        />
      </div>

      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <PositionSettings />
      </div>
    </div>
  )
}
