'use client'

import { useState, useEffect } from 'react'
import { X, Download, Loader2, Check, AlertCircle, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Template {
  id: string
  name: string
  description?: string | null
  created_at: string
  updated_at: string
}

interface BatchExportDialogProps {
  templates: Template[]
  isOpen: boolean
  onClose: () => void
}

export function BatchExportDialog({
  templates,
  isOpen,
  onClose,
}: BatchExportDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [exportData, setExportData] = useState('{\n  \n}')
  const [pageSize, setPageSize] = useState<'A4' | 'Letter'>('A4')
  const [includeWatermark, setIncludeWatermark] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set())
      setExportData('{\n  \n}')
      setError(null)
      setSuccess(false)
    }
  }, [isOpen])

  // Toggle template selection
  const toggleTemplate = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  // Select/deselect all
  const toggleAll = () => {
    if (selectedIds.size === templates.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(templates.map(t => t.id)))
    }
  }

  // Handle export
  const handleExport = async () => {
    if (selectedIds.size === 0) {
      setError('Please select at least one template')
      return
    }

    // Validate JSON
    let parsedData: Record<string, unknown>
    try {
      parsedData = JSON.parse(exportData)
    } catch {
      setError('Invalid JSON data')
      return
    }

    setIsExporting(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/templates/batch-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateIds: Array.from(selectedIds),
          data: parsedData,
          options: {
            filename: 'batch_export',
            pageSize,
            includeWatermark,
          },
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Export failed')
      }

      // Download the file
      const blob = await response.blob()
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = 'batch_export.zip'
      
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/)
        if (match) {
          filename = match[1]
        }
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-[#0a0f14] border border-[rgba(0,255,200,0.2)] rounded-xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[rgba(0,255,200,0.1)]">
            <h2 className="text-lg font-semibold text-white">Batch Export</h2>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-lg bg-[#39ff14]/10 border border-[#39ff14]/20 text-[#39ff14] text-sm flex items-center gap-2">
                <Check className="w-4 h-4 flex-shrink-0" />
                Export successful! Download started...
              </div>
            )}

            {/* Template Selection */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-white">Select Templates</h3>
                <button
                  onClick={toggleAll}
                  className="text-xs text-[#00ffc8] hover:underline"
                >
                  {selectedIds.size === templates.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              
              <div className="max-h-48 overflow-y-auto rounded-lg bg-[#050810] border border-[rgba(0,255,200,0.1)]">
                {templates.map((template) => (
                  <label
                    key={template.id}
                    className="flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer border-b border-[rgba(0,255,200,0.05)] last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(template.id)}
                      onChange={() => toggleTemplate(template.id)}
                      className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#0a0f14] text-[#00ffc8] focus:ring-[#00ffc8] focus:ring-offset-0"
                    />
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-white">{template.name}</span>
                    {selectedIds.has(template.id) && (
                      <Check className="w-4 h-4 text-[#00ffc8] ml-auto" />
                    )}
                  </label>
                ))}
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                {selectedIds.size} template{selectedIds.size !== 1 ? 's' : ''} selected
              </p>
            </div>

            {/* Data Input */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-white mb-3">Data to Apply</h3>
              <textarea
                value={exportData}
                onChange={(e) => setExportData(e.target.value)}
                className="w-full h-32 px-3 py-2 bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg text-white font-mono text-sm resize-none focus:outline-none focus:border-[#00ffc8]"
                placeholder='{"key": "value"}'
              />
              <p className="text-xs text-gray-500 mt-2">
                Enter JSON data that will be applied to all selected templates
              </p>
            </div>

            {/* Export Options */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-white mb-3">Export Options</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Page Size</label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value as 'A4' | 'Letter')}
                    className="w-full px-3 py-2 bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg text-white focus:outline-none focus:border-[#00ffc8]"
                  >
                    <option value="A4">A4</option>
                    <option value="Letter">Letter</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeWatermark}
                      onChange={(e) => setIncludeWatermark(e.target.checked)}
                      className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#0a0f14] text-[#00ffc8] focus:ring-[#00ffc8] focus:ring-offset-0"
                    />
                    <span className="text-sm text-gray-300">Include watermark</span>
                  </label>
                </div>
              </div>
              
              {!includeWatermark && selectedIds.size > 0 && (
                <p className="text-xs text-[#ffb000] mt-3">
                  Clean exports will use {selectedIds.size} credit{selectedIds.size !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[rgba(0,255,200,0.1)] flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting || selectedIds.size === 0 || success}
              className="flex-1"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
