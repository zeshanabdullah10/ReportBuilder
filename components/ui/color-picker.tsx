'use client'

import * as React from 'react'
import { HexColorPicker, RgbaColorPicker } from 'react-colorful'
import { cn } from '@/lib/utils'
import { parseColor, toRgba, toHex, type ParsedColor } from '@/lib/utils/color'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// Preset colors matching the oscilloscope theme
const PRESET_COLORS = [
  { color: 'rgba(0, 0, 0, 0)', label: 'Transparent' },
  { color: 'rgba(0, 0, 0, 1)', label: 'Black' },
  { color: 'rgba(255, 255, 255, 1)', label: 'White' },
  { color: 'rgba(0, 255, 200, 1)', label: 'Phosphor Cyan' },
  { color: 'rgba(57, 255, 20, 1)', label: 'Phosphor Green' },
  { color: 'rgba(255, 176, 0, 1)', label: 'Phosphor Amber' },
  { color: 'rgba(239, 68, 68, 1)', label: 'Red' },
  { color: 'rgba(59, 130, 246, 1)', label: 'Blue' },
  { color: 'rgba(168, 85, 247, 1)', label: 'Purple' },
  { color: 'rgba(236, 72, 153, 1)', label: 'Pink' },
]

export interface ColorPickerProps {
  value?: string
  onChange: (color: string) => void
  label?: string
  showPresets?: boolean
  showAlpha?: boolean
  className?: string
  disabled?: boolean
}

