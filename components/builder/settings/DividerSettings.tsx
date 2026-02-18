'use client'

import { useNode } from '@craftjs/core'
import { Input } from '@/components/ui/input'
import { PositionSettings } from './PositionSettings'

export function DividerSettings() {
  const {
    actions: { setProp },
    orientation,
    style,
    color,
    thickness,
  } = useNode((node) => ({
    orientation: node.data.props.orientation,
    style: node.data.props.style,
    color: node.data.props.color,
    thickness: node.data.props.thickness,
  }))

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Orientation</label>
        <div className="flex gap-1 bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setProp((props: any) => (props.orientation = 'horizontal'))}
            className={`flex-1 p-1.5 rounded text-sm transition-colors ${
              orientation === 'horizontal'
                ? 'bg-[#00ffc8] text-[#0a0f14]'
                : 'text-gray-400 hover:text-white hover:bg-[rgba(0,255,200,0.1)]'
            }`}
          >
            Horizontal
          </button>
          <button
            type="button"
            onClick={() => setProp((props: any) => (props.orientation = 'vertical'))}
            className={`flex-1 p-1.5 rounded text-sm transition-colors ${
              orientation === 'vertical'
                ? 'bg-[#00ffc8] text-[#0a0f14]'
                : 'text-gray-400 hover:text-white hover:bg-[rgba(0,255,200,0.1)]'
            }`}
          >
            Vertical
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Line Style</label>
        <select
          value={style}
          onChange={(e) => setProp((props: any) => (props.style = e.target.value))}
          className="w-full bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg p-2 text-white text-sm"
        >
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
          <option value="double">Double</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Color</label>
          <Input
            type="color"
            value={color}
            onChange={(e) => setProp((props: any) => (props.color = e.target.value))}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Thickness</label>
          <Input
            type="number"
            min={1}
            max={10}
            value={thickness}
            onChange={(e) => setProp((props: any) => (props.thickness = parseInt(e.target.value) || 1))}
          />
        </div>
      </div>

      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <PositionSettings />
      </div>
    </div>
  )
}
