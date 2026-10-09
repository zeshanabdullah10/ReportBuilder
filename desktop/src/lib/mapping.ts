// Fit a template to someone else's data: find the fields it reads that the data lacks,
// suggest the closest fields the data does have, and rewrite the template to use them.

import { type FieldNode, findField, isList, isScalar, normKey, walkFields } from './data-model'
import { mapMeasurementFields } from './drop'
import { getPathValue } from './path'
import type { Block, ReportDocument } from './types'

/** Names that usually mean the same thing in test data. */
const SYNONYMS: string[][] = [
  ['serial', 'serialnumber', 'sn', 'serialno', 'unitid', 'dutserial'],
  ['measurements', 'results', 'tests', 'readings', 'steps', 'testresults', 'data'],
  ['operator', 'user', 'tester', 'technician', 'engineer', 'username'],
  ['model', 'product', 'productname', 'partname', 'device', 'description'],
  ['partnumber', 'pn', 'partno', 'sku', 'article', 'item'],
  ['revision', 'rev', 'version'],
  ['start', 'starttime', 'started', 'timestamp', 'date', 'datetime', 'time'],
  ['durationseconds', 'duration', 'elapsed', 'testtime', 'seconds'],
  ['station', 'stationid', 'tester', 'machine', 'equipment'],
  ['dut', 'unit', 'uut', 'device', 'product', 'specimen'],
  ['test', 'testinfo', 'run', 'session'],
  ['name', 'title', 'parameter', 'description', 'label'],
  ['low', 'lowlimit', 'min', 'lsl', 'lower'],
  ['high', 'highlimit', 'max', 'usl', 'upper'],
  ['status', 'result', 'verdict', 'passfail', 'outcome'],
]

function synonymous(a: string, b: string): boolean {
  return SYNONYMS.some((g) => g.includes(a) && g.includes(b))
}

function similarity(a: string, b: string): number {
  const x = normKey(a)
  const y = normKey(b)
  if (!x || !y) return 0
  if (x === y) return 1
  if (synonymous(x, y)) return 0.8
  if (x.includes(y) || y.includes(x)) return 0.65
  // Shared prefix as a cheap typo tolerance (`voltage` / `voltages`, not `lot` / `log`).
  let i = 0
  while (i < x.length && i < y.length && x[i] === y[i]) i++
  return i >= 4 && i / Math.max(x.length, y.length) >= 0.7 ? 0.5 : 0
}

/** Score how well a data path stands in for a wanted one (last name matters most, its parent a little). */
export function pathSimilarity(want: string, have: string): number {
  const w = want.split('.')
  const h = have.split('.')
  const leaf = similarity(w[w.length - 1], h[h.length - 1])
  if (leaf === 0) return 0
  const parent = w.length > 1 && h.length > 1 ? similarity(w[w.length - 2], h[h.length - 2]) : 0
  return leaf + parent * 0.25
}

export interface MappingRow {
  /** The path the template reads. */
  need: string
  /** Best guess in the data, or null. */
  suggestion: string | null
  /** Other likely fields, best first. */
  options: string[]
}

/** Paths in the tree that aren't inside list items. */
function globalPaths(tree: FieldNode[]): FieldNode[] {
  const out: FieldNode[] = []
  walkFields(tree, (n) => {
    if (!n.path.includes('[]')) out.push(n)
  })
  return out
}

/** Template paths the data lacks, judged directly against the data. */
export function missingPaths(referenced: string[], data: unknown): string[] {
  return referenced.filter((p) => /^[A-Za-z_]\w*(\.\w+)*$/.test(p) && !['page', 'pages', 'report', 'theme', 'now'].includes(p.split('.')[0]) && getPathValue(data, p) === undefined)
}

