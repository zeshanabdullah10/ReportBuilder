// A typed, browsable view of a JSON data set: what the Data panel shows, what
// users drag onto the page, and what the auto-draft is built from.

export type FieldKind = 'text' | 'number' | 'boolean' | 'date' | 'status' | 'list' | 'numbers' | 'object' | 'empty'

export interface FieldNode {
  /** Path as used in templates. Fields inside a list item look like `measurements[].value`. */
  path: string
  key: string
  label: string
  kind: FieldKind
  /** Short display of the value (or a summary for lists and objects). */
  sample: string
  /** Number of items, for lists. */
  count?: number
  /** Object properties, or for a list of objects the fields of its items. */
  children: FieldNode[]
  /** For a field inside a list item: the list's path. */
  listPath?: string
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/
const STATUS = new Set(['pass', 'passed', 'fail', 'failed', 'ok', 'ng', 'error', 'warn', 'warning', 'skip', 'skipped'])
/** Items sampled to work out the fields of a list of objects. */
const SAMPLE_ITEMS = 25

export function humanize(key: string): string {
  const words = key
    .replace(/\[\]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()
    .toLowerCase()
  return words ? words[0].toUpperCase() + words.slice(1) : key
}

function clip(s: string, n = 38): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

export function scalarKind(v: unknown): FieldKind {
  if (v === null || v === undefined) return 'empty'
  if (typeof v === 'number') return 'number'
  if (typeof v === 'boolean') return 'boolean'
  if (typeof v === 'string') {
    if (ISO_DATE.test(v)) return 'date'
    if (STATUS.has(v.trim().toLowerCase())) return 'status'
    return 'text'
  }
  return 'text'
}

function sampleOf(v: unknown): string {
  if (v === null || v === undefined) return 'empty'
  if (typeof v === 'string') return clip(v)
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(Math.round(v * 1e6) / 1e6)
  return String(v)
}

/** Merge the kinds seen for one key: a mixed key falls back to text. */
function mergeKind(a: FieldKind | undefined, b: FieldKind): FieldKind {
  if (!a || a === 'empty') return b
  if (b === 'empty' || a === b) return a
  if ((a === 'text' || a === 'status' || a === 'date') && (b === 'text' || b === 'status' || b === 'date')) return 'text'
  return 'text'
}

function buildList(path: string, key: string, arr: unknown[], listPath?: string): FieldNode {
  const base = { path, key, label: humanize(key), listPath, count: arr.length }
  if (arr.length === 0) return { ...base, kind: 'list', sample: 'empty list', children: [] }
  const objs = arr.slice(0, SAMPLE_ITEMS).filter((x): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x))
  if (objs.length === 0) {
    const nums = arr.every((x) => typeof x === 'number')
    return { ...base, kind: nums ? 'numbers' : 'list', sample: `${arr.length} ${nums ? 'numbers' : 'values'}`, children: [] }
  }
  // Union of keys, first-seen order; sample value from the first item that has one.
  const keys: string[] = []
  const firstValue = new Map<string, unknown>()
  for (const o of objs) {
    for (const [k, v] of Object.entries(o)) {
      if (!keys.includes(k)) keys.push(k)
      if ((firstValue.get(k) === undefined || firstValue.get(k) === null) && v !== undefined) firstValue.set(k, v)
    }
  }
  const itemPath = `${path}[]`
  const children = keys.map((k) => {
    const v = firstValue.get(k)
    const p = `${itemPath}.${k}`
    if (Array.isArray(v)) return buildList(p, k, v, path)
    if (v && typeof v === 'object') return buildObject(p, k, v as Record<string, unknown>, path)
    let kind = scalarKind(v)
    for (const o of objs) kind = mergeKind(kind, scalarKind(o[k]))
    return { path: p, key: k, label: humanize(k), kind, sample: sampleOf(v), children: [], listPath: path } satisfies FieldNode
  })
  return { ...base, kind: 'list', sample: `${arr.length} item${arr.length === 1 ? '' : 's'}`, children }
}

function buildObject(path: string, key: string, obj: Record<string, unknown>, listPath?: string): FieldNode {
  const children = Object.entries(obj).map(([k, v]) => buildNode(path ? `${path}.${k}` : k, k, v, listPath))
  return { path, key, label: humanize(key), kind: 'object', sample: `${children.length} field${children.length === 1 ? '' : 's'}`, children, listPath }
}

function buildNode(path: string, key: string, v: unknown, listPath?: string): FieldNode {
  if (Array.isArray(v)) return buildList(path, key, v, listPath)
  if (v && typeof v === 'object') return buildObject(path, key, v as Record<string, unknown>, listPath)
  return { path, key, label: humanize(key), kind: scalarKind(v), sample: sampleOf(v), children: [], listPath }
}

/** The top-level fields of a data set. */
export function buildFieldTree(data: unknown): FieldNode[] {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return []
  return Object.entries(data as Record<string, unknown>).map(([k, v]) => buildNode(k, k, v))
}

export function isScalar(n: FieldNode): boolean {
  return n.kind !== 'list' && n.kind !== 'numbers' && n.kind !== 'object'
}

export function isList(n: FieldNode): boolean {
  return n.kind === 'list' || n.kind === 'numbers'
}

/** Visit every node, depth first. */
export function walkFields(nodes: FieldNode[], fn: (n: FieldNode) => void) {
  for (const n of nodes) {
    fn(n)
    walkFields(n.children, fn)
  }
}

export function findField(nodes: FieldNode[], path: string): FieldNode | null {
  let hit: FieldNode | null = null
  walkFields(nodes, (n) => {
    if (!hit && n.path === path) hit = n
  })
  return hit
}

/** Filter the tree to nodes whose key, path or sample match; parents of matches are kept. */
export function filterFields(nodes: FieldNode[], query: string): FieldNode[] {
  const q = query.trim().toLowerCase()
  if (!q) return nodes
  const out: FieldNode[] = []
  for (const n of nodes) {
    const kids = filterFields(n.children, q)
    if (n.key.toLowerCase().includes(q) || n.sample.toLowerCase().includes(q) || kids.length > 0) {
      out.push({ ...n, children: kids.length > 0 ? kids : n.children })
    }
  }
  return out
}

/** Lowercase, alphanumeric-only form for fuzzy matching of field names. */
export function normKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}
