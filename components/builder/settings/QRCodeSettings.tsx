'use client'

import { useNode } from '@craftjs/core'
import { Input } from '@/components/ui/input'
import { ColorPicker } from '@/components/ui/color-picker'
import { DataBindingInput } from '@/components/builder/data-binding'
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
      <div>
        <label className="block text-sm text-gray-400 mb-1">Value (or use binding)</label>
        <Input
          type="text"
          value={value}
          onChange={(e) => setProp((props: any) => props.value = e.target.value)}
          placeholder="https://example.com"
        />
      </div>

      {/* Binding */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Data Binding</label>
        <DataBindingInput
          value={binding}
          onChange={(value) => setProp((props: any) => props.binding = value)}
          placeholder="{{data.url}}"
          expectedType="string"
        />
      </div>

      {/* Size */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Size: {size}px</label>
        <input
          type="range"
          min="50"
          max="300"
          value={size}
          onChange={(e) => setProp((props: any) => props.size = parseInt(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[#050810] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00ffc8] [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>

      {/* Error Correction */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Error Correction</label>
        <select
          value={errorCorrection}
          onChange={(e) => setProp((props: any) => props.errorCorrection = e.target.value)}
          className="w-full bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg p-2 text-white text-sm"
        >
          <option value="L">Low (7%)</option>
          <option value="M">Medium (15%)</option>
          <option value="Q">Quartile (25%)</option>
          <option value="H">High (30%)</option>
        </select>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Foreground</label>
          <ColorPicker
            value={foregroundColor}
            onChange={(value) => setProp((props: any) => props.foregroundColor = value)}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Background</label>
          <ColorPicker
            value={backgroundColor}
            onChange={(value) => setProp((props: any) => props.backgroundColor = value)}
          />
        </div>
      </div>

      {/* Show Label */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={showLabel}
          onChange={(e) => setProp((props: any) => props.showLabel = e.target.checked)}
          className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#050810] text-[#00ffc8] focus:ring-[#00ffc8]"
        />
        <span className="text-sm text-gray-400">Show Label</span>
      </label>

      {/* Label */}
      {showLabel && (
        <>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Label Text (optional)</label>
            <Input
              type="text"
              value={label}
              onChange={(e) => setProp((props: any) => props.label = e.target.value)}
              placeholder="Leave empty to use value"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Label Position</label>
            <select
              value={labelPosition}
              onChange={(e) => setProp((props: any) => props.labelPosition = e.target.value)}
              className="w-full bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg p-2 text-white text-sm"
            >
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
            </select>
          </div>
        </>
      )}

      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <PositionSettings />
      </div>
    </div>
  )
}
