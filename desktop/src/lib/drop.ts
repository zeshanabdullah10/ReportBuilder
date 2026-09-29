// What happens when something is dropped: pure functions from (document, payload, target) to a new document.
//
// Layout is inferred from where you drop, so nobody has to plan containers:
// dropping on the side of a block puts the two side by side (creating columns),
// and columns that lose their content unwrap again.

import { blockInfo } from './blocks'
import { type FieldNode, humanize, isList, isScalar, normKey } from './data-model'
import { findBlock, insertBlock, type Location, moveBlock, newId, removeBlock, updateBlock } from './doc-ops'
import type { Block, ReportDocument, TableColumn } from './types'

export type Payload =
  | { kind: 'new'; type: Block['type'] }
  | { kind: 'move'; id: string }
  | { kind: 'field'; node: FieldNode }

export type DropTarget =
  | { kind: 'gap'; loc: Location }
  /** Drop onto a block: bind the field to it (falls back to inserting after it). */
  | { kind: 'onto'; id: string }
  /** Drop on the left or right edge of a block: place side by side. */
  | { kind: 'edge'; id: string; side: 'left' | 'right' }

export interface DropResult {
  doc: ReportDocument
  selectId: string | null
}

const MAX_COLUMNS = 4
const MAX_AUTO_COLUMNS = 8
const TEXT_PLACEHOLDER = 'Write something, insert fields with {{ }}'

// --- layout cleanup ---------------------------------------------------------

/** Drop empty columns; unwrap a columns block left with one column; remove one left with none. */
export function pruneColumns(doc: ReportDocument, columnsId: string): ReportDocument {
  const found = findBlock(doc, columnsId)
  if (!found || found.block.type !== 'columns') return doc
  const k = found.block
  const kept = k.columns.filter((c) => c.blocks.length > 0)
  if (kept.length === k.columns.length && kept.length > 1) return doc
  if (kept.length > 1) return updateBlock(doc, columnsId, () => ({ ...k, columns: kept }))
  // Unwrap: replace the columns block by the blocks of its remaining column.
  const without = removeBlock(doc, columnsId)
  const inner = kept[0]?.blocks ?? []
  let out = without
  inner.forEach((b, i) => {
    out = insertBlock(out, b, { ...found.loc, index: found.loc.index + i })
  })
  return out
}

/** Remove a block, tidying the columns block it leaves behind. */
export function removeBlockTidy(doc: ReportDocument, id: string): ReportDocument {
  const found = findBlock(doc, id)
  if (!found) return doc
  const owner = found.loc.parentId && found.path.at(-1)?.type === 'columns' ? found.loc.parentId : null
  const next = removeBlock(doc, id)
  return owner ? pruneColumns(next, owner) : next
}

/** Move a block, tidying the columns block it leaves behind. */
export function moveBlockTidy(doc: ReportDocument, id: string, to: Location): ReportDocument {
  const found = findBlock(doc, id)
  if (!found) return doc
  const owner = found.loc.parentId && found.path.at(-1)?.type === 'columns' ? found.loc.parentId : null
  const next = moveBlock(doc, id, to)
  return owner && next !== doc ? pruneColumns(next, owner) : next
}

// --- fields to blocks -------------------------------------------------------

/** Expression for a field, relative to any repeating section it sits in (`item.value`). */
export function scopedPath(path: string, ancestors: Block[]): string {
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const a = ancestors[i]
    if (a.type !== 'section' || !a.repeat) continue
    const alias = a.as?.trim() || 'item'
    if (path === a.repeat) return path
    const prefix = `${a.repeat}[].`
    if (path.startsWith(prefix)) return `${alias}.${path.slice(prefix.length).replace(/\[\]\./g, '.')}`
  }
  return path.replace(/\[\]\./g, '.')
}