export function suggestMapping(missing: string[], tree: FieldNode[]): MappingRow[] {
  const have = globalPaths(tree)
  const taken = new Set<string>()
  return missing.map((need) => {
    const ranked = have
      .filter((n) => n.kind !== 'empty')
      .map((n) => ({ path: n.path, score: pathSimilarity(need, n.path), structured: n.kind === 'list' || n.kind === 'object' || n.kind === 'numbers' }))
      // A whole list or group is only a good stand-in when the names really agree.
      .filter((r) => r.score >= (r.structured ? 0.75 : 0.5))
      .sort((a, b) => b.score - a.score)
    const best = ranked.find((r) => !taken.has(r.path)) ?? null
    if (best) taken.add(best.path)
    return { need, suggestion: best?.path ?? null, options: ranked.map((r) => r.path) }
  })
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function rewrite(value: unknown, mapping: Map<string, RegExp>, to: Map<string, string>): unknown {
  if (typeof value === 'string') {
    let s = value
    for (const [need, re] of mapping) s = s.replace(re, to.get(need)!)
    return s
  }
  if (Array.isArray(value)) return value.map((v) => rewrite(v, mapping, to))
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, k === 'id' || k === 'type' ? v : rewrite(v, mapping, to)]),
    )
  }
  return value
}

/** Rewrite the template so every mapped path reads from the chosen field. */
export function applyMapping(doc: ReportDocument, mapping: Record<string, string>): ReportDocument {
  const entries = Object.entries(mapping).filter(([need, to]) => to && need !== to)
  if (entries.length === 0) return doc
  // Longest paths first so `dut.serial` isn't clobbered by a mapping for `dut`.
  entries.sort((a, b) => b[0].length - a[0].length)
  const res = new Map(entries.map(([need]) => [need, new RegExp(`(?<![\\w.$])${escapeRe(need)}(?![\\w])`, 'g')]))
  const to = new Map(entries)
  return {
    ...doc,
    header: rewrite(doc.header, res, to) as Block[],
    body: rewrite(doc.body, res, to) as Block[],
    footer: rewrite(doc.footer, res, to) as Block[],
  }
}

function itemKeys(tree: FieldNode[], source: string): string[] | null {
  const n = findField(tree, source)
  return n && n.kind === 'list' ? n.children.filter(isScalar).map((c) => c.key) : null
}

function bestKey(want: string, keys: string[]): string | null {
  let best: { k: string; s: number } | null = null
  for (const k of keys) {
    const s = similarity(want, k)
    if (s >= 0.5 && (!best || s > best.s)) best = { k, s }
  }
  return best?.k ?? null
}

/** One item field a block reads that the list's items don't have, and what it was matched to. */
export interface ItemFieldChange {
  /** Stable key for overrides: `<blockId>:<slot>`. */
  key: string
  blockId: string
  /** The list the block reads (after mapping), e.g. `results`. */
  list: string
  /** What reads the field, for display: "Measurements · low limit", "Table · column Reading". */
  label: string
  /** The item field the template reads, e.g. `low`. */
  need: string
  /** The item field it now reads, or null when nothing matched (it stays empty). */
  chosen: string | null
  /** The fields the list's items have. */
  options: string[]
}

export interface RemapResult {
  doc: ReportDocument
  changes: ItemFieldChange[]
}

const MEASUREMENT_SLOTS: Record<string, string> = {
  name: 'name',
  value: 'value',
  low: 'low limit',
  high: 'high limit',
  nominal: 'nominal',
  unit: 'unit',
  status: 'status',
}

/**
 * After the lists are pointed at the user's data, bring the item fields along: a measurement
 * table's columns, a table's `row.x` cells, a chart's `item.x`, the verdict's status field.
 * Returns what was rematched and what couldn't be (`chosen: null`). `overrides` (by change key)
 * replace the automatic choice; an empty override leaves the field unmatched.
 */
