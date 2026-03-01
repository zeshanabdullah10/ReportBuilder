'use client'

import { useNode } from '@craftjs/core'
import { Input } from '@/components/ui/input'
import { ColorPicker } from '@/components/ui/color-picker'
import { DataBindingInput } from '@/components/builder/data-binding'
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
      <div>
        <label className="block text-sm text-gray-400 mb-1">Data Binding (Array of Numbers)</label>
        <DataBindingInput
          value={dataBinding}
          onChange={(value) => setProp((props: any) => props.dataBinding = value)}
          placeholder="{{data.measurements}}"
          expectedType="array"
          hint="Expected: Array of numeric values"
        />
      </div>

      {/* Bins */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Number of Bins: {bins}</label>
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
      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">
          Labels
        </label>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Title</label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setProp((props: any) => props.title = e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">X-Axis Label</label>
            <Input
              type="text"
              value={xAxisLabel}
              onChange={(e) => setProp((props: any) => props.xAxisLabel = e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Y-Axis Label</label>
            <Input
              type="text"
              value={yAxisLabel}
              onChange={(e) => setProp((props: any) => props.yAxisLabel = e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Display Options */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={showStatistics}
          onChange={(e) => setProp((props: any) => props.showStatistics = e.target.checked)}
          className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#050810] text-[#00ffc8] focus:ring-[#00ffc8]"
        />
        <span className="text-sm text-gray-400">Show Statistics (Mean, Std Dev)</span>
      </label>

      {/* Colors */}
      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">
          Colors
        </label>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Bar Color</label>
            <ColorPicker
              value={barColor}
              onChange={(value) => setProp((props: any) => props.barColor = value)}
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
