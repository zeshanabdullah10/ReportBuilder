'use client'

import { useNode } from '@craftjs/core'
import { PositionSettings } from './PositionSettings'

export function HistogramSettings() {
  const {
    actions: { setProp },
    dataBinding,
    bins,
    showStatistics,
    barColor,
    borderColor,
    backgroundColor,
    title,
    xAxisLabel,
    yAxisLabel,
  } = useNode((node) => ({
    dataBinding: node.data.props.dataBinding,
    bins: node.data.props.bins,
    showStatistics: node.data.props.showStatistics,
    barColor: node.data.props.barColor,
    borderColor: node.data.props.borderColor,
    backgroundColor: node.data.props.backgroundColor,
    title: node.data.props.title,
    xAxisLabel: node.data.props.xAxisLabel,
    yAxisLabel: node.data.props.yAxisLabel,
  }))

  return (
    <div className="space-y-4">
      {/* Data Binding */}
      <div className="space-y-1">
        <label className="text-xs text-gray-400">Data Binding (Array of Numbers)</label>
        <input
          type="text"
          value={dataBinding}
          onChange={(e) => setProp((props: any) => props.dataBinding = e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white font-mono"
          placeholder="{{data.measurements}}"
        />
        <p className="text-xs text-gray-500 mt-1">
          Expected: Array of numeric values
        </p>
      </div>

      {/* Bins */}
      <div className="space-y-1">
        <label className="text-xs text-gray-400">Number of Bins: {bins}</label>
        <input
          type="range"
          min="5"
          max="30"
          value={bins}
          onChange={(e) => setProp((props: any) => props.bins = parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Labels */}
      <div className="border-b border-gray-700 pb-3">
        <h4 className="text-xs font-semibold text-cyan-400 mb-2">Labels</h4>
        
        <div className="space-y-2">
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setProp((props: any) => props.title = e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-400">X-Axis Label</label>
            <input
              type="text"
              value={xAxisLabel}
              onChange={(e) => setProp((props: any) => props.xAxisLabel = e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-400">Y-Axis Label</label>
            <input
              type="text"
              value={yAxisLabel}
              onChange={(e) => setProp((props: any) => props.yAxisLabel = e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
            />
          </div>
        </div>
      </div>

      {/* Display Options */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={showStatistics}
          onChange={(e) => setProp((props: any) => props.showStatistics = e.target.checked)}
          className="rounded"
        />
        <label className="text-xs text-gray-400">Show Statistics (Mean, Std Dev)</label>
      </div>

      {/* Colors */}
      <div className="border-b border-gray-700 pb-3">
        <h4 className="text-xs font-semibold text-cyan-400 mb-2">Colors</h4>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Bar Color</label>
            <input
              type="color"
              value={barColor}
              onChange={(e) => setProp((props: any) => props.barColor = e.target.value)}
              className="w-full h-8 rounded cursor-pointer"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Border Color</label>
            <input
              type="color"
              value={borderColor}
              onChange={(e) => setProp((props: any) => props.borderColor = e.target.value)}
              className="w-full h-8 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="space-y-1 mt-2">
          <label className="text-xs text-gray-400">Background Color</label>
          <input
            type="color"
            value={backgroundColor}
            onChange={(e) => setProp((props: any) => props.backgroundColor = e.target.value)}
            className="w-full h-8 rounded cursor-pointer"
          />
        </div>
      </div>

      <PositionSettings />
    </div>
  )
}