export function remapItemFields(doc: ReportDocument, tree: FieldNode[], overrides: Record<string, string> = {}): RemapResult {
  const changes: ItemFieldChange[] = []
  /** Record a missing field and return the field to use (null: none). */
  const decide = (blockId: string, slot: string, list: string, label: string, need: string, auto: string | null, options: string[]): string | null => {
    const key = `${blockId}:${slot}`
    const o = overrides[key]
    const chosen = o === undefined ? auto : o && options.includes(o) ? o : null
    changes.push({ key, blockId, list, label, need, chosen, options })
    return chosen
  }

  const fix = (b: Block): Block => {
    let nb: Block = b
    if (b.type === 'measurementTable') {
      const keys = itemKeys(tree, b.source)
      const fields = (b.fields ?? {}) as Record<string, string>
      const present = (f: string | undefined) => !f || (keys ?? []).includes(f)
      if (keys && !Object.values(fields).every(present)) {
        const auto = mapMeasurementFields(keys) as Record<string, string>
        const next: Record<string, string> = { ...fields }
        // Fields the items already have stay; the rest take the best match.
        const kept = new Set(Object.values(fields).filter((f) => f && keys.includes(f)))
        for (const slot of Object.keys(MEASUREMENT_SLOTS)) {
          const old = fields[slot] ?? ''
          if (old && keys.includes(old)) continue
          const guess = auto[slot] && !kept.has(auto[slot]) ? auto[slot] : ''
          if (!old) {
            next[slot] = guess
            continue
          }
          next[slot] = decide(b.id, `fields.${slot}`, b.source, `Measurements · ${MEASUREMENT_SLOTS[slot]}`, old, guess || null, keys) ?? ''
        }
        nb = { ...b, fields: next as typeof b.fields }
      }
    } else if (b.type === 'summary') {
      const keys = itemKeys(tree, b.source)
      if (keys && b.statusField && !keys.includes(b.statusField)) {
        const chosen = decide(b.id, 'statusField', b.source, 'Summary · status', b.statusField, bestKey('status', keys), keys)
        // Unmatched keeps the original name: the summary then reports no verdicts.
        nb = { ...b, statusField: chosen ?? b.statusField }
      }
    } else if (b.type === 'table') {
      const keys = itemKeys(tree, b.source)
      if (keys) {
        nb = {
          ...b,
          columns: b.columns.map((c, i) => {
            const m = /^row\.(\w+)$/.exec(c.value)
            if (!m || keys.includes(m[1])) return c
            const k = decide(b.id, `columns.${i}`, b.source, `Table · column ${c.header || i + 1}`, m[1], bestKey(m[1], keys), keys)
            return k ? { ...c, value: `row.${k}` } : c
          }),
        }
      }
    } else if (b.type === 'chart') {
      nb = {
        ...b,
        series: b.series.map((s, i) => {
          const keys = itemKeys(tree, s.source)
          if (!keys) return s
          const fixField = (axis: 'x' | 'y') => {
            const expr = s[axis]
            const m = /^item\.(\w+)$/.exec(expr)
            if (!m || keys.includes(m[1])) return expr
            const k = decide(b.id, `series.${i}.${axis}`, s.source, `Chart · ${s.label || `series ${i + 1}`} ${axis.toUpperCase()}`, m[1], bestKey(m[1], keys), keys)
            return k ? `item.${k}` : expr
          }
          return { ...s, x: fixField('x'), y: fixField('y') }
        }),
      }
    }
    if (nb.type === 'section') nb = { ...nb, blocks: nb.blocks.map(fix) }
    if (nb.type === 'columns') nb = { ...nb, columns: nb.columns.map((c) => ({ ...c, blocks: c.blocks.map(fix) })) }
    return nb
  }
  const out = { ...doc, header: doc.header.map(fix), body: doc.body.map(fix), footer: doc.footer.map(fix) }
  return { doc: out, changes }
}

/** Group item-field changes by the list they read, in first-seen order. */
export function groupChanges(changes: ItemFieldChange[]): { list: string; changes: ItemFieldChange[] }[] {
  const groups = new Map<string, ItemFieldChange[]>()
  for (const c of changes) groups.set(c.list, [...(groups.get(c.list) ?? []), c])
  return [...groups].map(([list, cs]) => ({ list, changes: cs }))
}

export { isList }
