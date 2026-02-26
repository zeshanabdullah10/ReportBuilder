'use client'

import { useNode } from '@craftjs/core'
import { Input } from '@/components/ui/input'
import { ColorPicker } from '@/components/ui/color-picker'
import { PositionSettings } from './PositionSettings'

export function MeasurementTableSettings() {
  const {
    actions: { setProp },
    dataBinding,
    showHeader,
    showRowNumbers,
    stripeRows,
    headerBackgroundColor,
    passColor,
    failColor,
    borderColor,
    fontSize,
  } = useNode((node) => ({
    dataBinding: node.data.props.dataBinding,
    showHeader: node.data.props.showHeader,
    showRowNumbers: node.data.props.showRowNumbers,
    stripeRows: node.data.props.stripeRows,
    headerBackgroundColor: node.data.props.headerBackgroundColor,
    passColor: node.data.props.passColor,
    failColor: node.data.props.failColor,
    borderColor: node.data.props.borderColor,
    fontSize: node.data.props.fontSize,
  }))

  return (
    <div className="space-y-4">
      {/* Data Binding */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Data Binding</label>
        <Input
          type="text"
          value={dataBinding}
          onChange={(e) => setProp((props: any) => props.dataBinding = e.target.value)}
          placeholder="{{data.measurements}}"
        />
        <p className="text-xs text-gray-500 mt-1">
          Expected: Array of objects with parameter, nominal, measured, unit, min, max, status
        </p>
      </div>

      {/* Display Options */}
      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">
          Display Options
        </label>

        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showHeader}
              onChange={(e) => setProp((props: any) => props.showHeader = e.target.checked)}
              className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#050810] text-[#00ffc8] focus:ring-[#00ffc8]"
            />
            <span className="text-sm text-gray-400">Show Header</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showRowNumbers}
              onChange={(e) => setProp((props: any) => props.showRowNumbers = e.target.checked)}
              className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#050810] text-[#00ffc8] focus:ring-[#00ffc8]"
            />
            <span className="text-sm text-gray-400">Show Row Numbers</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={stripeRows}
              onChange={(e) => setProp((props: any) => props.stripeRows = e.target.checked)}
              className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#050810] text-[#00ffc8] focus:ring-[#00ffc8]"
            />
            <span className="text-sm text-gray-400">Stripe Rows</span>
          </label>
        </div>
      </div>

      {/* Font Size */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Font Size: {fontSize}px</label>
        <input
          type="range"
          min="10"
          max="16"
          value={fontSize}
          onChange={(e) => setProp((props: any) => props.fontSize = parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Colors */}
      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">
          Colors
        </label>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Pass Color</label>
            <ColorPicker
              value={passColor}
              onChange={(value) => setProp((props: any) => props.passColor = value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Fail Color</label>
            <ColorPicker
              value={failColor}
              onChange={(value) => setProp((props: any) => props.failColor = value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Header Background</label>
            <ColorPicker
              value={headerBackgroundColor}
              onChange={(value) => setProp((props: any) => props.headerBackgroundColor = value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Border Color</label>
            <ColorPicker
              value={borderColor}
              onChange={(value) => setProp((props: any) => props.borderColor = value)}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <PositionSettings />
      </div>
    </div>
  )
}
