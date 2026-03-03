'use client'

import * as React from 'react'
import { ChromePicker, ColorResult } from 'react-color'
import { cn } from '@/lib/utils'

export interface ColorPickerProps {
  value?: string
  onChange: (color: string) => void
  label?: string
  showPresets?: boolean
  showAlpha?: boolean
  className?: string
  disabled?: boolean
}

/**
 * Simple color picker using react-color's ChromePicker
 * Uses a fixed cover to close the picker when clicking outside
 */
export function ColorPicker({
  value,
  onChange,
  label,
  showPresets = true,
  showAlpha = true,
  className,
  disabled = false,
}: ColorPickerProps) {
  const [displayColorPicker, setDisplayColorPicker] = React.useState(false)
  const [color, setColor] = React.useState(value || '#000000')
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Sync from external value
  React.useEffect(() => {
    if (value) {
      setColor(value)
    }
  }, [value])

  const handleClick = () => {
    if (!disabled) {
      setDisplayColorPicker(!displayColorPicker)
    }
  }

  const handleClose = () => {
    setDisplayColorPicker(false)
    // Commit the color when closing
    onChange(color)
  }

  const handleChange = (colorResult: ColorResult) => {
    const newColor = colorResult.rgb.a === 1 
      ? colorResult.hex 
      : `rgba(${colorResult.rgb.r}, ${colorResult.rgb.g}, ${colorResult.rgb.b}, ${colorResult.rgb.a})`
    setColor(newColor)
    // Also call onChange immediately for live preview
    onChange(newColor)
  }

  // Determine if color is transparent or has alpha
  const isTransparent = color === 'rgba(0, 0, 0, 0)' || color === 'transparent'
  const displayHex = isTransparent ? 'Transparent' : (color.startsWith('rgba') ? color : color.toUpperCase())

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      {label && (
        <label className="block text-sm text-gray-400 mb-1">{label}</label>
      )}
      
      {/* Trigger button */}
      <button
        type="button"
        onClick={handleClick}
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
            style={{ backgroundColor: color }}
          />
        </div>
        <span className="text-xs text-white font-mono flex-1 text-left truncate">
          {displayHex}
        </span>
        {/* Dropdown arrow */}
        <svg 
          className={cn('w-3 h-3 text-gray-400 transition-transform', displayColorPicker && 'rotate-180')} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Color picker popover */}
      {displayColorPicker && (
        <>
          {/* Cover to close the picker when clicking outside */}
          <div 
            style={{
              position: 'fixed',
              top: '0px',
              right: '0px',
              bottom: '0px',
              left: '0px',
              zIndex: 999,
            }}
            onClick={handleClose}
          />
          {/* Picker container */}
          <div 
            style={{
              position: 'absolute',
              zIndex: 1000,
              right: 0,
              marginTop: '4px',
            }}
          >
            <ChromePicker
              color={color}
              onChange={handleChange}
              disableAlpha={!showAlpha}
            />
          </div>
        </>
      )}
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
  const [color, setColor] = React.useState(value || '#000000')

  React.useEffect(() => {
    if (value) {
      setColor(value)
    }
  }, [value])

  const handleChange = (colorResult: ColorResult) => {
    const newColor = colorResult.rgb.a === 1 
      ? colorResult.hex 
      : `rgba(${colorResult.rgb.r}, ${colorResult.rgb.g}, ${colorResult.rgb.b}, ${colorResult.rgb.a})`
    setColor(newColor)
    onChange(newColor)
  }

  return (
    <div className={cn('color-picker-inline', className)}>
      <ChromePicker
        color={color}
        onChange={handleChange}
        disableAlpha={!showAlpha}
      />
    </div>
  )
}

export default ColorPicker