const LIMIT_ALIASES = {
  name: ['name', 'parameter', 'param', 'test', 'testname', 'label', 'title', 'description'],
  value: ['value', 'measured', 'measurement', 'reading', 'actual', 'result'],
  low: ['low', 'lowlimit', 'min', 'lower', 'lsl', 'lo', 'minimum'],
  high: ['high', 'highlimit', 'max', 'upper', 'usl', 'hi', 'maximum'],
  nominal: ['nominal', 'target', 'expected', 'typ', 'typical'],
  unit: ['unit', 'units', 'uom'],
  status: ['status', 'verdict', 'passfail', 'outcome', 'pass', 'passed'],
} as const

/** Map a measurement table's slots onto the fields an item has. Empty when nothing matches. */
export function mapMeasurementFields(keys: string[]): Record<keyof typeof LIMIT_ALIASES, string> {
  const used = new Set<string>()
  const out = {} as Record<keyof typeof LIMIT_ALIASES, string>
  // value first: `result` may be both a value and a verdict, exact `value` wins.
  const order = ['value', 'low', 'high', 'nominal', 'unit', 'status', 'name'] as const
  for (const slot of order) {
    const hit = keys.find((k) => !used.has(k) && (LIMIT_ALIASES[slot] as readonly string[]).includes(normKey(k)))
    if (hit) used.add(hit)
    out[slot] = hit ?? ''
  }
  return out
}

/** A list of objects looks like measurements when items have a value and a limit. */
export function isMeasurementList(node: FieldNode): boolean {
  if (node.kind !== 'list' || node.children.length === 0) return false
  const m = mapMeasurementFields(node.children.filter(isScalar).map((c) => c.key))
  return !!m.value && (!!m.low || !!m.high)
}

function scalarChildren(node: FieldNode): FieldNode[] {
  return node.children.filter(isScalar)
}

function tableColumn(child: FieldNode): TableColumn {
  return { header: child.label, value: `row.${child.key}`, width: 'auto', align: child.kind === 'number' ? 'right' : 'left' }
}

function autoColumns(list: FieldNode): TableColumn[] {
  return scalarChildren(list).slice(0, MAX_AUTO_COLUMNS).map(tableColumn)
}

function blockOf(type: Block['type'], patch: Record<string, unknown> = {}): Block {
  return { ...blockInfo(type).create(), ...patch, id: newId() } as Block
}

/** The list a field belongs to, if it is an item field of a list (e.g. `measurements[].value`). */
function owningList(node: FieldNode): string | null {
  return node.listPath ?? null
}

/** A ready-made block for a field dropped on empty space. */
export function blockForField(node: FieldNode, ancestors: Block[] = []): Block {
  const path = scopedPath(node.path, ancestors)
  if (node.kind === 'list') {
    const src = scopedPath(node.path, ancestors)
    if (isMeasurementList(node)) {
      const keys = scalarChildren(node).map((c) => c.key)
      return blockOf('measurementTable', { source: src, fields: mapMeasurementFields(keys) })
    }
    return blockOf('table', { source: src, columns: autoColumns(node) })
  }
  if (node.kind === 'numbers') {
    return blockOf('chart', { title: node.label, series: [{ label: node.label, source: path, x: '', y: '' }] })
  }
  if (node.kind === 'object') {
    const kids = scalarChildren(node).slice(0, 12)
    return blockOf('keyValue', {
      title: node.label,
      items: kids.map((c) => ({ label: c.label, value: `{{ ${scopedPath(c.path, ancestors)} }}` })),
    })
  }
  if (node.kind === 'status') return blockOf('status', { label: node.label, value: path })
  return blockOf('text', { text: `**${node.label}:** {{ ${path} }}` })
}

function appendField(text: string, placeholder: string, expr: string): string {
  const ref = `{{ ${expr} }}`
  return !text.trim() || text === placeholder ? ref : `${text} ${ref}`
}

