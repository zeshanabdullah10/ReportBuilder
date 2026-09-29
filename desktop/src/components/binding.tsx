// Ways to point a block at data without typing expressions:
//  - TemplateEditor: text where {{ fields }} are chips showing live values
//  - BindingInput: a single field or list chosen from a picker (or dropped from the Data tab)

import { Braces, ChevronDown, Plus, Search, Sigma, X } from 'lucide-react'
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { type FieldNode, findField, isList, isScalar, walkFields } from '../lib/data-model'
import { registerZone, useDrag } from '../lib/dnd'
import { activeData, useStore } from '../lib/store'
import { useFieldTree } from '../lib/use-fields'
import { KIND_ICON, KIND_LABEL } from './DataPanel'
import { ExprInput, type LocalVar } from './fields'

// --- helpers ---------------------------------------------------------------

const SIMPLE_PATH = /^[A-Za-z_][\w]*(\.[A-Za-z_][\w]*)*$/

export function getPath(data: unknown, path: string): unknown {
  let cur: unknown = data
  for (const seg of path.split('.')) {
    if (cur && typeof cur === 'object' && !Array.isArray(cur) && seg in (cur as Record<string, unknown>)) cur = (cur as Record<string, unknown>)[seg]
    else return undefined
  }
  return cur
}

function clip(s: string, n = 26) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

function showValue(v: unknown): string | null {
  if (v === null || v === undefined || typeof v === 'object') return null
  return clip(typeof v === 'number' ? String(Math.round(v * 1e6) / 1e6) : String(v))
}

interface Candidate {
  path: string
  kind: FieldNode['kind']
  sample: string
  group: string
}

export type Accept = 'scalar' | 'list' | 'any'

/** Everything a binding can point at, including loop variables of enclosing repeated groups. */
export function candidates(tree: FieldNode[], accept: Accept, locals: LocalVar[] = [], onlyLocals = false): Candidate[] {
  const out: Candidate[] = []
  for (const l of locals) {
    if (l.fields.length === 0) continue
    for (const f of l.fields) out.push({ path: `${l.name}.${f}`, kind: 'text', sample: '', group: `Inside this group (${l.name})` })
  }
  if (onlyLocals) return out
  walkFields(tree, (n) => {
    if (n.path.includes('[]')) return
    if (accept === 'scalar' && !isScalar(n)) return
    if (accept === 'list' && !isList(n)) return
    if (accept === 'any' && n.kind === 'empty') return
    out.push({ path: n.path, kind: n.kind, sample: n.sample, group: 'Your data' })
  })
  return out
}

// --- drop target hook --------------------------------------------------------

/** Make an element accept fields dragged from the Data tab. Returns true while a field hovers it. */
export function useFieldDrop(ref: React.RefObject<HTMLElement | null>, onField: (node: FieldNode) => void, accept: Accept = 'any'): boolean {
  const key = useId()
  const cb = useRef(onField)
  cb.current = onField
  useEffect(
    () =>
      registerZone(`picker:${key}`, (x, y, payload) => {
        if (payload.kind !== 'field') return null
        const el = ref.current
        if (!el) return null
        const r = el.getBoundingClientRect()
        if (x < r.left || x > r.right || y < r.top || y > r.bottom) return null
        const n = payload.node
        if ((accept === 'scalar' && !isScalar(n)) || (accept === 'list' && !isList(n))) return { target: null, indicator: null, hint: accept === 'list' ? 'Needs a list' : 'Needs a single value' }
        return { target: { kind: 'custom', run: (p) => p.kind === 'field' && cb.current(p.node) }, indicator: { zone: 'picker', key }, hint: 'Use this field' }
      }),
    [key, ref, accept],
  )
  return useDrag((s) => s.drag?.indicator?.zone === 'picker' && s.drag.indicator.key === key)
}

// --- picker popover ------------------------------------------------------------

