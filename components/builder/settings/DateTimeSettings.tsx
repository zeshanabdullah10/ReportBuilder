'use client'

import { useNode } from '@craftjs/core'
import { Input } from '@/components/ui/input'
import { PositionSettings } from './PositionSettings'
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react'

const FONT_FAMILIES = [
  { value: 'inherit', label: 'Default' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Courier New, monospace', label: 'Courier New' },
]

const DATE_FORMATS = [
  { value: 'date-short', label: 'Short Date (01/15/2024)', example: '01/15/2024' },
  { value: 'date-long', label: 'Long Date (January 15, 2024)', example: 'January 15, 2024' },
  { value: 'date-time', label: 'Date & Time (01/15/2024 14:30)', example: '01/15/2024 14:30' },
  { value: 'time-only', label: 'Time Only (14:30)', example: '14:30' },
  { value: 'iso', label: 'ISO Format (2024-01-15)', example: '2024-01-15' },
  { value: 'custom', label: 'Custom Format', example: 'Custom' },
]

const TEXT_ALIGN_OPTIONS = [
  { value: 'left', icon: AlignLeft, label: 'Align Left' },
  { value: 'center', icon: AlignCenter, label: 'Align Center' },
  { value: 'right', icon: AlignRight, label: 'Align Right' },
] as const

export function DateTimeSettings() {
  const {
    actions: { setProp },
    format,
    fontSize,
    fontFamily,
    color,
    textAlign,
    binding,
  } = useNode((node) => ({
    format: node.data.props.format,
    fontSize: node.data.props.fontSize,
    fontFamily: node.data.props.fontFamily,
    color: node.data.props.color,
    textAlign: node.data.props.textAlign,
    binding: node.data.props.binding,
  }))

  const isCustomFormat = format !== 'custom' && !DATE_FORMATS.some(f => f.value === format)

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Format</label>
        <select
          value={format === 'custom' || isCustomFormat ? 'custom' : format}
          onChange={(e) => setProp((props: any) => (props.format = e.target.value))}
          className="w-full bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg p-2 text-white text-sm"
        >
          {DATE_FORMATS.map((fmt) => (
            <option key={fmt.value} value={fmt.value}>
              {fmt.label}
            </option>
          ))}
        </select>
      </div>

      {(format === 'custom' || isCustomFormat) && (
        <div>
          <label className="block text-sm text-gray-400 mb-1">Custom Format</label>
          <Input
            value={isCustomFormat ? format : ''}
            onChange={(e) => setProp((props: any) => (props.format = e.target.value))}
            placeholder="MMMM dd, yyyy HH:mm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Use: yyyy, MM, dd, HH, mm, ss, MMMM, MMM, dddd, ddd
          </p>
        </div>
      )}

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

      <div>
        <label className="block text-sm text-gray-400 mb-1">Text Align</label>
        <div className="flex gap-0.5 bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg p-0.5">
          {TEXT_ALIGN_OPTIONS.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.value}
                type="button"
                title={option.label}
                onClick={() => setProp((props: any) => (props.textAlign = option.value))}
                className={`flex-1 p-1 rounded transition-colors ${
                  textAlign === option.value
                    ? 'bg-[#00ffc8] text-[#0a0f14]'
                    : 'text-gray-400 hover:text-white hover:bg-[rgba(0,255,200,0.1)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 mx-auto" />
              </button>
            )
          })}
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
            placeholder="{{data.timestamp}}"
          />
          <p className="text-xs text-gray-500 mt-1">
            Bind to a date field. If empty, shows current date/time.
          </p>
        </div>
      </div>

      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <PositionSettings />
      </div>
    </div>
  )
}
