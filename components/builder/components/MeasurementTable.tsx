'use client'

import { useNode } from '@craftjs/core'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { hasBindings, resolveBindingOrValue } from '@/lib/utils/binding'
import { ResizableBox } from '../layout/ResizableBox'

interface MeasurementColumn {
  key: string
  header: string
  type: 'text' | 'number' | 'unit' | 'tolerance' | 'status' | 'deviation'
  unit?: string
  width?: number
  format?: string
}

interface MeasurementTableProps {
  // Data binding
  dataBinding?: string
  
  // Column configuration
  columns?: MeasurementColumn[]
  
  // Display options
  showHeader?: boolean
  showRowNumbers?: boolean
  stripeRows?: boolean
  
  // Styling
  headerBackgroundColor?: string
  passColor?: string
  failColor?: string
  borderColor?: string
  fontSize?: number
  
  // Position
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
  visible?: boolean
}

// Sample data for preview
const sampleMeasurements = [
  { parameter: 'Voltage Output', nominal: 5.0, measured: 5.02, unit: 'V', min: 4.9, max: 5.1, status: 'PASS' },
  { parameter: 'Current Draw', nominal: 0.5, measured: 0.52, unit: 'A', min: 0.45, max: 0.55, status: 'PASS' },
  { parameter: 'Temperature', nominal: 25.0, measured: 26.5, unit: '°C', min: 23.0, max: 27.0, status: 'PASS' },
  { parameter: 'Frequency', nominal: 60.0, measured: 61.2, unit: 'Hz', min: 59.0, max: 61.0, status: 'FAIL' },
]

const defaultColumns: MeasurementColumn[] = [
  { key: 'parameter', header: 'Parameter', type: 'text', width: 150 },
  { key: 'nominal', header: 'Nominal', type: 'number', format: '0.00', width: 80 },
  { key: 'measured', header: 'Measured', type: 'number', format: '0.00', width: 80 },
  { key: 'unit', header: 'Unit', type: 'unit', width: 50 },
  { key: 'tolerance', header: 'Tolerance', type: 'tolerance', width: 100 },
  { key: 'status', header: 'Status', type: 'status', width: 60 },
]

