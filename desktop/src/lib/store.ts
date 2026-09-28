import { create } from 'zustand'
import { blockInfo } from './blocks'
import { EMPTY_ID, SAMPLE_ID, STRESS_ID, dataSets, isGeneratedSet, newDocument, normalizeDocument } from './defaults'
import { duplicateBlock, findBlock, flatIds, insertBlock, type Location, moveBlock, newId, removeBlock, updateBlock } from './doc-ops'
import type { Block, BlockType, DataSet, ReportDocument } from './types'

const HISTORY_LIMIT = 200
/** Edits to the same field within this window merge into one undo step. */
const COALESCE_MS = 800

export type Panel = 'outline' | 'library' | 'data'

export interface Toast {
  id: number
  kind: 'info' | 'success' | 'error'
  text: string
}

interface State {
  doc: ReportDocument
  filePath: string | null
  dirty: boolean
  /** true while the welcome gallery is shown */
  welcome: boolean
  selectedId: string | null
  hoveredId: string | null
  past: ReportDocument[]
  future: ReportDocument[]
  lastEdit: { key: string; at: number } | null
  activeDataSet: string
  leftPanel: Panel
  zoom: number
  paletteOpen: boolean
  documentSettingsOpen: boolean
  toasts: Toast[]

  load: (doc: ReportDocument, path: string | null) => void
  newFromStarter: (template: string, data: string) => void
  closeWelcome: () => void
  showWelcome: () => void
  markSaved: (path: string) => void
  /** Apply a change; `key` coalesces rapid edits of the same field into one undo step. */
  change: (fn: (d: ReportDocument) => ReportDocument, key?: string) => void
  undo: () => void
  redo: () => void
  select: (id: string | null) => void
  hover: (id: string | null) => void
  selectRelative: (delta: number) => void
  insert: (type: BlockType, at?: Location) => void
  remove: (id: string) => void
  duplicate: (id: string) => void
  move: (id: string, to: Location) => void
  nudge: (id: string, delta: -1 | 1) => void
  updateBlock: (id: string, patch: Partial<Block> | ((b: Block) => Block), key?: string) => void
  setActiveDataSet: (id: string) => void
  setDataSetData: (id: string, data: unknown) => void
  addDataSet: (name: string, data: unknown) => void
  removeDataSet: (id: string) => void
  setLeftPanel: (p: Panel) => void
  setZoom: (z: number) => void
  setPaletteOpen: (v: boolean) => void
  setDocumentSettingsOpen: (v: boolean) => void
  toast: (kind: Toast['kind'], text: string) => void
  dismissToast: (id: number) => void
}

let toastId = 0