/** Bind a dropped field to an existing block. Null when the block can't take it. */
export function bindField(block: Block, node: FieldNode, ancestors: Block[] = []): Block | null {
  const path = scopedPath(node.path, ancestors)
  const listLike = isList(node)
  switch (block.type) {
    case 'table': {
      if (node.kind === 'list') return { ...block, source: path, columns: autoColumns(node) }
      const owner = owningList(node)
      if (!owner || !isScalar(node)) return null
      const listExpr = scopedPath(owner, ancestors)
      const col = tableColumn(node)
      if (!block.source) return { ...block, source: listExpr, columns: [col] }
      if (block.source !== listExpr) return null
      if (block.columns.some((c) => c.value === col.value)) return block
      return { ...block, columns: [...block.columns, col] }
    }
    case 'measurementTable':
      if (node.kind !== 'list') return null
      return { ...block, source: path, fields: mapMeasurementFields(scalarChildren(node).map((c) => c.key)) }
    case 'summary': {
      if (node.kind !== 'list') return null
      const keys = scalarChildren(node).map((c) => c.key)
      const status = mapMeasurementFields(keys).status
      return { ...block, source: path, statusField: status || block.statusField }
    }
    case 'chart': {
      if (!listLike) return null
      const owner = node.kind === 'list' ? node : null
      let series
      if (owner) {
        const y = scalarChildren(owner).find((c) => c.kind === 'number')
        if (!y) return null
        series = { label: node.label, source: path, x: '', y: `item.${y.key}` }
      } else {
        series = { label: node.label, source: path, x: '', y: '' }
      }
      const first = block.series[0]
      return { ...block, series: first && !first.source ? [series, ...block.series.slice(1)] : [...block.series, series] }
    }
    case 'text':
      return isScalar(node) ? { ...block, text: appendField(block.text, TEXT_PLACEHOLDER, path) } : null
    case 'heading':
      return isScalar(node) ? { ...block, text: appendField(block.text, 'Heading', path) } : null
    case 'callout':
      return isScalar(node) ? { ...block, text: appendField(block.text, '', path) } : null
    case 'keyValue': {
      if (isScalar(node)) return { ...block, items: [...block.items, { label: node.label, value: `{{ ${path} }}` }] }
      if (node.kind === 'object') {
        const items = scalarChildren(node).map((c) => ({ label: c.label, value: `{{ ${scopedPath(c.path, ancestors)} }}` }))
        return { ...block, items: [...block.items, ...items] }
      }
      return null
    }
    case 'status':
      return isScalar(node) ? { ...block, value: path, label: block.label === 'Result' ? node.label : block.label } : null
    case 'qrCode':
    case 'barcode':
      return isScalar(node) ? { ...block, value: `{{ ${path} }}` } : null
    case 'gauge':
    case 'progress':
      return node.kind === 'number'
        ? { ...block, value: path, label: block.label === 'Value' || block.label === 'Progress' ? node.label : block.label }
        : null
    case 'section':
      return node.kind === 'list' && scalarChildren(node).length > 0 ? { ...block, repeat: path } : null
    default:
      return null
  }
}

/** A starting layout for some data: a title, then a block per top-level field group. */
export function draftBody(fields: FieldNode[], title: string): Block[] {
  const body: Block[] = [blockOf('heading', { text: title, level: 1 })]
  const scalars = fields.filter(isScalar)
  if (scalars.length > 0) {
    body.push(blockOf('keyValue', { title: 'Details', items: scalars.slice(0, 12).map((c) => ({ label: c.label, value: `{{ ${c.path} }}` })) }))
  }
  const lists = fields.filter((f) => f.kind === 'list' || f.kind === 'numbers')
  const measurements = lists.find(isMeasurementList)
  if (measurements) {
    const keys = scalarChildren(measurements).map((c) => c.key)
    const status = mapMeasurementFields(keys).status
    body.push(blockOf('summary', { title: 'Overall result', source: measurements.path, statusField: status || 'status' }))
  }
  for (const f of fields) {
    if (f.kind === 'object' && scalarChildren(f).length > 0) body.push(blockForField(f))
  }
  for (const l of lists) body.push(blockForField(l))
  return body
}

// --- drop application -------------------------------------------------------

