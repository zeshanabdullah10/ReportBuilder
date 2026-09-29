import type { Block, BlockType } from './types'

export type Category = 'Text' | 'Data' | 'Results' | 'Visuals' | 'Codes' | 'Layout'

export interface BlockInfo {
  type: BlockType
  label: string
  category: Category
  description: string
  keywords: string
  /** lucide icon name, resolved in components/Icon.tsx */
  icon: string
  /** Shown first in the add menu. */
  common?: boolean
  create: () => Omit<Block, 'id'>
}

export const CATALOG: BlockInfo[] = [
  {
    type: 'heading', common: true, label: 'Heading', category: 'Text', icon: 'Heading', keywords: 'title h1 h2',
    description: 'Section or page title',
    create: () => ({ type: 'heading', text: 'Heading', level: 2 }),
  },
  {
    type: 'text', common: true, label: 'Text', category: 'Text', icon: 'Pilcrow', keywords: 'paragraph body note',
    description: 'Paragraph with **bold**, *italic* and {{ fields }}',
    create: () => ({ type: 'text', text: 'Write something, insert fields with {{ }}', style: {} }),
  },
  {
    type: 'callout', label: 'Callout', category: 'Text', icon: 'MessageSquareWarning', keywords: 'note warning alert info',
    description: 'Highlighted note with a tone',
    create: () => ({ type: 'callout', title: 'Note', text: '', tone: 'info' }),
  },
  {
    type: 'keyValue', common: true, label: 'Info grid', category: 'Data', icon: 'LayoutList', keywords: 'key value spec dut station details',
    description: 'Label / value pairs: unit, station, spec',
    create: () => ({
      type: 'keyValue', title: 'Details', columns: 2, boxed: true,
      items: [{ label: 'Serial number', value: '{{ dut.serial }}' }, { label: 'Operator', value: '{{ station.operator }}' }],
    }),
  },
  {
    type: 'table', common: true, label: 'Table', category: 'Data', icon: 'Table', keywords: 'grid rows list data',
    description: 'Rows from a list in your data',
    create: () => ({ type: 'table', source: '', columns: [], zebra: true, repeatHeader: true, emptyText: 'No data' }),
  },
  {
    type: 'measurementTable', common: true, label: 'Measurements', category: 'Results', icon: 'Ruler', keywords: 'limits measurement pass fail results',
    description: 'Values vs limits with automatic PASS/FAIL',
    create: () => ({
      type: 'measurementTable', source: 'measurements',
      fields: { name: 'name', value: 'value', low: 'low', high: 'high', nominal: 'nominal', unit: 'unit', status: 'status' },
      decimals: 3, showIndex: true, showNominal: false, showLimits: true, showUnit: true, showStatus: true,
      highlightFailures: true, failuresOnly: false, repeatHeader: true, emptyText: 'No measurements',
    }),
  },
  {
    type: 'summary', common: true, label: 'Verdict', category: 'Results', icon: 'BadgeCheck', keywords: 'summary overall result pass fail rate',
    description: 'Overall PASS/FAIL with counts and pass rate',
    create: () => ({ type: 'summary', title: 'Overall result', source: 'measurements', statusField: 'status', showCounts: true, showRate: true }),
  },
  {
    type: 'status', label: 'Status', category: 'Results', icon: 'CircleCheck', keywords: 'indicator badge pass fail',
    description: 'A PASS/FAIL badge or banner',
    create: () => ({ type: 'status', label: 'Result', value: 'status', style: 'badge' }),
  },
  {
    type: 'chart', common: true, label: 'Chart', category: 'Visuals', icon: 'ChartLine', keywords: 'graph plot trend line bar scatter histogram pie',
    description: 'Line, bar, scatter, histogram or pie',
    create: () => ({
      type: 'chart', kind: 'line', title: '', series: [{ label: 'Series 1', source: '', x: '', y: '' }], xLabel: '', yLabel: '',
      heightMm: 60, limits: [], bins: 12, legend: true, grid: true,
    }),
  },
  {
    type: 'gauge', label: 'Gauge', category: 'Visuals', icon: 'Gauge', keywords: 'meter dial',
    description: 'Radial gauge with an in-spec band',
    create: () => ({ type: 'gauge', label: 'Value', value: '', min: '0', max: '100', low: '', high: '', unit: '', decimals: 1, sizeMm: 40 }),
  },
  {
    type: 'progress', label: 'Progress', category: 'Visuals', icon: 'ChartNoAxesGantt', keywords: 'bar percent coverage yield',
    description: 'Horizontal progress bar',
    create: () => ({ type: 'progress', label: 'Progress', value: '', max: '100', showValue: true }),
  },
  {
    type: 'image', common: true, label: 'Image', category: 'Visuals', icon: 'Image', keywords: 'picture photo diagram',
    description: 'Embedded image or photo',
    create: () => ({ type: 'image', src: '', width: 50, align: 'left', caption: '' }),
  },
  {
    type: 'logo', label: 'Logo', category: 'Visuals', icon: 'Hexagon', keywords: 'brand company',
    description: 'Your logo from the brand kit',
    create: () => ({ type: 'logo', heightMm: 12, align: 'left' }),
  },
  {
    type: 'qrCode', label: 'QR code', category: 'Codes', icon: 'QrCode', keywords: 'qr traceability link',
    description: 'Link to a record or serial number',
    create: () => ({ type: 'qrCode', value: '{{ dut.serial }}', sizeMm: 24, caption: '', align: 'left' }),
  },
  {
    type: 'barcode', label: 'Barcode', category: 'Codes', icon: 'Barcode', keywords: 'code128 code39 ean',
    description: 'Code 128, Code 39 or EAN-13',
    create: () => ({ type: 'barcode', value: '{{ dut.serial }}', format: 'code128', heightMm: 12, widthMm: 60, showText: true, align: 'left' }),
  },
  {
    type: 'signatures', label: 'Signatures', category: 'Layout', icon: 'Signature', keywords: 'sign approval tested by',
    description: 'Signature lines with names and dates',
    create: () => ({ type: 'signatures', showDate: true, entries: [{ role: 'Tested by', name: '' }, { role: 'Approved by', name: '' }] }),
  },
  {
    type: 'columns', label: 'Columns', category: 'Layout', icon: 'Columns2', keywords: 'side by side grid split',
    description: 'Side by side. Tip: drop a block on the edge of another instead',
    create: () => ({ type: 'columns', gapMm: 6, columns: [{ width: 1, blocks: [] }, { width: 1, blocks: [] }] }),
  },
  {
    type: 'section', label: 'Group / Repeat', category: 'Layout', icon: 'SquareStack', keywords: 'section group repeat loop box per channel',
    description: 'Group blocks, or repeat them for each item in a list',
    create: () => ({ type: 'section', title: '', blocks: [], as: 'item', keepTogether: false, pageBreakBefore: false, boxed: false }),
  },
  {
    type: 'divider', label: 'Divider', category: 'Layout', icon: 'Minus', keywords: 'line rule separator',
    description: 'Horizontal rule',
    create: () => ({ type: 'divider', thickness: 0.5 }),
  },
  {
    type: 'spacer', label: 'Spacer', category: 'Layout', icon: 'MoveVertical', keywords: 'space gap',
    description: 'Vertical space',
    create: () => ({ type: 'spacer', heightMm: 6 }),
  },
  {
    type: 'pageBreak', label: 'Page break', category: 'Layout', icon: 'SeparatorHorizontal', keywords: 'new page',
    description: 'Start a new page',
    create: () => ({ type: 'pageBreak' }),
  },
]

