# New Validation Report Components Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 6 new components for enhanced validation and measurement data reports.

**Architecture:** Each component follows the existing pattern: React component with Craft.js integration, settings panel, and export renderer. Components use ResizableBox for drag/resize, useNode/useBuilderStore hooks, and data binding via {{data.path}} syntax.

**Tech Stack:** React 19, Craft.js, Zustand, Tailwind CSS, Chart.js (for ControlChart)

---

## Implementation Priority

| Task | Component | Complexity | Files |
|------|-----------|------------|-------|
| 1 | EquipmentInfo | Low | 3 files |
| 2 | ComparisonTable | Medium | 3 files |
| 3 | ApprovalBlock | Low | 3 files |
| 4 | HeaderFooter | Medium | 3 files |
| 5 | CapabilityIndex | Medium | 3 files |
| 6 | ControlChart | High | 3 files |

---

## Task 1: EquipmentInfo Component

**Files:**
- Create: `components/builder/components/EquipmentInfo.tsx`
- Create: `components/builder/settings/EquipmentInfoSettings.tsx`
- Create: `lib/export/component-renderers/render-equipmentinfo.ts`
- Modify: `lib/export/component-renderers/index.ts`
- Modify: `components/builder/toolbox/Toolbox.tsx`

**Step 1: Create the EquipmentInfo React component**

```typescript
// components/builder/components/EquipmentInfo.tsx
'use client'

import { useNode } from '@craftjs/core'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { hasBindings, resolveBindingOrValue } from '@/lib/utils/binding'
import { ResizableBox } from '../layout/ResizableBox'

interface EquipmentItem {
  name: string
  model: string
  serial: string
  calDate?: string
  calDue?: string
  status?: 'valid' | 'expired' | 'warning'
}

interface EquipmentInfoProps {
  title?: string
  dataBinding?: string
  columns?: ('name' | 'model' | 'serial' | 'calDate' | 'calDue' | 'status')[]
  showCalStatus?: boolean
  showCalDue?: boolean
  warnIfExpired?: boolean
  compactMode?: boolean
  validColor?: string
  expiredColor?: string
  warningColor?: string
  headerColor?: string
  backgroundColor?: string
  borderColor?: string
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
  visible?: boolean
}

export const EquipmentInfo = ({
  title = 'Test Equipment Used',
  dataBinding = '',
  columns = ['name', 'model', 'serial', 'calDate', 'status'],
  showCalStatus = true,
  showCalDue = false,
  warnIfExpired = true,
  compactMode = false,
  validColor = '#22c55e',
  expiredColor = '#ef4444',
  warningColor = '#f59e0b',
  headerColor = '#0a0f14',
  backgroundColor = '#ffffff',
  borderColor = '#00ffc8',
  x = 0,
  y = 0,
  width = 500,
  height = 150,
  zIndex = 1,
  visible = true,
}: EquipmentInfoProps) => {
  const {
    id,
    connectors: { connect },
    selected,
    actions: { setProp },
  } = useNode((node) => ({
    id: node.id,
    selected: node.events.selected,
  }))

  const { sampleData } = useBuilderStore()

  // Default sample equipment
  const defaultEquipment: EquipmentItem[] = [
    { name: 'Multimeter', model: 'Fluke 87V', serial: 'SN12345678', calDate: '2026-01-15', calDue: '2027-01-15', status: 'valid' },
    { name: 'Oscilloscope', model: 'Keysight DSOX', serial: 'SN87654321', calDate: '2025-12-20', calDue: '2026-12-20', status: 'valid' },
  ]

  // Resolve equipment data from binding or use default
  const getEquipmentData = (): EquipmentItem[] => {
    if (dataBinding && hasBindings(dataBinding) && sampleData) {
      const resolved = resolveBindingOrValue(dataBinding, sampleData as Record<string, unknown>)
      if (Array.isArray(resolved)) {
        return resolved as EquipmentItem[]
      }
    }
    return defaultEquipment
  }

  const equipment = getEquipmentData()

  // Check if any equipment is expired
  const hasExpired = equipment.some(e => e.status === 'expired')
  const hasWarning = equipment.some(e => e.status === 'warning')
  const allValid = !hasExpired && !hasWarning

  if (!visible) return null

  const handlePositionChange = (newPos: { x?: number; y?: number; width?: number; height?: number }) => {
    setProp((props: EquipmentInfoProps) => {
      if (newPos.x !== undefined) props.x = newPos.x
      if (newPos.y !== undefined) props.y = newPos.y
      if (newPos.width !== undefined) props.width = newPos.width
      if (newPos.height !== undefined) props.height = newPos.height
    })
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'valid': return validColor
      case 'expired': return expiredColor
      case 'warning': return warningColor
      default: return validColor
    }
  }

  const columnLabels: Record<string, string> = {
    name: 'Instrument',
    model: 'Model',
    serial: 'Serial No',
    calDate: 'Cal Date',
    calDue: 'Cal Due',
    status: 'Status',
  }

  return (
    <ResizableBox
      x={x}
      y={y}
      width={width}
      height={height}
      minWidth={300}
      minHeight={80}
      selected={selected}
      nodeId={id}
      onPositionChange={handlePositionChange}
      connectRef={(ref) => { if (ref) connect(ref) }}
      zIndex={zIndex}
    >
      <div
        className="w-full h-full flex flex-col overflow-hidden"
        style={{ backgroundColor, border: `1px solid ${borderColor}`, borderRadius: '4px' }}
      >
        {/* Header */}
        <div
          className="px-3 py-2 font-semibold text-sm text-white"
          style={{ backgroundColor: headerColor, borderBottom: `1px solid ${borderColor}` }}
        >
          {title}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-100">
                {columns.map((col) => (
                  <th key={col} className="px-2 py-1 text-left font-medium text-gray-600">
                    {columnLabels[col]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {equipment.map((item, idx) => (
                <tr
                  key={idx}
                  className={compactMode ? '' : 'border-b border-gray-200'}
                  style={{
                    backgroundColor: warnIfExpired && item.status === 'expired'
                      ? `${expiredColor}15`
                      : undefined
                  }}
                >
                  {columns.includes('name') && (
                    <td className="px-2 py-1 font-medium">{item.name}</td>
                  )}
                  {columns.includes('model') && (
                    <td className="px-2 py-1 text-gray-600">{item.model}</td>
                  )}
                  {columns.includes('serial') && (
                    <td className="px-2 py-1 text-gray-500 font-mono text-[10px]">{item.serial}</td>
                  )}
                  {columns.includes('calDate') && (
                    <td className="px-2 py-1">{item.calDate || '-'}</td>
                  )}
                  {columns.includes('calDue') && (
                    <td className="px-2 py-1">{item.calDue || '-'}</td>
                  )}
                  {columns.includes('status') && (
                    <td className="px-2 py-1">
                      <span
                        className="px-1.5 py-0.5 rounded text-white text-[10px] font-medium"
                        style={{ backgroundColor: getStatusColor(item.status) }}
                      >
                        {item.status || 'valid'}
                      </span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calibration Status Banner */}
        {showCalStatus && (
          <div
            className="px-3 py-1.5 text-xs text-center font-medium"
            style={{
              backgroundColor: allValid ? `${validColor}20` : hasExpired ? `${expiredColor}20` : `${warningColor}20`,
              color: allValid ? validColor : hasExpired ? expiredColor : warningColor,
            }}
          >
            {allValid
              ? 'All instruments within calibration period'
              : hasExpired
              ? 'Some instruments have expired calibration'
              : 'Some instruments approaching calibration due date'}
          </div>
        )}
      </div>
    </ResizableBox>
  )
}

import { EquipmentInfoSettings } from '../settings/EquipmentInfoSettings'

EquipmentInfo.craft = {
  displayName: 'Equipment Info',
  props: {
    title: 'Test Equipment Used',
    dataBinding: '',
    columns: ['name', 'model', 'serial', 'calDate', 'status'],
    showCalStatus: true,
    showCalDue: false,
    warnIfExpired: true,
    compactMode: false,
    validColor: '#22c55e',
    expiredColor: '#ef4444',
    warningColor: '#f59e0b',
    headerColor: '#0a0f14',
    backgroundColor: '#ffffff',
    borderColor: '#00ffc8',
    x: 0,
    y: 0,
    width: 500,
    height: 150,
    zIndex: 1,
    visible: true,
  },
  related: {
    settings: EquipmentInfoSettings,
  },
  rules: {
    canDrag: () => true,
  },
}
```