export const MeasurementTable = ({
  dataBinding = '',
  columns = defaultColumns,
  showHeader = true,
  showRowNumbers = false,
  stripeRows = true,
  headerBackgroundColor = '#1a1a2e',
  passColor = '#22c55e',
  failColor = '#ef4444',
  borderColor = '#333',
  fontSize = 12,
  x = 0,
  y = 0,
  width = 500,
  height = 200,
  zIndex = 1,
  visible = true,
}: MeasurementTableProps) => {
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

  // Resolve data from binding or use sample
  const getTableData = (): Record<string, unknown>[] => {
    if (!dataBinding || !hasBindings(dataBinding) || !sampleData) {
      return sampleMeasurements
    }
    const resolved = resolveBindingOrValue(dataBinding, sampleData as Record<string, unknown>)
    return Array.isArray(resolved) ? resolved : sampleMeasurements
  }

  const data = getTableData()

  // Format a number based on format string
  const formatNumber = (value: unknown, format?: string): string => {
    if (typeof value !== 'number') return String(value ?? '')
    if (!format) return value.toString()
    
    const decimals = (format.match(/0\.(0+)/) || [, ''])[1].length
    return value.toFixed(decimals)
  }

  // Render a cell based on column type
  const renderCell = (row: Record<string, unknown>, column: MeasurementColumn, rowIndex: number) => {
    const value = row[column.key]
    
    switch (column.type) {
      case 'text':
        return <span>{String(value ?? '')}</span>
        
      case 'number':
        return <span>{formatNumber(value, column.format)}</span>
        
      case 'unit':
        return <span>{column.unit || String(value ?? '')}</span>
        
      case 'tolerance':
        const min = row.min
        const max = row.max
        if (typeof min === 'number' && typeof max === 'number') {
          const nominal = row.nominal
          if (typeof nominal === 'number') {
            const tolerance = Math.max(Math.abs(min - nominal), Math.abs(max - nominal))
            return <span>±{formatNumber(tolerance, '0.00')}</span>
          }
          return <span>{formatNumber(min, '0.00')} - {formatNumber(max, '0.00')}</span>
        }
        return <span>-</span>
        
      case 'status':
        const status = String(value ?? '').toUpperCase()
        const isPass = status === 'PASS'
        return (
          <span
            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold"
            style={{ backgroundColor: isPass ? passColor : failColor }}
          >
            {isPass ? '✓' : '✗'}
          </span>
        )
        
      case 'deviation':
        const measured = row.measured
        const nominalVal = row.nominal
        if (typeof measured === 'number' && typeof nominalVal === 'number') {
          const deviation = ((measured - nominalVal) / nominalVal) * 100
          const isPositive = deviation >= 0
          return (
            <span style={{ color: Math.abs(deviation) > 5 ? failColor : passColor }}>
              {isPositive ? '+' : ''}{deviation.toFixed(2)}%
            </span>
          )
        }
        return <span>-</span>
        
      default:
        return <span>{String(value ?? '')}</span>
    }
  }

  if (!visible) return null

  const handlePositionChange = (newPos: { x?: number; y?: number; width?: number; height?: number }) => {
    setProp((props: MeasurementTableProps) => {
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
      minWidth={300}
      minHeight={100}
      selected={selected}
      nodeId={id}
      onPositionChange={handlePositionChange}
      connectRef={(ref) => { if (ref) connect(ref) }}
      zIndex={zIndex}
    >
      <div
        className="w-full h-full overflow-auto"
        style={{
          backgroundColor: '#fff',
          border: `1px solid ${borderColor}`,
          borderRadius: '4px',
        }}
      >
        <table className="w-full border-collapse" style={{ fontSize: `${fontSize}px` }}>
          {showHeader && (
            <thead>
              <tr style={{ backgroundColor: headerBackgroundColor }}>
                {showRowNumbers && (
                  <th
                    className="text-left p-2 text-white font-semibold"
                    style={{ borderRight: `1px solid ${borderColor}`, width: '40px' }}
                  >
                    #
                  </th>
                )}
                {columns.map((column, index) => (
                  <th
                    key={column.key}
                    className="text-left p-2 text-white font-semibold"
                    style={{
                      borderRight: index < columns.length - 1 ? `1px solid ${borderColor}` : 'none',
                      width: column.width,
                      minWidth: column.width,
                    }}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                style={{
                  backgroundColor: stripeRows && rowIndex % 2 === 1 ? '#f5f5f5' : '#fff',
                  borderBottom: `1px solid ${borderColor}`,
                }}
              >
                {showRowNumbers && (
                  <td
                    className="p-2 text-gray-500"
                    style={{ borderRight: `1px solid ${borderColor}` }}
                  >
                    {rowIndex + 1}
                  </td>
                )}
                {columns.map((column, colIndex) => (
                  <td
                    key={column.key}
                    className="p-2"
                    style={{
                      borderRight: colIndex < columns.length - 1 ? `1px solid ${borderColor}` : 'none',
                      textAlign: column.type === 'number' ? 'right' : 'left',
                    }}
                  >
                    {renderCell(row, column, rowIndex)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ResizableBox>
  )
}

import { MeasurementTableSettings } from '../settings/MeasurementTableSettings'

MeasurementTable.craft = {
  displayName: 'Measurement Table',
  props: {
    dataBinding: '',
    columns: defaultColumns,
    showHeader: true,
    showRowNumbers: false,
    stripeRows: true,
    headerBackgroundColor: '#1a1a2e',
    passColor: '#22c55e',
    failColor: '#ef4444',
    borderColor: '#333',
    fontSize: 12,
    x: 0,
    y: 0,
    width: 500,
    height: 200,
    zIndex: 1,
    visible: true,
  },
  related: {
    settings: MeasurementTableSettings,
  },
  rules: {
    canDrag: () => true,
  },
}
