'use client'

import { useNode } from '@craftjs/core'
import { IndicatorSettings } from '../settings/IndicatorSettings'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { hasBindings, resolveBindingOrValue } from '@/lib/utils/binding'
import { evaluateCondition } from '@/lib/utils/condition'
import { ResizableBox } from '../layout/ResizableBox'
import { CheckCircle, XCircle, AlertCircle, MinusCircle } from 'lucide-react'

export type IndicatorStatus = 'pass' | 'fail' | 'warning' | 'neutral'

export interface IndicatorProps {
  status?: IndicatorStatus
  label?: string
  passLabel?: string
  failLabel?: string
  warningLabel?: string
  binding?: string
  visibilityCondition?: string
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
  visible?: boolean
}

const statusConfig = {
  pass: {
    bgColor: 'bg-[rgba(57,255,20,0.15)]',
    borderColor: 'border-[#39ff14]',
    textColor: 'text-[#39ff14]',
    icon: CheckCircle,
    defaultLabel: 'PASS',
  },
  fail: {
    bgColor: 'bg-[rgba(255,107,107,0.15)]',
    borderColor: 'border-[#ff6b6b]',
    textColor: 'text-[#ff6b6b]',
    icon: XCircle,
    defaultLabel: 'FAIL',
  },
  warning: {
    bgColor: 'bg-[rgba(255,176,0,0.15)]',
    borderColor: 'border-[#ffb000]',
    textColor: 'text-[#ffb000]',
    icon: AlertCircle,
    defaultLabel: 'WARNING',
  },
  neutral: {
    bgColor: 'bg-[rgba(156,163,175,0.15)]',
    borderColor: 'border-[#9ca3af]',
    textColor: 'text-[#9ca3af]',
    icon: MinusCircle,
    defaultLabel: 'N/A',
  },
}

/**
 * Converts a resolved binding value to an IndicatorStatus
 */
function valueToStatus(value: unknown): IndicatorStatus {
  if (typeof value === 'boolean') {
    return value ? 'pass' : 'fail'
  }
  if (typeof value === 'string') {
    const lower = value.toLowerCase()
    if (lower === 'pass' || lower === 'true' || lower === 'success' || lower === 'ok') {
      return 'pass'
    }
    if (lower === 'fail' || lower === 'false' || lower === 'error' || lower === 'failed') {
      return 'fail'
    }
    if (lower === 'warning' || lower === 'warn') {
      return 'warning'
    }
  }
  return 'neutral'
}

export const Indicator = ({
  status = 'neutral',
  label = '',
  passLabel = 'PASS',
  failLabel = 'FAIL',
  warningLabel = 'WARNING',
  binding = '',
  visibilityCondition,
  x = 0,
  y = 0,
  width = 120,
  height = 44,
  zIndex = 1,
  visible = true,
}: IndicatorProps) => {
  const {
    id,
    connectors: { connect },
    selected,
    hovered,
    actions: { setProp },
  } = useNode((node) => ({
    id: node.id,
    selected: node.events.selected,
    hovered: node.events.hovered,
  }))

  const { isPreviewMode, sampleData } = useBuilderStore()

  // Check visibility condition
  if (visible && visibilityCondition && isPreviewMode && sampleData) {
    if (!evaluateCondition(visibilityCondition, sampleData)) {
      return null
    }
  }

  if (!visible) return null

  // Resolve status based on preview mode and binding
  const getDisplayStatus = (): IndicatorStatus => {
    if (isPreviewMode && sampleData && binding && hasBindings(binding)) {
      const resolved = resolveBindingOrValue(binding, sampleData)
      return valueToStatus(resolved)
    }
    return status
  }

  const displayStatus = getDisplayStatus()
  const config = statusConfig[displayStatus]
  const Icon = config.icon

  // Determine display label based on status
  const getDisplayLabel = () => {
    if (label) return label
    switch (displayStatus) {
      case 'pass':
        return passLabel
      case 'fail':
        return failLabel
      case 'warning':
        return warningLabel
      default:
        return config.defaultLabel
    }
  }

  const handlePositionChange = (newPos: { x?: number; y?: number; width?: number; height?: number }) => {
    setProp((props: IndicatorProps) => {
      if (newPos.x !== undefined) props.x = newPos.x
      if (newPos.y !== undefined) props.y = newPos.y
      if (newPos.width !== undefined) props.width = newPos.width
      if (newPos.height !== undefined) props.height = newPos.height
    })
  }

  return (
    <ResizableBox
      x={x}
      y={y}
      width={width}
      height={height}
      minWidth={80}
      minHeight={36}
      selected={selected}
      nodeId={id}
      onPositionChange={handlePositionChange}
      connectRef={(ref) => { if (ref) connect(ref) }}
      zIndex={zIndex}
    >
      <div
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${config.bgColor} ${config.borderColor} transition-all`}
        style={{
          outline: selected ? '2px solid #00ffc8' : hovered ? '1px dashed rgba(0,255,200,0.5)' : 'none',
          outlineOffset: '4px',
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Icon className={`w-5 h-5 ${config.textColor}`} />
        <span className={`font-semibold text-sm ${config.textColor}`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          {getDisplayLabel()}
        </span>
      </div>
    </ResizableBox>
  )
}

Indicator.craft = {
  displayName: 'Indicator',
  props: {
    status: 'neutral' as IndicatorStatus,
    label: '',
    passLabel: 'PASS',
    failLabel: 'FAIL',
    warningLabel: 'WARNING',
    binding: '',
    visibilityCondition: '',
    x: 0,
    y: 0,
    width: 120,
    height: 44,
    zIndex: 1,
    visible: true,
  },
  related: {
    settings: IndicatorSettings,
  },
}
