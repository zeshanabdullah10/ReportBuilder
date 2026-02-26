'use client'

import { useNode } from '@craftjs/core'
import { Input } from '@/components/ui/input'
import { ColorPicker } from '@/components/ui/color-picker'
import { DataBindingInput } from '@/components/builder/data-binding'
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
      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">
          Data Bindings
        </label>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Total Tests Binding</label>
            <DataBindingInput
              value={totalTestsBinding}
              onChange={(value) => setProp((props: any) => props.totalTestsBinding = value)}
              placeholder="{{data.summary.total}}"
              expectedType="number"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Passed Binding</label>
            <DataBindingInput
              value={passedBinding}
              onChange={(value) => setProp((props: any) => props.passedBinding = value)}
              placeholder="{{data.summary.passed}}"
              expectedType="number"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Failed Binding</label>
            <DataBindingInput
              value={failedBinding}
              onChange={(value) => setProp((props: any) => props.failedBinding = value)}
              placeholder="{{data.summary.failed}}"
              expectedType="number"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Skipped Binding</label>
            <DataBindingInput
              value={skippedBinding}
              onChange={(value) => setProp((props: any) => props.skippedBinding = value)}
              placeholder="{{data.summary.skipped}}"
              expectedType="number"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Status Binding</label>
            <DataBindingInput
              value={overallStatusBinding}
              onChange={(value) => setProp((props: any) => props.overallStatusBinding = value)}
              placeholder="{{data.summary.status}}"
              expectedType="string"
            />
          </div>
        </div>
      </div>

      {/* Static Values (Fallback) */}
      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">
          Static Values (Fallback)
        </label>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Total</label>
            <Input
              type="number"
              value={totalTests}
              onChange={(e) => setProp((props: any) => props.totalTests = parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Passed</label>
            <Input
              type="number"
              value={passed}
              onChange={(e) => setProp((props: any) => props.passed = parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Failed</label>
            <Input
              type="number"
              value={failed}
              onChange={(e) => setProp((props: any) => props.failed = parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Skipped</label>
            <Input
              type="number"
              value={skipped}
              onChange={(e) => setProp((props: any) => props.skipped = parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="block text-sm text-gray-400 mb-1">Overall Status</label>
          <select
            value={overallStatus}
            onChange={(e) => setProp((props: any) => props.overallStatus = e.target.value)}
            className="w-full bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg p-2 text-white text-sm"
          >
            <option value="PASS">PASS</option>
            <option value="FAIL">FAIL</option>
            <option value="INCOMPLETE">INCOMPLETE</option>
          </select>
        </div>
      </div>

      {/* Display Options */}
      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">
          Display Options
        </label>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Layout</label>
          <select
            value={layout}
            onChange={(e) => setProp((props: any) => props.layout = e.target.value)}
            className="w-full bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg p-2 text-white text-sm"
          >
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
            <option value="grid">Grid</option>
          </select>
        </div>

        <div className="space-y-2 mt-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showTitle}
              onChange={(e) => setProp((props: any) => props.showTitle = e.target.checked)}
              className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#050810] text-[#00ffc8] focus:ring-[#00ffc8]"
            />
            <span className="text-sm text-gray-400">Show Title</span>
          </label>

          {showTitle && (
            <div className="ml-6">
              <Input
                type="text"
                value={title}
                onChange={(e) => setProp((props: any) => props.title = e.target.value)}
                placeholder="Test Summary"
              />
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showSkipped}
              onChange={(e) => setProp((props: any) => props.showSkipped = e.target.checked)}
              className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#050810] text-[#00ffc8] focus:ring-[#00ffc8]"
            />
            <span className="text-sm text-gray-400">Show Skipped</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showPercentage}
              onChange={(e) => setProp((props: any) => props.showPercentage = e.target.checked)}
              className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#050810] text-[#00ffc8] focus:ring-[#00ffc8]"
            />
            <span className="text-sm text-gray-400">Show Percentage</span>
          </label>
        </div>
      </div>

      {/* Colors */}
      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">
          Colors
        </label>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Pass Color</label>
            <ColorPicker
              value={passColor}
              onChange={(value) => setProp((props: any) => props.passColor = value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Fail Color</label>
            <ColorPicker
              value={failColor}
              onChange={(value) => setProp((props: any) => props.failColor = value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Skip Color</label>
            <ColorPicker
              value={skipColor}
              onChange={(value) => setProp((props: any) => props.skipColor = value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Border Color</label>
            <ColorPicker
              value={borderColor}
              onChange={(value) => setProp((props: any) => props.borderColor = value)}
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="block text-xs text-gray-400 mb-1">Background Color</label>
          <ColorPicker
            value={backgroundColor}
            onChange={(value) => setProp((props: any) => props.backgroundColor = value)}
          />
        </div>
      </div>

      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <PositionSettings />
      </div>
    </div>
  )
}
