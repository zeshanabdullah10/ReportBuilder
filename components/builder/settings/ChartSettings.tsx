'use client'

import { useNode } from '@craftjs/core'
import { Input } from '@/components/ui/input'
import { PositionSettings } from './PositionSettings'
import { Plus, Trash2 } from 'lucide-react'

interface DatasetConfig {
  label?: string
  dataPoints?: string
  binding?: string
  chartType?: 'line' | 'bar'
  color?: string
  backgroundColor?: string
  yAxisID?: 'y' | 'y1'
  fill?: boolean
}

export function ChartSettings() {
  const {
    actions: { setProp },
    chartType,
    title,
    label,
    dataPoints,
    labels,
    binding,
    primaryColor,
    backgroundColor,
    borderColor,
    datasets,
    enableMultiAxis,
  } = useNode((node) => ({
    chartType: node.data.props.chartType,
    title: node.data.props.title,
    label: node.data.props.label,
    dataPoints: node.data.props.dataPoints,
    labels: node.data.props.labels,
    binding: node.data.props.binding,
    primaryColor: node.data.props.primaryColor,
    backgroundColor: node.data.props.backgroundColor,
    borderColor: node.data.props.borderColor,
    datasets: node.data.props.datasets,
    enableMultiAxis: node.data.props.enableMultiAxis,
  }))

  const useMultiDataset = datasets && datasets.length > 0

  const addDataset = () => {
    const newDataset: DatasetConfig = {
      label: `Dataset ${(datasets?.length || 0) + 1}`,
      dataPoints: '50, 60, 70, 80, 90',
      binding: '',
      chartType: chartType === 'pie' ? 'bar' : chartType,
      color: getDefaultColor((datasets?.length || 0)),
      yAxisID: 'y',
      fill: false,
    }
    setProp((props: any) => {
      props.datasets = [...(datasets || []), newDataset]
    })
  }

  const removeDataset = (index: number) => {
    setProp((props: any) => {
      props.datasets = (datasets || []).filter((_: any, i: number) => i !== index)
    })
  }

  const updateDataset = (index: number, updates: Partial<DatasetConfig>) => {
    setProp((props: any) => {
      props.datasets = (datasets || []).map((ds: DatasetConfig, i: number) =>
        i === index ? { ...ds, ...updates } : ds
      )
    })
  }

  const clearDatasets = () => {
    setProp((props: any) => {
      props.datasets = []
    })
  }

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

      {/* Color Options - for single dataset mode */}
      {!useMultiDataset && (
        <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
          <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">
            Colors
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Border Color</label>
              <Input
                type="color"
                value={borderColor || '#00ffc8'}
                onChange={(e) => setProp((props: any) => (props.borderColor = e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Fill Color</label>
              <Input
                type="color"
                value={primaryColor || '#00ffc8'}
                onChange={(e) => {
                  const color = e.target.value
                  setProp((props: any) => {
                    props.primaryColor = color
                    props.backgroundColor = hexToRgba(color, 0.5)
                  })
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Multi-Axis Toggle */}
      {chartType !== 'pie' && (
        <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={enableMultiAxis || false}
              onChange={(e) => setProp((props: any) => (props.enableMultiAxis = e.target.checked))}
              className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#050810] text-[#00ffc8] focus:ring-[#00ffc8]"
            />
            <span className="text-sm text-gray-400">Enable Dual Y-Axis</span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-6">
            Show two Y-axes for comparing different scales
          </p>
        </div>
      )}

      {/* Multi-Dataset Section */}
      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs text-gray-500 uppercase tracking-wide">
            Datasets
          </label>
          {!useMultiDataset ? (
            <button
              type="button"
              onClick={addDataset}
              className="flex items-center gap-1 text-xs text-[#00ffc8] hover:text-[#00ffc8]/80"
            >
              <Plus className="w-3 h-3" />
              Add Multiple Datasets
            </button>
          ) : (
            <button
              type="button"
              onClick={clearDatasets}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-400"
            >
              <Trash2 className="w-3 h-3" />
              Clear All
            </button>
          )}
        </div>

        {!useMultiDataset ? (
          /* Single Dataset Mode */
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Dataset Label</label>
              <Input
                value={label}
                onChange={(e) => setProp((props: any) => (props.label = e.target.value))}
              />
            </div>
          </div>
        ) : (
          /* Multi-Dataset Mode */
          <div className="space-y-4">
            {datasets?.map((ds: DatasetConfig, index: number) => (
              <div key={index} className="bg-[#0a0f14] border border-[rgba(0,255,200,0.1)] rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#00ffc8]">
                    Dataset {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeDataset(index)}
                    className="text-gray-500 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Label</label>
                    <input
                      type="text"
                      value={ds.label || ''}
                      onChange={(e) => updateDataset(index, { label: e.target.value })}
                      className="w-full bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded p-1.5 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Type</label>
                    <select
                      value={ds.chartType || 'bar'}
                      onChange={(e) => updateDataset(index, { chartType: e.target.value as 'line' | 'bar' })}
                      className="w-full bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded p-1.5 text-white text-sm"
                    >
                      <option value="bar">Bar</option>
                      <option value="line">Line</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Color</label>
                    <input
                      type="color"
                      value={ds.color || getDefaultColor(index)}
                      onChange={(e) => updateDataset(index, { color: e.target.value })}
                      className="w-full h-8 bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded cursor-pointer"
                    />
                  </div>
                  {enableMultiAxis && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Y-Axis</label>
                      <select
                        value={ds.yAxisID || 'y'}
                        onChange={(e) => updateDataset(index, { yAxisID: e.target.value as 'y' | 'y1' })}
                        className="w-full bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded p-1.5 text-white text-sm"
                      >
                        <option value="y">Primary (Left)</option>
                        <option value="y1">Secondary (Right)</option>
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Data Points</label>
                  <input
                    type="text"
                    value={ds.dataPoints || ''}
                    onChange={(e) => updateDataset(index, { dataPoints: e.target.value })}
                    className="w-full bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded p-1.5 text-white text-sm"
                    placeholder="65, 59, 80, 81, 56"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Binding Path</label>
                  <input
                    type="text"
                    value={ds.binding || ''}
                    onChange={(e) => updateDataset(index, { binding: e.target.value })}
                    className="w-full bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded p-1.5 text-white text-sm"
                    placeholder="{{data.dataset1}}"
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addDataset}
              className="w-full py-2 border border-dashed border-[rgba(0,255,200,0.3)] rounded-lg text-[#00ffc8] text-sm hover:bg-[rgba(0,255,200,0.1)] transition-colors flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Dataset
            </button>
          </div>
        )}
      </div>

      {/* Static Data Section - only for single dataset */}
      {!useMultiDataset && (
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
      )}

      {/* Common Labels - for multi-dataset */}
      {useMultiDataset && (
        <div>
          <label className="block text-sm text-gray-400 mb-1">X-Axis Labels (comma-separated)</label>
          <input
            type="text"
            value={labels}
            onChange={(e) => setProp((props: any) => (props.labels = e.target.value))}
            className="w-full bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg p-2 text-white text-sm"
            placeholder="Mon, Tue, Wed, Thu, Fri"
          />
        </div>
      )}

      {/* Data Binding - only for single dataset */}
      {!useMultiDataset && (
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
      )}

      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <PositionSettings />
      </div>
    </div>
  )
}

// Helper functions
function getDefaultColor(index: number): string {
  const colors = [
    '#00ffc8', '#39ff14', '#ffb000', '#ff6b6b', '#4ecdc4',
    '#9b59b6', '#3498db', '#e74c3c', '#1abc9c', '#f39c12'
  ]
  return colors[index % colors.length]
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
