'use client'

import { useNode } from '@craftjs/core'
import { Input } from '@/components/ui/input'
import { ColorPicker } from '@/components/ui/color-picker'
import { PositionSettings } from './PositionSettings'

export const WatermarkSettings = () => {
  const {
    actions: { setProp },
    text,
    binding,
    opacity,
    rotation,
    fontSize,
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
        <label className="block text-sm text-gray-400 mb-1">Watermark Text</label>
        <Input
          type="text"
          value={text}
          onChange={(e) => setProp((props: any) => (props.text = e.target.value))}
          placeholder="CONFIDENTIAL"
        />
      </div>

      {/* Data Binding */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Data Binding</label>
        <Input
          type="text"
          value={binding}
          onChange={(e) => setProp((props: any) => (props.binding = e.target.value))}
          placeholder="{{report.status}}"
        />
        <p className="text-xs text-gray-500 mt-1">
          Bind to data for dynamic watermarks
        </p>
      </div>

      {/* Opacity */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Opacity: {Math.round(opacity * 100)}%</label>
        <input
          type="range"
          value={opacity}
          onChange={(e) => setProp((props: any) => (props.opacity = parseFloat(e.target.value)))}
          min={0.05}
          max={0.5}
          step={0.05}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[#050810] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00ffc8] [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>

      {/* Rotation */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Rotation: {rotation}°</label>
        <input
          type="range"
          value={rotation}
          onChange={(e) => setProp((props: any) => (props.rotation = parseInt(e.target.value)))}
          min={-90}
          max={90}
          step={5}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[#050810] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00ffc8] [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>

      {/* Font Size */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Font Size (px)</label>
        <Input
          type="number"
          value={fontSize}
          onChange={(e) => setProp((props: any) => (props.fontSize = parseInt(e.target.value) || 48))}
          min={12}
          max={120}
        />
      </div>

      {/* Color */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Color</label>
        <ColorPicker
          value={color}
          onChange={(value) => setProp((props: any) => (props.color = value))}
        />
      </div>

      {/* Repeat */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={repeat}
          onChange={(e) => setProp((props: any) => (props.repeat = e.target.checked))}
          className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#050810] text-[#00ffc8] focus:ring-[#00ffc8]"
        />
        <span className="text-sm text-gray-400">Repeat Pattern</span>
      </label>

      {/* Spacing (only when repeat is enabled) */}
      {repeat && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Spacing X (px)</label>
            <Input
              type="number"
              value={spacingX}
              onChange={(e) => setProp((props: any) => (props.spacingX = parseInt(e.target.value) || 200))}
              min={50}
              max={500}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Spacing Y (px)</label>
            <Input
              type="number"
              value={spacingY}
              onChange={(e) => setProp((props: any) => (props.spacingY = parseInt(e.target.value) || 150))}
              min={50}
              max={500}
            />
          </div>
        </div>
      )}

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
