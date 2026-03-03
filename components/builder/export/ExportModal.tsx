'use client'

import { useState, useMemo } from 'react'
import { X, Download, AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { validateTemplate, getValidationSummary, type ValidationResult } from '@/lib/validations/template'
import type { CanvasState } from '@/lib/export/html-compiler'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  templateId: string
  templateName: string
  canvasState?: CanvasState | null
  sampleData?: Record<string, unknown> | null
}

export function ExportModal({ 
  isOpen, 
  onClose, 
  templateId, 
  templateName,
  canvasState,
  sampleData 
}: ExportModalProps) {
  const [filename, setFilename] = useState(templateName)
  const [includeSampleData, setIncludeSampleData] = useState(false)
  const [pageSize, setPageSize] = useState<'A4' | 'Letter'>('A4')
  const [margin, setMargin] = useState(20)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Validate template when modal opens
  const validation = useMemo<ValidationResult>(() => {
    if (!isOpen) return { isValid: true, warnings: [], errors: [] }
    return validateTemplate(canvasState || null, sampleData || null)
  }, [isOpen, canvasState, sampleData])

  const handleExport = async () => {
    // Don't export if there are blocking errors
    if (!validation.isValid) {
      setError('Please fix the errors before exporting')
      return
    }

    setIsExporting(true)
    setError(null)

    try {
      const response = await fetch(`/api/templates/${templateId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename,
          includeSampleData,
          pageSize,
          margins: { top: margin, right: margin, bottom: margin, left: margin },
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Export failed')
      }

      const html = await response.text()
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.html`
      a.click()
      URL.revokeObjectURL(url)

      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  if (!isOpen) return null

  const hasWarnings = validation.warnings.length > 0
  const hasErrors = validation.errors.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[rgba(0,255,200,0.1)] sticky top-0 bg-[#050810]">
          <h3 className="text-lg font-semibold text-white">Export Template</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Validation Status */}
          {hasErrors ? (
            <div className="p-3 rounded bg-red-500/10 border border-red-500/30">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm font-medium text-red-400">Cannot Export</span>
              </div>
              <ul className="text-xs text-red-300 space-y-1 ml-6">
                {validation.errors.map((err, i) => (
                  <li key={i}>• {err.message}</li>
                ))}
              </ul>
            </div>
          ) : hasWarnings ? (
            <div className="p-3 rounded bg-[#ffb000]/10 border border-[#ffb000]/30">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-[#ffb000]" />
                <span className="text-sm font-medium text-[#ffb000]">
                  {getValidationSummary(validation)}
                </span>
              </div>
              <ul className="text-xs text-[#ffb000]/80 space-y-1 ml-6">
                {validation.warnings.map((warning, i) => (
                  <li key={i}>• {warning.message}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2 rounded bg-[#39ff14]/10 border border-[#39ff14]/30">
              <CheckCircle className="w-4 h-4 text-[#39ff14]" />
              <span className="text-sm text-[#39ff14]">Template is ready for export</span>
            </div>
          )}

          {/* Filename */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">File Name</label>
            <Input
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="Report Template"
            />
          </div>

          {/* Include sample data */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeSampleData}
              onChange={(e) => setIncludeSampleData(e.target.checked)}
              className="rounded border-[rgba(0,255,200,0.2)] bg-[#0a0f14]"
            />
            <span className="text-sm text-gray-300">Include sample data for testing</span>
          </label>

          {/* Page Settings */}
          <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
            <label className="block text-sm text-gray-400 mb-2">Page Settings</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Size</label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value as 'A4' | 'Letter')}
                  className="w-full bg-[#0a0f14] border border-[rgba(0,255,200,0.2)] rounded px-3 py-2 text-sm text-white"
                >
                  <option value="A4">A4</option>
                  <option value="Letter">Letter</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Margin (mm)</label>
                <Input
                  type="number"
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                  min={0}
                  max={50}
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-[rgba(0,255,200,0.1)] sticky bottom-0 bg-[#050810]">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting || hasErrors}
          >
            {isExporting ? 'Exporting...' : (
              <><Download className="w-4 h-4 mr-1" /> Download HTML</>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
