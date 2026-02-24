'use client'

import { useNode } from '@craftjs/core'
import { PositionSettings } from './PositionSettings'

export function SignatureLineSettings() {
  const {
    actions: { setProp },
    layout,
    signatureCount,
    lineColor,
    lineWidth,
    labelFontSize,
    dateFontSize,
  } = useNode((node) => ({
    layout: node.data.props.layout,
    signatureCount: node.data.props.signatureCount,
    lineColor: node.data.props.lineColor,
    lineWidth: node.data.props.lineWidth,
    labelFontSize: node.data.props.labelFontSize,
    dateFontSize: node.data.props.dateFontSize,
  }))

  return (
    <div className="space-y-4">
      {/* Layout */}
      <div className="space-y-1">
        <label className="text-xs text-gray-400">Layout</label>
        <select
          value={layout}
          onChange={(e) => setProp((props: any) => props.layout = e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
        >
          <option value="horizontal">Horizontal</option>
          <option value="vertical">Vertical</option>
        </select>
      </div>

      {/* Signature Count */}
      <div className="space-y-1">
        <label className="text-xs text-gray-400">Number of Signatures</label>
        <select
          value={signatureCount}
          onChange={(e) => setProp((props: any) => props.signatureCount = parseInt(e.target.value))}
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
        >
          <option value={1}>1 Signature</option>
          <option value={2}>2 Signatures</option>
          <option value={3}>3 Signatures</option>
        </select>
      </div>

      {/* Line Color */}
      <div className="space-y-1">
        <label className="text-xs text-gray-400">Line Color</label>
        <input
          type="color"
          value={lineColor}
          onChange={(e) => setProp((props: any) => props.lineColor = e.target.value)}
          className="w-full h-8 rounded cursor-pointer"
        />
      </div>

      {/* Line Width */}
      <div className="space-y-1">
        <label className="text-xs text-gray-400">Line Width: {lineWidth}px</label>
        <input
          type="range"
          min="1"
          max="3"
          step="0.5"
          value={lineWidth}
          onChange={(e) => setProp((props: any) => props.lineWidth = parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Label Font Size */}
      <div className="space-y-1">
        <label className="text-xs text-gray-400">Label Font Size: {labelFontSize}px</label>
        <input
          type="range"
          min="10"
          max="18"
          value={labelFontSize}
          onChange={(e) => setProp((props: any) => props.labelFontSize = parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Date Font Size */}
      <div className="space-y-1">
        <label className="text-xs text-gray-400">Date Font Size: {dateFontSize}px</label>
        <input
          type="range"
          min="8"
          max="14"
          value={dateFontSize}
          onChange={(e) => setProp((props: any) => props.dateFontSize = parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      <PositionSettings />
    </div>
  )
}