**Step 2: Create the EquipmentInfoSettings component**

```typescript
// components/builder/settings/EquipmentInfoSettings.tsx
'use client'

import { useNode } from '@craftjs/core'
import { Input } from '@/components/ui/input'
import { ColorPicker } from '@/components/ui/color-picker'
import { DataBindingInput } from '@/components/builder/data-binding'
import { PositionSettings } from './PositionSettings'

export const EquipmentInfoSettings = () => {
  const {
    actions: { setProp },
    title,
    dataBinding,
    columns,
    showCalStatus,
    showCalDue,
    warnIfExpired,
    compactMode,
    validColor,
    expiredColor,
    warningColor,
    headerColor,
    backgroundColor,
    borderColor,
    visible,
  } = useNode((node) => ({
    title: node.data.props.title,
    dataBinding: node.data.props.dataBinding,
    columns: node.data.props.columns,
    showCalStatus: node.data.props.showCalStatus,
    showCalDue: node.data.props.showCalDue,
    warnIfExpired: node.data.props.warnIfExpired,
    compactMode: node.data.props.compactMode,
    validColor: node.data.props.validColor,
    expiredColor: node.data.props.expiredColor,
    warningColor: node.data.props.warningColor,
    headerColor: node.data.props.headerColor,
    backgroundColor: node.data.props.backgroundColor,
    borderColor: node.data.props.borderColor,
    visible: node.data.props.visible,
  }))

  const allColumns = ['name', 'model', 'serial', 'calDate', 'calDue', 'status']
  const columnLabels: Record<string, string> = {
    name: 'Instrument',
    model: 'Model',
    serial: 'Serial No',
    calDate: 'Cal Date',
    calDue: 'Cal Due',
    status: 'Status',
  }

  const toggleColumn = (col: string) => {
    const newColumns = columns.includes(col)
      ? columns.filter((c: string) => c !== col)
      : [...columns, col]
    setProp((props: any) => (props.columns = newColumns))
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
          placeholder="Test Equipment Used"
        />
      </div>

      {/* Data Binding */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Equipment Data Binding</label>
        <DataBindingInput
          value={dataBinding}
          onChange={(value) => setProp((props: any) => (props.dataBinding = value))}
          placeholder="{{equipment}}"
          expectedType="array"
        />
      </div>

      {/* Columns */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">Columns</label>
        <div className="grid grid-cols-2 gap-2">
          {allColumns.map((col) => (
            <label key={col} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={columns.includes(col)}
                onChange={() => toggleColumn(col)}
                className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#050810] text-[#00ffc8]"
              />
              <span className="text-xs text-gray-400">{columnLabels[col]}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showCalStatus}
            onChange={(e) => setProp((props: any) => (props.showCalStatus = e.target.checked))}
            className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#050810] text-[#00ffc8]"
          />
          <span className="text-sm text-gray-400">Show Cal Status Banner</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showCalDue}
            onChange={(e) => setProp((props: any) => (props.showCalDue = e.target.checked))}
            className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#050810] text-[#00ffc8]"
          />
          <span className="text-sm text-gray-400">Show Cal Due Date</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={warnIfExpired}
            onChange={(e) => setProp((props: any) => (props.warnIfExpired = e.target.checked))}
            className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#050810] text-[#00ffc8]"
          />
          <span className="text-sm text-gray-400">Highlight Expired</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={compactMode}
            onChange={(e) => setProp((props: any) => (props.compactMode = e.target.checked))}
            className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#050810] text-[#00ffc8]"
          />
          <span className="text-sm text-gray-400">Compact Mode</span>
        </label>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Valid Color</label>
          <ColorPicker
            value={validColor}
            onChange={(value) => setProp((props: any) => (props.validColor = value))}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Expired Color</label>
          <ColorPicker
            value={expiredColor}
            onChange={(value) => setProp((props: any) => (props.expiredColor = value))}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Warning Color</label>
          <ColorPicker
            value={warningColor}
            onChange={(value) => setProp((props: any) => (props.warningColor = value))}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Border Color</label>
          <ColorPicker
            value={borderColor}
            onChange={(value) => setProp((props: any) => (props.borderColor = value))}
          />
        </div>
      </div>

      {/* Visibility */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={visible}
          onChange={(e) => setProp((props: any) => (props.visible = e.target.checked))}
          className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#050810] text-[#00ffc8]"
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
```

