'use client'

import { useNode } from '@craftjs/core'
import { PositionSettings } from './PositionSettings'

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
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setProp((props: any) => (props.title = e.target.value))}
          placeholder="Revision History"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
      </div>

      {/* Data Binding */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Revisions Binding
        </label>
        <input
          type="text"
          value={revisionsBinding}
          onChange={(e) => setProp((props: any) => (props.revisionsBinding = e.target.value))}
          placeholder="{{report.revisions}}"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          Bind to an array of revision objects
        </p>
      </div>

      {/* Columns */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Columns
        </label>
        <div className="flex flex-wrap gap-2">
          {['version', 'date', 'author', 'description'].map((col) => (
            <button
              key={col}
              onClick={() => toggleColumn(col)}
              className={`px-3 py-1 text-xs rounded-md border ${
                columns.includes(col)
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {col.charAt(0).toUpperCase() + col.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Header Color
          </label>
          <div className="flex gap-1">
            <input
              type="color"
              value={headerColor}
              onChange={(e) => setProp((props: any) => (props.headerColor = e.target.value))}
              className="w-10 h-10 rounded border border-gray-300"
            />
            <input
              type="text"
              value={headerColor}
              onChange={(e) => setProp((props: any) => (props.headerColor = e.target.value))}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Border Color
          </label>
          <div className="flex gap-1">
            <input
              type="color"
              value={borderColor}
              onChange={(e) => setProp((props: any) => (props.borderColor = e.target.value))}
              className="w-10 h-10 rounded border border-gray-300"
            />
            <input
              type="text"
              value={borderColor}
              onChange={(e) => setProp((props: any) => (props.borderColor = e.target.value))}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>
      </div>

      {/* Show Header */}
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showHeader}
            onChange={(e) => setProp((props: any) => (props.showHeader = e.target.checked))}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">Show Column Headers</span>
        </label>
      </div>

      {/* Static Revisions (when not bound) */}
      {!revisionsBinding && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Revisions
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {(revisions || []).map((rev: RevisionEntry, index: number) => (
              <div key={index} className="p-2 bg-gray-50 rounded text-xs space-y-1">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={rev.version}
                    onChange={(e) => updateRevision(index, 'version', e.target.value)}
                    placeholder="Ver"
                    className="w-14 px-1 py-0.5 border border-gray-300 rounded"
                  />
                  <input
                    type="date"
                    value={rev.date}
                    onChange={(e) => updateRevision(index, 'date', e.target.value)}
                    className="flex-1 px-1 py-0.5 border border-gray-300 rounded"
                  />
                  <button
                    onClick={() => removeRevision(index)}
                    className="text-red-500 hover:text-red-700 px-1"
                  >
                    ×
                  </button>
                </div>
                <input
                  type="text"
                  value={rev.author}
                  onChange={(e) => updateRevision(index, 'author', e.target.value)}
                  placeholder="Author"
                  className="w-full px-1 py-0.5 border border-gray-300 rounded"
                />
                <input
                  type="text"
                  value={rev.description}
                  onChange={(e) => updateRevision(index, 'description', e.target.value)}
                  placeholder="Description"
                  className="w-full px-1 py-0.5 border border-gray-300 rounded"
                />
              </div>
            ))}
          </div>
          <button
            onClick={addRevision}
            className="mt-2 w-full px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            + Add Revision
          </button>
        </div>
      )}

      {/* Visibility */}
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={visible}
            onChange={(e) => setProp((props: any) => (props.visible = e.target.checked))}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">Visible</span>
        </label>
      </div>

      {/* Position Settings */}
      <PositionSettings />
    </div>
  )
}
