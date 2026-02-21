'use client'

import { useNode } from '@craftjs/core'
import { PositionSettings } from './PositionSettings'

export function QRCodeSettings() {
  const {
    actions: { setProp },
    value,
    binding,
    size,
    errorCorrection,
    foregroundColor,
    backgroundColor,
    showLabel,
    label,
    labelPosition,
  } = useNode((node) => ({
    value: node.data.props.value,
    binding: node.data.props.binding,
    size: node.data.props.size,
    errorCorrection: node.data.props.errorCorrection,
    foregroundColor: node.data.props.foregroundColor,
    backgroundColor: node.data.props.backgroundColor,
    showLabel: node.data.props.showLabel,
    label: node.data.props.label,
    labelPosition: node.data.props.labelPosition,
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
          placeholder="https://example.com"
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
          placeholder="{{data.url}}"
        />
      </div>

      {/* Size */}
      <div className="space-y-1">
        <label className="text-xs text-gray-400">Size: {size}px</label>
        <input
          type="range"
          min="50"
          max="300"
          value={size}
          onChange={(e) => setProp((props: any) => props.size = parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Error Correction */}
      <div className="space-y-1">
        <label className="text-xs text-gray-400">Error Correction</label>
        <select
          value={errorCorrection}
          onChange={(e) => setProp((props: any) => props.errorCorrection = e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
        >
          <option value="L">Low (7%)</option>
          <option value="M">Medium (15%)</option>
          <option value="Q">Quartile (25%)</option>
          <option value="H">High (30%)</option>
        </select>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Foreground</label>
          <input
            type="color"
            value={foregroundColor}
            onChange={(e) => setProp((props: any) => props.foregroundColor = e.target.value)}
            className="w-full h-8 rounded cursor-pointer"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Background</label>
          <input
            type="color"
            value={backgroundColor}
            onChange={(e) => setProp((props: any) => props.backgroundColor = e.target.value)}
            className="w-full h-8 rounded cursor-pointer"
          />
        </div>
      </div>

      {/* Show Label */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={showLabel}
          onChange={(e) => setProp((props: any) => props.showLabel = e.target.checked)}
          className="rounded"
        />
        <label className="text-xs text-gray-400">Show Label</label>
      </div>

      {/* Label */}
      {showLabel && (
        <>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Label Text (optional)</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setProp((props: any) => props.label = e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
              placeholder="Leave empty to use value"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Label Position</label>
            <select
              value={labelPosition}
              onChange={(e) => setProp((props: any) => props.labelPosition = e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
            >
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
            </select>
          </div>
        </>
      )}

      <PositionSettings />
    </div>
  )
}
