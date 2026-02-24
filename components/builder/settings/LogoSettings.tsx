'use client'

import { useNode } from '@craftjs/core'
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
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Logo Image URL
        </label>
        <input
          type="text"
          value={src}
          onChange={(e) => setProp((props: any) => (props.src = e.target.value))}
          placeholder="https://example.com/logo.png"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          Enter the URL of your company logo
        </p>
      </div>

      {/* Data Binding */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Data Binding
        </label>
        <input
          type="text"
          value={binding}
          onChange={(e) => setProp((props: any) => (props.binding = e.target.value))}
          placeholder="{{company.logo}}"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          Bind to data source for dynamic logos
        </p>
      </div>

      {/* Fallback Text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fallback Text
        </label>
        <input
          type="text"
          value={fallbackText}
          onChange={(e) => setProp((props: any) => (props.fallbackText = e.target.value))}
          placeholder="Company Name"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          Shown when no image is available
        </p>
      </div>

      {/* Alt Text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Alt Text
        </label>
        <input
          type="text"
          value={alt}
          onChange={(e) => setProp((props: any) => (props.alt = e.target.value))}
          placeholder="Company Logo"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
      </div>

      {/* Max Height */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Max Height (px)
        </label>
        <input
          type="number"
          value={maxHeight}
          onChange={(e) => setProp((props: any) => (props.maxHeight = parseInt(e.target.value) || 80))}
          min={20}
          max={200}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
      </div>

      {/* Alignment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Alignment
        </label>
        <div className="flex gap-2">
          {['left', 'center', 'right'].map((a) => (
            <button
              key={a}
              onClick={() => setProp((props: any) => (props.align = a))}
              className={`flex-1 px-3 py-2 text-sm rounded-md border ${
                align === a
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {a.charAt(0).toUpperCase() + a.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Visibility */}
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={visible}
            onChange={(e) => setProp((props: any) => (props.visible = e.target.checked))}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">Visible</span>
        </label>
      </div>

      {/* Position Settings */}
      <PositionSettings />
    </div>
  )
}
