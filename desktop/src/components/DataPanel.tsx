import { Braces, Calendar, ChartLine, ChevronDown, ChevronRight, CircleAlert, FileJson, Hash, List, Plus, Search, ToggleLeft, Trash2, TriangleAlert, Type, Upload, BadgeCheck, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { loadDataFile } from '../lib/actions'
import { type FieldKind, type FieldNode, filterFields } from '../lib/data-model'
import { dataSets, isGeneratedSet } from '../lib/defaults'
import { beginDrag } from '../lib/dnd'
import { usePreview } from '../lib/preview'
import { useStore } from '../lib/store'
import { useFieldTree } from '../lib/use-fields'
import type { Issue } from '../lib/types'
import { Select } from './fields'

const NO_ISSUES: Issue[] = []

export const KIND_ICON: Record<FieldKind, typeof Type> = {
  text: Type,
  number: Hash,
  boolean: ToggleLeft,
  date: Calendar,
  status: BadgeCheck,
  list: List,
  numbers: ChartLine,
  object: Braces,
  empty: Type,
}

export const KIND_LABEL: Record<FieldKind, string> = {
  text: 'Text',
  number: 'Number',
  boolean: 'Yes / no',
  date: 'Date and time',
  status: 'Pass / fail',
  list: 'List',
  numbers: 'List of numbers',
  object: 'Group of fields',
  empty: 'Empty',
}

export function DataPanel() {
  const doc = useStore((s) => s.doc)
  const active = useStore((s) => s.activeDataSet)
  const setActive = useStore((s) => s.setActiveDataSet)
  const addSet = useStore((s) => s.addDataSet)
  const removeSet = useStore((s) => s.removeDataSet)
  const toast = useStore((s) => s.toast)
  const sets = useMemo(() => dataSets(doc), [doc])
  const current = sets.find((s) => s.id === active) ?? sets[0]
  const readOnly = isGeneratedSet(current.id)
  const [jsonOpen, setJsonOpen] = useState(false)
  const [q, setQ] = useState('')
  const tree = useFieldTree()
  const shown = useMemo(() => filterFields(tree, q), [tree, q])

  return (
    <>
      <div className="sidebar-head" style={{ paddingTop: 0 }}>
        <div className="row">
          <Select value={current.id} options={sets.map((s) => ({ value: s.id, label: s.name }))} onChange={setActive} ariaLabel="Active data set" />
          <button className="btn icon bordered" title="Load a JSON or CSV file as a new data set" onClick={loadDataFile}>
            <Upload size={14} />
          </button>
          <button
            className="btn icon bordered"
            title="Duplicate as a new data set"
            onClick={() => {
              addSet(`${current.name} copy`, structuredClone(current.data))
              toast('success', 'Data set added')
            }}
          >
            <Plus size={14} />
          </button>
          {!readOnly && current.id !== 'sample' && (
            <button className="btn icon bordered danger" title="Delete this data set" onClick={() => removeSet(current.id)}>
              <Trash2 size={14} />
            </button>
          )}
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <div className="search grow-1">
            <Search size={13} color="var(--text-3)" />
            <input placeholder="Search fields" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search fields" />
            {q && (
              <button className="btn icon small" style={{ width: 18, height: 18 }} title="Clear" onClick={() => setQ('')}>
                <X size={11} />
              </button>
            )}
          </div>
          <button className="btn small bordered" onClick={() => setJsonOpen(true)} title="View or edit the raw JSON">
            <FileJson size={13} /> JSON
          </button>
        </div>
      </div>
      <div className="scroll">
        <Issues />
        <div className="section-label">
          Fields <span className="grow" />
          <span style={{ fontWeight: 400 }}>drag onto the page</span>
        </div>
        <div className="field-tree" role="tree">
          {shown.length === 0 && (
            <div className="hint" style={{ padding: '4px 10px' }}>
              {q ? `No fields match “${q}”.` : 'No data yet. Load a JSON file or edit the JSON.'}
            </div>
          )}
          {shown.map((n) => (
            <FieldRow key={n.path} node={n} depth={0} forceOpen={!!q} />
          ))}
        </div>
      </div>
      {jsonOpen && <JsonDialog id={current.id} name={current.name} data={current.data} readOnly={readOnly} onClose={() => setJsonOpen(false)} />}
    </>
  )
}

function FieldRow({ node, depth, forceOpen }: { node: FieldNode; depth: number; forceOpen: boolean }) {
  const expandable = node.children.length > 0
  const [open, setOpen] = useState(depth === 0 && node.kind === 'object')
  const useField = useStore((s) => s.useField)
  const Icon = KIND_ICON[node.kind]
  const isOpen = expandable && (open || forceOpen)
  return (
    <>
      <div
        className="field-row"
        style={{ paddingLeft: 6 + depth * 14 }}
        role="treeitem"
        aria-expanded={expandable ? isOpen : undefined}
        title={`${node.path}\n${KIND_LABEL[node.kind]} — drag onto the page or onto a block`}
        onPointerDown={(e) => beginDrag(e, { kind: 'field', node }, node.label)}
        onClick={() => expandable && setOpen(!open)}
      >
        <span className="chev">{expandable ? isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} /> : null}</span>
        <span className={`kind kind-${node.kind}`}>
          <Icon size={12} strokeWidth={2} />
        </span>
        <span className="k">{node.key}</span>
        <span className={`v v-${node.kind}`}>{node.sample}</span>
        <button
          className="btn icon small add"
          title="Use on the selected block, or add a block for it"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            useField(node)
          }}
        >
          <Plus size={12} />
        </button>
      </div>
      {isOpen && node.children.map((c) => <FieldRow key={c.path} node={c} depth={depth + 1} forceOpen={forceOpen} />)}
    </>
  )
}

