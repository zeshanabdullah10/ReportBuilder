'use client'

import { useNode } from '@craftjs/core'
import { Input } from '@/components/ui/input'
import { DataBindingInput } from '@/components/builder/data-binding'
import { PositionSettings } from './PositionSettings'

export const LogoSettings = () => {
  const {
    actions: { setProp },
    src,
    binding,
    maxHeight,
    align,
    alt,
    fallbackText,
    visible,
  } = useNode((node) => ({
    src: node.data.props.src,
    binding: node.data.props.binding,
    maxHeight: node.data.props.maxHeight,
    align: node.data.props.align,
    alt: node.data.props.alt,
    fallbackText: node.data.props.fallbackText,
    visible: node.data.props.visible,
  }))

  return (
    <div className="space-y-4">
      {/* Image URL */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Logo Image URL</label>
        <Input
          type="text"
          value={src}
          onChange={(e) => setProp((props: any) => (props.src = e.target.value))}
          placeholder="https://example.com/logo.png"
        />
        <p className="text-xs text-gray-500 mt-1">
          Enter the URL of your company logo
        </p>
      </div>

      {/* Data Binding */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Data Binding</label>
        <DataBindingInput
          value={binding}
          onChange={(value) => setProp((props: any) => (props.binding = value))}
          placeholder="{{company.logo}}"
          expectedType="string"
          hint="Bind to data source for dynamic logos"
        />
      </div>

      {/* Fallback Text */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Fallback Text</label>
        <Input
          type="text"
          value={fallbackText}
          onChange={(e) => setProp((props: any) => (props.fallbackText = e.target.value))}
          placeholder="Company Name"
        />
        <p className="text-xs text-gray-500 mt-1">
          Shown when no image is available
        </p>
      </div>

      {/* Alt Text */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Alt Text</label>
        <Input
          type="text"
          value={alt}
          onChange={(e) => setProp((props: any) => (props.alt = e.target.value))}
          placeholder="Company Logo"
        />
      </div>

      {/* Max Height */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Max Height (px)</label>
        <Input
          type="number"
          value={maxHeight}
          onChange={(e) => setProp((props: any) => (props.maxHeight = parseInt(e.target.value) || 80))}
          min={20}
          max={200}
        />
      </div>

      {/* Alignment */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Alignment</label>
        <div className="flex gap-2">
          {['left', 'center', 'right'].map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setProp((props: any) => (props.align = a))}
              className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                align === a
                  ? 'bg-[rgba(0,255,200,0.2)] text-[#00ffc8] border-[#00ffc8]'
                  : 'bg-[#050810] text-gray-400 border-[rgba(0,255,200,0.2)] hover:border-[rgba(0,255,200,0.4)]'
              }`}
            >
              {a.charAt(0).toUpperCase() + a.slice(1)}
            </button>
          ))}
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
