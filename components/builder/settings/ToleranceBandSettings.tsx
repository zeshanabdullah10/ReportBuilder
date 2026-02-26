'use client'

import { useNode } from '@craftjs/core'
import { Input } from '@/components/ui/input'
import { ColorPicker } from '@/components/ui/color-picker'
import { DataBindingInput } from '@/components/builder/data-binding'
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
        <label className="block text-sm text-gray-400 mb-1">Nominal Value</label>
        <Input
          type="number"
          value={nominal}
          onChange={(e) => setProp((props: any) => (props.nominal = parseFloat(e.target.value) || 0))}
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
        <label className="block text-sm text-gray-400 mb-1">Tolerance (±)</label>
        <Input
          type="number"
          value={tolerance}
          onChange={(e) => setProp((props: any) => (props.tolerance = parseFloat(e.target.value) || 0))}
        />
        <div className="mt-2">
          <DataBindingInput
            value={toleranceBinding}
            onChange={(value) => setProp((props: any) => (props.toleranceBinding = value))}
            placeholder="{{spec.tolerance}}"
            expectedType="number"
          />
        </div>
      </div>

      {/* Measured Value */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Measured Value</label>
        <Input
          type="number"
          value={measured}
          onChange={(e) => setProp((props: any) => (props.measured = parseFloat(e.target.value) || 0))}
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

      {/* Scale Settings */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer mb-2">
          <input
            type="checkbox"
            checked={autoScale}
            onChange={(e) => setProp((props: any) => (props.autoScale = e.target.checked))}
            className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#050810] text-[#00ffc8] focus:ring-[#00ffc8]"
          />
          <span className="text-sm text-gray-400">Auto Scale</span>
        </label>
        {!autoScale && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Min</label>
              <Input
                type="number"
                value={minScale}
                onChange={(e) => setProp((props: any) => (props.minScale = parseFloat(e.target.value) || 0))}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Max</label>
              <Input
                type="number"
                value={maxScale}
                onChange={(e) => setProp((props: any) => (props.maxScale = parseFloat(e.target.value) || 100))}
              />
            </div>
          </div>
        )}
      </div>

      {/* Colors */}
      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">
          Colors
        </label>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Tolerance</label>
            <ColorPicker
              value={bandColor}
              onChange={(value) => setProp((props: any) => (props.bandColor = value))}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Center</label>
            <ColorPicker
              value={centerColor}
              onChange={(value) => setProp((props: any) => (props.centerColor = value))}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Measured</label>
            <ColorPicker
              value={measuredColor}
              onChange={(value) => setProp((props: any) => (props.measuredColor = value))}
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
              checked={showLabels}
              onChange={(e) => setProp((props: any) => (props.showLabels = e.target.checked))}
              className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#050810] text-[#00ffc8] focus:ring-[#00ffc8]"
            />
            <span className="text-sm text-gray-400">Show Min/Max Labels</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showValue}
              onChange={(e) => setProp((props: any) => (props.showValue = e.target.checked))}
              className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#050810] text-[#00ffc8] focus:ring-[#00ffc8]"
            />
            <span className="text-sm text-gray-400">Show Value Summary</span>
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