function payloadBlock(payload: Payload, doc: ReportDocument, ancestors: Block[]): Block | null {
  if (payload.kind === 'new') return blockOf(payload.type)
  if (payload.kind === 'field') return blockForField(payload.node, ancestors)
  return findBlock(doc, payload.id)?.block ?? null
}

function ancestorsOf(doc: ReportDocument, loc: { parentId?: string }): Block[] {
  if (!loc.parentId) return []
  const p = findBlock(doc, loc.parentId)
  return p ? [...p.path, p.block] : []
}

function insertAt(doc: ReportDocument, payload: Payload, loc: Location): DropResult {
  if (payload.kind === 'move') {
    if (!findBlock(doc, payload.id)) return { doc, selectId: null }
    return { doc: moveBlockTidy(doc, payload.id, loc), selectId: payload.id }
  }
  const block = payloadBlock(payload, doc, ancestorsOf(doc, loc))
  if (!block) return { doc, selectId: null }
  return { doc: insertBlock(doc, block, loc), selectId: block.id }
}

function afterBlock(doc: ReportDocument, id: string): Location | null {
  const f = findBlock(doc, id)
  return f ? { ...f.loc, index: f.loc.index + 1 } : null
}

export function applyDrop(doc: ReportDocument, payload: Payload, target: DropTarget): DropResult {
  const none: DropResult = { doc, selectId: null }
  if (target.kind === 'gap') return insertAt(doc, payload, target.loc)

  const t = findBlock(doc, target.id)
  if (!t) return none
  if (payload.kind === 'move' && payload.id === target.id) return none

  if (target.kind === 'onto') {
    if (payload.kind === 'field') {
      const bound = bindField(t.block, payload.node, t.path)
      if (bound) return { doc: updateBlock(doc, t.block.id, () => bound), selectId: t.block.id }
    }
    const loc = afterBlock(doc, target.id)
    return loc ? insertAt(doc, payload, loc) : none
  }

  // Edge drop: side by side.
  if (payload.kind === 'move' && findBlock(doc, target.id) && isInside(doc, target.id, payload.id)) return none
  const beside = target.side === 'left' ? 0 : 1
  if (t.block.type === 'columns' || t.block.type === 'pageBreak') {
    const loc = { ...t.loc, index: t.loc.index + beside }
    return insertAt(doc, payload, loc)
  }
  const moved = payload.kind === 'move' ? findBlock(doc, payload.id)?.block ?? null : null
  if (payload.kind === 'move' && !moved) return none
  // Take a moved block out first; its old columns may unwrap, so re-find the target after.
  const base = payload.kind === 'move' ? removeBlockTidy(doc, payload.id) : doc
  const t2 = findBlock(base, target.id)
  if (!t2) return none
  const block = payload.kind === 'move' ? moved! : payloadBlock(payload, base, t2.path)
  if (!block) return none

  const owner = t2.path.at(-1)
  if (t2.loc.column !== undefined && owner?.type === 'columns') {
    // Beside a block inside a column: add a column, or stack in the neighbouring one when full.
    const at = t2.loc.column + beside
    const next =
      owner.columns.length < MAX_COLUMNS
        ? updateBlock(base, owner.id, (o) => {
            if (o.type !== 'columns') return o
            const cols = [...o.columns]
            cols.splice(at, 0, { width: 1, blocks: [block] })
            return { ...o, columns: cols }
          })
        : insertBlock(base, block, { ...t2.loc, index: t2.loc.index + beside })
    return { doc: next, selectId: block.id }
  }

  const wrapper: Block = {
    ...blockOf('columns'),
    id: newId(),
    columns: [
      { width: 1, blocks: beside === 0 ? [block] : [t2.block] },
      { width: 1, blocks: beside === 0 ? [t2.block] : [block] },
    ],
  } as Block
  const without = removeBlock(base, t2.block.id)
  return { doc: insertBlock(without, wrapper, t2.loc), selectId: block.id }
}

function isInside(doc: ReportDocument, id: string, ancestorId: string): boolean {
  const f = findBlock(doc, id)
  return !!f?.path.some((p) => p.id === ancestorId)
}

export { humanize }
