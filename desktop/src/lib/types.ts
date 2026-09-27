// Mirrors engine/reportcore/src/model.rs. Keep in sync.

export type PaperSize = 'a3' | 'a4' | 'a5' | 'letter' | 'legal' | 'custom'
export type Align = 'left' | 'center' | 'right'
export type Weight = 'regular' | 'medium' | 'semibold' | 'bold'
export type FontFamily = 'sans' | 'serif' | 'mono'
export type Tone = 'info' | 'pass' | 'warn' | 'fail'
export type ChartKind = 'line' | 'bar' | 'scatter' | 'histogram' | 'pie'
export type BarcodeFormat = 'code128' | 'code39' | 'ean13'

export interface Meta {
  name: string
  description: string
  author: string
  revision: string
  tags: string[]
}

export interface PageSetup {
  size: PaperSize
  widthMm: number
  heightMm: number
  orientation: 'portrait' | 'landscape'
  margins: { top: number; right: number; bottom: number; left: number }
}

export interface Theme {
  font: FontFamily
  fontSize: number
  textColor: string
  mutedColor: string
  accentColor: string
  borderColor: string
  surfaceColor: string
  passColor: string
  failColor: string
  warnColor: string
  logo?: string
  company: string
}

export interface Watermark {
  text: string
  visibleIf?: string
  color: string
  opacity: number
  angle: number
  size: number
}

export interface TextStyle {
  size?: number
  weight?: Weight
  color?: string
  align?: Align
  italic?: boolean
  mono?: boolean
}

export interface TableColumn { header: string; value: string; width: string; align: Align }
export interface KeyValueItem { label: string; value: string }
export interface Series { label: string; source: string; x: string; y: string; color?: string }
export interface LimitLine { label: string; value: string; color?: string }
export interface SignatureEntry { role: string; name: string }
export interface Column { width: number; blocks: Block[] }

interface Base { id: string; visibleIf?: string }

export type Block = Base & (
  | { type: 'heading'; text: string; level: number; align?: Align; color?: string }
  | { type: 'text'; text: string; style: TextStyle }
  | { type: 'image'; src: string; width: number; align: Align; caption: string }
  | { type: 'logo'; heightMm: number; align: Align }
  | { type: 'table'; source: string; columns: TableColumn[]; zebra: boolean; repeatHeader: boolean; emptyText: string; rowTone?: string; fontSize?: number }
  | {
      type: 'measurementTable'; source: string
      fields: { name: string; value: string; low: string; high: string; nominal: string; unit: string; status: string }
      decimals: number; showIndex: boolean; showNominal: boolean; showLimits: boolean; showUnit: boolean; showStatus: boolean
      highlightFailures: boolean; failuresOnly: boolean; repeatHeader: boolean; emptyText: string
    }
  | { type: 'keyValue'; title: string; items: KeyValueItem[]; columns: number; boxed: boolean }
  | { type: 'summary'; title: string; source: string; statusField: string; verdict?: string; showCounts: boolean; showRate: boolean }
  | { type: 'status'; label: string; value: string; style: 'badge' | 'banner' }
  | { type: 'callout'; title: string; text: string; tone: Tone }
  | { type: 'chart'; kind: ChartKind; title: string; series: Series[]; xLabel: string; yLabel: string; heightMm: number; limits: LimitLine[]; bins: number; legend: boolean; grid: boolean }
  | { type: 'gauge'; label: string; value: string; min: string; max: string; low: string; high: string; unit: string; decimals: number; sizeMm: number }
  | { type: 'progress'; label: string; value: string; max: string; color?: string; showValue: boolean }
  | { type: 'qrCode'; value: string; sizeMm: number; caption: string; align: Align }
  | { type: 'barcode'; value: string; format: BarcodeFormat; heightMm: number; widthMm: number; showText: boolean; align: Align }
  | { type: 'signatures'; entries: SignatureEntry[]; showDate: boolean }
  | { type: 'divider'; thickness: number; color?: string }
  | { type: 'spacer'; heightMm: number }
  | { type: 'pageBreak' }
  | { type: 'columns'; columns: Column[]; gapMm: number }
  | { type: 'section'; title: string; blocks: Block[]; repeat?: string; as: string; keepTogether: boolean; pageBreakBefore: boolean; boxed: boolean }
)

export type BlockType = Block['type']
export type BlockOf<T extends BlockType> = Extract<Block, { type: T }>

export interface DataSet { id: string; name: string; data: unknown }

export interface ReportDocument {
  schemaVersion: number
  meta: Meta
  page: PageSetup
  theme: Theme
  header: Block[]
  footer: Block[]
  body: Block[]
  watermark?: Watermark
  sampleData?: unknown
  editor?: { dataSets?: DataSet[]; activeDataSet?: string }
}

export type Region = 'header' | 'body' | 'footer'

export interface Issue { severity: 'error' | 'warning' | 'info'; blockId: string; field: string; message: string }
export interface BlockRegion { id: string; page: number; top: number; bottom: number; left: number }
export interface PreviewResult { pages: string[]; pageSizes: [number, number][]; regions: BlockRegion[]; issues: Issue[]; elapsedMs: number }
export interface DataPath { path: string; kind: string; sample: string }
export interface Starter { id: string; name: string; description: string; template: string; data: string }
