'use client'

import { useNode } from '@craftjs/core'
import { Input } from '@/components/ui/input'
import { ColorPicker } from '@/components/ui/color-picker'
import { DataBindingInput } from '@/components/builder/data-binding'
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
      <div>
        <label className="block text-sm text-gray-400 mb-1">Data Binding (Array of {`{x, y}`})</label>
        <DataBindingInput
          value={dataBinding}
          onChange={(value) => setProp((props: any) => props.dataBinding = value)}
          placeholder="{{data.points}}"
          expectedType="array"
          hint="Expected: Array of objects with x and y properties"
        />
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Title</label>
        <Input
          type="text"
          value={title}
          onChange={(e) => setProp((props: any) => props.title = e.target.value)}
        />
      </div>

      {/* Axis Labels */}
      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">
          Axis Labels
        </label>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">X-Axis</label>
            <Input
              type="text"
              value={xAxisLabel}
              onChange={(e) => setProp((props: any) => props.xAxisLabel = e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Y-Axis</label>
            <Input
              type="text"
              value={yAxisLabel}
              onChange={(e) => setProp((props: any) => props.yAxisLabel = e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Axis Range */}
      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">
          Axis Range (optional)
        </label>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">X Min</label>
            <Input
              type="number"
              value={xAxisMin ?? ''}
              onChange={(e) => setProp((props: any) => props.xAxisMin = e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Auto"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">X Max</label>
            <Input
              type="number"
              value={xAxisMax ?? ''}
              onChange={(e) => setProp((props: any) => props.xAxisMax = e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Auto"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Y Min</label>
            <Input
              type="number"
              value={yAxisMin ?? ''}
              onChange={(e) => setProp((props: any) => props.yAxisMin = e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Auto"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Y Max</label>
            <Input
              type="number"
              value={yAxisMax ?? ''}
              onChange={(e) => setProp((props: any) => props.yAxisMax = e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Auto"
            />
          </div>
        </div>
      </div>

      {/* Point Settings */}
      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">
          Point Settings
        </label>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Point Size: {pointRadius}px</label>
          <input
            type="range"
            min="2"
            max="10"
            value={pointRadius}
            onChange={(e) => setProp((props: any) => props.pointRadius = parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer mt-3">
          <input
            type="checkbox"
            checked={showGridLines}
            onChange={(e) => setProp((props: any) => props.showGridLines = e.target.checked)}
            className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#050810] text-[#00ffc8] focus:ring-[#00ffc8]"
          />
          <span className="text-sm text-gray-400">Show Grid Lines</span>
        </label>
      </div>

      {/* Colors */}
      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">
          Colors
        </label>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Point Color</label>
            <ColorPicker
              value={pointColor}
              onChange={(value) => setProp((props: any) => props.pointColor = value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Grid Color</label>
            <ColorPicker
              value={gridColor}
              onChange={(value) => setProp((props: any) => props.gridColor = value)}
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="block text-sm text-gray-400 mb-1">Background Color</label>
          <ColorPicker
            value={backgroundColor}
            onChange={(value) => setProp((props: any) => props.backgroundColor = value)}
          />
        </div>
      </div>

      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <PositionSettings />
      </div>
    </div>
  )
}
