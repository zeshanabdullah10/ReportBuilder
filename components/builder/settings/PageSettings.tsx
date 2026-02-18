'use client'

import { useNode } from '@craftjs/core'
import { Input } from '@/components/ui/input'
import { PAGE_SIZE_PRESETS, PageSizePreset } from '@/lib/stores/builder-store'

export function PageSettings() {
  const {
    actions: { setProp },
    background,
    padding,
    pageSize,
    customWidth,
    customHeight,
  } = useNode((node) => ({
    background: node.data.props.background,
    padding: node.data.props.padding,
    pageSize: node.data.props.pageSize || 'A4',
    customWidth: node.data.props.customWidth || 794,
    customHeight: node.data.props.customHeight || 1123,
  }))

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = e.target.value as PageSizePreset
    setProp((props: any) => {
      props.pageSize = newSize
      // Also update background to white for print-friendly defaults
      if (!props.background || props.background === 'transparent') {
        props.background = 'white'
      }
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Page Size</label>
        <select
          value={pageSize}
          onChange={handlePageSizeChange}
          className="w-full bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00ffc8]"
        >
          {Object.entries(PAGE_SIZE_PRESETS).map(([key, value]) => (
            <option key={key} value={key}>
              {value.label}
            </option>
          ))}
        </select>
      </div>

      {pageSize === 'Custom' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Width (px)</label>
            <Input
              type="number"
              value={customWidth}
              onChange={(e) => setProp((props: any) => (props.customWidth = parseInt(e.target.value) || 794))}
              min={100}
              max={5000}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Height (px)</label>
            <Input
              type="number"
              value={customHeight}
              onChange={(e) => setProp((props: any) => (props.customHeight = parseInt(e.target.value) || 1123))}
              min={100}
              max={5000}
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm text-gray-400 mb-1">Background Color</label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={background}
            onChange={(e) => setProp((props: any) => (props.background = e.target.value))}
            className="w-12 h-10 p-1"
          />
          <Input
            type="text"
            value={background}
            onChange={(e) => setProp((props: any) => (props.background = e.target.value))}
            placeholder="#ffffff"
            className="flex-1"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Padding (px)</label>
        <Input
          type="number"
          value={padding}
          onChange={(e) => setProp((props: any) => (props.padding = parseInt(e.target.value) || 40))}
          min={0}
          max={200}
        />
      </div>

      {/* Print info */}
      <div className="mt-4 p-3 bg-[rgba(0,255,200,0.05)] border border-[rgba(0,255,200,0.1)] rounded text-xs text-gray-400">
        <p className="font-semibold text-[#00ffc8] mb-1">Print Tips</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>A4: 210 × 297mm (standard in Europe/Asia)</li>
          <li>Letter: 8.5 × 11in (standard in US/Canada)</li>
          <li>Use white background for clean PDF exports</li>
        </ul>
      </div>
    </div>
  )
}
