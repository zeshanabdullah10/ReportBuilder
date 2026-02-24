'use client'

import { useNode } from '@craftjs/core'
import { PositionSettings } from './PositionSettings'

export const ToleranceBandSettings = () => {
  const {
    actions: { setProp },
    nominal,
    nominalBinding,
    tolerance,
    toleranceBinding,
    measured,
    measuredBinding,
    bandColor,
    centerColor,
    measuredColor,
    showLabels,
    showValue,
    minScale,
    maxScale,
    autoScale,
    visible,
  } = useNode((node) => ({
    nominal: node.data.props.nominal,
    nominalBinding: node.data.props.nominalBinding,
    tolerance: node.data.props.tolerance,
    toleranceBinding: node.data.props.toleranceBinding,
    measured: node.data.props.measured,
    measuredBinding: node.data.props.measuredBinding,
    bandColor: node.data.props.bandColor,
    centerColor: node.data.props.centerColor,
    measuredColor: node.data.props.measuredColor,
    showLabels: node.data.props.showLabels,
    showValue: node.data.props.showValue,
    minScale: node.data.props.minScale,
    maxScale: node.data.props.maxScale,
    autoScale: node.data.props.autoScale,
    visible: node.data.props.visible,
  }))

  return (
    <div className="space-y-4">
      {/* Nominal Value */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nominal Value
        </label>
        <input
          type="number"
          value={nominal}
          onChange={(e) => setProp((props: any) => (props.nominal = parseFloat(e.target.value) || 0))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
        <input
          type="text"
          value={nominalBinding}
          onChange={(e) => setProp((props: any) => (props.nominalBinding = e.target.value))}
          placeholder="{{spec.nominal}}"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mt-1"
        />
      </div>

      {/* Tolerance */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tolerance (±)
        </label>
        <input
          type="number"
          value={tolerance}
          onChange={(e) => setProp((props: any) => (props.tolerance = parseFloat(e.target.value) || 0))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
        <input
          type="text"
          value={toleranceBinding}
          onChange={(e) => setProp((props: any) => (props.toleranceBinding = e.target.value))}
          placeholder="{{spec.tolerance}}"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mt-1"
        />
      </div>

      {/* Measured Value */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Measured Value
        </label>
        <input
          type="number"
          value={measured}
          onChange={(e) => setProp((props: any) => (props.measured = parseFloat(e.target.value) || 0))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
        <input
          type="text"
          value={measuredBinding}
          onChange={(e) => setProp((props: any) => (props.measuredBinding = e.target.value))}
          placeholder="{{measurement.value}}"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mt-1"
        />
      </div>

      {/* Scale Settings */}
      <div>
        <label className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={autoScale}
            onChange={(e) => setProp((props: any) => (props.autoScale = e.target.checked))}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">Auto Scale</span>
        </label>
        {!autoScale && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Min</label>
              <input
                type="number"
                value={minScale}
                onChange={(e) => setProp((props: any) => (props.minScale = parseFloat(e.target.value) || 0))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Max</label>
              <input
                type="number"
                value={maxScale}
                onChange={(e) => setProp((props: any) => (props.maxScale = parseFloat(e.target.value) || 100))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Colors */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Colors</label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tolerance</label>
            <div className="flex gap-1">
              <input
                type="color"
                value={bandColor}
                onChange={(e) => setProp((props: any) => (props.bandColor = e.target.value))}
                className="w-8 h-8 rounded border border-gray-300"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Center</label>
            <div className="flex gap-1">
              <input
                type="color"
                value={centerColor}
                onChange={(e) => setProp((props: any) => (props.centerColor = e.target.value))}
                className="w-8 h-8 rounded border border-gray-300"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Measured</label>
            <div className="flex gap-1">
              <input
                type="color"
                value={measuredColor}
                onChange={(e) => setProp((props: any) => (props.measuredColor = e.target.value))}
                className="w-8 h-8 rounded border border-gray-300"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Display Options */}
      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showLabels}
            onChange={(e) => setProp((props: any) => (props.showLabels = e.target.checked))}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">Show Min/Max Labels</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showValue}
            onChange={(e) => setProp((props: any) => (props.showValue = e.target.checked))}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">Show Value Summary</span>
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