export function Issues() {
  const issues = usePreview((s) => s.result?.issues ?? NO_ISSUES)
  const select = useStore((s) => s.select)
  const visible = issues.filter((i) => i.severity !== 'info')
  const [all, setAll] = useState(false)
  if (visible.length === 0) return null
  const list = all ? visible : visible.slice(0, 4)
  return (
    <div className="issues-top">
      <div className="section-label" style={{ paddingLeft: 2 }}>
        Needs attention <span className="grow" /> <span>{visible.length}</span>
      </div>
      {list.map((i, n) => (
        <div key={n} className={`issue ${i.severity}${i.blockId ? ' clickable' : ''}`} onClick={() => i.blockId && select(i.blockId)}>
          {i.severity === 'error' ? <CircleAlert size={14} /> : <TriangleAlert size={14} />}
          <div>
            {i.message}
            {i.field && <span className="where">{i.field}</span>}
          </div>
        </div>
      ))}
      {visible.length > 4 && (
        <button className="btn small" onClick={() => setAll(!all)}>
          {all ? 'Show fewer' : `Show all ${visible.length}`}
        </button>
      )}
    </div>
  )
}

function JsonDialog({ id, name, data, readOnly, onClose }: { id: string; name: string; data: unknown; readOnly: boolean; onClose: () => void }) {
  const setData = useStore((s) => s.setDataSetData)
  const [text, setText] = useState(() => JSON.stringify(data, null, 2))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const onEdit = (t: string) => {
    setText(t)
    try {
      setData(id, JSON.parse(t))
      setError(null)
    } catch (e) {
      setError((e as Error).message.replace(/^JSON\.parse: /, ''))
    }
  }

  return (
    <div className="scrim" onMouseDown={onClose}>
      <div className="dialog" role="dialog" aria-label="Data JSON" onMouseDown={(e) => e.stopPropagation()}>
        <div className="dialog-head">
          <strong>{name}</strong>
          <span className="hint">{readOnly ? 'Generated from the sample data. Duplicate the set to edit.' : 'The preview updates as you type.'}</span>
          <span className="grow" />
          <button className="btn icon" onClick={onClose} title="Close">
            <X size={15} />
          </button>
        </div>
        <textarea
          className="textarea code dialog-json"
          spellCheck={false}
          readOnly={readOnly}
          value={text}
          aria-label="Data JSON"
          onChange={(e) => onEdit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Tab') {
              e.preventDefault()
              const el = e.currentTarget
              const s = el.selectionStart
              onEdit(text.slice(0, s) + '  ' + text.slice(el.selectionEnd))
              requestAnimationFrame(() => el.setSelectionRange(s + 2, s + 2))
            }
          }}
        />
        <div className={`json-status${error ? ' bad' : ''}`}>{error ? <><CircleAlert size={12} /> {error}</> : 'Valid JSON'}</div>
      </div>
    </div>
  )
}
