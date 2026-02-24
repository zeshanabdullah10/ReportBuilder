'use client'

import { useNode } from '@craftjs/core'
import { PositionSettings } from './PositionSettings'

export function TestSummaryBoxSettings() {
  const {
    actions: { setProp },
    totalTestsBinding,
    passedBinding,
    failedBinding,
    skippedBinding,
    overallStatusBinding,
    totalTests,
    passed,
    failed,
    skipped,
    overallStatus,
    showSkipped,
    showPercentage,
    layout,
    passColor,
    failColor,
    skipColor,
    borderColor,
    backgroundColor,
    title,
    showTitle,
  } = useNode((node) => ({
    totalTestsBinding: node.data.props.totalTestsBinding,
    passedBinding: node.data.props.passedBinding,
    failedBinding: node.data.props.failedBinding,
    skippedBinding: node.data.props.skippedBinding,
    overallStatusBinding: node.data.props.overallStatusBinding,
    totalTests: node.data.props.totalTests,
    passed: node.data.props.passed,
    failed: node.data.props.failed,
    skipped: node.data.props.skipped,
    overallStatus: node.data.props.overallStatus,
    showSkipped: node.data.props.showSkipped,
    showPercentage: node.data.props.showPercentage,
    layout: node.data.props.layout,
    passColor: node.data.props.passColor,
    failColor: node.data.props.failColor,
    skipColor: node.data.props.skipColor,
    borderColor: node.data.props.borderColor,
    backgroundColor: node.data.props.backgroundColor,
    title: node.data.props.title,
    showTitle: node.data.props.showTitle,
  }))

  return (
    <div className="space-y-4">
      {/* Data Bindings Section */}
      <div className="border-b border-gray-700 pb-3">
        <h4 className="text-xs font-semibold text-cyan-400 mb-2">Data Bindings</h4>
        
        <div className="space-y-2">
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Total Tests Binding</label>
            <input
              type="text"
              value={totalTestsBinding}
              onChange={(e) => setProp((props: any) => props.totalTestsBinding = e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white font-mono"
              placeholder="{{data.summary.total}}"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-400">Passed Binding</label>
            <input
              type="text"
              value={passedBinding}
              onChange={(e) => setProp((props: any) => props.passedBinding = e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white font-mono"
              placeholder="{{data.summary.passed}}"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-400">Failed Binding</label>
            <input
              type="text"
              value={failedBinding}
              onChange={(e) => setProp((props: any) => props.failedBinding = e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white font-mono"
              placeholder="{{data.summary.failed}}"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-400">Skipped Binding</label>
            <input
              type="text"
              value={skippedBinding}
              onChange={(e) => setProp((props: any) => props.skippedBinding = e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white font-mono"
              placeholder="{{data.summary.skipped}}"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-400">Status Binding</label>
            <input
              type="text"
              value={overallStatusBinding}
              onChange={(e) => setProp((props: any) => props.overallStatusBinding = e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white font-mono"
              placeholder="{{data.summary.status}}"
            />
          </div>
        </div>
      </div>

      {/* Static Values (Fallback) */}
      <div className="border-b border-gray-700 pb-3">
        <h4 className="text-xs font-semibold text-cyan-400 mb-2">Static Values (Fallback)</h4>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Total</label>
            <input
              type="number"
              value={totalTests}
              onChange={(e) => setProp((props: any) => props.totalTests = parseInt(e.target.value) || 0)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Passed</label>
            <input
              type="number"
              value={passed}
              onChange={(e) => setProp((props: any) => props.passed = parseInt(e.target.value) || 0)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Failed</label>
            <input
              type="number"
              value={failed}
              onChange={(e) => setProp((props: any) => props.failed = parseInt(e.target.value) || 0)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Skipped</label>
            <input
              type="number"
              value={skipped}
              onChange={(e) => setProp((props: any) => props.skipped = parseInt(e.target.value) || 0)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
            />
          </div>
        </div>

        <div className="space-y-1 mt-2">
          <label className="text-xs text-gray-400">Overall Status</label>
          <select
            value={overallStatus}
            onChange={(e) => setProp((props: any) => props.overallStatus = e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
          >
            <option value="PASS">PASS</option>
            <option value="FAIL">FAIL</option>
            <option value="INCOMPLETE">INCOMPLETE</option>
          </select>
        </div>
      </div>

      {/* Display Options */}
      <div className="border-b border-gray-700 pb-3">
        <h4 className="text-xs font-semibold text-cyan-400 mb-2">Display Options</h4>
        
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Layout</label>
          <select
            value={layout}
            onChange={(e) => setProp((props: any) => props.layout = e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
          >
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
            <option value="grid">Grid</option>
          </select>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            checked={showTitle}
            onChange={(e) => setProp((props: any) => props.showTitle = e.target.checked)}
            className="rounded"
          />
          <label className="text-xs text-gray-400">Show Title</label>
        </div>

        {showTitle && (
          <div className="space-y-1 mt-2">
            <label className="text-xs text-gray-400">Title Text</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setProp((props: any) => props.title = e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
            />
          </div>
        )}

        <div className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            checked={showSkipped}
            onChange={(e) => setProp((props: any) => props.showSkipped = e.target.checked)}
            className="rounded"
          />
          <label className="text-xs text-gray-400">Show Skipped</label>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            checked={showPercentage}
            onChange={(e) => setProp((props: any) => props.showPercentage = e.target.checked)}
            className="rounded"
          />
          <label className="text-xs text-gray-400">Show Percentage</label>
        </div>
      </div>

      {/* Colors */}
      <div className="border-b border-gray-700 pb-3">
        <h4 className="text-xs font-semibold text-cyan-400 mb-2">Colors</h4>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Pass Color</label>
            <input
              type="color"
              value={passColor}
              onChange={(e) => setProp((props: any) => props.passColor = e.target.value)}
              className="w-full h-8 rounded cursor-pointer"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Fail Color</label>
            <input
              type="color"
              value={failColor}
              onChange={(e) => setProp((props: any) => props.failColor = e.target.value)}
              className="w-full h-8 rounded cursor-pointer"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Skip Color</label>
            <input
              type="color"
              value={skipColor}
              onChange={(e) => setProp((props: any) => props.skipColor = e.target.value)}
              className="w-full h-8 rounded cursor-pointer"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Border Color</label>
            <input
              type="color"
              value={borderColor}
              onChange={(e) => setProp((props: any) => props.borderColor = e.target.value)}
              className="w-full h-8 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="space-y-1 mt-2">
          <label className="text-xs text-gray-400">Background Color</label>
          <input
            type="color"
            value={backgroundColor}
            onChange={(e) => setProp((props: any) => props.backgroundColor = e.target.value)}
            className="w-full h-8 rounded cursor-pointer"
          />
        </div>
      </div>

      <PositionSettings />
    </div>
  )
}
