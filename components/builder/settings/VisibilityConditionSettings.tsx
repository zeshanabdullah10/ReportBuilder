'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, AlertCircle, HelpCircle } from 'lucide-react'
import { validateCondition, CONDITION_EXAMPLES } from '@/lib/utils/condition'

interface VisibilityConditionSettingsProps {
  value: string | undefined
  onChange: (value: string) => void
}

export function VisibilityConditionSettings({
  value = '',
  onChange,
}: VisibilityConditionSettingsProps) {
  const [localValue, setLocalValue] = useState(value)
  const [showExamples, setShowExamples] = useState(false)
  const [validation, setValidation] = useState<{ valid: boolean; error?: string }>({ valid: true })

  // Sync local value with prop
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Validate on change
  const handleChange = (newValue: string) => {
    setLocalValue(newValue)
    const result = validateCondition(newValue)
    setValidation(result)
    
    if (result.valid) {
      onChange(newValue)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
          <Eye className="w-4 h-4 text-gray-400" />
          Visibility Condition
        </label>
        <button
          type="button"
          onClick={() => setShowExamples(!showExamples)}
          className="text-xs text-gray-500 hover:text-[#00ffc8] flex items-center gap-1"
        >
          <HelpCircle className="w-3 h-3" />
          Examples
        </button>
      </div>

      <div className="relative">
        <input
          type="text"
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="e.g., data.status === 'PASS'"
          className={`w-full px-3 py-2 bg-[#050810] border rounded-lg text-white placeholder-gray-500 text-sm font-mono focus:outline-none focus:ring-1 ${
            validation.valid
              ? 'border-[rgba(0,255,200,0.2)] focus:border-[#00ffc8] focus:ring-[#00ffc8]'
              : 'border-red-500/50 focus:border-red-500 focus:ring-red-500'
          }`}
        />
        {!validation.valid && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
        )}
      </div>

      {!validation.valid && validation.error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {validation.error}
        </p>
      )}

      {localValue && validation.valid && (
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <EyeOff className="w-3 h-3" />
          Component will only show when condition is true
        </p>
      )}

      {showExamples && (
        <div className="mt-2 p-3 rounded-lg bg-[#050810] border border-[rgba(0,255,200,0.1)]">
          <p className="text-xs text-gray-400 mb-2">Click an example to use it:</p>
          <div className="space-y-1">
            {CONDITION_EXAMPLES.map((example, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleChange(example.condition)}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-white/5 transition-colors"
              >
                <span className="text-xs text-gray-300 block">{example.label}</span>
                <code className="text-xs text-[#00ffc8] font-mono">{example.condition}</code>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
