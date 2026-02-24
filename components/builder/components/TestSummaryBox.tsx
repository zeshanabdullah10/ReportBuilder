'use client'

import { useNode } from '@craftjs/core'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { hasBindings, resolveBindingOrValue } from '@/lib/utils/binding'
import { ResizableBox } from '../layout/ResizableBox'

interface TestSummaryBoxProps {
  // Data bindings
  totalTestsBinding?: string
  passedBinding?: string
  failedBinding?: string
  skippedBinding?: string
  overallStatusBinding?: string
  
  // Static values (fallback)
  totalTests?: number
  passed?: number
  failed?: number
  skipped?: number
  overallStatus?: 'PASS' | 'FAIL' | 'INCOMPLETE'
  
  // Display options
  showSkipped?: boolean
  showPercentage?: boolean
  layout?: 'horizontal' | 'vertical' | 'grid'
  
  // Styling
  passColor?: string
  failColor?: string
  skipColor?: string
  borderColor?: string
  backgroundColor?: string
  
  // Title
  title?: string
  showTitle?: boolean
  
  // Position
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
  visible?: boolean
}

export const TestSummaryBox = ({
  totalTestsBinding = '',
  passedBinding = '',
  failedBinding = '',
  skippedBinding = '',
  overallStatusBinding = '',
  totalTests = 100,
  passed = 95,
  failed = 5,
  skipped = 0,
  overallStatus = 'PASS',
  showSkipped = true,
  showPercentage = true,
  layout = 'horizontal',
  passColor = '#22c55e',
  failColor = '#ef4444',
  skipColor = '#f59e0b',
  borderColor = '#00ffc8',
  backgroundColor = '#0a0f14',
  title = 'Test Summary',
  showTitle = true,
  x = 0,
  y = 0,
  width = 400,
  height = 120,
  zIndex = 1,
  visible = true,
}: TestSummaryBoxProps) => {
  const {
    id,
    connectors: { connect },
    selected,
    actions: { setProp },
  } = useNode((node) => ({
    id: node.id,
    selected: node.events.selected,
  }))

  const { sampleData } = useBuilderStore()

  // Resolve bindings or use static values
  const resolveNumber = (binding: string, fallback: number): number => {
    if (!binding || !hasBindings(binding) || !sampleData) return fallback
    const resolved = resolveBindingOrValue(binding, sampleData as Record<string, unknown>)
    return typeof resolved === 'number' ? resolved : fallback
  }

  const resolveStatus = (binding: string, fallback: string): string => {
    if (!binding || !hasBindings(binding) || !sampleData) return fallback
    const resolved = resolveBindingOrValue(binding, sampleData as Record<string, unknown>)
    return typeof resolved === 'string' ? resolved : fallback
  }

  const total = resolveNumber(totalTestsBinding, totalTests)
  const passedCount = resolveNumber(passedBinding, passed)
  const failedCount = resolveNumber(failedBinding, failed)
  const skippedCount = resolveNumber(skippedBinding, skipped)
  const status = resolveStatus(overallStatusBinding, overallStatus)

  const passedPercent = total > 0 ? ((passedCount / total) * 100).toFixed(1) : '0'
  const failedPercent = total > 0 ? ((failedCount / total) * 100).toFixed(1) : '0'
  const skippedPercent = total > 0 ? ((skippedCount / total) * 100).toFixed(1) : '0'

  if (!visible) return null

  const handlePositionChange = (newPos: { x?: number; y?: number; width?: number; height?: number }) => {
    setProp((props: TestSummaryBoxProps) => {
      if (newPos.x !== undefined) props.x = newPos.x
      if (newPos.y !== undefined) props.y = newPos.y
      if (newPos.width !== undefined) props.width = newPos.width
      if (newPos.height !== undefined) props.height = newPos.height
    })
  }

  const isPass = status === 'PASS'

  return (
    <ResizableBox
      x={x}
      y={y}
      width={width}
      height={height}
      minWidth={250}
      minHeight={80}
      selected={selected}
      nodeId={id}
      onPositionChange={handlePositionChange}
      connectRef={(ref) => { if (ref) connect(ref) }}
      zIndex={zIndex}
    >
      <div
        className="w-full h-full flex flex-col"
        style={{
          backgroundColor,
          border: `2px solid ${borderColor}`,
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        {showTitle && (
          <div
            className="flex items-center justify-between px-4 py-2"
            style={{
              backgroundColor: isPass ? `${passColor}20` : `${failColor}20`,
              borderBottom: `1px solid ${borderColor}`,
            }}
          >
            <span className="font-semibold text-white text-sm">{title}</span>
            <span
              className="font-bold text-sm px-2 py-0.5 rounded"
              style={{
                backgroundColor: isPass ? passColor : failColor,
                color: 'white',
              }}
            >
              {isPass ? '✓ PASS' : '✗ FAIL'}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-3">
          {layout === 'horizontal' && (
            <div className="flex items-center justify-around w-full gap-4">
              {/* Total */}
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{total}</div>
                <div className="text-xs text-gray-400">Total</div>
              </div>
              
              {/* Passed */}
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: passColor }}>{passedCount}</div>
                <div className="text-xs text-gray-400">
                  Passed{showPercentage && ` (${passedPercent}%)`}
                </div>
              </div>
              
              {/* Failed */}
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: failColor }}>{failedCount}</div>
                <div className="text-xs text-gray-400">
                  Failed{showPercentage && ` (${failedPercent}%)`}
                </div>
              </div>
              
              {/* Skipped */}
              {showSkipped && (
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: skipColor }}>{skippedCount}</div>
                  <div className="text-xs text-gray-400">
                    Skipped{showPercentage && ` (${skippedPercent}%)`}
                  </div>
                </div>
              )}
            </div>
          )}

          {layout === 'grid' && (
            <div className="grid grid-cols-3 gap-2 w-full">
              <div
                className="text-center p-2 rounded"
                style={{ backgroundColor: `${passColor}20` }}
              >
                <div className="text-xl font-bold" style={{ color: passColor }}>{passedCount}</div>
                <div className="text-xs text-gray-400">PASSED</div>
                {showPercentage && (
                  <div className="text-xs" style={{ color: passColor }}>{passedPercent}%</div>
                )}
              </div>
              <div
                className="text-center p-2 rounded"
                style={{ backgroundColor: `${failColor}20` }}
              >
                <div className="text-xl font-bold" style={{ color: failColor }}>{failedCount}</div>
                <div className="text-xs text-gray-400">FAILED</div>
                {showPercentage && (
                  <div className="text-xs" style={{ color: failColor }}>{failedPercent}%</div>
                )}
              </div>
              <div
                className="text-center p-2 rounded"
                style={{ backgroundColor: `${skipColor}20` }}
              >
                <div className="text-xl font-bold" style={{ color: skipColor }}>{total}</div>
                <div className="text-xs text-gray-400">TOTAL</div>
              </div>
            </div>
          )}

          {layout === 'vertical' && (
            <div className="flex flex-col gap-2 w-full">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Passed:</span>
                <span className="font-bold" style={{ color: passColor }}>
                  {passedCount}{showPercentage && ` (${passedPercent}%)`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Failed:</span>
                <span className="font-bold" style={{ color: failColor }}>
                  {failedCount}{showPercentage && ` (${failedPercent}%)`}
                </span>
              </div>
              {showSkipped && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Skipped:</span>
                  <span className="font-bold" style={{ color: skipColor }}>
                    {skippedCount}{showPercentage && ` (${skippedPercent}%)`}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center border-t border-gray-600 pt-1 mt-1">
                <span className="text-sm text-gray-400">Total:</span>
                <span className="font-bold text-white">{total}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </ResizableBox>
  )
}

import { TestSummaryBoxSettings } from '../settings/TestSummaryBoxSettings'

TestSummaryBox.craft = {
  displayName: 'Test Summary',
  props: {
    totalTestsBinding: '',
    passedBinding: '',
    failedBinding: '',
    skippedBinding: '',
    overallStatusBinding: '',
    totalTests: 100,
    passed: 95,
    failed: 5,
    skipped: 0,
    overallStatus: 'PASS',
    showSkipped: true,
    showPercentage: true,
    layout: 'horizontal',
    passColor: '#22c55e',
    failColor: '#ef4444',
    skipColor: '#f59e0b',
    borderColor: '#00ffc8',
    backgroundColor: '#0a0f14',
    title: 'Test Summary',
    showTitle: true,
    x: 0,
    y: 0,
    width: 400,
    height: 120,
    zIndex: 1,
    visible: true,
  },
  related: {
    settings: TestSummaryBoxSettings,
  },
  rules: {
    canDrag: () => true,
  },
}