**Step 3: Create the export renderer**

```typescript
// lib/export/component-renderers/render-equipmentinfo.ts
/**
 * EquipmentInfo Export Renderer
 */

import { RendererResult, ComponentRenderer } from './types'
import { generatePositionStyles } from '../utils/style-helpers'

interface EquipmentItem {
  name: string
  model: string
  serial: string
  calDate?: string
  calDue?: string
  status?: 'valid' | 'expired' | 'warning'
}

interface EquipmentInfoProps {
  title?: string
  dataBinding?: string
  columns?: string[]
  showCalStatus?: boolean
  showCalDue?: boolean
  warnIfExpired?: boolean
  compactMode?: boolean
  validColor?: string
  expiredColor?: string
  warningColor?: string
  headerColor?: string
  backgroundColor?: string
  borderColor?: string
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
  visible?: boolean
}

function escapeHtml(str: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  return str.replace(/[&<>"']/g, (char) => htmlEntities[char] || char)
}

export const renderEquipmentInfo: ComponentRenderer = (
  id: string,
  props: Record<string, unknown>
): RendererResult => {
  const {
    title = 'Test Equipment Used',
    dataBinding,
    columns = ['name', 'model', 'serial', 'calDate', 'status'],
    showCalStatus = true,
    showCalDue = false,
    warnIfExpired = true,
    compactMode = false,
    validColor = '#22c55e',
    expiredColor = '#ef4444',
    warningColor = '#f59e0b',
    headerColor = '#0a0f14',
    backgroundColor = '#ffffff',
    borderColor = '#00ffc8',
    x = 0,
    y = 0,
    width = 500,
    height = 150,
    zIndex = 1,
    visible = true,
  } = props as EquipmentInfoProps

  if (!visible) {
    return { html: '', componentConfig: null }
  }

  // Get equipment data from props or use default
  const defaultEquipment: EquipmentItem[] = [
    { name: 'Multimeter', model: 'Fluke 87V', serial: 'SN12345678', calDate: '2026-01-15', calDue: '2027-01-15', status: 'valid' },
    { name: 'Oscilloscope', model: 'Keysight DSOX', serial: 'SN87654321', calDate: '2025-12-20', calDue: '2026-12-20', status: 'valid' },
  ]

  const equipment = dataBinding && props[dataBinding]
    ? (props[dataBinding] as EquipmentItem[])
    : defaultEquipment

  const hasExpired = equipment.some(e => e.status === 'expired')
  const hasWarning = equipment.some(e => e.status === 'warning')
  const allValid = !hasExpired && !hasWarning

  const positionStyles = generatePositionStyles({ x, y, width, height, zIndex })

  const columnLabels: Record<string, string> = {
    name: 'Instrument',
    model: 'Model',
    serial: 'Serial No',
    calDate: 'Cal Date',
    calDue: 'Cal Due',
    status: 'Status',
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'valid': return validColor
      case 'expired': return expiredColor
      case 'warning': return warningColor
      default: return validColor
    }
  }

  const tableHeader = columns.map((col: string) =>
    `<th style="padding: 4px 8px; text-align: left; font-weight: 500; color: #4b5563; background: #f3f4f6;">${columnLabels[col]}</th>`
  ).join('')

  const tableRows = equipment.map((item) => {
    const cells = columns.map((col: string) => {
      let content = ''
      switch (col) {
        case 'name': content = `<span style="font-weight: 500;">${escapeHtml(item.name)}</span>`; break
        case 'model': content = `<span style="color: #4b5563;">${escapeHtml(item.model)}</span>`; break
        case 'serial': content = `<span style="color: #6b7280; font-family: monospace; font-size: 10px;">${escapeHtml(item.serial)}</span>`; break
        case 'calDate': content = item.calDate || '-'; break
        case 'calDue': content = item.calDue || '-'; break
        case 'status':
          content = `<span style="padding: 2px 6px; border-radius: 4px; color: white; font-size: 10px; font-weight: 500; background: ${getStatusColor(item.status)};">${item.status || 'valid'}</span>`
          break
        default: content = ''
      }
      const bgColor = warnIfExpired && item.status === 'expired' ? `${expiredColor}15` : 'transparent'
      return `<td style="padding: 4px 8px; background: ${bgColor};">${content}</td>`
    }).join('')
    return `<tr style="${compactMode ? '' : 'border-bottom: 1px solid #e5e7eb;'}">${cells}</tr>`
  }).join('')

  const statusBanner = showCalStatus ? `
    <div style="padding: 6px 12px; text-align: center; font-size: 12px; font-weight: 500; background: ${
      allValid ? `${validColor}20` : hasExpired ? `${expiredColor}20` : `${warningColor}20`
    }; color: ${
      allValid ? validColor : hasExpired ? expiredColor : warningColor
    };">
      ${allValid
        ? 'All instruments within calibration period'
        : hasExpired
        ? 'Some instruments have expired calibration'
        : 'Some instruments approaching calibration due date'}
    </div>
  ` : ''

  const html = `
    <div id="${id}" style="${positionStyles}">
      <div style="width: 100%; height: 100%; display: flex; flex-direction: column; overflow: hidden; background: ${backgroundColor}; border: 1px solid ${borderColor}; border-radius: 4px;">
        <div style="padding: 8px 12px; font-weight: 600; font-size: 14px; color: white; background: ${headerColor}; border-bottom: 1px solid ${borderColor};">
          ${escapeHtml(title)}
        </div>
        <div style="flex: 1; overflow: auto;">
          <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
            <thead><tr>${tableHeader}</tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
        ${statusBanner}
      </div>
    </div>
  `

  return { html: html.trim(), componentConfig: null }
}
```

**Step 4: Register the renderer in index.ts**

Add to `lib/export/component-renderers/index.ts`:
- Import: `import { renderEquipmentInfo } from './render-equipmentinfo'`
- Add to renderers object: `EquipmentInfo: renderEquipmentInfo,`
- Add to exports: `export { renderEquipmentInfo } from './render-equipmentinfo'`

