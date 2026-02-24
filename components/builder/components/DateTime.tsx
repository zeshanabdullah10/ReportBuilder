'use client'

import { useNode } from '@craftjs/core'
import { DateTimeSettings } from '../settings/DateTimeSettings'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { hasBindings, resolveBindingOrValue } from '@/lib/utils/binding'
import { ResizableBox } from '../layout/ResizableBox'

interface DateTimeProps {
  format?: string
  fontSize?: number
  fontFamily?: string
  color?: string
  textAlign?: 'left' | 'center' | 'right'
  binding?: string
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
  visible?: boolean
}

const DEFAULT_FORMATS: Record<string, string> = {
  'date-short': 'MM/dd/yyyy',
  'date-long': 'MMMM dd, yyyy',
  'date-time': 'MM/dd/yyyy HH:mm',
  'time-only': 'HH:mm',
  'iso': 'yyyy-MM-dd',
  'custom': '',
}

export const DateTime = ({
  format = 'date-long',
  fontSize = 12,
  fontFamily = 'inherit',
  color = '#9ca3af',
  textAlign = 'center',
  binding = '',
  x = 0,
  y = 0,
  width = 150,
  height = 30,
  zIndex = 1,
  visible = true,
}: DateTimeProps) => {
  const {
    id,
    connectors: { connect },
    selected,
    actions: { setProp },
  } = useNode((node) => ({
    id: node.id,
    selected: node.events.selected,
  }))

  const { isPreviewMode, sampleData } = useBuilderStore()

  if (!visible) return null

  const handlePositionChange = (newPos: { x?: number; y?: number; width?: number; height?: number }) => {
    setProp((props: DateTimeProps) => {
      if (newPos.x !== undefined) props.x = newPos.x
      if (newPos.y !== undefined) props.y = newPos.y
      if (newPos.width !== undefined) props.width = newPos.width
      if (newPos.height !== undefined) props.height = newPos.height
    })
  }

  // Format the date
  const formatDateTime = (date: Date, formatStr: string): string => {
    const pad = (n: number) => n.toString().padStart(2, '0')

    const replacements: Record<string, string> = {
      'yyyy': date.getFullYear().toString(),
      'MM': pad(date.getMonth() + 1),
      'dd': pad(date.getDate()),
      'HH': pad(date.getHours()),
      'mm': pad(date.getMinutes()),
      'ss': pad(date.getSeconds()),
      'MMMM': date.toLocaleString('default', { month: 'long' }),
      'MMM': date.toLocaleString('default', { month: 'short' }),
      'dddd': date.toLocaleString('default', { weekday: 'long' }),
      'ddd': date.toLocaleString('default', { weekday: 'short' }),
    }

    let result = formatStr
    // Sort by length descending to replace longer patterns first
    const sortedKeys = Object.keys(replacements).sort((a, b) => b.length - a.length)
    for (const key of sortedKeys) {
      result = result.replace(new RegExp(key, 'g'), replacements[key])
    }
    return result
  }

  // Get the display text
  const getDisplayText = () => {
    // Check for binding
    if (isPreviewMode && sampleData && binding && hasBindings(binding)) {
      const resolved = resolveBindingOrValue(binding, sampleData)
      if (resolved) {
        const date = new Date(resolved as string)
        if (!isNaN(date.getTime())) {
          return formatDateTime(date, DEFAULT_FORMATS[format] || format)
        }
        return String(resolved)
      }
    }

    // Show current date/time as preview
    const now = new Date()
    const formatStr = DEFAULT_FORMATS[format] || format
    return formatDateTime(now, formatStr)
  }

  return (
    <ResizableBox
      x={x}
      y={y}
      width={width}
      height={height}
      minWidth={80}
      minHeight={20}
      selected={selected}
      nodeId={id}
      onPositionChange={handlePositionChange}
      connectRef={(ref) => { if (ref) connect(ref) }}
      zIndex={zIndex}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: textAlign,
          fontSize: `${fontSize}px`,
          fontFamily,
          color,
          outline: selected ? '2px solid #00ffc8' : '1px dashed transparent',
          outlineOffset: '2px',
          borderRadius: '4px',
          padding: '0 8px',
        }}
      >
        {getDisplayText()}
      </div>
    </ResizableBox>
  )
}

DateTime.craft = {
  displayName: 'Date/Time',
  props: {
    format: 'date-long',
    fontSize: 12,
    fontFamily: 'inherit',
    color: '#666666',
    textAlign: 'center',
    binding: '',
    x: 0,
    y: 0,
    width: 150,
    height: 30,
    zIndex: 1,
    visible: true,
  },
  related: {
    settings: DateTimeSettings,
  },
}
