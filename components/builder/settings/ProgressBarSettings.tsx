'use client'

import { useNode } from '@craftjs/core'
import { Input } from '@/components/ui/input'
import { PositionSettings } from './PositionSettings'

export function ProgressBarSettings() {
  const {
    actions: { setProp },
    value,
    min,
    max,
    label,
    showValue,
    fillColor,
    backgroundColor,
    textColor,
    borderRadius,
    binding,
  } = useNode((node) => ({
    value: node.data.props.value,
    min: node.data.props.min,
    max: node.data.props.max,
    label: node.data.props.label,
    showValue: node.data.props.showValue,
    fillColor: node.data.props.fillColor,
    backgroundColor: node.data.props.backgroundColor,
    textColor: node.data.props.textColor,
    borderRadius: node.data.props.borderRadius,
    binding: node.data.props.binding,
  }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Min</label>
          <Input
            type="number"
            value={min}
            onChange={(e) => setProp((props: any) => (props.min = parseFloat(e.target.value) || 0))}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Value</label>
          <Input
            type="number"
            value={value}
            onChange={(e) => setProp((props: any) => (props.value = parseFloat(e.target.value) || 0))}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Max</label>
          <Input
            type="number"
            value={max}
            onChange={(e) => setProp((props: any) => (props.max = parseFloat(e.target.value) || 100))}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Label</label>
        <Input
          value={label}
          onChange={(e) => setProp((props: any) => (props.label = e.target.value))}
          placeholder="e.g. Progress"
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={showValue}
          onChange={(e) => setProp((props: any) => (props.showValue = e.target.checked))}
          className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#050810] text-[#00ffc8] focus:ring-[#00ffc8]"
        />
        <span className="text-sm text-gray-400">Show percentage value</span>
      </label>

      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">
          Colors
        </label>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Fill Color</label>
              <Input
                type="color"
                value={fillColor}
                onChange={(e) => setProp((props: any) => (props.fillColor = e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Track Color</label>
              <Input
                type="color"
                value={backgroundColor?.replace(/rgba?\([^)]+\)/, '#333333') || '#333333'}
                onChange={(e) => {
                  const hex = e.target.value
                  const r = parseInt(hex.slice(1, 3), 16)
                  const g = parseInt(hex.slice(3, 5), 16)
                  const b = parseInt(hex.slice(5, 7), 16)
                  setProp((props: any) => (props.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.2)`))
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Text Color</label>
              <Input
                type="color"
                value={textColor}
                onChange={(e) => setProp((props: any) => (props.textColor = e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Border Radius</label>
              <Input
                type="number"
                min={0}
                max={20}
                value={borderRadius}
                onChange={(e) => setProp((props: any) => (props.borderRadius = parseInt(e.target.value) || 0))}
              />
            </div>
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
            placeholder="{{data.progress}}"
          />
          <p className="text-xs text-gray-500 mt-1">
            Bind to a numeric value (0-100). Overrides static value when bound.
          </p>
        </div>
      </div>

      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <PositionSettings />
      </div>
    </div>
  )
}
