'use client'

import { cn } from '@/lib/utils'
import { DataType } from '@/lib/utils/data-paths'

interface DataBindingBadgeProps {
  type: DataType
  className?: string
  compact?: boolean
}

const TYPE_CONFIG: Record<DataType, { color: string; bgColor: string; label: string }> = {
  string: {
    color: 'text-[#00ffc8]',
    bgColor: 'bg-[rgba(0,255,200,0.15)]',
    label: 'STR',
  },
  number: {
    color: 'text-[#39ff14]',
    bgColor: 'bg-[rgba(57,255,20,0.15)]',
    label: 'NUM',
  },
  boolean: {
    color: 'text-[#ffb000]',
    bgColor: 'bg-[rgba(255,176,0,0.15)]',
    label: 'BOOL',
  },
  array: {
    color: 'text-[#ff6b6b]',
    bgColor: 'bg-[rgba(255,107,107,0.15)]',
    label: 'ARR',
  },
  object: {
    color: 'text-[#9b59b6]',
    bgColor: 'bg-[rgba(155,89,182,0.15)]',
    label: 'OBJ',
  },
  null: {
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/15',
    label: 'NULL',
  },
  undefined: {
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/15',
    label: '???',
  },
}

export function DataBindingBadge({ type, className, compact = false }: DataBindingBadgeProps) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.undefined

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-mono font-medium rounded',
        compact ? 'text-[9px] px-1 py-0.5' : 'text-[10px] px-1.5 py-0.5',
        config.bgColor,
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  )
}