function PickerPopover({ accept, locals, onlyLocals, onPick, onClose }: { accept: Accept; locals?: LocalVar[]; onlyLocals?: boolean; onPick: (path: string) => void; onClose: () => void }) {
  const tree = useFieldTree()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const all = useMemo(() => candidates(tree, accept, locals, onlyLocals), [tree, accept, locals, onlyLocals])
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase()
    return t ? all.filter((c) => c.path.toLowerCase().includes(t) || c.sample.toLowerCase().includes(t)) : all
  }, [all, q])

  useEffect(() => inputRef.current?.focus(), [])
  useEffect(() => setActive(0), [q])
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) onClose()
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [onClose])
  useEffect(() => {
    rootRef.current?.querySelector('.pick-item.active')?.scrollIntoView({ block: 'nearest' })
  }, [active])

  let last = ''
  return (
    <div className="picker" ref={rootRef} role="listbox">
      <div className="picker-search">
        <Search size={13} color="var(--text-3)" />
        <input
          ref={inputRef}
          value={q}
          placeholder="Search fields"
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActive((a) => Math.min(rows.length - 1, a + 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((a) => Math.max(0, a - 1))
            } else if (e.key === 'Enter') {
              e.preventDefault()
              if (rows[active]) onPick(rows[active].path)
            } else if (e.key === 'Escape') {
              e.stopPropagation()
              onClose()
            }
          }}
        />
      </div>
      <div className="picker-list">
        {rows.length === 0 && (
          <div className="hint" style={{ padding: 10 }}>
            {all.length === 0 ? (accept === 'list' ? 'No lists in this data.' : 'No fields in this data.') : `Nothing matches “${q}”.`}
          </div>
        )}
        {rows.map((r, i) => {
          const head = r.group !== last ? <div className="palette-group">{r.group}</div> : null
          last = r.group
          const Icon = KIND_ICON[r.kind]
          return (
            <div key={r.path}>
              {head}
              <div className={`pick-item${i === active ? ' active' : ''}`} role="option" aria-selected={i === active} onMouseEnter={() => setActive(i)} onMouseDown={(e) => { e.preventDefault(); onPick(r.path) }}>
                <span className={`kind kind-${r.kind}`}><Icon size={12} strokeWidth={2} /></span>
                <span className="p">{r.path}</span>
                <span className="s">{r.sample}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// --- BindingInput ---------------------------------------------------------------

/** A bare-expression field (a list to loop over, a value to show). Pick it, drop it, or switch to typing. */
export function BindingInput(props: {
  value: string
  onChange: (v: string) => void
  accept?: Accept
  locals?: LocalVar[]
  /** Offer only the locals (e.g. the fields of a table row), not the whole data set. */
  onlyLocals?: boolean
  placeholder?: string
  ariaLabel?: string
}) {
  const accept = props.accept ?? 'any'
  const tree = useFieldTree()
  const [open, setOpen] = useState(false)
  const complex = props.value.trim() !== '' && !SIMPLE_PATH.test(props.value.trim())
  const [typing, setTyping] = useState(complex)
  const ref = useRef<HTMLDivElement>(null)
  const dropping = useFieldDrop(ref, (n) => props.onChange(n.path.replace(/\[\]\./g, '.')), accept)

  useEffect(() => {
    if (complex) setTyping(true)
  }, [complex])

  if (typing) {
    return (
      <div className="binding-typing" ref={ref}>
        <div className={dropping ? 'drop-hot' : ''}>
          <ExprInput value={props.value} onChange={props.onChange} locals={props.locals} placeholder={props.placeholder} ariaLabel={props.ariaLabel} />
        </div>
        {!complex && (
          <button className="btn small" title="Pick a field instead of typing" onClick={() => setTyping(false)}>
            <Braces size={12} /> Pick
          </button>
        )}
      </div>
    )
  }

  const node = props.value ? findField(tree, props.value) : null
  const data = activeData(useStore.getState().doc, useStore.getState().activeDataSet)
  const sample = node?.sample ?? showValue(getPath(data, props.value)) ?? ''
  const Icon = node ? KIND_ICON[node.kind] : null
  return (
    <div className={`binding${dropping ? ' drop-hot' : ''}`} ref={ref}>
      <button className={`binding-btn${props.value ? '' : ' empty'}`} aria-label={props.ariaLabel} onClick={() => setOpen(!open)} title={node ? `${KIND_LABEL[node.kind]}` : undefined}>
        {props.value ? (
          <>
            {Icon && <span className={`kind kind-${node!.kind}`}><Icon size={12} strokeWidth={2} /></span>}
            <span className="p">{props.value}</span>
            {sample && <span className="s">{sample}</span>}
          </>
        ) : (
          <span className="p">{props.placeholder ? `e.g. ${props.placeholder}` : 'Choose a field…'}</span>
        )}
        <ChevronDown size={12} />
      </button>
      {props.value && (
        <button className="btn icon small" title="Clear" onClick={() => props.onChange('')}>
          <X size={12} />
        </button>
      )}
      <button className="btn icon small" title="Type an expression instead" onClick={() => setTyping(true)}>
        <Sigma size={12} />
      </button>
      {open && (
        <PickerPopover
          accept={accept}
          locals={props.locals}
          onlyLocals={props.onlyLocals}
          onClose={() => setOpen(false)}
          onPick={(p) => {
            props.onChange(p)
            setOpen(false)
          }}
        />
      )}
    </div>
  )
}

// --- TemplateEditor ---------------------------------------------------------------

const TOKEN = /\{\{\s*([^{}]*?)\s*\}\}/g

function chipLabel(expr: string, data: unknown, locals: LocalVar[]): { text: string; missing: boolean } {
  if (SIMPLE_PATH.test(expr)) {
    const first = expr.split('.')[0]
    const local = locals.some((l) => l.name === first) || ['item', 'row', 'number', 'index', 'page', 'pages', 'report', 'theme'].includes(first)
    if (!local) {
      const v = getPath(data, expr)
      const s = showValue(v)
      if (s !== null) return { text: s, missing: false }
      return { text: expr, missing: v === undefined }
    }
  }
  return { text: expr, missing: false }
}

function makeChip(expr: string, data: unknown, locals: LocalVar[]): HTMLElement {
  const { text, missing } = chipLabel(expr, data, locals)
  const el = document.createElement('span')
  el.className = `chip${missing ? ' chip-missing' : ''}`
  el.contentEditable = 'false'
  el.dataset.expr = expr
  el.title = missing ? `${expr} — not found in this data` : expr
  el.textContent = text
  return el
}

function build(root: HTMLElement, value: string, data: unknown, locals: LocalVar[]) {
  root.textContent = ''
  let last = 0
  const text = (s: string) => {
    const lines = s.split('\n')
    lines.forEach((ln, i) => {
      if (i > 0) root.appendChild(document.createElement('br'))
      if (ln) root.appendChild(document.createTextNode(ln))
    })
  }
  for (const m of value.matchAll(TOKEN)) {
    text(value.slice(last, m.index))
    root.appendChild(makeChip(m[1], data, locals))
    last = m.index! + m[0].length
  }
  text(value.slice(last))
}

function serialize(root: HTMLElement): string {
  let out = ''
  const walk = (n: Node) => {
    n.childNodes.forEach((c) => {
      if (c.nodeType === Node.TEXT_NODE) out += (c.nodeValue ?? '').replace(/ /g, ' ')
      else if (c instanceof HTMLElement) {
        if (c.dataset.expr !== undefined) out += `{{ ${c.dataset.expr} }}`
        else if (c.tagName === 'BR') out += '\n'
        else {
          if (out && !out.endsWith('\n')) out += '\n'
          walk(c)
        }
      }
    })
  }
  walk(root)
  // A trailing <br> is the browser's caret placeholder, not a newline.
  if (out.endsWith('\n') && root.lastChild instanceof HTMLElement && root.lastChild.tagName === 'BR') out = out.slice(0, -1)
  return out
}

/** Text with {{ field }} tokens shown as chips. Type `{` or use “+ Field” to insert one; drag a field in from the Data tab. */
export function TemplateEditor(props: {
  value: string
  onChange: (v: string) => void
  multiline?: boolean
  rows?: number
  placeholder?: string
  locals?: LocalVar[]
  ariaLabel?: string
  autoFocus?: boolean
  onDone?: () => void
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const emitted = useRef<string | null>(null)
  const range = useRef<Range | null>(null)
  const [picker, setPicker] = useState(false)
  const data = useStore((s) => activeData(s.doc, s.activeDataSet))
  const locals = props.locals ?? []
  const localsKey = locals.map((l) => l.name).join(',')

  const sync = useCallback(() => {
    const el = ref.current
    if (!el) return
    build(el, props.value, data, locals)
    emitted.current = props.value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.value, data, localsKey])

  // Rebuild when the value changed from outside (or the data behind the chips did), never while typing.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const typing = document.activeElement === el && emitted.current === props.value
    if (!typing) sync()
  }, [props.value, data, sync])

  useEffect(() => {
    if (props.autoFocus) {
      const el = ref.current
      el?.focus()
      if (el) {
        const r = document.createRange()
        r.selectNodeContents(el)
        r.collapse(false)
        const s = window.getSelection()
        s?.removeAllRanges()
        s?.addRange(r)
      }
    }
  }, [props.autoFocus])

  const emit = () => {
    const el = ref.current
    if (!el) return
    const v = serialize(el)
    if (v === emitted.current) return
    emitted.current = v
    props.onChange(v)
  }

  const remember = () => {
    const s = window.getSelection()
    if (s && s.rangeCount && ref.current?.contains(s.anchorNode)) range.current = s.getRangeAt(0).cloneRange()
  }

  const insertChip = (expr: string) => {
    const el = ref.current
    if (!el) return
    el.focus()
    const chip = makeChip(expr, data, locals)
    const s = window.getSelection()
    const r = range.current && el.contains(range.current.startContainer) ? range.current : null
    if (r) {
      s?.removeAllRanges()
      s?.addRange(r)
      r.deleteContents()
      r.insertNode(chip)
    } else {
      el.appendChild(chip)
    }
    const after = document.createRange()
    after.setStartAfter(chip)
    after.collapse(true)
    s?.removeAllRanges()
    s?.addRange(after)
    range.current = after.cloneRange()
    emit()
  }

  const dropping = useFieldDrop(wrapRef, (n) => insertChip(n.path.replace(/\[\]\./g, '.')), 'scalar')

  return (
    <div className={`tpl-wrap${dropping ? ' drop-hot' : ''}`} ref={wrapRef}>
      <div
        ref={ref}
        className={`tpl-editor ${props.multiline ? 'multi' : 'single'} ${props.className ?? ''}`}
        style={props.multiline ? { minHeight: (props.rows ?? 3) * 19 + 12 } : undefined}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline={!!props.multiline}
        aria-label={props.ariaLabel}
        data-placeholder={props.placeholder ?? ''}
        spellCheck
        onInput={emit}
        onKeyUp={remember}
        onMouseUp={remember}
        onBlur={(e) => {
          remember()
          emit()
          // Focus moving into this editor's own field picker is not "finished editing".
          if (wrapRef.current?.contains(e.relatedTarget as Node | null)) return
          // Turn any freshly typed {{ field }} into a chip.
          build(e.currentTarget, serialize(e.currentTarget), data, locals)
          props.onDone?.()
        }}
        onPaste={(e) => {
          e.preventDefault()
          const t = e.clipboardData.getData('text/plain')
          document.execCommand('insertText', false, props.multiline ? t : t.replace(/\s*\n\s*/g, ' '))
        }}
        onKeyDown={(e) => {
          if (e.key === '{') {
            e.preventDefault()
            remember()
            setPicker(true)
          } else if (e.key === 'Enter') {
            e.preventDefault()
            if (props.multiline && !(e.metaKey || e.ctrlKey)) document.execCommand('insertLineBreak')
            else (e.currentTarget as HTMLElement).blur()
          } else if (e.key === 'Escape') {
            e.stopPropagation()
            ;(e.currentTarget as HTMLElement).blur()
          }
        }}
      />
      <button
        className="tpl-add"
        title="Insert a field ({)"
        onMouseDown={(e) => {
          e.preventDefault()
          remember()
          setPicker(true)
        }}
      >
        <Plus size={11} strokeWidth={2.5} /> Field
      </button>
      {picker && (
        <PickerPopover
          accept="scalar"
          locals={locals}
          onClose={() => setPicker(false)}
          onPick={(p) => {
            setPicker(false)
            insertChip(p)
          }}
        />
      )}
    </div>
  )
}
