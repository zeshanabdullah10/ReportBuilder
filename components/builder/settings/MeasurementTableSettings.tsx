'use client'

import { useNode } from '@craftjs/core'
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
      <div className="space-y-1">
        <label className="text-xs text-gray-400">Data Binding</label>
        <input
          type="text"
          value={dataBinding}
          onChange={(e) => setProp((props: any) => props.dataBinding = e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white font-mono"
          placeholder="{{data.measurements}}"
        />
        <p className="text-xs text-gray-500 mt-1">
          Expected: Array of objects with parameter, nominal, measured, unit, min, max, status
        </p>
      </div>

      {/* Display Options */}
      <div className="border-b border-gray-700 pb-3">
        <h4 className="text-xs font-semibold text-cyan-400 mb-2">Display Options</h4>
        
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showHeader}
            onChange={(e) => setProp((props: any) => props.showHeader = e.target.checked)}
            className="rounded"
          />
          <label className="text-xs text-gray-400">Show Header</label>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            checked={showRowNumbers}
            onChange={(e) => setProp((props: any) => props.showRowNumbers = e.target.checked)}
            className="rounded"
          />
          <label className="text-xs text-gray-400">Show Row Numbers</label>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            checked={stripeRows}
            onChange={(e) => setProp((props: any) => props.stripeRows = e.target.checked)}
            className="rounded"
          />
          <label className="text-xs text-gray-400">Stripe Rows</label>
        </div>
      </div>

      {/* Font Size */}
      <div className="space-y-1">
        <label className="text-xs text-gray-400">Font Size: {fontSize}px</label>
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
      <div className="border-b border-gray-700 pb-3">
        <h4 className="text-xs font-semibold text-cyan-400 mb-2">Colors</h4>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Pass Color</label>
            <input
              type="color"
              value={passColor}
              onChange={(e) => setProp((props: any) => props.passColor = e.target.value)}
              className="w-full h-8 rounded cursor-pointer"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Fail Color</label>
            <input
              type="color"
              value={failColor}
              onChange={(e) => setProp((props: any) => props.failColor = e.target.value)}
              className="w-full h-8 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="space-y-1 mt-2">
          <label className="text-xs text-gray-400">Header Background</label>
          <input
            type="color"
            value={headerBackgroundColor}
            onChange={(e) => setProp((props: any) => props.headerBackgroundColor = e.target.value)}
            className="w-full h-8 rounded cursor-pointer"
          />
        </div>

        <div className="space-y-1 mt-2">
          <label className="text-xs text-gray-400">Border Color</label>
          <input
            type="color"
            value={borderColor}
            onChange={(e) => setProp((props: any) => props.borderColor = e.target.value)}
            className="w-full h-8 rounded cursor-pointer"
          />
        </div>
      </div>

      <PositionSettings />
    </div>
  )
}
