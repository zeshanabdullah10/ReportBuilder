'use client'

import { useNode } from '@craftjs/core'
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
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setProp((props: any) => (props.title = e.target.value))}
          placeholder="Pass Rate"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
      </div>

      {/* Pass Count */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Pass Count
        </label>
        <input
          type="number"
          value={passCount}
          onChange={(e) => setProp((props: any) => (props.passCount = parseInt(e.target.value) || 0))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
        <input
          type="text"
          value={passCountBinding}
          onChange={(e) => setProp((props: any) => (props.passCountBinding = e.target.value))}
          placeholder="{{summary.passCount}}"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mt-1"
        />
      </div>

      {/* Fail Count */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fail Count
        </label>
        <input
          type="number"
          value={failCount}
          onChange={(e) => setProp((props: any) => (props.failCount = parseInt(e.target.value) || 0))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
        <input
          type="text"
          value={failCountBinding}
          onChange={(e) => setProp((props: any) => (props.failCountBinding = e.target.value))}
          placeholder="{{summary.failCount}}"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mt-1"
        />
      </div>

      {/* Chart Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Chart Type
        </label>
        <div className="flex gap-2">
          {['donut', 'pie', 'bar'].map((t) => (
            <button
              key={t}
              onClick={() => setProp((props: any) => (props.chartType = t))}
              className={`flex-1 px-3 py-2 text-sm rounded-md border ${
                chartType === t
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pass Color
          </label>
          <div className="flex gap-1">
            <input
              type="color"
              value={passColor}
              onChange={(e) => setProp((props: any) => (props.passColor = e.target.value))}
              className="w-10 h-10 rounded border border-gray-300"
            />
            <input
              type="text"
              value={passColor}
              onChange={(e) => setProp((props: any) => (props.passColor = e.target.value))}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fail Color
          </label>
          <div className="flex gap-1">
            <input
              type="color"
              value={failColor}
              onChange={(e) => setProp((props: any) => (props.failColor = e.target.value))}
              className="w-10 h-10 rounded border border-gray-300"
            />
            <input
              type="text"
              value={failColor}
              onChange={(e) => setProp((props: any) => (props.failColor = e.target.value))}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>
      </div>

      {/* Display Options */}
      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showPercentage}
            onChange={(e) => setProp((props: any) => (props.showPercentage = e.target.checked))}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">Show Percentage</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showLegend}
            onChange={(e) => setProp((props: any) => (props.showLegend = e.target.checked))}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">Show Legend</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showCounts}
            onChange={(e) => setProp((props: any) => (props.showCounts = e.target.checked))}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">Show Counts</span>
        </label>
      </div>

      {/* Visibility */}
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={visible}
            onChange={(e) => setProp((props: any) => (props.visible = e.target.checked))}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">Visible</span>
        </label>
      </div>

      {/* Position Settings */}
      <PositionSettings />
    </div>
  )
}