**Step 5: Add to Toolbox**

Add to `components/builder/toolbox/Toolbox.tsx`:
- Import: `import { EquipmentInfo } from '../components/EquipmentInfo'`
- Import icon: `Cpu` from lucide-react
- Add to 'Test Reports' category:
```typescript
{
  name: 'Equipment Info',
  icon: Cpu,
  component: <EquipmentInfo />,
  description: 'Test equipment traceability',
},
```

**Step 6: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 7: Commit**

```bash
git add components/builder/components/EquipmentInfo.tsx \
        components/builder/settings/EquipmentInfoSettings.tsx \
        lib/export/component-renderers/render-equipmentinfo.ts \
        lib/export/component-renderers/index.ts \
        components/builder/toolbox/Toolbox.tsx
git commit -m "feat: add EquipmentInfo component for test equipment traceability"
```

---

## Task 2: ComparisonTable Component

**Files:**
- Create: `components/builder/components/ComparisonTable.tsx`
- Create: `components/builder/settings/ComparisonTableSettings.tsx`
- Create: `lib/export/component-renderers/render-comparisontable.ts`
- Modify: `lib/export/component-renderers/index.ts`
- Modify: `components/builder/toolbox/Toolbox.tsx`

**Step 1: Create the ComparisonTable React component**

```typescript
// components/builder/components/ComparisonTable.tsx
'use client'

import { useNode } from '@craftjs/core'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { hasBindings, resolveBindingOrValue } from '@/lib/utils/binding'
import { ResizableBox } from '../layout/ResizableBox'

interface ComparisonItem {
  parameter: string
  expected: number
  tolerance: number
  toleranceType?: 'absolute' | 'percentage'
  actual: number
  unit?: string
}

interface ComparisonTableProps {
  title?: string
  dataBinding?: string
  columns?: ('parameter' | 'expected' | 'tolerance' | 'actual' | 'status' | 'deviation')[]
  showTolerance?: boolean
  showDeviation?: boolean
  showPercentage?: boolean
  unitInHeader?: boolean
  passColor?: string
  failColor?: string
  headerColor?: string
  backgroundColor?: string
  borderColor?: string
  zebraStriping?: boolean
  compactMode?: boolean
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
  visible?: boolean
}

export const ComparisonTable = ({
  title = 'Measurement Comparison',
  dataBinding = '',
  columns = ['parameter', 'expected', 'tolerance', 'actual', 'status'],
  showTolerance = true,
  showDeviation = false,
  showPercentage = false,
  unitInHeader = false,
  passColor = '#22c55e',
  failColor = '#ef4444',
  headerColor = '#0a0f14',
  backgroundColor = '#ffffff',
  borderColor = '#00ffc8',
  zebraStriping = true,
  compactMode = false,
  x = 0,
  y = 0,
  width = 500,
  height = 200,
  zIndex = 1,
  visible = true,
}: ComparisonTableProps) => {
  const {
    id,
    connectors: { connect },
    selected,
    actions: { setProp },
  } = useNode((node) => ({
    id: node.id,
    selected: node.events.selected,
  }))

  const { sampleData } = useBuilderStore()

  // Default sample data
  const defaultComparisons: ComparisonItem[] = [
    { parameter: 'Voltage', expected: 5.0, tolerance: 0.1, actual: 5.02, unit: 'V' },
    { parameter: 'Current', expected: 100, tolerance: 5, actual: 103, unit: 'mA' },
    { parameter: 'Frequency', expected: 60, tolerance: 1, actual: 62, unit: 'Hz' },
  ]

  // Resolve data from binding
  const getComparisonData = (): ComparisonItem[] => {
    if (dataBinding && hasBindings(dataBinding) && sampleData) {
      const resolved = resolveBindingOrValue(dataBinding, sampleData as Record<string, unknown>)
      if (Array.isArray(resolved)) {
        return resolved as ComparisonItem[]
      }
    }
    return defaultComparisons
  }

  const comparisons = getComparisonData()

  // Calculate if value is within tolerance
  const isWithinTolerance = (item: ComparisonItem): boolean => {
    const deviation = Math.abs(item.actual - item.expected)
    if (item.toleranceType === 'percentage') {
      const percentTolerance = (item.tolerance / 100) * item.expected
      return deviation <= percentTolerance
    }
    return deviation <= item.tolerance
  }

  // Calculate deviation
  const getDeviation = (item: ComparisonItem): { value: number; percent: number } => {
    const value = item.actual - item.expected
    const percent = item.expected !== 0 ? (value / item.expected) * 100 : 0
    return { value, percent }
  }

  // Count pass/fail
  const passCount = comparisons.filter(isWithinTolerance).length
  const failCount = comparisons.length - passCount

  if (!visible) return null

  const handlePositionChange = (newPos: { x?: number; y?: number; width?: number; height?: number }) => {
    setProp((props: ComparisonTableProps) => {
      if (newPos.x !== undefined) props.x = newPos.x
      if (newPos.y !== undefined) props.y = newPos.y
      if (newPos.width !== undefined) props.width = newPos.width
      if (newPos.height !== undefined) props.height = newPos.height
    })
  }

  const columnLabels: Record<string, string> = {
    parameter: 'Parameter',
    expected: 'Expected',
    tolerance: 'Tolerance',
    actual: 'Actual',
    status: 'Status',
    deviation: 'Deviation',
  }

  const formatValue = (value: number, unit?: string) => {
    return unit && !unitInHeader ? `${value.toFixed(2)} ${unit}` : value.toFixed(2)
  }

  const formatTolerance = (item: ComparisonItem) => {
    if (item.toleranceType === 'percentage') {
      return `±${item.tolerance}%`
    }
    return unitInHeader ? `±${item.tolerance}` : `±${item.tolerance} ${item.unit || ''}`
  }

  return (
    <ResizableBox
      x={x}
      y={y}
      width={width}
      height={height}
      minWidth={300}
      minHeight={100}
      selected={selected}
      nodeId={id}
      onPositionChange={handlePositionChange}
      connectRef={(ref) => { if (ref) connect(ref) }}
      zIndex={zIndex}
    >
      <div
        className="w-full h-full flex flex-col overflow-hidden"
        style={{ backgroundColor, border: `1px solid ${borderColor}`, borderRadius: '4px' }}
      >
        {/* Header */}
        <div
          className="px-3 py-2 flex items-center justify-between"
          style={{ backgroundColor: headerColor, borderBottom: `1px solid ${borderColor}` }}
        >
          <span className="font-semibold text-sm text-white">{title}</span>
          <div className="flex gap-3 text-xs">
            <span style={{ color: passColor }}>Pass: {passCount}</span>
            <span style={{ color: failCount > 0 ? failColor : passColor }}>Fail: {failCount}</span>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-100">
                {columns.map((col) => (
                  <th key={col} className="px-2 py-1.5 text-left font-medium text-gray-600">
                    {columnLabels[col]}
                    {unitInHeader && col === 'expected' && ' (units)'}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisons.map((item, idx) => {
                const isPass = isWithinTolerance(item)
                const deviation = getDeviation(item)
                return (
                  <tr
                    key={idx}
                    className={compactMode ? '' : 'border-b border-gray-200'}
                    style={{
                      backgroundColor: zebraStriping && idx % 2 === 1 ? '#f9fafb' : 'white'
                    }}
                  >
                    {columns.includes('parameter') && (
                      <td className="px-2 py-1.5 font-medium">{item.parameter}</td>
                    )}
                    {columns.includes('expected') && (
                      <td className="px-2 py-1.5">{formatValue(item.expected, unitInHeader ? item.unit : undefined)}</td>
                    )}
                    {columns.includes('tolerance') && (
                      <td className="px-2 py-1.5 text-gray-500">{formatTolerance(item)}</td>
                    )}
                    {columns.includes('actual') && (
                      <td
                        className="px-2 py-1.5 font-medium"
                        style={{ color: isPass ? 'inherit' : failColor }}
                      >
                        {formatValue(item.actual, unitInHeader ? item.unit : undefined)}
                      </td>
                    )}
                    {columns.includes('status') && (
                      <td className="px-2 py-1.5">
                        <span
                          className="inline-block w-5 h-5 leading-5 text-center rounded text-white"
                          style={{ backgroundColor: isPass ? passColor : failColor }}
                        >
                          {isPass ? '✓' : '✗'}
                        </span>
                      </td>
                    )}
                    {columns.includes('deviation') && (
                      <td className="px-2 py-1.5">
                        <span style={{ color: isPass ? passColor : failColor }}>
                          {deviation.value >= 0 ? '+' : ''}{deviation.value.toFixed(3)}
                          {showPercentage && ` (${deviation.percent >= 0 ? '+' : ''}${deviation.percent.toFixed(1)}%)`}
                        </span>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </ResizableBox>
  )
}

import { ComparisonTableSettings } from '../settings/ComparisonTableSettings'

ComparisonTable.craft = {
  displayName: 'Comparison Table',
  props: {
    title: 'Measurement Comparison',
    dataBinding: '',
    columns: ['parameter', 'expected', 'tolerance', 'actual', 'status'],
    showTolerance: true,
    showDeviation: false,
    showPercentage: false,
    unitInHeader: false,
    passColor: '#22c55e',
    failColor: '#ef4444',
    headerColor: '#0a0f14',
    backgroundColor: '#ffffff',
    borderColor: '#00ffc8',
    zebraStriping: true,
    compactMode: false,
    x: 0,
    y: 0,
    width: 500,
    height: 200,
    zIndex: 1,
    visible: true,
  },
  related: {
    settings: ComparisonTableSettings,
  },
  rules: {
    canDrag: () => true,
  },
}
```

