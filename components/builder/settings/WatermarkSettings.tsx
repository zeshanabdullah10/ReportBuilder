'use client'

import { useNode } from '@craftjs/core'
import { PositionSettings } from './PositionSettings'

export const WatermarkSettings = () => {
  const {
    actions: { setProp },
    text,
    binding,
    opacity,
    rotation,
    fontSize,
    fontFamily,
    color,
    repeat,
    spacingX,
    spacingY,
    visible,
  } = useNode((node) => ({
    text: node.data.props.text,
    binding: node.data.props.binding,
    opacity: node.data.props.opacity,
    rotation: node.data.props.rotation,
    fontSize: node.data.props.fontSize,
    fontFamily: node.data.props.fontFamily,
    color: node.data.props.color,
    repeat: node.data.props.repeat,
    spacingX: node.data.props.spacingX,
    spacingY: node.data.props.spacingY,
    visible: node.data.props.visible,
  }))

  return (
    <div className="space-y-4">
      {/* Text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Watermark Text
        </label>
        <input
          type="text"
          value={text}
          onChange={(e) => setProp((props: any) => (props.text = e.target.value))}
          placeholder="CONFIDENTIAL"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
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
          placeholder="{{report.status}}"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          Bind to data for dynamic watermarks
        </p>
      </div>

      {/* Opacity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Opacity: {Math.round(opacity * 100)}%
        </label>
        <input
          type="range"
          value={opacity}
          onChange={(e) => setProp((props: any) => (props.opacity = parseFloat(e.target.value)))}
          min={0.05}
          max={0.5}
          step={0.05}
          className="w-full"
        />
      </div>

      {/* Rotation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Rotation: {rotation}°
        </label>
        <input
          type="range"
          value={rotation}
          onChange={(e) => setProp((props: any) => (props.rotation = parseInt(e.target.value)))}
          min={-90}
          max={90}
          step={5}
          className="w-full"
        />
      </div>

      {/* Font Size */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Font Size (px)
        </label>
        <input
          type="number"
          value={fontSize}
          onChange={(e) => setProp((props: any) => (props.fontSize = parseInt(e.target.value) || 48))}
          min={12}
          max={120}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
      </div>

      {/* Color */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Color
        </label>
        <div className="flex gap-2">
          <input
            type="color"
            value={color}
            onChange={(e) => setProp((props: any) => (props.color = e.target.value))}
            className="w-12 h-10 rounded border border-gray-300"
          />
          <input
            type="text"
            value={color}
            onChange={(e) => setProp((props: any) => (props.color = e.target.value))}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>

      {/* Repeat */}
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={repeat}
            onChange={(e) => setProp((props: any) => (props.repeat = e.target.checked))}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">Repeat Pattern</span>
        </label>
      </div>

      {/* Spacing (only when repeat is enabled) */}
      {repeat && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Spacing X (px)
            </label>
            <input
              type="number"
              value={spacingX}
              onChange={(e) => setProp((props: any) => (props.spacingX = parseInt(e.target.value) || 200))}
              min={50}
              max={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Spacing Y (px)
            </label>
            <input
              type="number"
              value={spacingY}
              onChange={(e) => setProp((props: any) => (props.spacingY = parseInt(e.target.value) || 150))}
              min={50}
              max={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
      )}

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
