'use client'

import { useMemo } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { extractRawPath, validateBindingPath } from '@/lib/utils/data-paths'
import { resolveBindingOrValue, hasBindings, extractArrayFields } from '@/lib/utils/binding'

interface FieldMapperProps {
  /** The binding path to extract fields from */
  bindingPath: string
  /** Currently selected field */
  value: string
  /** Callback when field changes */
  onChange: (field: string) => void
  /** Label for the field selector */
  label: string
  /** Hint text to show below the selector */
  hint?: string
  /** Placeholder text when no fields available */
  placeholder?: string
  /** Class name for the container */
  className?: string
  /** Whether to show "Auto-detect" option */
  showAutoOption?: boolean
  /** Label for the auto-detect option */
  autoLabel?: string
}

export function FieldMapper({
  bindingPath,
  value,
  onChange,
  label,
  hint,
  placeholder = 'Select field...',
  className,
  showAutoOption = true,
  autoLabel = 'Auto-detect',
}: FieldMapperProps) {
  const { sampleData } = useBuilderStore()

  // Extract available fields from the bound data
  const availableFields = useMemo(() => {
    if (!bindingPath || !sampleData || !hasBindings(bindingPath)) {
      return []
    }

    const resolved = resolveBindingOrValue(bindingPath, sampleData)

    if (!Array.isArray(resolved) || resolved.length === 0) {
      return []
    }

    // Extract fields from array of objects
    return extractArrayFields(resolved)
  }, [bindingPath, sampleData])

  // Check if binding is valid
  const isBindingValid = useMemo(() => {
    if (!bindingPath) return false
    if (!hasBindings(bindingPath)) return false

    const validation = validateBindingPath(bindingPath, sampleData)
    return validation.valid && !validation.typeMismatch
  }, [bindingPath, sampleData])

  // Don't render if no binding or no fields
  if (!bindingPath || !hasBindings(bindingPath) || !isBindingValid) {
    return null
  }

  // Don't render if no fields available (array of primitives, not objects)
  if (availableFields.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-1', className)}>
      <label className="block text-sm text-gray-400">{label}</label>
      <div className="relative">
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'w-full bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-md px-2 py-1.5 pr-8',
            'text-white text-sm appearance-none cursor-pointer',
            'focus:outline-none focus:border-[rgba(0,255,200,0.5)]',
            !value && 'text-gray-500'
          )}
        >
          {showAutoOption && (
            <option value="">{autoLabel}</option>
          )}
          {availableFields.map((field) => (
            <option key={field} value={field}>
              {field}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
      </div>
      {hint && (
        <p className="text-xs text-gray-500">{hint}</p>
      )}
    </div>
  )
}

/**
 * Combined field mapper for label and value fields (common pattern for charts)
 */
interface LabelValueFieldMapperProps {
  bindingPath: string
  labelField: string
  valueField: string
  onLabelFieldChange: (field: string) => void
  onValueFieldChange: (field: string) => void
  className?: string
}

export function LabelValueFieldMapper({
  bindingPath,
  labelField,
  valueField,
  onLabelFieldChange,
  onValueFieldChange,
  className,
}: LabelValueFieldMapperProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">
        Field Mapping
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FieldMapper
          bindingPath={bindingPath}
          value={labelField}
          onChange={onLabelFieldChange}
          label="Label Field"
          hint="Field for X-axis labels"
          autoLabel="Auto (label/name)"
        />
        <FieldMapper
          bindingPath={bindingPath}
          value={valueField}
          onChange={onValueFieldChange}
          label="Value Field"
          hint="Field for data values"
          autoLabel="Auto (value/count)"
        />
      </div>
    </div>
  )
}