**Step 2: Create the ComparisonTableSettings component**

```typescript
// components/builder/settings/ComparisonTableSettings.tsx
'use client'

import { useNode } from '@craftjs/core'
import { Input } from '@/components/ui/input'
import { ColorPicker } from '@/components/ui/color-picker'
import { DataBindingInput } from '@/components/builder/data-binding'
import { PositionSettings } from './PositionSettings'

export const ComparisonTableSettings = () => {
  const {
    actions: { setProp },
    title,
    dataBinding,
    columns,
    showTolerance,
    showDeviation,
    showPercentage,
    unitInHeader,
    passColor,
    failColor,
    zebraStriping,
    compactMode,
    borderColor,
    visible,
  } = useNode((node) => ({
    title: node.data.props.title,
    dataBinding: node.data.props.dataBinding,
    columns: node.data.props.columns,
    showTolerance: node.data.props.showTolerance,
    showDeviation: node.data.props.showDeviation,
    showPercentage: node.data.props.showPercentage,
    unitInHeader: node.data.props.unitInHeader,
    passColor: node.data.props.passColor,
    failColor: node.data.props.failColor,
    zebraStriping: node.data.props.zebraStriping,
    compactMode: node.data.props.compactMode,
    borderColor: node.data.props.borderColor,
    visible: node.data.props.visible,
  }))

  const allColumns = ['parameter', 'expected', 'tolerance', 'actual', 'status', 'deviation']
  const columnLabels: Record<string, string> = {
    parameter: 'Parameter',
    expected: 'Expected',
    tolerance: 'Tolerance',
    actual: 'Actual',
    status: 'Status',
    deviation: 'Deviation',
  }

  const toggleColumn = (col: string) => {
    const newColumns = columns.includes(col)
      ? columns.filter((c: string) => c !== col)
      : [...columns, col]
    setProp((props: any) => (props.columns = newColumns))
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
          placeholder="Measurement Comparison"
        />
      </div>

      {/* Data Binding */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Comparison Data Binding</label>
        <DataBindingInput
          value={dataBinding}
          onChange={(value) => setProp((props: any) => (props.dataBinding = value))}
          placeholder="{{comparisons}}"
          expectedType="array"
        />
      </div>

      {/* Columns */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">Columns</label>
        <div className="grid grid-cols-2 gap-2">
          {allColumns.map((col) => (
            <label key={col} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={columns.includes(col)}
                onChange={() => toggleColumn(col)}
                className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#050810] text-[#00ffc8]"
              />
              <span className="text-xs text-gray-400">{columnLabels[col]}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showTolerance}
            onChange={(e) => setProp((props: any) => (props.showTolerance = e.target.checked))}
            className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#050810] text-[#00ffc8]"
          />
          <span className="text-sm text-gray-400">Show Tolerance Column</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showDeviation}
            onChange={(e) => setProp((props: any) => (props.showDeviation = e.target.checked))}
            className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#050810] text-[#00ffc8]"
          />
          <span className="text-sm text-gray-400">Show Deviation Column</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showPercentage}
            onChange={(e) => setProp((props: any) => (props.showPercentage = e.target.checked))}
            className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#050810] text-[#00ffc8]"
          />
          <span className="text-sm text-gray-400">Show Percentage</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={unitInHeader}
            onChange={(e) => setProp((props: any) => (props.unitInHeader = e.target.checked))}
            className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#050810] text-[#00ffc8]"
          />
          <span className="text-sm text-gray-400">Units in Header</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={zebraStriping}
            onChange={(e) => setProp((props: any) => (props.zebraStriping = e.target.checked))}
            className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#050810] text-[#00ffc8]"
          />
          <span className="text-sm text-gray-400">Zebra Striping</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={compactMode}
            onChange={(e) => setProp((props: any) => (props.compactMode = e.target.checked))}
            className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#050810] text-[#00ffc8]"
          />
          <span className="text-sm text-gray-400">Compact Mode</span>
        </label>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Pass Color</label>
          <ColorPicker
            value={passColor}
            onChange={(value) => setProp((props: any) => (props.passColor = value))}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Fail Color</label>
          <ColorPicker
            value={failColor}
            onChange={(value) => setProp((props: any) => (props.failColor = value))}
          />
        </div>
      </div>

      {/* Visibility */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={visible}
          onChange={(e) => setProp((props: any) => (props.visible = e.target.checked))}
          className="w-4 h-4 rounded border-[rgba(0,255,200,0.3)] bg-[#050810] text-[#00ffc8]"
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
```

