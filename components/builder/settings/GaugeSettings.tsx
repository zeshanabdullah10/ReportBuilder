'use client'

import { useNode } from '@craftjs/core'
import { Input } from '@/components/ui/input'
import { PositionSettings } from './PositionSettings'

export function GaugeSettings() {
  const {
    actions: { setProp },
    value,
    min,
    max,
    label,
    unit,
    primaryColor,
    backgroundColor,
    textColor,
    binding,
  } = useNode((node) => ({
    value: node.data.props.value,
    min: node.data.props.min,
    max: node.data.props.max,
    label: node.data.props.label,
    unit: node.data.props.unit,
    primaryColor: node.data.props.primaryColor,
    backgroundColor: node.data.props.backgroundColor,
    textColor: node.data.props.textColor,
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Label</label>
          <Input
            value={label}
            onChange={(e) => setProp((props: any) => (props.label = e.target.value))}
            placeholder="e.g. Temperature"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Unit</label>
          <Input
            value={unit}
            onChange={(e) => setProp((props: any) => (props.unit = e.target.value))}
            placeholder="e.g. %, °C"
          />
        </div>
      </div>

      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">
          Colors
        </label>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Gauge Color</label>
              <Input
                type="color"
                value={primaryColor}
                onChange={(e) => setProp((props: any) => (props.primaryColor = e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Track Color</label>
              <Input
                type="color"
                value={backgroundColor?.replace(/rgba?\([^)]+\)/, '#ffffff') || '#333333'}
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
          <div>
            <label className="block text-sm text-gray-400 mb-1">Text Color</label>
            <Input
              type="color"
              value={textColor}
              onChange={(e) => setProp((props: any) => (props.textColor = e.target.value))}
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
            placeholder="{{data.temperature}}"
          />
          <p className="text-xs text-gray-500 mt-1">
            Bind to a numeric value. Overrides static value when bound.
          </p>
        </div>
      </div>

      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <PositionSettings />
      </div>
    </div>
  )
}
