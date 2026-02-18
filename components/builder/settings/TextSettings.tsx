'use client'

import { useNode } from '@craftjs/core'
import { Input } from '@/components/ui/input'
import { PositionSettings } from './PositionSettings'
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react'

const FONT_FAMILIES = [
  { value: 'inherit', label: 'Default' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Courier New, monospace', label: 'Courier New' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: 'Tahoma, sans-serif', label: 'Tahoma' },
  { value: 'Trebuchet MS, sans-serif', label: 'Trebuchet MS' },
  { value: 'Impact, sans-serif', label: 'Impact' },
  { value: 'Comic Sans MS, cursive', label: 'Comic Sans MS' },
  { value: 'Palatino Linotype, serif', label: 'Palatino' },
  { value: 'Lucida Console, monospace', label: 'Lucida Console' },
]

const TEXT_ALIGN_OPTIONS = [
  { value: 'left', icon: AlignLeft, label: 'Align Left' },
  { value: 'center', icon: AlignCenter, label: 'Align Center' },
  { value: 'right', icon: AlignRight, label: 'Align Right' },
  { value: 'justify', icon: AlignJustify, label: 'Justify' },
] as const

export function TextSettings() {
  const {
    actions: { setProp },
    text,
    fontSize,
    fontWeight,
    fontFamily,
    color,
    textAlign,
    binding,
  } = useNode((node) => ({
    text: node.data.props.text,
    fontSize: node.data.props.fontSize,
    fontWeight: node.data.props.fontWeight,
    fontFamily: node.data.props.fontFamily,
    color: node.data.props.color,
    textAlign: node.data.props.textAlign,
    binding: node.data.props.binding,
  }))

  const handleSizeToContent = () => {
    // Create a temporary element to measure text dimensions
    const tempEl = document.createElement('div')
    tempEl.style.cssText = `
      position: absolute;
      visibility: hidden;
      white-space: pre-wrap;
      font-size: ${fontSize}px;
      font-weight: ${fontWeight};
      font-family: ${fontFamily || 'inherit'};
      padding: 8px;
      box-sizing: border-box;
      max-width: 800px;
    `
    tempEl.textContent = text || 'Edit this text'
    document.body.appendChild(tempEl)

    const measuredWidth = tempEl.offsetWidth + 16 // Add some padding
    const measuredHeight = tempEl.offsetHeight + 8

    document.body.removeChild(tempEl)

    setProp((props: any) => {
      props.width = Math.max(50, Math.min(measuredWidth, 800))
      props.height = Math.max(30, measuredHeight)
    })
  }

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

        <div>
          <label className="block text-sm text-gray-400 mb-1">Text Align</label>
          <div className="flex gap-1 bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg p-1">
            {TEXT_ALIGN_OPTIONS.map((option) => {
              const Icon = option.icon
              return (
                <button
                  key={option.value}
                  type="button"
                  title={option.label}
                  onClick={() => setProp((props: any) => (props.textAlign = option.value))}
                  className={`flex-1 p-1.5 rounded transition-colors ${
                    textAlign === option.value
                      ? 'bg-[#00ffc8] text-[#0a0f14]'
                      : 'text-gray-400 hover:text-white hover:bg-[rgba(0,255,200,0.1)]'
                  }`}
                >
                  <Icon className="w-4 h-4 mx-auto" />
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={handleSizeToContent}
          className="w-full py-2 px-3 bg-[rgba(0,255,200,0.1)] border border-[rgba(0,255,200,0.3)] rounded-lg text-[#00ffc8] text-sm hover:bg-[rgba(0,255,200,0.2)] transition-colors"
        >
          Size to Content
        </button>
        <p className="text-xs text-gray-500 mt-1 text-center">
          Auto-size the component to fit the text
        </p>
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