**Step 3: Create the export renderer**

```typescript
// lib/export/component-renderers/render-comparisontable.ts
/**
 * ComparisonTable Export Renderer
 */

import { RendererResult, ComponentRenderer } from './types'
import { generatePositionStyles } from '../utils/style-helpers'

interface ComparisonItem {
  parameter: string
  expected: number
  tolerance: number
  toleranceType?: 'absolute' | 'percentage'
  actual: number
  unit?: string
}

interface ComparisonTableProps {
  title?: string
  dataBinding?: string
  columns?: string[]
  showTolerance?: boolean
  showDeviation?: boolean
  showPercentage?: boolean
  unitInHeader?: boolean
  passColor?: string
  failColor?: string
  headerColor?: string
  backgroundColor?: string
  borderColor?: string
  zebraStriping?: boolean
  compactMode?: boolean
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
  visible?: boolean
}

function escapeHtml(str: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  return str.replace(/[&<>"']/g, (char) => htmlEntities[char] || char)
}

export const renderComparisonTable: ComponentRenderer = (
  id: string,
  props: Record<string, unknown>
): RendererResult => {
  const {
    title = 'Measurement Comparison',
    dataBinding,
    columns = ['parameter', 'expected', 'tolerance', 'actual', 'status'],
    showTolerance = true,
    showDeviation = false,
    showPercentage = false,
    unitInHeader = false,
    passColor = '#22c55e',
    failColor = '#ef4444',
    headerColor = '#0a0f14',
    backgroundColor = '#ffffff',
    borderColor = '#00ffc8',
    zebraStriping = true,
    compactMode = false,
    x = 0,
    y = 0,
    width = 500,
    height = 200,
    zIndex = 1,
    visible = true,
  } = props as ComparisonTableProps

  if (!visible) {
    return { html: '', componentConfig: null }
  }

  // Default data
  const defaultComparisons: ComparisonItem[] = [
    { parameter: 'Voltage', expected: 5.0, tolerance: 0.1, actual: 5.02, unit: 'V' },
    { parameter: 'Current', expected: 100, tolerance: 5, actual: 103, unit: 'mA' },
    { parameter: 'Frequency', expected: 60, tolerance: 1, actual: 62, unit: 'Hz' },
  ]

  const comparisons = dataBinding && props[dataBinding]
    ? (props[dataBinding] as ComparisonItem[])
    : defaultComparisons

  const isWithinTolerance = (item: ComparisonItem): boolean => {
    const deviation = Math.abs(item.actual - item.expected)
    if (item.toleranceType === 'percentage') {
      const percentTolerance = (item.tolerance / 100) * item.expected
      return deviation <= percentTolerance
    }
    return deviation <= item.tolerance
  }

  const getDeviation = (item: ComparisonItem): { value: number; percent: number } => {
    const value = item.actual - item.expected
    const percent = item.expected !== 0 ? (value / item.expected) * 100 : 0
    return { value, percent }
  }

  const passCount = comparisons.filter(isWithinTolerance).length
  const failCount = comparisons.length - passCount

  const positionStyles = generatePositionStyles({ x, y, width, height, zIndex })

  const columnLabels: Record<string, string> = {
    parameter: 'Parameter',
    expected: 'Expected',
    tolerance: 'Tolerance',
    actual: 'Actual',
    status: 'Status',
    deviation: 'Deviation',
  }

  const formatValue = (value: number, unit?: string) => {
    return unit && !unitInHeader ? `${value.toFixed(2)} ${unit}` : value.toFixed(2)
  }

  const formatTolerance = (item: ComparisonItem) => {
    if (item.toleranceType === 'percentage') {
      return `±${item.tolerance}%`
    }
    return unitInHeader ? `±${item.tolerance}` : `±${item.tolerance} ${item.unit || ''}`
  }

  const tableHeader = columns.map((col: string) =>
    `<th style="padding: 6px 8px; text-align: left; font-weight: 500; color: #4b5563; background: #f3f4f6;">${columnLabels[col]}</th>`
  ).join('')

  const tableRows = comparisons.map((item, idx) => {
    const isPass = isWithinTolerance(item)
    const deviation = getDeviation(item)
    const bgColor = zebraStriping && idx % 2 === 1 ? '#f9fafb' : 'white'

    const cells = columns.map((col: string) => {
      let content = ''
      switch (col) {
        case 'parameter':
          content = `<span style="font-weight: 500;">${escapeHtml(item.parameter)}</span>`
          break
        case 'expected':
          content = formatValue(item.expected, unitInHeader ? item.unit : undefined)
          break
        case 'tolerance':
          content = `<span style="color: #6b7280;">${formatTolerance(item)}</span>`
          break
        case 'actual':
          content = `<span style="font-weight: 500; color: ${isPass ? 'inherit' : failColor};">${formatValue(item.actual, unitInHeader ? item.unit : undefined)}</span>`
          break
        case 'status':
          content = `<span style="display: inline-block; width: 20px; height: 20px; line-height: 20px; text-align: center; border-radius: 4px; color: white; background: ${isPass ? passColor : failColor};">${isPass ? '✓' : '✗'}</span>`
          break
        case 'deviation':
          const devStr = `${deviation.value >= 0 ? '+' : ''}${deviation.value.toFixed(3)}${showPercentage ? ` (${deviation.percent >= 0 ? '+' : ''}${deviation.percent.toFixed(1)}%)` : ''}`
          content = `<span style="color: ${isPass ? passColor : failColor};">${devStr}</span>`
          break
      }
      return `<td style="padding: 6px 8px; background: ${bgColor};">${content}</td>`
    }).join('')

    return `<tr style="${compactMode ? '' : 'border-bottom: 1px solid #e5e7eb;'}">${cells}</tr>`
  }).join('')

  const html = `
    <div id="${id}" style="${positionStyles}">
      <div style="width: 100%; height: 100%; display: flex; flex-direction: column; overflow: hidden; background: ${backgroundColor}; border: 1px solid ${borderColor}; border-radius: 4px;">
        <div style="padding: 8px 12px; display: flex; align-items: center; justify-content: space-between; background: ${headerColor}; border-bottom: 1px solid ${borderColor};">
          <span style="font-weight: 600; font-size: 14px; color: white;">${escapeHtml(title)}</span>
          <div style="display: flex; gap: 12px; font-size: 12px;">
            <span style="color: ${passColor};">Pass: ${passCount}</span>
            <span style="color: ${failCount > 0 ? failColor : passColor};">Fail: ${failCount}</span>
          </div>
        </div>
        <div style="flex: 1; overflow: auto;">
          <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
            <thead><tr>${tableHeader}</tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
      </div>
    </div>
  `

  return { html: html.trim(), componentConfig: null }
}
```

