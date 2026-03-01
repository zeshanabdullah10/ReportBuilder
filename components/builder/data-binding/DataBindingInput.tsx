'use client'

import { useState, useRef, useEffect } from 'react'
import { Database, Check, AlertTriangle, X, AlertCircle } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { DataType, formatAsBinding, extractRawPath, validateBindingPath } from '@/lib/utils/data-paths'
import { DataTree } from './DataTree'

interface DataBindingInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hint?: string
  expectedType?: DataType
  className?: string
  disabled?: boolean
}

export function DataBindingInput({
  value,
  onChange,
  placeholder = '{{data.fieldName}}',
  hint,
  expectedType,
  className,
  disabled = false,
}: DataBindingInputProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const { sampleData, availableDataPaths } = useBuilderStore()

  // Extract current path for selection highlight
  const currentPath = value ? extractRawPath(value) : ''

  // Validate current binding with type checking
  const validation = value ? validateBindingPath(value, sampleData, expectedType) : null

  // Determine validation state
  const isValid = validation?.valid && !validation?.typeMismatch
  const isTypeMismatch = validation?.typeMismatch
  const isMissing = validation && !validation.valid

  const handleSelectFromPicker = (path: string) => {
    const binding = formatAsBinding(path)
    onChange(binding)
    setIsPickerOpen(false)
    inputRef.current?.focus()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    inputRef.current?.focus()
  }

  const handleUseSuggestion = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (validation?.suggestion) {
      const binding = formatAsBinding(validation.suggestion)
      onChange(binding)
    }
  }

  const hasNoData = !sampleData || !availableDataPaths
  const showPickerButton = isFocused || isPickerOpen || !value

  return (
    <div className={cn('relative', className)}>
      <div className="relative flex items-center">
        {/* Main input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full bg-[#050810] border rounded-md px-2 py-1.5 pr-16',
            'text-white text-sm font-mono',
            'placeholder:text-gray-600 placeholder:font-sans',
            'focus:outline-none',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors',
            // Border color based on validation state
            isTypeMismatch
              ? 'border-[#ff8c00] focus:border-[#ff8c00]'
              : isMissing
                ? 'border-[#ffb000] focus:border-[#ffb000]'
                : 'border-[rgba(0,255,200,0.2)] focus:border-[rgba(0,255,200,0.5)]'
          )}
        />

        {/* Right-side controls */}
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {/* Validation indicator */}
          {value && validation && (
            <span
              className="flex-shrink-0"
              title={validation.error || (isTypeMismatch ? `Expected ${expectedType}, got ${validation.resolvedType}` : undefined)}
            >
              {isValid ? (
                <Check className="w-3.5 h-3.5 text-[#39ff14]" />
              ) : isTypeMismatch ? (
                <AlertCircle className="w-3.5 h-3.5 text-[#ff8c00]" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-[#ffb000]" />
              )}
            </span>
          )}

          {/* Clear button */}
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:bg-[rgba(255,255,255,0.1)] rounded"
              tabIndex={-1}
            >
              <X className="w-3 h-3 text-gray-500 hover:text-white" />
            </button>
          )}

          {/* Picker button */}
          <Popover open={isPickerOpen} onOpenChange={setIsPickerOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                disabled={disabled || hasNoData}
                className={cn(
                  'p-1 rounded transition-colors',
                  showPickerButton ? 'opacity-100' : 'opacity-0',
                  hasNoData
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-[#00ffc8] hover:bg-[rgba(0,255,200,0.1)]',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                title={hasNoData ? 'Load sample data first' : 'Browse data bindings'}
                tabIndex={-1}
              >
                <Database className="w-4 h-4" />
              </button>
            </PopoverTrigger>

            <PopoverContent
              className="w-80 p-0"
              align="start"
              side="bottom"
              sideOffset={4}
              collisionPadding={16}
              avoidCollisions={true}
            >
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-white">Select Data Binding</h4>
                  {expectedType && (
                    <span className="text-[10px] text-gray-500 uppercase">
                      Type: {expectedType}
                    </span>
                  )}
                </div>

                <DataTree
                  data={availableDataPaths}
                  onSelect={handleSelectFromPicker}
                  selectedPath={currentPath}
                  showValues={true}
                  filterType={expectedType}
                  maxHeight="250px"
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Hint text */}
      {hint && !validation?.error && (
        <p className="text-xs text-gray-500 mt-1">{hint}</p>
      )}

      {/* Type mismatch error with suggestion */}
      {value && isTypeMismatch && validation?.error && (
        <div className="mt-1">
          <p className="text-xs text-[#ff8c00] flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {validation.error}
          </p>
          {validation.suggestion && (
            <button
              type="button"
              onClick={handleUseSuggestion}
              className="text-xs text-[#00ffc8] hover:underline mt-0.5 ml-4"
            >
              Use {validation.suggestion} instead?
            </button>
          )}
        </div>
      )}

      {/* Missing path error */}
      {value && isMissing && validation?.error && (
        <p className="text-xs text-[#ffb000] mt-1 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          {validation.error}
        </p>
      )}
    </div>
  )
}
