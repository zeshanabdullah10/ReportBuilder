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
              'w-full h-8 rounded-lg border border-[rgba(0,255,200,0.2)] bg-[#050810]',
              'flex items-center gap-2 px-2',
              'focus:outline-none focus:ring-2 focus:ring-[#00ffc8] focus:border-[#00ffc8]',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'transition-all duration-200'
            )}
          >
            {/* Color preview with checkered background for transparency */}
            <div
              className="w-5 h-5 rounded border border-[rgba(255,255,255,0.1)] flex-shrink-0"
              style={{
                background: `
                  linear-gradient(45deg, #333 25%, transparent 25%),
                  linear-gradient(-45deg, #333 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, #333 75%),
                  linear-gradient(-45deg, transparent 75%, #333 75%)
                `,
                backgroundSize: '6px 6px',
                backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
              }}
            >
              <div
                className="w-full h-full rounded"
                style={{ backgroundColor: displayColor }}
              />
            </div>
            <span className="text-xs text-white font-mono flex-1 text-left truncate">
              {internalColor.a === 0 ? 'Transparent' : displayHex}
            </span>
            {internalColor.a < 1 && internalColor.a > 0 && (
              <span className="text-xs text-gray-500 flex-shrink-0">
                {Math.round(internalColor.a * 100)}%
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-52 p-2 bg-[#0a0f14] border border-[rgba(0,255,200,0.2)] rounded-lg shadow-xl z-50"
          align="start"
          side="bottom"
          sideOffset={4}
          collisionPadding={16}
          avoidCollisions={true}
        >
          <div className="space-y-2">
            {/* Color picker - compact */}
            <div className="color-picker-compact">
              <RgbaColorPicker
                color={internalColor}
                onChange={(color) => handleColorChange(color)}
              />
            </div>

            {/* Alpha slider - compact */}
            {showAlpha && (
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={internalColor.a}
                  onChange={(e) => handleAlphaChange(parseFloat(e.target.value))}
                  className="alpha-slider flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                />
                <span className="text-xs text-gray-400 w-7 text-right">
                  {Math.round(internalColor.a * 100)}%
                </span>
              </div>
            )}

            {/* Hex input - compact */}
            <div className="flex gap-1.5">
              <input
                type="text"
                value={displayHex}
                onChange={(e) => handleHexChange(e.target.value)}
                placeholder="#000000"
                className="flex-1 h-7 px-2 bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#00ffc8]"
              />
              {showAlpha && (
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={Math.round(internalColor.a * 100)}
                  onChange={(e) => handleAlphaChange(parseInt(e.target.value) / 100)}
                  className="w-12 h-7 px-1 bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded text-white text-xs text-center focus:outline-none focus:ring-1 focus:ring-[#00ffc8]"
                  title="Opacity %"
                />
              )}
            </div>

            {/* Preset colors - compact */}
            {showPresets && (
              <div className="grid grid-cols-5 gap-1">
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
                      backgroundSize: preset.color === 'rgba(0, 0, 0, 0)' ? '4px 4px' : undefined,
                      backgroundPosition: preset.color === 'rgba(0, 0, 0, 0)' ? '0 0, 0 2px, 2px -2px, -2px 0px' : undefined,
                    }}
                  />
                ))}
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
