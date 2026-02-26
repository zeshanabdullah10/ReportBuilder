'use client'

import { useNode } from '@craftjs/core'
import { ColorPicker } from '@/components/ui/color-picker'
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
      <div>
        <label className="block text-sm text-gray-400 mb-1">Layout</label>
        <select
          value={layout}
          onChange={(e) => setProp((props: any) => props.layout = e.target.value)}
          className="w-full bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg p-2 text-white text-sm"
        >
          <option value="horizontal">Horizontal</option>
          <option value="vertical">Vertical</option>
        </select>
      </div>

      {/* Signature Count */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Number of Signatures</label>
        <select
          value={signatureCount}
          onChange={(e) => setProp((props: any) => props.signatureCount = parseInt(e.target.value))}
          className="w-full bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg p-2 text-white text-sm"
        >
          <option value={1}>1 Signature</option>
          <option value={2}>2 Signatures</option>
          <option value={3}>3 Signatures</option>
        </select>
      </div>

      {/* Line Color */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Line Color</label>
        <ColorPicker
          value={lineColor}
          onChange={(value) => setProp((props: any) => props.lineColor = value)}
        />
      </div>

      {/* Line Width */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Line Width: {lineWidth}px</label>
        <input
          type="range"
          min="1"
          max="3"
          step="0.5"
          value={lineWidth}
          onChange={(e) => setProp((props: any) => props.lineWidth = parseFloat(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[#050810] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00ffc8] [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>

      {/* Label Font Size */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Label Font Size: {labelFontSize}px</label>
        <input
          type="range"
          min="10"
          max="18"
          value={labelFontSize}
          onChange={(e) => setProp((props: any) => props.labelFontSize = parseInt(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[#050810] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00ffc8] [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>

      {/* Date Font Size */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Date Font Size: {dateFontSize}px</label>
        <input
          type="range"
          min="8"
          max="14"
          value={dateFontSize}
          onChange={(e) => setProp((props: any) => props.dateFontSize = parseInt(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[#050810] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00ffc8] [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>

      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <PositionSettings />
      </div>
    </div>
  )
}
