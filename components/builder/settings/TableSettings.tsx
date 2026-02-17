'use client'

import { useNode } from '@craftjs/core'
import { Input } from '@/components/ui/input'

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
        <input
          type="text"
          value={columns.join(', ')}
          onChange={(e) => setProp((props: any) => (props.columns = e.target.value.split(',').map((s: string) => s.trim())))}
          className="w-full bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg p-2 text-white text-sm"
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
          <Input
            value={binding}
            onChange={(e) => setProp((props: any) => (props.binding = e.target.value))}
            placeholder="{{data.tableData}}"
          />
          <p className="text-xs text-gray-500 mt-1">
            Bind to an array of objects. Each object key becomes a column.
            Use <code className="text-[#00ffc8]">{'{{data.items}}'}</code> syntax.
          </p>
        </div>
      </div>
    </div>
  )
}
