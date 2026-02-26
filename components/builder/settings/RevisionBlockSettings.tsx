'use client'

import { useNode } from '@craftjs/core'
import { Input } from '@/components/ui/input'
import { DataBindingInput } from '@/components/builder/data-binding'
import { PositionSettings } from './PositionSettings'
import { Plus, Trash2 } from 'lucide-react'

interface RevisionEntry {
  version: string
  date: string
  author: string
  description: string
}

export const RevisionBlockSettings = () => {
  const {
    actions: { setProp },
    revisionsBinding,
    revisions,
    title,
    showHeader,
    columns,
    headerColor,
    borderColor,
    visible,
  } = useNode((node) => ({
    revisionsBinding: node.data.props.revisionsBinding,
    revisions: node.data.props.revisions,
    title: node.data.props.title,
    showHeader: node.data.props.showHeader,
    columns: node.data.props.columns,
    headerColor: node.data.props.headerColor,
    borderColor: node.data.props.borderColor,
    visible: node.data.props.visible,
  }))

  const addRevision = () => {
    const newRevision: RevisionEntry = {
      version: `${(revisions?.length || 0) + 1}.0`,
      date: new Date().toISOString().split('T')[0],
      author: '',
      description: '',
    }
    setProp((props: any) => {
      props.revisions = [...(revisions || []), newRevision]
    })
  }

  const updateRevision = (index: number, field: keyof RevisionEntry, value: string) => {
    setProp((props: any) => {
      const updated = [...(revisions || [])]
      updated[index] = { ...updated[index], [field]: value }
      props.revisions = updated
    })
  }

  const removeRevision = (index: number) => {
    setProp((props: any) => {
      const updated = [...(revisions || [])]
      updated.splice(index, 1)
      props.revisions = updated
    })
  }

  const toggleColumn = (col: string) => {
    setProp((props: any) => {
      if (columns.includes(col)) {
        props.columns = columns.filter((c: string) => c !== col)
      } else {
        props.columns = [...columns, col]
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Title</label>
        <Input
          type="text"
          value={title}
          onChange={(e) => setProp((props: any) => (props.title = e.target.value))}
          placeholder="Revision History"
        />
      </div>

      {/* Data Binding */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Revisions Binding</label>
        <DataBindingInput
          value={revisionsBinding}
          onChange={(value) => setProp((props: any) => (props.revisionsBinding = value))}
          placeholder="{{report.revisions}}"
          expectedType="array"
          hint="Bind to an array of revision objects"
        />
      </div>

      {/* Columns */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Columns</label>
        <div className="flex flex-wrap gap-2">
          {['version', 'date', 'author', 'description'].map((col) => (
            <button
              key={col}
              type="button"
              onClick={() => toggleColumn(col)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                columns.includes(col)
                  ? 'bg-[rgba(0,255,200,0.2)] text-[#00ffc8] border-[#00ffc8]'
                  : 'bg-[#050810] text-gray-400 border-[rgba(0,255,200,0.2)] hover:border-[rgba(0,255,200,0.4)]'
              }`}
            >
              {col.charAt(0).toUpperCase() + col.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">
          Colors
        </label>
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
            <label className="block text-sm text-gray-400 mb-1">Border Color</label>
            <Input
              type="color"
              value={borderColor}
              onChange={(e) => setProp((props: any) => (props.borderColor = e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Show Header */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={showHeader}
          onChange={(e) => setProp((props: any) => (props.showHeader = e.target.checked))}
          className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#050810] text-[#00ffc8] focus:ring-[#00ffc8]"
        />
        <span className="text-sm text-gray-400">Show Column Headers</span>
      </label>

      {/* Static Revisions (when not bound) */}
      {!revisionsBinding && (
        <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
          <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">
            Revisions
          </label>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {(revisions || []).map((rev: RevisionEntry, index: number) => (
              <div key={index} className="p-3 bg-[#0a0f14] border border-[rgba(0,255,200,0.1)] rounded-lg space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={rev.version}
                    onChange={(e) => updateRevision(index, 'version', e.target.value)}
                    placeholder="Ver"
                    className="w-14 bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded px-2 py-1 text-white text-xs"
                  />
                  <input
                    type="date"
                    value={rev.date}
                    onChange={(e) => updateRevision(index, 'date', e.target.value)}
                    className="flex-1 bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded px-2 py-1 text-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => removeRevision(index)}
                    className="text-gray-500 hover:text-red-400 px-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  value={rev.author}
                  onChange={(e) => updateRevision(index, 'author', e.target.value)}
                  placeholder="Author"
                  className="w-full bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded px-2 py-1 text-white text-xs"
                />
                <input
                  type="text"
                  value={rev.description}
                  onChange={(e) => updateRevision(index, 'description', e.target.value)}
                  placeholder="Description"
                  className="w-full bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded px-2 py-1 text-white text-xs"
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addRevision}
            className="mt-3 w-full py-2 border border-dashed border-[rgba(0,255,200,0.3)] rounded-lg text-[#00ffc8] text-sm hover:bg-[rgba(0,255,200,0.1)] transition-colors flex items-center justify-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Revision
          </button>
        </div>
      )}

      {/* Visibility */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={visible}
          onChange={(e) => setProp((props: any) => (props.visible = e.target.checked))}
          className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#050810] text-[#00ffc8] focus:ring-[#00ffc8]"
        />
        <span className="text-sm text-gray-400">Visible</span>
      </label>

      {/* Position Settings */}
      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <PositionSettings />
      </div>
    </div>
  )
}
