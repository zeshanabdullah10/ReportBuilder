// Pure, immutable operations on the document tree.

import type { Block, Region, ReportDocument } from './types'

/** Where a block list lives: a region root, a section, or one column of a columns block. */
export interface ListRef {
  region: Region
  /** Owning block id (section or columns); undefined for the region root. */
  parentId?: string
  /** Column index when the parent is a columns block. */
  column?: number
}

export interface Location extends ListRef {
  index: number
}

let counter = 0
export function newId(prefix = 'b'): string {
  counter = (counter + 1) % 1_000_000
  return `${prefix}${Date.now().toString(36).slice(-4)}${Math.random().toString(36).slice(2, 6)}${counter.toString(36)}`
}

export function childLists(b: Block): Block[][] {
  if (b.type === 'section') return [b.blocks]
  if (b.type === 'columns') return b.columns.map((c) => c.blocks)
  return []
}

const REGIONS: Region[] = ['header', 'body', 'footer']

/** Depth-first search for a block and its location. */
export function findBlock(doc: ReportDocument, id: string): { block: Block; loc: Location; path: Block[] } | null {
  const visit = (list: Block[], ref: ListRef, path: Block[]): { block: Block; loc: Location; path: Block[] } | null => {
    for (let i = 0; i < list.length; i++) {
      const b = list[i]
      if (b.id === id) return { block: b, loc: { ...ref, index: i }, path }
      if (b.type === 'section') {
        const r = visit(b.blocks, { region: ref.region, parentId: b.id }, [...path, b])
        if (r) return r
      } else if (b.type === 'columns') {
        for (let c = 0; c < b.columns.length; c++) {
          const r = visit(b.columns[c].blocks, { region: ref.region, parentId: b.id, column: c }, [...path, b])
          if (r) return r
        }
      }
    }
    return null
  }
  for (const region of REGIONS) {
    const r = visit(doc[region], { region }, [])
    if (r) return r
  }
  return null
}

function mapList(list: Block[], fn: (b: Block) => Block): Block[] {
  return list.map((b) => {
    let nb = fn(b)
    if (nb.type === 'section') nb = { ...nb, blocks: mapList(nb.blocks, fn) }
    else if (nb.type === 'columns') nb = { ...nb, columns: nb.columns.map((c) => ({ ...c, blocks: mapList(c.blocks, fn) })) }
    return nb
  })
}

/** Replace a block by id. */
export function updateBlock(doc: ReportDocument, id: string, fn: (b: Block) => Block): ReportDocument {
  const f = (b: Block) => (b.id === id ? fn(b) : b)
  return { ...doc, header: mapList(doc.header, f), body: mapList(doc.body, f), footer: mapList(doc.footer, f) }
}

function getList(doc: ReportDocument, ref: ListRef): Block[] | null {
  if (!ref.parentId) return doc[ref.region]
  const found = findBlock(doc, ref.parentId)
  if (!found) return null
  const p = found.block
  if (p.type === 'section') return p.blocks
  if (p.type === 'columns') return p.columns[ref.column ?? 0]?.blocks ?? null
  return null
}

function setList(doc: ReportDocument, ref: ListRef, list: Block[]): ReportDocument {
  if (!ref.parentId) return { ...doc, [ref.region]: list }
  return updateBlock(doc, ref.parentId, (p) => {
    if (p.type === 'section') return { ...p, blocks: list }
    if (p.type === 'columns') {
      const columns = p.columns.map((c, i) => (i === (ref.column ?? 0) ? { ...c, blocks: list } : c))
      return { ...p, columns }
    }
    return p
  })
}

export function insertBlock(doc: ReportDocument, block: Block, at: Location): ReportDocument {
  const list = getList(doc, at)
  if (!list) return doc
  const next = [...list]
  next.splice(Math.max(0, Math.min(at.index, next.length)), 0, block)
  return setList(doc, at, next)
}

export function removeBlock(doc: ReportDocument, id: string): ReportDocument {
  const found = findBlock(doc, id)
  if (!found) return doc
  const list = getList(doc, found.loc)!
  return setList(doc, found.loc, list.filter((b) => b.id !== id))
}

/** True when `id` is `ancestorId` or nested inside it. */
export function isWithin(doc: ReportDocument, id: string, ancestorId: string): boolean {
  if (id === ancestorId) return true
  const found = findBlock(doc, id)
  return !!found?.path.some((p) => p.id === ancestorId)
}

/** Move a block to a new location. `to.index` refers to the target list before removal. */
export function moveBlock(doc: ReportDocument, id: string, to: Location): ReportDocument {
  const found = findBlock(doc, id)
  if (!found) return doc
  if (to.parentId && isWithin(doc, to.parentId, id)) return doc // can't move into itself
  const sameList =
    found.loc.region === to.region && found.loc.parentId === to.parentId && (found.loc.column ?? 0) === (to.column ?? 0)
  let index = to.index
  if (sameList && found.loc.index < index) index -= 1
  const without = removeBlock(doc, id)
  return insertBlock(without, found.block, { ...to, index })
}

export function cloneWithNewIds(b: Block): Block {
  const copy = structuredClone(b) as Block
  const walk = (x: Block) => {
    x.id = newId()
    childLists(x).forEach((l) => l.forEach(walk))
  }
  walk(copy)
  return copy
}

export function duplicateBlock(doc: ReportDocument, id: string): { doc: ReportDocument; newId: string | null } {
  const found = findBlock(doc, id)
  if (!found) return { doc, newId: null }
  const copy = cloneWithNewIds(found.block)
  return { doc: insertBlock(doc, copy, { ...found.loc, index: found.loc.index + 1 }), newId: copy.id }
}

/** All block ids in visual order. */
export function flatIds(doc: ReportDocument): string[] {
  const out: string[] = []
  const walk = (list: Block[]) =>
    list.forEach((b) => {
      out.push(b.id)
      childLists(b).forEach(walk)
    })
  REGIONS.forEach((r) => walk(doc[r]))
  return out
}

/** Give every block a unique id (templates from disk may lack them). */
export function ensureIds(doc: ReportDocument): ReportDocument {
  const seen = new Set<string>()
  const fix = (list: Block[]): Block[] =>
    list.map((b) => {
      let id = b.id
      if (!id || seen.has(id) || !/^[A-Za-z0-9_-]+$/.test(id)) id = newId()
      seen.add(id)
      let nb = { ...b, id } as Block
      if (nb.type === 'section') nb = { ...nb, blocks: fix(nb.blocks) }
      if (nb.type === 'columns') nb = { ...nb, columns: nb.columns.map((c) => ({ ...c, blocks: fix(c.blocks) })) }
      return nb
    })
  return { ...doc, header: fix(doc.header ?? []), body: fix(doc.body ?? []), footer: fix(doc.footer ?? []) }
}
