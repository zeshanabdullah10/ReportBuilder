'use client'

import { useNode } from '@craftjs/core'
import { Input } from '@/components/ui/input'
import type { IndicatorStatus } from '../components/Indicator'

export function IndicatorSettings() {
  const {
    actions: { setProp },
    status,
    label,
    passLabel,
    failLabel,
    warningLabel,
    binding,
  } = useNode((node) => ({
    status: node.data.props.status,
    label: node.data.props.label,
    passLabel: node.data.props.passLabel,
    failLabel: node.data.props.failLabel,
    warningLabel: node.data.props.warningLabel,
    binding: node.data.props.binding,
  }))

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Status</label>
        <select
          value={status}
          onChange={(e) => setProp((props: any) => (props.status = e.target.value as IndicatorStatus))}
          className="w-full bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg p-2 text-white text-sm"
        >
          <option value="pass">Pass (Green)</option>
          <option value="fail">Fail (Red)</option>
          <option value="warning">Warning (Amber)</option>
          <option value="neutral">Neutral (Gray)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Custom Label (optional)</label>
        <Input
          value={label}
          onChange={(e) => setProp((props: any) => (props.label = e.target.value))}
          placeholder="Override default label..."
        />
      </div>

      <div className="border-t border-[rgba(0,255,200,0.1)] pt-4">
        <label className="block text-xs text-gray-500 mb-3 uppercase tracking-wide">
          Default Labels
        </label>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Pass Label</label>
            <Input
              value={passLabel}
              onChange={(e) => setProp((props: any) => (props.passLabel = e.target.value))}
              placeholder="PASS"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Fail Label</label>
            <Input
              value={failLabel}
              onChange={(e) => setProp((props: any) => (props.failLabel = e.target.value))}
              placeholder="FAIL"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Warning Label</label>
            <Input
              value={warningLabel}
              onChange={(e) => setProp((props: any) => (props.warningLabel = e.target.value))}
              placeholder="WARNING"
            />
          </div>
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
            placeholder="{{data.testResult}}"
          />
          <p className="text-xs text-gray-500 mt-1">
            Bind to a boolean or string value. Use "pass", "fail", "warning", or true/false.
          </p>
        </div>
      </div>
    </div>
  )
}
