import { ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { usePreview } from '../lib/preview'
import type { DataPath } from '../lib/types'

export function Field({ label, hint, stack, children }: { label: ReactNode; hint?: ReactNode; stack?: boolean; children: ReactNode }) {
  return (
    <div className={`field${stack ? ' stack' : ''}`}>
      <label>{label}</label>
      <div>
        {children}
        {hint && <div className="hint" style={{ marginTop: 4 }}>{hint}</div>}
      </div>
    </div>
  )
}

export function Group({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="group">
      <div className="group-title">
        <span className="grow">{title}</span>
        {action}
      </div>
      {children}
    </div>
  )
}

/** A collapsed-by-default section for less common settings. */
export function Disclosure({ title, note, defaultOpen, children }: { title: string; note?: string; defaultOpen?: boolean; children: ReactNode }) {
  return (
    <details className="disclosure" open={defaultOpen}>
      <summary>
        <span className="chev"><ChevronRight size={12} /></span>
        {title}
        {note && <span className="note">{note}</span>}
      </summary>
      <div className="group">{children}</div>
    </details>
  )
}

export function TextInput(props: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  code?: boolean
  multiline?: boolean
  rows?: number
  ariaLabel?: string
}) {
  const cls = `${props.multiline ? 'textarea' : 'input'}${props.code ? ' code' : ''}`
  return props.multiline ? (
    <textarea
      className={cls}
      rows={props.rows ?? 3}
      value={props.value}
      placeholder={props.placeholder}
      aria-label={props.ariaLabel}
      spellCheck={!props.code}
      onChange={(e) => props.onChange(e.target.value)}
    />
  ) : (
    <input
      className={cls}
      value={props.value}
      placeholder={props.placeholder}
      aria-label={props.ariaLabel}
      spellCheck={false}
      onChange={(e) => props.onChange(e.target.value)}
    />
  )
}

export function NumberInput(props: { value: number | undefined; onChange: (v: number) => void; min?: number; max?: number; step?: number; unit?: string; placeholder?: string }) {
  const [text, setText] = useState(props.value === undefined ? '' : String(props.value))
  useEffect(() => setText(props.value === undefined ? '' : String(props.value)), [props.value])
  const commit = (t: string) => {
    const n = Number(t)
    if (t.trim() === '' || Number.isNaN(n)) return
    let v = n
    if (props.min !== undefined) v = Math.max(props.min, v)
    if (props.max !== undefined) v = Math.min(props.max, v)
    props.onChange(v)
  }
  return (
    <div className="unit-input">
      <input
        className="input"
        inputMode="decimal"
        value={text}
        placeholder={props.placeholder}
        onChange={(e) => {
          setText(e.target.value)
          commit(e.target.value)
        }}
        onKeyDown={(e) => {
          if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
          e.preventDefault()
          const step = (props.step ?? 1) * (e.shiftKey ? 10 : 1)
          const next = Math.round(((Number(text) || 0) + (e.key === 'ArrowUp' ? step : -step)) * 1000) / 1000
          setText(String(next))
          commit(String(next))
        }}
      />
      {props.unit && <span>{props.unit}</span>}
    </div>
  )
}