export const useStore = create<State>((set, get) => ({
  doc: newDocument(),
  filePath: null,
  dirty: false,
  welcome: true,
  selectedId: null,
  hoveredId: null,
  past: [],
  future: [],
  lastEdit: null,
  activeDataSet: SAMPLE_ID,
  leftPanel: 'outline',
  zoom: 1,
  paletteOpen: false,
  documentSettingsOpen: false,
  toasts: [],

  load: (doc, path) =>
    set({
      doc: normalizeDocument(doc),
      filePath: path,
      dirty: false,
      welcome: false,
      selectedId: null,
      past: [],
      future: [],
      lastEdit: null,
      activeDataSet: doc.editor?.activeDataSet ?? SAMPLE_ID,
    }),

  newFromStarter: (template, data) => {
    const raw = JSON.parse(template) as ReportDocument
    raw.sampleData = JSON.parse(data)
    get().load(raw, null)
    set({ dirty: true })
  },

  closeWelcome: () => set({ welcome: false }),
  showWelcome: () => set({ welcome: true }),
  markSaved: (path) => set({ filePath: path, dirty: false }),

  change: (fn, key) => {
    const { doc, past, lastEdit } = get()
    const next = fn(doc)
    if (next === doc) return
    const now = Date.now()
    const coalesce = !!key && lastEdit?.key === key && now - lastEdit.at < COALESCE_MS
    set({
      doc: next,
      dirty: true,
      past: coalesce ? past : [...past, doc].slice(-HISTORY_LIMIT),
      future: [],
      lastEdit: key ? { key, at: now } : null,
    })
  },

  undo: () => {
    const { past, doc, future, selectedId } = get()
    const prev = past.at(-1)
    if (!prev) return
    set({
      doc: prev,
      past: past.slice(0, -1),
      future: [doc, ...future],
      dirty: true,
      lastEdit: null,
      selectedId: selectedId && findBlock(prev, selectedId) ? selectedId : null,
    })
  },

  redo: () => {
    const { past, doc, future, selectedId } = get()
    const next = future[0]
    if (!next) return
    set({
      doc: next,
      past: [...past, doc],
      future: future.slice(1),
      dirty: true,
      lastEdit: null,
      selectedId: selectedId && findBlock(next, selectedId) ? selectedId : null,
    })
  },

  select: (id) => set({ selectedId: id }),
  hover: (id) => set({ hoveredId: id }),

  selectRelative: (delta) => {
    const { doc, selectedId } = get()
    const ids = flatIds(doc)
    if (ids.length === 0) return
    const i = selectedId ? ids.indexOf(selectedId) : -1
    const next = ids[Math.max(0, Math.min(ids.length - 1, i < 0 ? 0 : i + delta))]
    set({ selectedId: next })
  },

  insert: (type, at) => {
    const { doc, selectedId } = get()
    const block = { ...blockInfo(type).create(), id: newId() } as Block
    let loc: Location = at ?? { region: 'body', index: doc.body.length }
    if (!at && selectedId) {
      const found = findBlock(doc, selectedId)
      if (found) {
        // Insert into an empty selected container, else right after the selection.
        const b = found.block
        if (b.type === 'section' && b.blocks.length === 0) loc = { region: found.loc.region, parentId: b.id, index: 0 }
        else loc = { ...found.loc, index: found.loc.index + 1 }
      }
    }
    get().change((d) => insertBlock(d, block, loc))
    set({ selectedId: block.id })
  },

  remove: (id) => {
    const found = findBlock(get().doc, id)
    if (!found) return
    // Prefer the previous sibling, then the next one, then the parent.
    const siblings = found.loc.parentId
      ? (() => {
          const p = findBlock(get().doc, found.loc.parentId!)!.block
          if (p.type === 'section') return p.blocks
          if (p.type === 'columns') return p.columns[found.loc.column ?? 0].blocks
          return []
        })()
      : get().doc[found.loc.region]
    const neighbour = siblings[found.loc.index - 1] ?? siblings[found.loc.index + 1]
    get().change((d) => removeBlock(d, id))
    set({ selectedId: neighbour?.id ?? found.loc.parentId ?? null })
  },

  duplicate: (id) => {
    let created: string | null = null
    get().change((d) => {
      const r = duplicateBlock(d, id)
      created = r.newId
      return r.doc
    })
    if (created) set({ selectedId: created })
  },

  move: (id, to) => get().change((d) => moveBlock(d, id, to)),

  nudge: (id, delta) => {
    const found = findBlock(get().doc, id)
    if (!found) return
    const target = found.loc.index + (delta > 0 ? 2 : -1)
    if (target < 0) return
    get().move(id, { ...found.loc, index: target })
  },

  updateBlock: (id, patch, key) =>
    get().change(
      (d) => updateBlock(d, id, (b) => (typeof patch === 'function' ? patch(b) : ({ ...b, ...patch } as Block))),
      key ? `${id}:${key}` : undefined,
    ),

  setActiveDataSet: (id) =>
    set((s) => ({ activeDataSet: id, doc: { ...s.doc, editor: { ...s.doc.editor, activeDataSet: id } } })),

  setDataSetData: (id, data) => {
    if (isGeneratedSet(id)) return
    if (id === SAMPLE_ID) {
      get().change((d) => ({ ...d, sampleData: data }), 'data:sample')
      return
    }
    get().change(
      (d) => ({
        ...d,
        editor: { ...d.editor, dataSets: (d.editor?.dataSets ?? []).map((s) => (s.id === id ? { ...s, data } : s)) },
      }),
      `data:${id}`,
    )
  },

  addDataSet: (name, data) => {
    const ds: DataSet = { id: newId('ds'), name, data }
    get().change((d) => ({ ...d, editor: { ...d.editor, dataSets: [...(d.editor?.dataSets ?? []), ds] } }))
    set({ activeDataSet: ds.id })
  },

  removeDataSet: (id) => {
    get().change((d) => ({ ...d, editor: { ...d.editor, dataSets: (d.editor?.dataSets ?? []).filter((s) => s.id !== id) } }))
    if (get().activeDataSet === id) set({ activeDataSet: SAMPLE_ID })
  },

  setLeftPanel: (p) => set({ leftPanel: p }),
  setZoom: (z) => set({ zoom: Math.max(0.3, Math.min(3, Math.round(z * 100) / 100)) }),
  setPaletteOpen: (v) => set({ paletteOpen: v }),
  setDocumentSettingsOpen: (v) => set({ documentSettingsOpen: v }),

  toast: (kind, text) => {
    const id = ++toastId
    set((s) => ({ toasts: [...s.toasts, { id, kind, text }] }))
    setTimeout(() => get().dismissToast(id), kind === 'error' ? 7000 : 3500)
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

/** The data currently driving the preview. */
export function activeData(doc: ReportDocument, id: string): unknown {
  const sets = dataSets(doc)
  return (sets.find((s) => s.id === id) ?? sets[0]).data
}

export { EMPTY_ID, SAMPLE_ID, STRESS_ID }

/** Serialize for saving: drops nothing, pretty-printed. */
export function serialize(doc: ReportDocument): string {
  return JSON.stringify(doc, null, 2) + '\n'
}
