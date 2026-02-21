'use client'

import { useNode } from '@craftjs/core'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { hasBindings, resolveBindingOrValue } from '@/lib/utils/binding'
import { ResizableBox } from '../layout/ResizableBox'

interface RevisionEntry {
  version: string
  date: string
  author: string
  description: string
}

interface RevisionBlockProps {
  // Revisions array binding
  revisionsBinding?: string
  
  // Static revisions (fallback)
  revisions?: RevisionEntry[]
  
  // Appearance
  title?: string
  showHeader?: boolean
  columns?: ('version' | 'date' | 'author' | 'description')[]
  dateFormat?: string
  
  // Styling
  headerColor?: string
  borderColor?: string
  
  // Position
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
  visible?: boolean
}

export const RevisionBlock = ({
  revisionsBinding = '',
  revisions = [
    { version: '1.0', date: '2024-01-15', author: 'John Doe', description: 'Initial release' },
    { version: '1.1', date: '2024-02-01', author: 'Jane Smith', description: 'Added new tests' },
  ],
  title = 'Revision History',
  showHeader = true,
  columns = ['version', 'date', 'author', 'description'],
  dateFormat = 'YYYY-MM-DD',
  headerColor = '#3b82f6',
  borderColor = '#e5e7eb',
  x = 0,
  y = 0,
  width = 400,
  height = 120,
  zIndex = 1,
  visible = true,
}: RevisionBlockProps) => {
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

  // Resolve revisions from binding or use static value
  let resolvedRevisions = revisions
  if (revisionsBinding && hasBindings(revisionsBinding) && sampleData) {
    const bound = resolveBindingOrValue(revisionsBinding, sampleData as Record<string, unknown>)
    if (Array.isArray(bound)) {
      resolvedRevisions = bound
    }
  }

  if (!visible) return null

  const handlePositionChange = (newPos: { x?: number; y?: number; width?: number; height?: number }) => {
    setProp((props: RevisionBlockProps) => {
      if (newPos.x !== undefined) props.x = newPos.x
      if (newPos.y !== undefined) props.y = newPos.y
      if (newPos.width !== undefined) props.width = newPos.width
      if (newPos.height !== undefined) props.height = newPos.height
    })
  }

  const columnLabels: Record<string, string> = {
    version: 'Rev',
    date: 'Date',
    author: 'Author',
    description: 'Description',
  }

  const columnWidths: Record<string, string> = {
    version: '10%',
    date: '15%',
    author: '20%',
    description: '55%',
  }

  return (
    <ResizableBox
      x={x}
      y={y}
      width={width}
      height={height}
      minWidth={200}
      minHeight={60}
      selected={selected}
      nodeId={id}
      onPositionChange={handlePositionChange}
      connectRef={(ref) => { if (ref) connect(ref) }}
      zIndex={zIndex}
    >
      <div className="w-full h-full flex flex-col bg-white border rounded overflow-hidden"
        style={{ borderColor }}>
        {/* Title */}
        {title && (
          <div className="px-2 py-1 text-sm font-semibold"
            style={{ backgroundColor: headerColor, color: 'white' }}>
            {title}
          </div>
        )}
        
        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            {showHeader && (
              <thead>
                <tr className="bg-gray-50 border-b"
                  style={{ borderColor }}>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-2 py-1 text-left font-medium text-gray-600"
                      style={{ width: columnWidths[col] }}
                    >
                      {columnLabels[col]}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {resolvedRevisions.map((rev, index) => (
                <tr
                  key={index}
                  className="border-b"
                  style={{ borderColor }}
                >
                  {columns.map((col) => (
                    <td key={col} className="px-2 py-1 text-gray-700">
                      {rev[col as keyof RevisionEntry] || '-'}
                    </td>
                  ))}
                </tr>
              ))}
              {resolvedRevisions.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-2 py-2 text-center text-gray-400"
                  >
                    No revisions
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ResizableBox>
  )
}

import { RevisionBlockSettings } from '../settings/RevisionBlockSettings'

RevisionBlock.craft = {
  displayName: 'Revision Block',
  props: {
    revisionsBinding: '',
    revisions: [
      { version: '1.0', date: '2024-01-15', author: 'John Doe', description: 'Initial release' },
      { version: '1.1', date: '2024-02-01', author: 'Jane Smith', description: 'Added new tests' },
    ],
    title: 'Revision History',
    showHeader: true,
    columns: ['version', 'date', 'author', 'description'],
    dateFormat: 'YYYY-MM-DD',
    headerColor: '#3b82f6',
    borderColor: '#e5e7eb',
    x: 0,
    y: 0,
    width: 400,
    height: 120,
    zIndex: 1,
    visible: true,
  },
  related: {
    settings: RevisionBlockSettings,
  },
  rules: {
    canDrag: () => true,
  },
}