export function ColorPicker({
  value,
  onChange,
  label,
  showPresets = true,
  showAlpha = true,
  className,
  disabled = false,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [internalColor, setInternalColor] = React.useState<ParsedColor>(() => parseColor(value))

  // Update internal state when value prop changes
  React.useEffect(() => {
    setInternalColor(parseColor(value))
  }, [value])

  const handleColorChange = (color: ParsedColor) => {
    setInternalColor(color)
    onChange(toRgba(color))
  }

  const handleHexChange = (hex: string) => {
    const parsed = parseColor(hex)
    // Preserve alpha when changing hex
    parsed.a = internalColor.a
    handleColorChange(parsed)
  }

  const handleAlphaChange = (alpha: number) => {
    handleColorChange({ ...internalColor, a: alpha })
  }

  const handlePresetClick = (presetColor: string) => {
    const parsed = parseColor(presetColor)
    handleColorChange(parsed)
  }

  const displayColor = toRgba(internalColor)
  const displayHex = toHex(internalColor)

  return (
    <div className={cn('relative', className)}>
      {label && (
        <label className="block text-sm text-gray-400 mb-1">{label}</label>
      )}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild disabled={disabled}>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              'w-full h-10 rounded-lg border border-[rgba(0,255,200,0.2)] bg-[#050810]',
              'flex items-center gap-2 px-3',
              'focus:outline-none focus:ring-2 focus:ring-[#00ffc8] focus:border-[#00ffc8]',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'transition-all duration-200'
            )}
          >
            {/* Color preview with checkered background for transparency */}
            <div
              className="w-6 h-6 rounded border border-[rgba(255,255,255,0.1)]"
              style={{
                background: `
                  linear-gradient(45deg, #333 25%, transparent 25%),
                  linear-gradient(-45deg, #333 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, #333 75%),
                  linear-gradient(-45deg, transparent 75%, #333 75%)
                `,
                backgroundSize: '8px 8px',
                backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
              }}
            >
              <div
                className="w-full h-full rounded"
                style={{ backgroundColor: displayColor }}
              />
            </div>
            <span className="text-sm text-white font-mono flex-1 text-left">
              {internalColor.a === 0 ? 'Transparent' : displayHex}
            </span>
            {internalColor.a < 1 && internalColor.a > 0 && (
              <span className="text-xs text-gray-500">
                {Math.round(internalColor.a * 100)}%
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-64 p-3 bg-[#0a0f14] border border-[rgba(0,255,200,0.2)] rounded-lg shadow-xl z-50"
          align="start"
        >
          <div className="space-y-3">
            {/* Color picker */}
            <div className="color-picker-wrapper">
              <RgbaColorPicker
                color={internalColor}
                onChange={(color) => handleColorChange(color)}
              />
            </div>

            {/* Alpha slider */}
            {showAlpha && (
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Opacity</label>
                <div className="flex items-center gap-2">
                  <div
                    className="flex-1 h-2 rounded-full"
                    style={{
                      background: `
                        linear-gradient(45deg, #333 25%, transparent 25%),
                        linear-gradient(-45deg, #333 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #333 75%),
                        linear-gradient(-45deg, transparent 75%, #333 75%)
                      `,
                      backgroundSize: '8px 8px',
                      backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                    }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(to right, transparent, ${toHex(internalColor)})`,
                        width: '100%',
                      }}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={internalColor.a}
                    onChange={(e) => handleAlphaChange(parseFloat(e.target.value))}
                    className="alpha-slider w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, transparent, ${displayColor})`,
                    }}
                  />
                  <span className="text-xs text-gray-400 w-8 text-right">
                    {Math.round(internalColor.a * 100)}%
                  </span>
                </div>
              </div>
            )}

            {/* Hex input */}
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Hex Color</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={displayHex}
                  onChange={(e) => handleHexChange(e.target.value)}
                  placeholder="#000000"
                  className="flex-1 h-8 px-2 bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded text-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#00ffc8]"
                />
                {showAlpha && (
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={Math.round(internalColor.a * 100)}
                    onChange={(e) => handleAlphaChange(parseInt(e.target.value) / 100)}
                    className="w-16 h-8 px-2 bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded text-white text-sm text-center focus:outline-none focus:ring-1 focus:ring-[#00ffc8]"
                    title="Opacity %"
                  />
                )}
              </div>
            </div>

            {/* Preset colors */}
            {showPresets && (
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Presets</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {PRESET_COLORS.map((preset, index) => (
                    <button
                      key={index}
                      type="button"
                      title={preset.label}
                      onClick={() => handlePresetClick(preset.color)}
                      className={cn(
                        'w-full aspect-square rounded border transition-all',
                        'hover:scale-110 hover:border-[#00ffc8]',
                        preset.color === 'rgba(0, 0, 0, 0)'
                          ? 'border-[rgba(255,255,255,0.2)]'
                          : 'border-[rgba(255,255,255,0.1)]'
                      )}
                      style={{
                        background: preset.color === 'rgba(0, 0, 0, 0)'
                          ? `
                            linear-gradient(45deg, #333 25%, transparent 25%),
                            linear-gradient(-45deg, #333 25%, transparent 25%),
                            linear-gradient(45deg, transparent 75%, #333 75%),
                            linear-gradient(-45deg, transparent 75%, #333 75%)
                          `
                          : preset.color,
                        backgroundSize: preset.color === 'rgba(0, 0, 0, 0)' ? '6px 6px' : undefined,
                        backgroundPosition: preset.color === 'rgba(0, 0, 0, 0)' ? '0 0, 0 3px, 3px -3px, -3px 0px' : undefined,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

/**
 * Inline color picker without popover - useful for compact layouts
 */
export function ColorPickerInline({
  value,
  onChange,
  showAlpha = true,
  className,
}: Omit<ColorPickerProps, 'label' | 'showPresets'>) {
  const [internalColor, setInternalColor] = React.useState<ParsedColor>(() => parseColor(value))

  React.useEffect(() => {
    setInternalColor(parseColor(value))
  }, [value])

  const handleColorChange = (color: ParsedColor) => {
    setInternalColor(color)
    onChange(toRgba(color))
  }

  return (
    <div className={cn('color-picker-inline', className)}>
      <RgbaColorPicker
        color={internalColor}
        onChange={handleColorChange}
      />
    </div>
  )
}

export default ColorPicker
