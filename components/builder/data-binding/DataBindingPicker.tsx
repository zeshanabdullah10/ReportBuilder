'use client'

import { useState } from 'react'
import { Database, X, Check, AlertTriangle } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { DataType, formatAsBinding, extractRawPath, validateBindingPath } from '@/lib/utils/data-paths'
import { DataTree } from './DataTree'

interface DataBindingPickerProps {
  value: string
  onChange: (value: string) => void
  expectedType?: DataType
  placeholder?: string
  className?: string
}

export function DataBindingPicker({
  value,
  onChange,
  expectedType,
  placeholder = 'Select data binding...',
  className,
}: DataBindingPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { sampleData, availableDataPaths } = useBuilderStore()

  // Extract current path for selection highlight
  const currentPath = value ? extractRawPath(value) : ''

  // Validate current binding
  const validation = value ? validateBindingPath(value, sampleData) : null

  const handleSelect = (path: string) => {
    const binding = formatAsBinding(path)
    onChange(binding)
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }

  const hasNoData = !sampleData || !availableDataPaths

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-left text-sm',
            'border border-[rgba(0,255,200,0.2)] bg-[#050810]',
            'hover:border-[rgba(0,255,200,0.4)] transition-colors',
            'focus:outline-none focus:border-[rgba(0,255,200,0.5)]',
            className
          )}
        >
          <Database
            className={cn(
              'w-4 h-4 flex-shrink-0',
              hasNoData ? 'text-gray-600' : 'text-[#00ffc8]'
            )}
          />

          {value ? (
            <span className="flex-1 truncate font-mono text-xs text-white">
              {value}
            </span>
          ) : (
            <span className="flex-1 text-gray-500 text-xs">{placeholder}</span>
          )}

          {/* Validation indicator */}
          {value && validation && (
            <span className="flex-shrink-0">
              {validation.valid ? (
                <Check className="w-3.5 h-3.5 text-[#39ff14]" />
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
            >
              <X className="w-3 h-3 text-gray-500 hover:text-white" />
            </button>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 p-0"
        align="start"
        sideOffset={4}
      >
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-white">Data Binding</h4>
            {expectedType && (
              <span className="text-[10px] text-gray-500">
                Expected: {expectedType}
              </span>
            )}
          </div>

          {hasNoData ? (
            <div className="py-6 text-center">
              <Database className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <p className="text-sm text-gray-400">No sample data loaded</p>
              <p className="text-xs text-gray-600 mt-1">
                Load sample data to browse available bindings
              </p>
            </div>
          ) : (
            <DataTree
              data={availableDataPaths}
              onSelect={handleSelect}
              selectedPath={currentPath}
              showValues={true}
              filterType={expectedType}
              maxHeight="250px"
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
