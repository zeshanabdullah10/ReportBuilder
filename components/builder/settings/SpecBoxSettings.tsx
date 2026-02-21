'use client'

import { useNode } from '@craftjs/core'
import { PositionSettings } from './PositionSettings'

export const SpecBoxSettings = () => {
  const {
    actions: { setProp },
    title,
    titleBinding,
    nominal,
    nominalBinding,
    tolerance,
    toleranceBinding,
    unit,
    unitBinding,
    measured,
    measuredBinding,
    showStatus,
    passColor,
    failColor,
    layout,
    visible,
  } = useNode((node) => ({
    title: node.data.props.title,
    titleBinding: node.data.props.titleBinding,
    nominal: node.data.props.nominal,
    nominalBinding: node.data.props.nominalBinding,
    tolerance: node.data.props.tolerance,
    toleranceBinding: node.data.props.toleranceBinding,
    unit: node.data.props.unit,
    unitBinding: node.data.props.unitBinding,
    measured: node.data.props.measured,
    measuredBinding: node.data.props.measuredBinding,
    showStatus: node.data.props.showStatus,
    passColor: node.data.props.passColor,
    failColor: node.data.props.failColor,
    layout: node.data.props.layout,
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
          placeholder="Specification"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
        <input
          type="text"
          value={titleBinding}
          onChange={(e) => setProp((props: any) => (props.titleBinding = e.target.value))}
          placeholder="{{spec.name}}"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mt-1"
        />
      </div>

      {/* Nominal Value */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nominal Value
        </label>
        <input
          type="text"
          value={nominal}
          onChange={(e) => setProp((props: any) => (props.nominal = e.target.value))}
          placeholder="0.00"
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
          Tolerance
        </label>
        <input
          type="text"
          value={tolerance}
          onChange={(e) => setProp((props: any) => (props.tolerance = e.target.value))}
          placeholder="±0.01"
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

      {/* Unit */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Unit
        </label>
        <input
          type="text"
          value={unit}
          onChange={(e) => setProp((props: any) => (props.unit = e.target.value))}
          placeholder="mm"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
        <input
          type="text"
          value={unitBinding}
          onChange={(e) => setProp((props: any) => (props.unitBinding = e.target.value))}
          placeholder="{{spec.unit}}"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mt-1"
        />
      </div>

      {/* Measured Value */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Measured Value
        </label>
        <input
          type="text"
          value={measured}
          onChange={(e) => setProp((props: any) => (props.measured = e.target.value))}
          placeholder="0.005"
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

      {/* Layout */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Layout
        </label>
        <div className="flex gap-2">
          {['horizontal', 'vertical', 'compact'].map((l) => (
            <button
              key={l}
              onClick={() => setProp((props: any) => (props.layout = l))}
              className={`flex-1 px-3 py-2 text-sm rounded-md border ${
                layout === l
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {l.charAt(0).toUpperCase() + l.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Show Status */}
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showStatus}
            onChange={(e) => setProp((props: any) => (props.showStatus = e.target.checked))}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">Show Pass/Fail Status</span>
        </label>
      </div>

      {/* Status Colors */}
      {showStatus && (
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
      )}

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
