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

const LIST_STYLES = [
  { value: 'disc', label: 'Bullets (●)' },
  { value: 'circle', label: 'Circles (○)' },
  { value: 'square', label: 'Squares (■)' },
  { value: 'decimal', label: 'Numbers (1, 2, 3)' },
  { value: 'lower-roman', label: 'Roman (i, ii, iii)' },
  { value: 'upper-alpha', label: 'Letters (A, B, C)' },
]

export function BulletListSettings() {
  const {
    actions: { setProp },
    items,
    listStyle,
    fontSize,
    fontFamily,
    color,
    lineHeight,
    binding,
  } = useNode((node) => ({
    items: node.data.props.items,
    listStyle: node.data.props.listStyle,
    fontSize: node.data.props.fontSize,
    fontFamily: node.data.props.fontFamily,
    color: node.data.props.color,
    lineHeight: node.data.props.lineHeight,
    binding: node.data.props.binding,
  }))

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">List Items (one per line)</label>
        <textarea
          value={items}
          onChange={(e) => setProp((props: any) => (props.items = e.target.value))}
          className="w-full bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg p-2 text-white text-sm font-mono"
          rows={5}
          placeholder="Item 1&#10;Item 2&#10;Item 3"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">List Style</label>
        <select
          value={listStyle}
          onChange={(e) => setProp((props: any) => (props.listStyle = e.target.value))}
          className="w-full bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg p-2 text-white text-sm"
        >
          {LIST_STYLES.map((style) => (
            <option key={style.value} value={style.value}>
              {style.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Font Size</label>
          <Input
            type="number"
            value={fontSize}
            onChange={(e) => setProp((props: any) => (props.fontSize = parseInt(e.target.value) || 14))}
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

      <div>
        <label className="block text-sm text-gray-400 mb-1">Line Height</label>
        <Input
          type="number"
          step="0.1"
          min="1"
          max="3"
          value={lineHeight}
          onChange={(e) => setProp((props: any) => (props.lineHeight = parseFloat(e.target.value) || 1.6))}
        />
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
            placeholder="{{data.items}}"
          />
          <p className="text-xs text-gray-500 mt-1">
            Bind to an array of strings or objects. Overrides static items when bound.
          </p>
        </div>
      </div>

      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <PositionSettings />
      </div>
    </div>
  )
}
