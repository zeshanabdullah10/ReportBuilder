import { CATALOG } from './blocks'
import { ensureIds, newId } from './doc-ops'
import type { Block, DataSet, LimitLine, PageSetup, ReportDocument, Series, TableColumn, Theme } from './types'

// Mirrors the Rust defaults in model.rs.
export const DEFAULT_THEME: Theme = {
  font: 'sans',
  fontSize: 9.5,
  textColor: '#1d1d1f',
  mutedColor: '#6e6e73',
  accentColor: '#0a5dc2',
  borderColor: '#d2d2d7',
  surfaceColor: '#f5f5f7',
  passColor: '#1a7f37',
  failColor: '#d1242f',
  warnColor: '#9a6700',
  company: '',
}

export const DEFAULT_PAGE: PageSetup = {
  size: 'a4',
  widthMm: 210,
  heightMm: 297,
  orientation: 'portrait',
  margins: { top: 22, right: 18, bottom: 20, left: 18 },
}

export function newDocument(): ReportDocument {
  return {
    schemaVersion: 1,
    meta: { name: 'Untitled Report', description: '', author: '', revision: 'A', tags: [] },
    page: structuredClone(DEFAULT_PAGE),
    theme: { ...DEFAULT_THEME },
    header: [],
    footer: [
      {
        id: newId(), type: 'columns', gapMm: 6, columns: [
          { width: 2, blocks: [{ id: newId(), type: 'text', text: '{{ report.name }}', style: { color: 'muted' } }] },
          { width: 1, blocks: [{ id: newId(), type: 'text', text: 'Page {{ page }} of {{ pages }}', style: { color: 'muted', align: 'right' } }] },
        ],
      },
    ],
    body: [{ id: newId(), type: 'heading', text: 'Untitled Report', level: 1 }],
    sampleData: {},
  }
}

function normalizeBlock(raw: Block): Block {
  const info = CATALOG.find((c) => c.type === raw.type)
  if (!info) return raw
  const base = info.create() as Record<string, unknown>
  const merged: Record<string, unknown> = { ...base, ...raw }
  // Merge one level of nested objects with defaults.
  for (const k of ['style', 'fields']) {
    if (base[k] && typeof base[k] === 'object') merged[k] = { ...(base[k] as object), ...((raw as unknown as Record<string, unknown>)[k] as object) }
  }
  const b = merged as unknown as Block
  if (b.type === 'section') return { ...b, blocks: b.blocks.map(normalizeBlock) }
  if (b.type === 'columns') return { ...b, columns: b.columns.map((c) => ({ width: c.width ?? 1, blocks: (c.blocks ?? []).map(normalizeBlock) })) }
  if (b.type === 'table') return { ...b, columns: b.columns.map((c) => ({ header: '', value: '', width: 'auto', align: 'left', ...(c as Partial<TableColumn>) }) as TableColumn) }
  if (b.type === 'chart') {
    return {
      ...b,
      series: b.series.map((s) => ({ label: '', source: '', x: '', y: '', ...(s as Partial<Series>) }) as Series),
      limits: b.limits.map((l) => ({ label: '', value: '', ...(l as Partial<LimitLine>) }) as LimitLine),
    }
  }
  return b
}

/** Fill in defaults for anything a template file omits. */
export function normalizeDocument(raw: Partial<ReportDocument>): ReportDocument {
  const base = newDocument()
  const doc: ReportDocument = {
    schemaVersion: raw.schemaVersion ?? 1,
    meta: { ...base.meta, name: '', ...raw.meta },
    page: { ...DEFAULT_PAGE, ...raw.page, margins: { ...DEFAULT_PAGE.margins, ...raw.page?.margins } },
    theme: { ...DEFAULT_THEME, ...raw.theme },
    header: (raw.header ?? []).map(normalizeBlock),
    footer: (raw.footer ?? []).map(normalizeBlock),
    body: (raw.body ?? []).map(normalizeBlock),
    watermark: raw.watermark,
    sampleData: raw.sampleData ?? {},
    editor: raw.editor,
  }
  return ensureIds(doc)
}

export const SAMPLE_ID = 'sample'
export const EMPTY_ID = '__empty'
export const STRESS_ID = '__stress'

/** Multiply every array so long-table pagination can be checked at a glance. */
export function stressData(v: unknown, factor = 25): unknown {
  if (Array.isArray(v)) {
    const items = v.map((x) => stressData(x, factor))
    if (items.length === 0) return items
    const out: unknown[] = []
    for (let i = 0; i < Math.max(items.length * factor, 60); i++) out.push(items[i % items.length])
    return out
  }
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, stressData(x, factor)]))
  }
  return v
}

/** The data sets a document offers: its sample data, user sets, and generated edge cases. */
export function dataSets(doc: ReportDocument): DataSet[] {
  return [
    { id: SAMPLE_ID, name: 'Sample data', data: doc.sampleData ?? {} },
    ...(doc.editor?.dataSets ?? []),
    { id: STRESS_ID, name: 'Stress test (long lists)', data: stressData(doc.sampleData ?? {}) },
    { id: EMPTY_ID, name: 'Empty (missing data)', data: {} },
  ]
}

export function isGeneratedSet(id: string) {
  return id === STRESS_ID || id === EMPTY_ID
}
