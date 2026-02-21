'use client'

import { useNode } from '@craftjs/core'
import { PositionSettings } from './PositionSettings'

export function ScatterPlotSettings() {
  const {
    actions: { setProp },
    dataBinding,
    showGridLines,
    pointRadius,
    xAxisLabel,
    yAxisLabel,
    xAxisMin,
    xAxisMax,
    yAxisMin,
    yAxisMax,
    pointColor,
    gridColor,
    backgroundColor,
    title,
  } = useNode((node) => ({
    dataBinding: node.data.props.dataBinding,
    showGridLines: node.data.props.showGridLines,
    pointRadius: node.data.props.pointRadius,
    xAxisLabel: node.data.props.xAxisLabel,
    yAxisLabel: node.data.props.yAxisLabel,
    xAxisMin: node.data.props.xAxisMin,
    xAxisMax: node.data.props.xAxisMax,
    yAxisMin: node.data.props.yAxisMin,
    yAxisMax: node.data.props.yAxisMax,
    pointColor: node.data.props.pointColor,
    gridColor: node.data.props.gridColor,
    backgroundColor: node.data.props.backgroundColor,
    title: node.data.props.title,
  }))

  return (
    <div className="space-y-4">
      {/* Data Binding */}
      <div className="space-y-1">
        <label className="text-xs text-gray-400">Data Binding (Array of {`{x, y}`})</label>
        <input
          type="text"
          value={dataBinding}
          onChange={(e) => setProp((props: any) => props.dataBinding = e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white font-mono"
          placeholder="{{data.points}}"
        />
        <p className="text-xs text-gray-500 mt-1">
          Expected: Array of objects with x and y properties
        </p>
      </div>

      {/* Title */}
      <div className="space-y-1">
        <label className="text-xs text-gray-400">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setProp((props: any) => props.title = e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
        />
      </div>

      {/* Axis Labels */}
      <div className="border-b border-gray-700 pb-3">
        <h4 className="text-xs font-semibold text-cyan-400 mb-2">Axis Labels</h4>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-gray-400">X-Axis</label>
            <input
              type="text"
              value={xAxisLabel}
              onChange={(e) => setProp((props: any) => props.xAxisLabel = e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Y-Axis</label>
            <input
              type="text"
              value={yAxisLabel}
              onChange={(e) => setProp((props: any) => props.yAxisLabel = e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
            />
          </div>
        </div>
      </div>

      {/* Axis Range */}
      <div className="border-b border-gray-700 pb-3">
        <h4 className="text-xs font-semibold text-cyan-400 mb-2">Axis Range (optional)</h4>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-gray-400">X Min</label>
            <input
              type="number"
              value={xAxisMin ?? ''}
              onChange={(e) => setProp((props: any) => props.xAxisMin = e.target.value ? parseFloat(e.target.value) : undefined)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
              placeholder="Auto"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">X Max</label>
            <input
              type="number"
              value={xAxisMax ?? ''}
              onChange={(e) => setProp((props: any) => props.xAxisMax = e.target.value ? parseFloat(e.target.value) : undefined)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
              placeholder="Auto"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Y Min</label>
            <input
              type="number"
              value={yAxisMin ?? ''}
              onChange={(e) => setProp((props: any) => props.yAxisMin = e.target.value ? parseFloat(e.target.value) : undefined)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
              placeholder="Auto"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Y Max</label>
            <input
              type="number"
              value={yAxisMax ?? ''}
              onChange={(e) => setProp((props: any) => props.yAxisMax = e.target.value ? parseFloat(e.target.value) : undefined)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
              placeholder="Auto"
            />
          </div>
        </div>
      </div>

      {/* Point Settings */}
      <div className="border-b border-gray-700 pb-3">
        <h4 className="text-xs font-semibold text-cyan-400 mb-2">Point Settings</h4>
        
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Point Size: {pointRadius}px</label>
          <input
            type="range"
            min="2"
            max="10"
            value={pointRadius}
            onChange={(e) => setProp((props: any) => props.pointRadius = parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            checked={showGridLines}
            onChange={(e) => setProp((props: any) => props.showGridLines = e.target.checked)}
            className="rounded"
          />
          <label className="text-xs text-gray-400">Show Grid Lines</label>
        </div>
      </div>

      {/* Colors */}
      <div className="border-b border-gray-700 pb-3">
        <h4 className="text-xs font-semibold text-cyan-400 mb-2">Colors</h4>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Point Color</label>
            <input
              type="color"
              value={pointColor}
              onChange={(e) => setProp((props: any) => props.pointColor = e.target.value)}
              className="w-full h-8 rounded cursor-pointer"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Grid Color</label>
            <input
              type="color"
              value={gridColor}
              onChange={(e) => setProp((props: any) => props.gridColor = e.target.value)}
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
