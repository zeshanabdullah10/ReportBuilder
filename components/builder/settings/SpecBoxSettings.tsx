'use client'

import { useNode } from '@craftjs/core'
import { Input } from '@/components/ui/input'
import { ColorPicker } from '@/components/ui/color-picker'
import { DataBindingInput } from '@/components/builder/data-binding'
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
        <label className="block text-sm text-gray-400 mb-1">Title</label>
        <Input
          type="text"
          value={title}
          onChange={(e) => setProp((props: any) => (props.title = e.target.value))}
          placeholder="Specification"
        />
        <div className="mt-2">
          <DataBindingInput
            value={titleBinding}
            onChange={(value) => setProp((props: any) => (props.titleBinding = value))}
            placeholder="{{spec.name}}"
            expectedType="string"
          />
        </div>
      </div>

      {/* Nominal Value */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Nominal Value</label>
        <Input
          type="text"
          value={nominal}
          onChange={(e) => setProp((props: any) => (props.nominal = e.target.value))}
          placeholder="0.00"
        />
        <div className="mt-2">
          <DataBindingInput
            value={nominalBinding}
            onChange={(value) => setProp((props: any) => (props.nominalBinding = value))}
            placeholder="{{spec.nominal}}"
            expectedType="number"
          />
        </div>
      </div>

      {/* Tolerance */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Tolerance</label>
        <Input
          type="text"
          value={tolerance}
          onChange={(e) => setProp((props: any) => (props.tolerance = e.target.value))}
          placeholder="±0.01"
        />
        <div className="mt-2">
          <DataBindingInput
            value={toleranceBinding}
            onChange={(value) => setProp((props: any) => (props.toleranceBinding = value))}
            placeholder="{{spec.tolerance}}"
            expectedType="string"
          />
        </div>
      </div>

      {/* Unit */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Unit</label>
        <Input
          type="text"
          value={unit}
          onChange={(e) => setProp((props: any) => (props.unit = e.target.value))}
          placeholder="mm"
        />
        <div className="mt-2">
          <DataBindingInput
            value={unitBinding}
            onChange={(value) => setProp((props: any) => (props.unitBinding = value))}
            placeholder="{{spec.unit}}"
            expectedType="string"
          />
        </div>
      </div>

      {/* Measured Value */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Measured Value</label>
        <Input
          type="text"
          value={measured}
          onChange={(e) => setProp((props: any) => (props.measured = e.target.value))}
          placeholder="0.005"
        />
        <div className="mt-2">
          <DataBindingInput
            value={measuredBinding}
            onChange={(value) => setProp((props: any) => (props.measuredBinding = value))}
            placeholder="{{measurement.value}}"
            expectedType="number"
          />
        </div>
      </div>

      {/* Layout */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Layout</label>
        <div className="flex gap-2">
          {['horizontal', 'vertical', 'compact'].map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setProp((props: any) => (props.layout = l))}
              className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                layout === l
                  ? 'bg-[rgba(0,255,200,0.2)] text-[#00ffc8] border-[#00ffc8]'
                  : 'bg-[#050810] text-gray-400 border-[rgba(0,255,200,0.2)] hover:border-[rgba(0,255,200,0.4)]'
              }`}
            >
              {l.charAt(0).toUpperCase() + l.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Show Status */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={showStatus}
          onChange={(e) => setProp((props: any) => (props.showStatus = e.target.checked))}
          className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#050810] text-[#00ffc8] focus:ring-[#00ffc8]"
        />
        <span className="text-sm text-gray-400">Show Pass/Fail Status</span>
      </label>

      {/* Status Colors */}
      {showStatus && (
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
      )}

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