export const CATEGORIES: Category[] = ['Text', 'Data', 'Results', 'Visuals', 'Codes', 'Layout']

export function blockInfo(type: BlockType): BlockInfo {
  return CATALOG.find((b) => b.type === type) ?? CATALOG[1]
}

/** Short human summary of a block, used in the outline. */
export function blockSummary(b: Block): string {
  const clip = (s: string, n = 42) => (s.length > n ? s.slice(0, n - 1) + '…' : s)
  switch (b.type) {
    case 'heading':
    case 'text':
      return clip(b.text.replace(/\s+/g, ' ').replace(/\*\*/g, ''))
    case 'callout':
      return clip(b.title || b.text)
    case 'table':
    case 'measurementTable':
    case 'summary':
      return b.source ? `from ${b.source}` : 'no source'
    case 'keyValue':
      return clip(b.title || `${b.items.length} fields`)
    case 'chart':
      return clip(b.title || `${b.kind} · ${b.series.length} series`)
    case 'section':
      return clip(b.title || (b.repeat ? `repeat ${b.repeat}` : `${b.blocks.length} blocks`))
    case 'columns':
      return `${b.columns.length} columns`
    case 'status':
      return clip(`${b.label}: ${b.value}`)
    case 'qrCode':
    case 'barcode':
      return clip(b.value)
    case 'gauge':
    case 'progress':
      return clip(`${b.label} ${b.value}`)
    case 'signatures':
      return b.entries.map((e) => e.role).join(', ')
    case 'image':
      return b.src ? (b.src.startsWith('data:') ? 'embedded image' : clip(b.src)) : 'no image'
    default:
      return ''
  }
}
