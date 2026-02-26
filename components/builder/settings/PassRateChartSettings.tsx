'use client'

import { useNode } from '@craftjs/core'
import { Input } from '@/components/ui/input'
import { ColorPicker } from '@/components/ui/color-picker'
import { PositionSettings } from './PositionSettings'

export const PassRateChartSettings = () => {
  const {
    actions: { setProp },
    passCount,
    passCountBinding,
    failCount,
    failCountBinding,
    chartType,
    passColor,
    failColor,
    showPercentage,
    showLegend,
    showCounts,
    title,
    visible,
  } = useNode((node) => ({
    passCount: node.data.props.passCount,
    passCountBinding: node.data.props.passCountBinding,
    failCount: node.data.props.failCount,
    failCountBinding: node.data.props.failCountBinding,
    chartType: node.data.props.chartType,
    passColor: node.data.props.passColor,
    failColor: node.data.props.failColor,
    showPercentage: node.data.props.showPercentage,
    showLegend: node.data.props.showLegend,
    showCounts: node.data.props.showCounts,
    title: node.data.props.title,
    visible: node.data.props.visible,
  }))

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Title</label>
        <Input
          type="text"
          value={title}
          onChange={(e) => setProp((props: any) => (props.title = e.target.value))}
          placeholder="Pass Rate"
        />
      </div>

      {/* Pass Count */}
      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">
          Pass Count
        </label>
        <Input
          type="number"
          value={passCount}
          onChange={(e) => setProp((props: any) => (props.passCount = parseInt(e.target.value) || 0))}
        />
        <Input
          type="text"
          value={passCountBinding}
          onChange={(e) => setProp((props: any) => (props.passCountBinding = e.target.value))}
          placeholder="{{summary.passCount}}"
          className="mt-2"
        />
      </div>

      {/* Fail Count */}
      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">
          Fail Count
        </label>
        <Input
          type="number"
          value={failCount}
          onChange={(e) => setProp((props: any) => (props.failCount = parseInt(e.target.value) || 0))}
        />
        <Input
          type="text"
          value={failCountBinding}
          onChange={(e) => setProp((props: any) => (props.failCountBinding = e.target.value))}
          placeholder="{{summary.failCount}}"
          className="mt-2"
        />
      </div>

      {/* Chart Type */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Chart Type</label>
        <div className="flex gap-2">
          {['donut', 'pie', 'bar'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setProp((props: any) => (props.chartType = t))}
              className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                chartType === t
                  ? 'bg-[rgba(0,255,200,0.2)] text-[#00ffc8] border-[#00ffc8]'
                  : 'bg-[#050810] text-gray-400 border-[rgba(0,255,200,0.2)] hover:border-[rgba(0,255,200,0.4)]'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
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
              onChange={(value) => setProp((props: any) => (props.passColor = value))}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Fail Color</label>
            <ColorPicker
              value={failColor}
              onChange={(value) => setProp((props: any) => (props.failColor = value))}
            />
          </div>
        </div>
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
              checked={showPercentage}
              onChange={(e) => setProp((props: any) => (props.showPercentage = e.target.checked))}
              className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#050810] text-[#00ffc8] focus:ring-[#00ffc8]"
            />
            <span className="text-sm text-gray-400">Show Percentage</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showLegend}
              onChange={(e) => setProp((props: any) => (props.showLegend = e.target.checked))}
              className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#050810] text-[#00ffc8] focus:ring-[#00ffc8]"
            />
            <span className="text-sm text-gray-400">Show Legend</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showCounts}
              onChange={(e) => setProp((props: any) => (props.showCounts = e.target.checked))}
              className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#050810] text-[#00ffc8] focus:ring-[#00ffc8]"
            />
            <span className="text-sm text-gray-400">Show Counts</span>
          </label>
        </div>
      </div>

      {/* Visibility */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={visible}
          onChange={(e) => setProp((props: any) => (props.visible = e.target.checked))}
          className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#050810] text-[#00ffc8] focus:ring-[#00ffc8]"
        />
        <span className="text-sm text-gray-400">Visible</span>
      </label>

      {/* Position Settings */}
      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <PositionSettings />
      </div>
    </div>
  )
}
