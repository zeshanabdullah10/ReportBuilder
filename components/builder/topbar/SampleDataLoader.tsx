'use client'

import { useState, useRef } from 'react'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { Button } from '@/components/ui/button'
import { Upload, FileJson, ChevronDown, Check, X, Edit3 } from 'lucide-react'

// Preset sample data templates
const SAMPLE_DATA_TEMPLATES = [
  {
    id: 'labview-test-results',
    name: 'LabVIEW Test Results',
    description: 'Typical test measurement data',
    data: {
      testName: 'Voltage Measurement Test',
      testDate: '2026-02-18',
      operator: 'John Smith',
      results: {
        passCount: 42,
        failCount: 3,
        totalTests: 45,
        passRate: 93.3,
      },
      measurements: [
        { name: 'Voltage Ch1', value: 5.02, unit: 'V', status: 'pass' },
        { name: 'Voltage Ch2', value: 3.31, unit: 'V', status: 'pass' },
        { name: 'Current Draw', value: 0.25, unit: 'A', status: 'pass' },
        { name: 'Frequency', value: 60.1, unit: 'Hz', status: 'warning' },
        { name: 'Temperature', value: 45.2, unit: 'C', status: 'pass' },
      ],
      chartData: [
        { label: 'Test 1', value: 95 },
        { label: 'Test 2', value: 87 },
        { label: 'Test 3', value: 92 },
        { label: 'Test 4', value: 78 },
        { label: 'Test 5', value: 91 },
      ],
      summary: 'All tests completed successfully with minor warnings.',
      overallStatus: 'pass',
    },
  },
  {
    id: 'production-report',
    name: 'Production Report',
    description: 'Manufacturing production data',
    data: {
      reportTitle: 'Daily Production Summary',
      date: '2026-02-18',
      shift: 'Day Shift',
      line: 'Assembly Line A',
      unitsProduced: 1247,
      targetUnits: 1300,
      efficiency: 95.9,
      defects: [
        { type: 'Cosmetic', count: 5 },
        { type: 'Functional', count: 2 },
        { type: 'Packaging', count: 3 },
      ],
      hourlyOutput: [
        { hour: '6AM', output: 145 },
        { hour: '7AM', output: 162 },
        { hour: '8AM', output: 158 },
        { hour: '9AM', output: 171 },
        { hour: '10AM', output: 168 },
        { hour: '11AM', output: 155 },
      ],
    },
  },
  {
    id: 'quality-inspection',
    name: 'Quality Inspection',
    description: 'Quality control inspection data',
    data: {
      inspectionId: 'QC-2026-0218-001',
      partNumber: 'PN-12345-A',
      inspector: 'Jane Doe',
      inspectionDate: '2026-02-18',
      specifications: {
        dimension1: { nominal: 10.0, tolerance: 0.1, measured: 10.05, status: 'pass' },
        dimension2: { nominal: 25.0, tolerance: 0.2, measured: 24.95, status: 'pass' },
        dimension3: { nominal: 50.0, tolerance: 0.5, measured: 50.3, status: 'pass' },
      },
      visualInspection: 'pass',
      overallResult: 'pass',
      notes: 'All dimensions within specification.',
    },
  },
  {
    id: 'empty',
    name: 'Empty',
    description: 'Clear sample data',
    data: null,
  },
]

export function SampleDataLoader() {
  const { sampleData, setSampleData } = useBuilderStore()
  const [isOpen, setIsOpen] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [editorValue, setEditorValue] = useState('')
  const [editorError, setEditorError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSelectTemplate = (templateId: string) => {
    const template = SAMPLE_DATA_TEMPLATES.find((t) => t.id === templateId)
    if (template) {
      setSampleData(template.data)
    }
    setIsOpen(false)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string)
        setSampleData(json)
      } catch (error) {
        console.error('Failed to parse JSON file:', error)
        alert('Invalid JSON file. Please check the format.')
      }
    }
    reader.readAsText(file)

    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleOpenEditor = () => {
    setEditorValue(JSON.stringify(sampleData || {}, null, 2))
    setEditorError(null)
    setShowEditor(true)
  }

  const handleSaveEditor = () => {
    try {
      const parsed = editorValue.trim() ? JSON.parse(editorValue) : null
      setSampleData(parsed)
      setShowEditor(false)
      setEditorError(null)
    } catch (error) {
      setEditorError('Invalid JSON format. Please check your syntax.')
    }
  }

  const currentTemplate = SAMPLE_DATA_TEMPLATES.find(
    (t) => JSON.stringify(t.data) === JSON.stringify(sampleData)
  )

  return (
    <>
      <div className="relative">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs"
          >
            <Upload className="w-3 h-3 mr-1" />
            Load JSON
          </Button>

          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="text-xs min-w-[140px] justify-between"
            >
              <span className="flex items-center gap-1">
                <FileJson className="w-3 h-3" />
                {currentTemplate ? currentTemplate.name : 'Sample Data'}
              </span>
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>

            {isOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg shadow-xl z-50">
                <div className="p-2 text-xs text-gray-500 uppercase tracking-wide border-b border-[rgba(0,255,200,0.1)]">
                  Preset Templates
                </div>
                {SAMPLE_DATA_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template.id)}
                    className="w-full text-left px-3 py-2 hover:bg-[rgba(0,255,200,0.1)] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-200">{template.name}</span>
                      {currentTemplate?.id === template.id && (
                        <Check className="w-3 h-3 text-[#00ffc8]" />
                      )}
                    </div>
                    {template.description && (
                      <span className="text-xs text-gray-500">{template.description}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenEditor}
            className="text-xs"
            title="Edit sample data"
          >
            <Edit3 className="w-3 h-3 mr-1" />
            Edit
          </Button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Click outside to close dropdown */}
        {isOpen && (
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
        )}
      </div>

      {/* JSON Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[rgba(0,255,200,0.1)]">
              <h3 className="text-lg font-semibold text-white">Edit Sample Data</h3>
              <button
                onClick={() => setShowEditor(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-hidden">
              {editorError && (
                <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
                  {editorError}
                </div>
              )}
              <textarea
                value={editorValue}
                onChange={(e) => setEditorValue(e.target.value)}
                className="w-full h-[400px] bg-[#0a0f14] border border-[rgba(0,255,200,0.2)] rounded-lg p-3 text-white text-sm font-mono resize-none focus:outline-none focus:border-[#00ffc8]"
                placeholder='{"key": "value"}'
                spellCheck={false}
              />
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-[rgba(0,255,200,0.1)]">
              <Button variant="outline" onClick={() => setShowEditor(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEditor}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
