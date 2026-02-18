'use client'

import { useNode } from '@craftjs/core'
import { Input } from '@/components/ui/input'
import { PositionSettings } from './PositionSettings'

export function TextSettings() {
  const {
    actions: { setProp },
    text,
    fontSize,
    fontWeight,
    color,
    binding,
  } = useNode((node) => ({
    text: node.data.props.text,
    fontSize: node.data.props.fontSize,
    fontWeight: node.data.props.fontWeight,
    color: node.data.props.color,
    binding: node.data.props.binding,
  }))

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Text Content</label>
        <textarea
          value={text}
          onChange={(e) => setProp((props: any) => (props.text = e.target.value))}
          className="w-full bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg p-2 text-white text-sm"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Font Size</label>
          <Input
            type="number"
            value={fontSize}
            onChange={(e) => setProp((props: any) => (props.fontSize = parseInt(e.target.value) || 16))}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Color</label>
          <Input
            type="color"
            value={color}
            onChange={(e) => setProp((props: any) => (props.color = e.target.value))}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Font Weight</label>
        <select
          value={fontWeight}
          onChange={(e) => setProp((props: any) => (props.fontWeight = e.target.value))}
          className="w-full bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg p-2 text-white text-sm"
        >
          <option value="normal">Normal</option>
          <option value="bold">Bold</option>
          <option value="lighter">Light</option>
        </select>
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
            placeholder="{{data.fieldName}}"
          />
          <p className="text-xs text-gray-500 mt-1">
            Use <code className="text-[#00ffc8]">{'{{data.path}}'}</code> to bind to sample data.
            You can also use bindings directly in the text content.
          </p>
        </div>
      </div>

      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <PositionSettings />
      </div>
    </div>
  )
}
