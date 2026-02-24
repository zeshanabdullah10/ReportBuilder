'use client'

import { useNode } from '@craftjs/core'
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
      <div className="space-y-1">
        <label className="text-xs text-gray-400">Value (or use binding)</label>
        <input
          type="text"
          value={value}
          onChange={(e) => setProp((props: any) => props.value = e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
          placeholder="1234567890"
        />
      </div>

      {/* Binding */}
      <div className="space-y-1">
        <label className="text-xs text-gray-400">Data Binding</label>
        <input
          type="text"
          value={binding}
          onChange={(e) => setProp((props: any) => props.binding = e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white font-mono"
          placeholder="{{data.serialNumber}}"
        />
      </div>

      {/* Format */}
      <div className="space-y-1">
        <label className="text-xs text-gray-400">Barcode Format</label>
        <select
          value={format}
          onChange={(e) => setProp((props: any) => props.format = e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
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
      <div className="space-y-1">
        <label className="text-xs text-gray-400">Bar Width: {barWidth}px</label>
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
      <div className="space-y-1">
        <label className="text-xs text-gray-400">Bar Height: {barHeight}px</label>
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
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={displayValue}
          onChange={(e) => setProp((props: any) => props.displayValue = e.target.checked)}
          className="rounded"
        />
        <label className="text-xs text-gray-400">Display Value Below Barcode</label>
      </div>

      {/* Font Size */}
      {displayValue && (
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Font Size: {fontSize}px</label>
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
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Text Alignment</label>
          <select
            value={textAlign}
            onChange={(e) => setProp((props: any) => props.textAlign = e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      )}

      {/* Colors */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Line Color</label>
          <input
            type="color"
            value={lineColor}
            onChange={(e) => setProp((props: any) => props.lineColor = e.target.value)}
            className="w-full h-8 rounded cursor-pointer"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Background</label>
          <input
            type="color"
            value={background}
            onChange={(e) => setProp((props: any) => props.background = e.target.value)}
            className="w-full h-8 rounded cursor-pointer"
          />
        </div>
      </div>

      {/* Label */}
      <div className="space-y-1">
        <label className="text-xs text-gray-400">Label (optional)</label>
        <input
          type="text"
          value={label}
          onChange={(e) => setProp((props: any) => props.label = e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
          placeholder="Part Number"
        />
      </div>

      <PositionSettings />
    </div>
  )
}
