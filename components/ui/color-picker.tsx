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
 * Color picker using react-color's ChromePicker
 * Styled with oscilloscope precision theme (dark mode)
 * Uses a fixed cover to close picker when clicking outside
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
  const [pickerPosition, setPickerPosition] = React.useState({ top: 0, right: 0 })
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  // Sync from external value
  React.useEffect(() => {
    if (value) {
      setColor(value)
    }
  }, [value])

  const handleClick = () => {
    if (!disabled) {
      setDisplayColorPicker(!displayColorPicker)
      // Calculate position when opening
      if (buttonRef.current && !displayColorPicker) {
        const rect = buttonRef.current.getBoundingClientRect()
        setPickerPosition({
          top: rect.bottom + window.scrollY + 8,
          right: window.innerWidth - rect.right
        })
      }
    }
  }

  const handleClose = () => {
    setDisplayColorPicker(false)
    // Commit color when closing
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
  const displayHex = isTransparent ? 'TRANSPARENT' : (color.startsWith('rgba') ? color : color.toUpperCase())


  return (
    <div className={cn('relative', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-400 mb-2 tracking-wide uppercase">
          {label}
        </label>
      )}

      {/* Trigger button with oscilloscope styling */}
      <button
        type="button"
        ref={buttonRef}
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          'w-full h-10 rounded-lg border border-[rgba(0,255,200,0.2)] bg-[#050810]',
          'flex items-center gap-3 px-3',
          'focus:outline-none focus:ring-2 focus:ring-[#00ffc8] focus:border-[#00ffc8] focus:shadow-[0_0_20px_rgba(0,255,200,0.3)]',
          'hover:border-[rgba(0,255,200,0.4)] hover:shadow-[0_0_15px_rgba(0,255,200,0.2)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-all duration-200 ease-out'
        )}
      >
        {/* Color preview with checkered background for transparency */}
        <div
          className="w-6 h-6 rounded border border-[rgba(255,255,255,0.1)] flex-shrink-0"
          style={{
            background: `
              linear-gradient(45deg, #1a1a2e 25%, transparent 25%),
              linear-gradient(-45deg, #1a1a2e 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #1a1a2e 75%),
              linear-gradient(-45deg, transparent 75%, #1a1a2e 75%)
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

        {/* Color value display */}
        <span className="text-xs text-[#00ffc8] font-mono flex-1 text-left truncate tracking-wider">
          {displayHex}
        </span>

        {/* Dropdown arrow */}
        <svg
          className={cn('w-4 h-4 text-gray-400 transition-transform duration-200', displayColorPicker && 'rotate-180 text-[#00ffc8]')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Color picker popover with high z-index and correct positioning */}
      {displayColorPicker && (
        <>
          {/* Cover to close picker when clicking outside */}
          <div
            style={{
              position: 'fixed',
              top: '0px',
              right: '0px',
              bottom: '0px',
              left: '0px',
              zIndex: 99999,
            }}
            onClick={handleClose}
          />
          {/* Picker container - positioned relative to button */}
          <div
            style={{
              position: 'fixed',
              zIndex: 100000,
              top: `${pickerPosition.top}px`,
              right: `${pickerPosition.right}px`,
            }}
            className="rounded-lg overflow-hidden border border-[rgba(0,255,200,0.3)] shadow-[0_10_40px_rgba(0,0,0,0.5)]"
          >
            <div className="p-2 bg-[#0a0f14]">
              <ChromePicker
                color={color}
                onChange={handleChange}
                disableAlpha={!showAlpha}
              />
            </div>
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
    <div className={cn('color-picker-inline bg-[#0a0f14] border border-[rgba(0,255,200,0.2)] rounded-lg p-2', className)}>
      <ChromePicker
        color={color}
        onChange={handleChange}
        disableAlpha={!showAlpha}
      />
    </div>
  )
}

export default ColorPicker
