'use client'

import { useNode } from '@craftjs/core'
import { Input } from '@/components/ui/input'

export function ChartSettings() {
  const {
    actions: { setProp },
    chartType,
    title,
    label,
    dataPoints,
    labels,
    binding,
  } = useNode((node) => ({
    chartType: node.data.props.chartType,
    title: node.data.props.title,
    label: node.data.props.label,
    dataPoints: node.data.props.dataPoints,
    labels: node.data.props.labels,
    binding: node.data.props.binding,
  }))

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Chart Type</label>
        <select
          value={chartType}
          onChange={(e) => setProp((props: any) => (props.chartType = e.target.value))}
          className="w-full bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg p-2 text-white text-sm"
        >
          <option value="bar">Bar Chart</option>
          <option value="line">Line Chart</option>
          <option value="pie">Pie Chart</option>
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Title</label>
        <Input
          value={title}
          onChange={(e) => setProp((props: any) => (props.title = e.target.value))}
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Dataset Label</label>
        <Input
          value={label}
          onChange={(e) => setProp((props: any) => (props.label = e.target.value))}
        />
      </div>

      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">
          Static Data
        </label>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Data Points (comma-separated)</label>
            <input
              type="text"
              value={dataPoints}
              onChange={(e) => setProp((props: any) => (props.dataPoints = e.target.value))}
              className="w-full bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg p-2 text-white text-sm"
              placeholder="65, 59, 80, 81, 56"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Labels (comma-separated, optional)</label>
            <input
              type="text"
              value={labels}
              onChange={(e) => setProp((props: any) => (props.labels = e.target.value))}
              className="w-full bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg p-2 text-white text-sm"
              placeholder="Mon, Tue, Wed, Thu, Fri"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">
          Data Binding
        </label>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Binding Path</label>
          <Input
            value={binding}
            onChange={(e) => setProp((props: any) => (props.binding = e.target.value))}
            placeholder="{{data.chartData}}"
          />
          <p className="text-xs text-gray-500 mt-1">
            Bind to an array of numbers or objects with <code className="text-[#00ffc8]">{'{label, value}'}</code> format.
            Overrides static data points when bound.
          </p>
        </div>
      </div>
    </div>
  )
}
