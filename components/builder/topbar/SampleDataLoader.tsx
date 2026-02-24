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
    id: 'component-test-sample',
    name: 'Component Test Sample',
    description: 'Comprehensive data for all component types',
    data: {
      meta: {
        reportTitle: 'PCB Assembly Test Report',
        reportVersion: '1.0',
        generatedBy: 'LabVIEW Test System',
        projectName: 'Project Alpha - Rev 2.1',
      },
      testInfo: {
        testName: 'PCB Functional Test',
        testDate: '2026-02-24T14:30:00',
        operator: 'John Smith',
        workOrder: 'WO-2026-0224-001',
        serialNumber: 'SN-PCB-001234',
        stationId: 'TEST-STN-05',
      },
      summary: {
        totalTests: 150,
        passed: 142,
        failed: 5,
        skipped: 3,
        passRate: 94.67,
        overallStatus: 'pass',
        testDuration: '00:12:45',
      },
      measurements: [
        { id: 1, name: 'Voltage Ch1', nominal: 5.0, measured: 5.02, unit: 'V', tolerance: '±5%', status: 'pass' },
        { id: 2, name: 'Voltage Ch2', nominal: 3.3, measured: 3.31, unit: 'V', tolerance: '±5%', status: 'pass' },
        { id: 3, name: 'Voltage Ch3', nominal: 12.0, measured: 12.15, unit: 'V', tolerance: '±3%', status: 'pass' },
        { id: 4, name: 'Current Draw', nominal: 0.25, measured: 0.28, unit: 'A', tolerance: '±10%', status: 'warning' },
        { id: 5, name: 'Frequency', nominal: 60.0, measured: 60.1, unit: 'Hz', tolerance: '±1%', status: 'pass' },
        { id: 6, name: 'Temperature', nominal: 45.0, measured: 44.2, unit: '°C', tolerance: '±5%', status: 'pass' },
        { id: 7, name: 'Resistance R1', nominal: 1000, measured: 998, unit: 'Ω', tolerance: '±1%', status: 'pass' },
        { id: 8, name: 'Resistance R2', nominal: 4700, measured: 4750, unit: 'Ω', tolerance: '±5%', status: 'pass' },
        { id: 9, name: 'Capacitance C1', nominal: 100, measured: 98.5, unit: 'µF', tolerance: '±10%', status: 'pass' },
        { id: 10, name: 'Ripple Voltage', nominal: 50, measured: 78, unit: 'mV', tolerance: '±50%', status: 'fail' },
      ],
      chartData: {
        labels: ['Test 1', 'Test 2', 'Test 3', 'Test 4', 'Test 5', 'Test 6', 'Test 7', 'Test 8'],
        values: [95, 87, 92, 78, 91, 88, 94, 85],
      },
      trendData: {
        labels: ['6AM', '7AM', '8AM', '9AM', '10AM', '11AM', '12PM', '1PM'],
        passRates: [98, 96, 94, 97, 95, 93, 96, 94],
        testCounts: [12, 15, 18, 14, 16, 19, 13, 17],
      },
      scatterData: [
        { x: 1.0, y: 5.02, label: 'V1' },
        { x: 1.5, y: 5.01, label: 'V2' },
        { x: 2.0, y: 5.03, label: 'V3' },
        { x: 2.5, y: 4.99, label: 'V4' },
        { x: 3.0, y: 5.0, label: 'V5' },
        { x: 3.5, y: 5.02, label: 'V6' },
        { x: 4.0, y: 5.01, label: 'V7' },
        { x: 4.5, y: 5.04, label: 'V8' },
      ],
      histogramData: {
        bins: ['4.95-4.97', '4.97-4.99', '4.99-5.01', '5.01-5.03', '5.03-5.05'],
        counts: [2, 5, 12, 8, 3],
      },
      gaugeData: {
        mainVoltage: {
          value: 5.02,
          min: 4.5,
          max: 5.5,
          unit: 'V',
        },
        temperature: {
          value: 44.2,
          min: 0,
          max: 100,
          unit: '°C',
        },
      },
      status: {
        overall: 'pass',
        voltageTest: 'pass',
        currentTest: 'warning',
        frequencyTest: 'pass',
        temperatureTest: 'pass',
        functionalTest: 'pass',
      },
      progress: {
        completion: 100,
        currentStep: 'Final Validation',
        totalSteps: 10,
        completedSteps: 10,
      },
      specifications: {
        title: 'Test Specifications',
        items: [
          { parameter: 'Input Voltage', spec: '120V AC ±10%', actual: '118V AC', status: 'pass' },
          { parameter: 'Output Voltage', spec: '5.0V DC ±5%', actual: '5.02V DC', status: 'pass' },
          { parameter: 'Max Current', spec: '≤500mA', actual: '280mA', status: 'pass' },
          { parameter: 'Operating Temp', spec: '0-70°C', actual: '44.2°C', status: 'pass' },
        ],
      },
      revisions: [
        { rev: 'A', date: '2026-02-20', author: 'J. Smith', description: 'Initial test procedure' },
        { rev: 'B', date: '2026-02-22', author: 'M. Johnson', description: 'Added voltage tolerance checks' },
        { rev: 'C', date: '2026-02-24', author: 'J. Smith', description: 'Updated pass/fail criteria' },
      ],
      notes: 'All measurements taken at ambient temperature (23°C). Unit under test was powered for 30 minutes before measurements.',
      approval: {
        testedBy: 'John Smith',
        testedDate: '2026-02-24',
        approvedBy: '',
        approvedDate: '',
        status: 'pending',
      },
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
