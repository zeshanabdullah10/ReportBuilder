'use client'

import { useNode } from '@craftjs/core'
import { Input } from '@/components/ui/input'
import { DataBindingInput } from '@/components/builder/data-binding'
import { PositionSettings } from './PositionSettings'

export function TableSettings() {
  const {
    actions: { setProp },
    columns,
    rows,
    headerColor,
    rowColor,
    binding,
  } = useNode((node) => ({
    columns: node.data.props.columns,
    rows: node.data.props.rows,
    headerColor: node.data.props.headerColor,
    rowColor: node.data.props.rowColor,
    binding: node.data.props.binding,
  }))

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Columns (comma-separated)</label>
        <Input
          type="text"
          value={columns.join(', ')}
          onChange={(e) => setProp((props: any) => (props.columns = e.target.value.split(',').map((s: string) => s.trim())))}
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Preview Rows</label>
        <Input
          type="number"
          value={rows}
          onChange={(e) => setProp((props: any) => (props.rows = parseInt(e.target.value) || 3))}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Header Color</label>
          <Input
            type="color"
            value={headerColor}
            onChange={(e) => setProp((props: any) => (props.headerColor = e.target.value))}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Row Color</label>
          <Input
            type="color"
            value={rowColor}
            onChange={(e) => setProp((props: any) => (props.rowColor = e.target.value))}
          />
        </div>
      </div>

      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">
          Data Binding
        </label>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Binding Path</label>
          <DataBindingInput
            value={binding}
            onChange={(value) => setProp((props: any) => (props.binding = value))}
            placeholder="{{data.tableData}}"
            expectedType="array"
            hint="Bind to an array of objects (each key becomes a column)"
          />
        </div>
      </div>

      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <PositionSettings />
      </div>
    </div>
  )
}