**Step 4: Register in index.ts**

Add imports and exports for `renderComparisonTable` and add `ComparisonTable: renderComparisonTable` to renderers.

**Step 5: Add to Toolbox**

Add `ComparisonTable` to the 'Test Reports' category with icon `GitCompare`.

**Step 6: Run type check**

Run: `npx tsc --noEmit`

**Step 7: Commit**

```bash
git add components/builder/components/ComparisonTable.tsx \
        components/builder/settings/ComparisonTableSettings.tsx \
        lib/export/component-renderers/render-comparisontable.ts \
        lib/export/component-renderers/index.ts \
        components/builder/toolbox/Toolbox.tsx
git commit -m "feat: add ComparisonTable component for expected vs actual measurements"
```

---

## Task 3: ApprovalBlock Component

**Files:**
- Create: `components/builder/components/ApprovalBlock.tsx`
- Create: `components/builder/settings/ApprovalBlockSettings.tsx`
- Create: `lib/export/component-renderers/render-approvalblock.ts`
- Modify: `lib/export/component-renderers/index.ts`
- Modify: `components/builder/toolbox/Toolbox.tsx`

**Step 1: Create the ApprovalBlock React component**

```typescript
// components/builder/components/ApprovalBlock.tsx
'use client'

import { useNode } from '@craftjs/core'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { hasBindings, resolveBindingOrValue } from '@/lib/utils/binding'
import { ResizableBox } from '../layout/ResizableBox'

interface Approver {
  role: string
  name?: string
  title?: string
  date?: string
  status?: 'pending' | 'approved' | 'rejected'
}

interface ApprovalBlockProps {
  title?: string
  dataBinding?: string
  layout?: 'horizontal' | 'vertical' | 'grid'
  showSignatureLine?: boolean
  showDate?: boolean
  showTitle?: boolean
  showStatus?: boolean
  emptyDatePlaceholder?: string
  approvedColor?: string
  pendingColor?: string
  rejectedColor?: string
  borderColor?: string
  backgroundColor?: string
  x?: number
  y?: number
  width?: number
  height?: number
  zIndex?: number
  visible?: boolean
}

export const ApprovalBlock = ({
  title = 'Report Approval',
  dataBinding = '',
  layout = 'horizontal',
  showSignatureLine = true,
  showDate = true,
  showTitle = true,
  showStatus = true,
  emptyDatePlaceholder = '___/___/___',
  approvedColor = '#22c55e',
  pendingColor = '#f59e0b',
  rejectedColor = '#ef4444',
  borderColor = '#00ffc8',
  backgroundColor = '#ffffff',
  x = 0,
  y = 0,
  width = 500,
  height = 150,
  zIndex = 1,
  visible = true,
}: ApprovalBlockProps) => {
  const {
    id,
    connectors: { connect },
    selected,
    actions: { setProp },
  } = useNode((node) => ({
    id: node.id,
    selected: node.events.selected,
  }))

  const { sampleData } = useBuilderStore()

  // Default approvers
  const defaultApprovers: Approver[] = [
    { role: 'Prepared By', name: 'John Smith', title: 'Test Engineer', date: '2026-03-11', status: 'approved' },
    { role: 'Reviewed By', name: 'Jane Doe', title: 'Quality Manager', date: '2026-03-12', status: 'approved' },
    { role: 'Approved By', name: '', title: 'Engineering Director', date: '', status: 'pending' },
  ]

  // Resolve approvers from binding
  const getApprovers = (): Approver[] => {
    if (dataBinding && hasBindings(dataBinding) && sampleData) {
      const resolved = resolveBindingOrValue(dataBinding, sampleData as Record<string, unknown>)
      if (Array.isArray(resolved)) {
        return resolved as Approver[]
      }
    }
    return defaultApprovers
  }

  const approvers = getApprovers()

  if (!visible) return null

  const handlePositionChange = (newPos: { x?: number; y?: number; width?: number; height?: number }) => {
    setProp((props: ApprovalBlockProps) => {
      if (newPos.x !== undefined) props.x = newPos.x
      if (newPos.y !== undefined) props.y = newPos.y
      if (newPos.width !== undefined) props.width = newPos.width
      if (newPos.height !== undefined) props.height = newPos.height
    })
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved': return approvedColor
      case 'rejected': return rejectedColor
      default: return pendingColor
    }
  }

  const renderApproverBox = (approver: Approver, index: number) => (
    <div
      key={index}
      className="flex flex-col items-center p-3 border rounded"
      style={{ borderColor: showStatus ? getStatusColor(approver.status) : '#e5e7eb', minWidth: '120px' }}
    >
      {/* Role */}
      <div className="text-xs font-medium text-gray-600 mb-2">{approver.role}</div>

      {/* Signature Line */}
      {showSignatureLine && (
        <div className="w-full border-t border-gray-400 mb-1" style={{ marginTop: '24px' }} />
      )}

      {/* Name */}
      <div className="text-sm font-medium">
        {approver.name || <span className="text-gray-300">________________</span>}
      </div>

      {/* Title */}
      {showTitle && approver.title && (
        <div className="text-xs text-gray-500">{approver.title}</div>
      )}

      {/* Date */}
      {showDate && (
        <div className="text-xs text-gray-500 mt-1">
          Date: {approver.date || emptyDatePlaceholder}
        </div>
      )}

      {/* Status Badge */}
      {showStatus && (
        <div
          className="mt-2 px-2 py-0.5 rounded text-white text-xs font-medium"
          style={{ backgroundColor: getStatusColor(approver.status) }}
        >
          {approver.status || 'pending'}
        </div>
      )}
    </div>
  )

  return (
    <ResizableBox
      x={x}
      y={y}
      width={width}
      height={height}
      minWidth={300}
      minHeight={100}
      selected={selected}
      nodeId={id}
      onPositionChange={handlePositionChange}
      connectRef={(ref) => { if (ref) connect(ref) }}
      zIndex={zIndex}
    >
      <div
        className="w-full h-full flex flex-col overflow-hidden"
        style={{ backgroundColor, border: `1px solid ${borderColor}`, borderRadius: '4px' }}
      >
        {/* Header */}
        <div
          className="px-3 py-2 font-semibold text-sm text-white"
          style={{ backgroundColor: '#0a0f14', borderBottom: `1px solid ${borderColor}` }}
        >
          {title}
        </div>

        {/* Approvers */}
        <div className="flex-1 p-4">
          {layout === 'horizontal' && (
            <div className="flex justify-around gap-4 h-full">
              {approvers.map(renderApproverBox)}
            </div>
          )}

          {layout === 'vertical' && (
            <div className="flex flex-col gap-3 h-full">
              {approvers.map(renderApproverBox)}
            </div>
          )}

          {layout === 'grid' && (
            <div className="grid grid-cols-3 gap-4 h-full">
              {approvers.map(renderApproverBox)}
            </div>
          )}
        </div>
      </div>
    </ResizableBox>
  )
}

import { ApprovalBlockSettings } from '../settings/ApprovalBlockSettings'

ApprovalBlock.craft = {
  displayName: 'Approval Block',
  props: {
    title: 'Report Approval',
    dataBinding: '',
    layout: 'horizontal',
    showSignatureLine: true,
    showDate: true,
    showTitle: true,
    showStatus: true,
    emptyDatePlaceholder: '___/___/___',
    approvedColor: '#22c55e',
    pendingColor: '#f59e0b',
    rejectedColor: '#ef4444',
    borderColor: '#00ffc8',
    backgroundColor: '#ffffff',
    x: 0,
    y: 0,
    width: 500,
    height: 150,
    zIndex: 1,
    visible: true,
  },
  related: {
    settings: ApprovalBlockSettings,
  },
  rules: {
    canDrag: () => true,
  },
}
```