export function Select<T extends string | number>(props: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; ariaLabel?: string }) {
  return (
    <select
      className="select"
      aria-label={props.ariaLabel}
      value={String(props.value)}
      onChange={(e) => {
        const opt = props.options.find((o) => String(o.value) === e.target.value)
        if (opt) props.onChange(opt.value)
      }}
    >
      {props.options.map((o) => (
        <option key={String(o.value)} value={String(o.value)}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="toggle-row">
      <label>{label}</label>
      <span className="switch">
        <input type="checkbox" role="switch" aria-label={label} checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span />
      </span>
    </div>
  )
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: ReactNode; title?: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="segmented full" role="group">
      {options.map((o) => (
        <button key={o.value} title={o.title} aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

const TOKENS = ['text', 'muted', 'accent', 'pass', 'fail', 'warn']

export function ColorInput({ value, onChange, placeholder }: { value: string | undefined; onChange: (v: string | undefined) => void; placeholder?: string }) {
  const hex = value && /^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'
  return (
    <div className="color">
      <input type="color" value={hex} aria-label="Pick colour" onChange={(e) => onChange(e.target.value)} />
      <input
        className="input code"
        value={value ?? ''}
        placeholder={placeholder ?? 'default'}
        list="color-tokens"
        onChange={(e) => onChange(e.target.value.trim() === '' ? undefined : e.target.value)}
      />
      <datalist id="color-tokens">
        {TOKENS.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Expression input with autocomplete
// ---------------------------------------------------------------------------

export const FUNCTIONS: { name: string; sig: string; doc: string }[] = [
  { name: 'fixed', sig: 'fixed(x, decimals)', doc: 'Number with fixed decimals' },
  { name: 'round', sig: 'round(x, decimals)', doc: 'Round a number' },
  { name: 'percent', sig: 'percent(ratio, decimals)', doc: '0.934 → "93.4 %"' },
  { name: 'si', sig: 'si(x, "V", decimals)', doc: 'Engineering notation: 4.7 mV' },
  { name: 'date', sig: "date(x, 'YYYY-MM-DD HH:mm')", doc: 'Format a timestamp' },
  { name: 'duration', sig: 'duration(seconds)', doc: '"3 min 05 s"' },
  { name: 'len', sig: 'len(list)', doc: 'Number of items' },
  { name: 'sum', sig: "sum(list, 'field')", doc: 'Total of numbers' },
  { name: 'avg', sig: "avg(list, 'field')", doc: 'Mean' },
  { name: 'min', sig: "min(list, 'field')", doc: 'Minimum' },
  { name: 'max', sig: "max(list, 'field')", doc: 'Maximum' },
  { name: 'stdev', sig: "stdev(list, 'field')", doc: 'Sample standard deviation' },
  { name: 'cpk', sig: 'cpk(values, low, high)', doc: 'Process capability' },
  { name: 'verdict', sig: "verdict(list, 'status')", doc: 'Roll up PASS/FAIL' },
  { name: 'pass_rate', sig: "pass_rate(list, 'status')", doc: 'Share of passing rows (0–1)' },
  { name: 'count_if', sig: "count_if(list, 'field', value)", doc: 'Count matching rows' },
  { name: 'status', sig: 'status(value, low, high, margin)', doc: 'PASS/FAIL against limits; WARN within margin' },
  { name: 'limits', sig: "limits(low, high, 'V', decimals)", doc: '"4.75 … 5.25 V", "≥ 4.75 V"' },
  { name: 'with_unit', sig: "with_unit(value, 'V', decimals)", doc: '"4.988 V"; empty when missing' },
  { name: 'count_by', sig: "count_by(list, 'field')", doc: 'Pareto: [{key, count}], most first' },
  { name: 'group_by', sig: "group_by(list, 'field')", doc: '[{key, count, items}]' },
  { name: 'split', sig: "split(text, ',')", doc: 'Text to a list' },
  { name: 'lvtime', sig: 'lvtime(seconds)', doc: 'LabVIEW timestamp to a date' },
  { name: 'each', sig: "each(list, 'it.a * 2')", doc: 'Map with an expression' },
  { name: 'select', sig: "select(list, 'it.ok')", doc: 'Filter with an expression' },
  { name: 'count', sig: "count(list, 'it.v > 3')", doc: 'Count with an expression' },
  { name: 'where', sig: "where(list, 'field', value)", doc: 'Rows where field equals value' },
  { name: 'pluck', sig: "pluck(list, 'field')", doc: 'List of one field' },
  { name: 'join', sig: "join(list, ', ')", doc: 'Join into text' },
  { name: 'upper', sig: 'upper(text)', doc: 'Uppercase' },
  { name: 'default', sig: "default(x, 'n/a')", doc: 'Fallback when empty' },
  { name: 'now', sig: 'now()', doc: 'Render time' },
  { name: 'pad', sig: 'pad(n, width)', doc: 'Zero-pad: 007' },
]

export interface LocalVar {
  name: string
  /** Fields of the local, e.g. ["name", "value"] */
  fields: string[]
  doc: string
}

/** Fields of the items of a list expression, from the data paths (`list[].field`). */
export function itemFields(paths: DataPath[], source: string): string[] {
  const src = source.trim().replace(/^data\./, '')
  if (!/^[\w.[\]]+$/.test(src)) return []
  const prefix = `${src}[].`
  return paths.filter((p) => p.path.startsWith(prefix)).map((p) => p.path.slice(prefix.length)).filter((f) => !f.includes('[]'))
}

interface Suggestion { insert: string; label: string; kind: string }

function currentToken(text: string, caret: number, template: boolean): { start: number; token: string } | null {
  const before = text.slice(0, caret)
  if (template) {
    const open = before.lastIndexOf('{{')
    if (open < 0 || before.lastIndexOf('}}') > open) return null
  }
  const m = /[A-Za-z_$][\w$.[\]]*$/.exec(before)
  if (!m) return template && before.endsWith('{{ ') ? { start: caret, token: '' } : null
  return { start: caret - m[0].length, token: m[0] }
}

export function ExprInput(props: {
  value: string
  onChange: (v: string) => void
  template?: boolean
  locals?: LocalVar[]
  placeholder?: string
  multiline?: boolean
  rows?: number
  ariaLabel?: string
}) {
  const paths = usePreview((s) => s.paths)
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [tok, setTok] = useState<{ start: number; token: string } | null>(null)

  const suggestions = useMemo<Suggestion[]>(() => {
    if (!tok) return []
    const q = tok.token.toLowerCase()
    const out: Suggestion[] = []
    for (const l of props.locals ?? []) {
      out.push({ insert: l.name, label: l.name, kind: l.doc })
      for (const f of l.fields) out.push({ insert: `${l.name}.${f}`, label: `${l.name}.${f}`, kind: 'field' })
    }
    for (const p of paths) {
      if (p.path.includes('[]')) continue
      out.push({ insert: p.path, label: p.path, kind: p.kind === 'string' || p.kind === 'number' ? p.sample : p.kind })
    }
    if (!q.includes('.')) for (const f of FUNCTIONS) out.push({ insert: `${f.name}(`, label: f.sig, kind: f.doc })
    for (const b of ['page', 'pages', 'report.name', 'report.generatedAt', 'theme.company']) out.push({ insert: b, label: b, kind: 'built-in' })
    return out.filter((s) => s.insert.toLowerCase().startsWith(q) && s.insert !== tok.token).slice(0, 40)
  }, [tok, paths, props.locals])

  const refresh = () => {
    const el = ref.current
    if (!el) return
    const t = currentToken(el.value, el.selectionStart ?? el.value.length, !!props.template)
    setTok(t)
    setActive(0)
    setOpen(!!t)
  }

  const apply = (s: Suggestion) => {
    const el = ref.current
    if (!el || !tok) return
    const caret = el.selectionStart ?? el.value.length
    let insert = s.insert
    const after = el.value.slice(caret)
    if (props.template && !after.trimStart().startsWith('}}') && !insert.endsWith('(')) insert += ' }}'
    const next = el.value.slice(0, tok.start) + insert + after
    props.onChange(next)
    setOpen(false)
    requestAnimationFrame(() => {
      el.focus()
      const pos = tok.start + insert.length
      el.setSelectionRange(pos, pos)
    })
  }

  const common = {
    ref,
    className: `${props.multiline ? 'textarea' : 'input'} code`,
    value: props.value,
    placeholder: props.placeholder,
    'aria-label': props.ariaLabel,
    spellCheck: false,
    autoComplete: 'off',
    onChange: (e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => {
      props.onChange(e.target.value)
      requestAnimationFrame(refresh)
    },
    onBlur: () => setTimeout(() => setOpen(false), 120),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (!open || suggestions.length === 0) {
        if (e.key === ' ' && e.ctrlKey) {
          e.preventDefault()
          refresh()
        }
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((a) => (a + 1) % suggestions.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((a) => (a - 1 + suggestions.length) % suggestions.length)
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        apply(suggestions[active])
      } else if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
      }
    },
  }

  return (
    <div className="ac-wrap">
      {props.multiline ? <textarea rows={props.rows ?? 3} {...common} /> : <input {...common} />}
      {open && suggestions.length > 0 && (
        <div className="ac-list" role="listbox">
          {suggestions.map((s, i) => (
            <div
              key={s.insert + i}
              role="option"
              aria-selected={i === active}
              className={`ac-item${i === active ? ' active' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault()
                apply(s)
              }}
              onMouseEnter={() => setActive(i)}
            >
              <span className="p">{s.label}</span>
              <span className="k">{s.kind}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
