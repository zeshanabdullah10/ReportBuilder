'use client'

import { useNode } from '@craftjs/core'
import { TableSettings } from '../settings/TableSettings'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { hasBindings, resolveBinding, resolveBindingOrValue } from '@/lib/utils/binding'

interface TableProps {
  columns?: string[]
  rows?: number
  headerColor?: string
  rowColor?: string
  borderColor?: string
  binding?: string
}

interface TableRow {
  [key: string]: string | number | boolean | null
}

export const Table = ({
  columns = ['Column 1', 'Column 2', 'Column 3'],
  rows = 3,
  headerColor = '#1a1a2e',
  rowColor = '#ffffff',
  borderColor = '#e0e0e0',
  binding = '',
}: TableProps) => {
  const {
    connectors: { connect, drag },
  } = useNode()

  const { isPreviewMode, sampleData } = useBuilderStore()

  // Resolve table data based on preview mode and bindings
  const getTableData = (): TableRow[] => {
    if (isPreviewMode && sampleData && binding && hasBindings(binding)) {
      // Try to resolve binding to an array
      const resolved = resolveBindingOrValue(binding, sampleData)

      if (Array.isArray(resolved)) {
        return resolved.map((row) => {
          if (typeof row === 'object' && row !== null) {
            // Convert object values to strings
            const stringRow: TableRow = {}
            Object.entries(row).forEach(([key, value]) => {
              stringRow[key] = String(value ?? '')
            })
            return stringRow
          }
          return { Value: String(row) }
        })
      }
    }

    // Generate sample data for preview/editing
    return Array(rows)
      .fill(null)
      .map((_, i) =>
        columns.reduce((acc, col) => ({ ...acc, [col]: `Data ${i + 1}` }), {} as TableRow)
      )
  }

  // Get columns - either from resolved data or use the defined columns
  const getColumns = (): string[] => {
    if (isPreviewMode && sampleData && binding && hasBindings(binding)) {
      const resolved = resolveBindingOrValue(binding, sampleData)
      if (Array.isArray(resolved) && resolved.length > 0 && typeof resolved[0] === 'object') {
        return Object.keys(resolved[0])
      }
    }
    return columns
  }

  const displayColumns = getColumns()
  const tableRows = getTableData()

  // Resolve colors if they contain bindings
  const getHeaderColor = () => {
    if (isPreviewMode && sampleData && hasBindings(headerColor)) {
      const resolved = resolveBindingOrValue(headerColor, sampleData)
      return typeof resolved === 'string' ? resolved : headerColor
    }
    return headerColor
  }

  const getRowColor = () => {
    if (isPreviewMode && sampleData && hasBindings(rowColor)) {
      const resolved = resolveBindingOrValue(rowColor, sampleData)
      return typeof resolved === 'string' ? resolved : rowColor
    }
    return rowColor
  }

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref))
      }}
      className="overflow-x-auto cursor-pointer"
    >
      <table className="w-full border-collapse" style={{ fontSize: '14px' }}>
        <thead>
          <tr style={{ background: getHeaderColor() }}>
            {displayColumns.map((col, i) => (
              <th
                key={i}
                style={{ border: `1px solid ${borderColor}`, padding: '8px', textAlign: 'left', color: '#fff' }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableRows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? getRowColor() : '#f5f5f5' }}>
              {displayColumns.map((col, j) => (
                <td
                  key={j}
                  style={{ border: `1px solid ${borderColor}`, padding: '8px', color: '#333' }}
                >
                  {row[col] ?? ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

Table.craft = {
  displayName: 'Table',
  props: {
    columns: ['Column 1', 'Column 2', 'Column 3'],
    rows: 3,
    headerColor: '#1a1a2e',
    rowColor: '#ffffff',
    borderColor: '#e0e0e0',
    binding: '',
  },
  related: {
    settings: TableSettings,
  },
}