**Step 2-7:** Follow same pattern as previous components for Settings, Renderer, Registration, Toolbox, Type check, and Commit.

---

## Task 4: HeaderFooter Component

**Files:**
- Create: `components/builder/components/HeaderFooter.tsx`
- Create: `components/builder/settings/HeaderFooterSettings.tsx`
- Create: `lib/export/component-renderers/render-headerfooter.ts`
- Modify: `lib/export/component-renderers/index.ts`
- Modify: `components/builder/toolbox/Toolbox.tsx`

**Note:** This component is special - it renders at fixed positions on every page. Follow the same pattern but add `position: 'header' | 'footer'` prop.

**Step 1-7:** Follow the same component pattern. Add to 'Document' category in Toolbox.

---

## Task 5: CapabilityIndex Component

**Files:**
- Create: `components/builder/components/CapabilityIndex.tsx`
- Create: `components/builder/settings/CapabilityIndexSettings.tsx`
- Create: `lib/export/component-renderers/render-capabilityindex.ts`
- Modify: `lib/export/component-renderers/index.ts`
- Modify: `components/builder/toolbox/Toolbox.tsx`

**Key Features:**
- Display Cp, Cpk, Pp, Ppk metrics with visual bars
- Color-coded rating (Excellent/Good/Marginal/Poor)
- Show specification limits (USL, LSL, Target)
- Interpretation text

**Step 1-7:** Follow the same component pattern. Add to 'Test Reports' category.

---

## Task 6: ControlChart Component

**Files:**
- Create: `components/builder/components/ControlChart.tsx`
- Create: `components/builder/settings/ControlChartSettings.tsx`
- Create: `lib/export/component-renderers/render-controlchart.ts`
- Modify: `lib/export/component-renderers/index.ts`
- Modify: `components/builder/toolbox/Toolbox.tsx`

**Key Features:**
- Use Chart.js for rendering (existing dependency)
- Display UCL, CL, LCL lines
- Connect data points
- Highlight out-of-control points
- Support data binding for measurements and SPC values

**Step 1-7:** Follow the same component pattern. Add to 'Charts & Data' category.

---

## Final Step: Verify All Components

**Run full test suite:**
```bash
npm run test:run
```

**Run type check:**
```bash
npx tsc --noEmit
```

**Start dev server and test in browser:**
```bash
npm run dev
```

**Final commit:**
```bash
git add -A
git commit -m "feat: add 6 new validation report components

- EquipmentInfo: Test equipment traceability
- ComparisonTable: Expected vs actual measurements
- ApprovalBlock: Multi-signature approval workflow
- HeaderFooter: Repeatable header/footer for multi-page reports
- CapabilityIndex: Process capability metrics display
- ControlChart: SPC control chart with limits

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```
