'use client'

import { useNode } from '@craftjs/core'
import { Input } from '@/components/ui/input'
import { PositionSettings } from './PositionSettings'

const FONT_FAMILIES = [
  { value: 'inherit', label: 'Default' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Courier New, monospace', label: 'Courier New' },
]

export function PageNumberSettings() {
  const {
    actions: { setProp },
    format,
    fontSize,
    fontFamily,
    color,
    prefix,
    suffix,
  } = useNode((node) => ({
    format: node.data.props.format,
    fontSize: node.data.props.fontSize,
    fontFamily: node.data.props.fontFamily,
    color: node.data.props.color,
    prefix: node.data.props.prefix,
    suffix: node.data.props.suffix,
  }))

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Format</label>
        <select
          value={format}
          onChange={(e) => setProp((props: any) => (props.format = e.target.value))}
          className="w-full bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg p-2 text-white text-sm"
        >
          <option value="page">Page 1</option>
          <option value="page-of">Page 1 of 5</option>
          <option value="slash">1/5</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Font Size</label>
          <Input
            type="number"
            value={fontSize}
            onChange={(e) => setProp((props: any) => (props.fontSize = parseInt(e.target.value) || 12))}
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
        <label className="block text-sm text-gray-400 mb-1">Font Family</label>
        <select
          value={fontFamily || 'inherit'}
          onChange={(e) => setProp((props: any) => (props.fontFamily = e.target.value))}
          className="w-full bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg p-2 text-white text-sm"
        >
          {FONT_FAMILIES.map((font) => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Prefix</label>
          <Input
            value={prefix}
            onChange={(e) => setProp((props: any) => (props.prefix = e.target.value))}
            placeholder="e.g. Page "
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Suffix</label>
          <Input
            value={suffix}
            onChange={(e) => setProp((props: any) => (props.suffix = e.target.value))}
            placeholder="e.g. ."
          />
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Page numbers are auto-generated when the report is exported to PDF.
      </p>

      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <PositionSettings />
      </div>
    </div>
  )
}
