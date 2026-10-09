import { FileText, ImagePlus, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { DEFAULT_THEME } from '../lib/defaults'
import { useStore } from '../lib/store'
import { LABEL_KEYS, type PaperSize, type ReportDocument, type Theme, type Variable } from '../lib/types'
import { ColorInput, Disclosure, ExprInput, Field, Group, NumberInput, Segmented, Select, TextInput, Toggle } from './fields'
import { readImageFile } from './Inspector'

const SIZES: { value: PaperSize; label: string }[] = [
  { value: 'a4', label: 'A4 (210 × 297 mm)' },
  { value: 'letter', label: 'US Letter (8.5 × 11 in)' },
  { value: 'legal', label: 'US Legal (8.5 × 14 in)' },
  { value: 'a3', label: 'A3 (297 × 420 mm)' },
  { value: 'a5', label: 'A5 (148 × 210 mm)' },
  { value: 'custom', label: 'Custom…' },
]

const COLOR_FIELDS: { key: keyof Theme; label: string }[] = [
  { key: 'textColor', label: 'Text' },
  { key: 'mutedColor', label: 'Secondary' },
  { key: 'accentColor', label: 'Accent' },
  { key: 'borderColor', label: 'Lines' },
  { key: 'surfaceColor', label: 'Panels' },
  { key: 'passColor', label: 'Pass' },
  { key: 'failColor', label: 'Fail' },
  { key: 'warnColor', label: 'Warning' },
]

export function DocumentInspector() {
  const doc = useStore((s) => s.doc)
  const change = useStore((s) => s.change)
  const edit = (key: string, fn: (d: ReportDocument) => ReportDocument) => change(fn, `doc:${key}`)
  const theme = (patch: Partial<Theme>, key: string) => edit(`theme.${key}`, (d) => ({ ...d, theme: { ...d.theme, ...patch } }))
  const margins = doc.page.margins

  return (
    <>
      <div className="inspector-head">
        <span className="icon-bubble">
          <FileText size={16} />
        </span>
        <div className="title">
          Document
          <small>Select a block to edit it</small>
        </div>
      </div>
      <div className="scroll">
        <Group title="Details">
          <Field label="Name">
            <TextInput value={doc.meta.name} onChange={(v) => edit('meta.name', (d) => ({ ...d, meta: { ...d.meta, name: v } }))} />
          </Field>
          <Field label="Revision">
            <TextInput value={doc.meta.revision} onChange={(v) => edit('meta.revision', (d) => ({ ...d, meta: { ...d.meta, revision: v } }))} />
          </Field>
          <Field label="Author">
            <TextInput value={doc.meta.author} onChange={(v) => edit('meta.author', (d) => ({ ...d, meta: { ...d.meta, author: v } }))} />
          </Field>
          <Field label="Description" stack>
            <TextInput multiline rows={2} value={doc.meta.description} onChange={(v) => edit('meta.description', (d) => ({ ...d, meta: { ...d.meta, description: v } }))} />
          </Field>
        </Group>

        <Group title="Page">
          <Field label="Size">
            <Select value={doc.page.size} options={SIZES} onChange={(v) => edit('page.size', (d) => ({ ...d, page: { ...d.page, size: v } }))} ariaLabel="Paper size" />
          </Field>
          {doc.page.size === 'custom' && (
            <Field label="W × H">
              <div className="row">
                <NumberInput value={doc.page.widthMm} unit="mm" min={20} max={2000} onChange={(v) => edit('page.w', (d) => ({ ...d, page: { ...d.page, widthMm: v } }))} />
                <NumberInput value={doc.page.heightMm} unit="mm" min={20} max={2000} onChange={(v) => edit('page.h', (d) => ({ ...d, page: { ...d.page, heightMm: v } }))} />
              </div>
            </Field>
          )}
          <Field label="Orientation">
            <Segmented
              value={doc.page.orientation}
              options={[{ value: 'portrait', label: 'Portrait' }, { value: 'landscape', label: 'Landscape' }]}
              onChange={(v) => edit('page.o', (d) => ({ ...d, page: { ...d.page, orientation: v } }))}
            />
          </Field>
          <div className="field" style={{ alignItems: 'start' }}>
            <label style={{ paddingTop: 5 }}>Margins</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {(['top', 'bottom', 'left', 'right'] as const).map((k) => (
                <div key={k} title={`${k[0].toUpperCase()}${k.slice(1)} margin`}>
                  <div className="hint" style={{ marginBottom: 2 }}>{k[0].toUpperCase() + k.slice(1)}</div>
                  <NumberInput value={margins[k]} unit="mm" min={0} max={100} onChange={(v) => edit(`page.m.${k}`, (d) => ({ ...d, page: { ...d.page, margins: { ...d.page.margins, [k]: v } } }))} />
                </div>
              ))}
            </div>
          </div>
        </Group>

        <Group
          title="Brand kit"
          action={
            <button className="btn small" onClick={() => edit('theme.reset', (d) => ({ ...d, theme: { ...DEFAULT_THEME, logo: d.theme.logo, company: d.theme.company } }))}>
              Reset colours
            </button>
          }
        >
          <Field label="Company">
            <TextInput value={doc.theme.company} onChange={(v) => theme({ company: v }, 'company')} placeholder="Shown via {{ theme.company }}" />
          </Field>
          <Field label="Logo">
            <div className="row">
              {doc.theme.logo ? (
                <img src={doc.theme.logo.startsWith('data:') ? doc.theme.logo : undefined} alt="Logo" style={{ height: 26, maxWidth: 120, objectFit: 'contain', background: '#fff', borderRadius: 4, padding: 2 }} />
              ) : (
                <span className="hint">None</span>
              )}
              <button className="btn icon bordered" title="Choose logo" onClick={async () => { const d = await readImageFile(); if (d) theme({ logo: d }, 'logo') }}>
                <ImagePlus size={14} />
              </button>
              {doc.theme.logo && (
                <button className="btn icon" title="Remove logo" onClick={() => theme({ logo: undefined }, 'logo')}>
                  <X size={13} />
                </button>
              )}
            </div>
          </Field>
          <Field label="Typeface">
            <Segmented value={doc.theme.font} options={[{ value: 'sans', label: 'Sans' }, { value: 'serif', label: 'Serif' }, { value: 'mono', label: 'Mono' }]} onChange={(v) => theme({ font: v }, 'font')} />
          </Field>
          <Field label="Base size">
            <NumberInput value={doc.theme.fontSize} unit="pt" min={5} max={24} step={0.5} onChange={(v) => theme({ fontSize: v }, 'fontSize')} />
          </Field>
          {COLOR_FIELDS.map((c) => (
            <Field key={c.key} label={c.label}>
              <ColorInput value={doc.theme[c.key] as string} onChange={(v) => theme({ [c.key]: v ?? DEFAULT_THEME[c.key] } as Partial<Theme>, c.key)} />
            </Field>
          ))}
        </Group>

        <Group title="Watermark">
          <Toggle
            label="Show a watermark"
            checked={!!doc.watermark}
            onChange={(on) => edit('wm', (d) => ({ ...d, watermark: on ? { text: 'DRAFT', color: '#d1242f', opacity: 0.12, angle: -40, size: 96 } : undefined }))}
          />
          {doc.watermark && (
            <>
              <Field label="Text">
                <ExprInput template value={doc.watermark.text} onChange={(v) => edit('wm.text', (d) => ({ ...d, watermark: { ...d.watermark!, text: v } }))} />
              </Field>
              <Field label="Show if" hint="e.g. status != 'RELEASED'">
                <ExprInput value={doc.watermark.visibleIf ?? ''} onChange={(v) => edit('wm.if', (d) => ({ ...d, watermark: { ...d.watermark!, visibleIf: v.trim() ? v : undefined } }))} placeholder="always" />
              </Field>
              <Field label="Colour">
                <ColorInput value={doc.watermark.color} onChange={(v) => edit('wm.color', (d) => ({ ...d, watermark: { ...d.watermark!, color: v ?? '#d1242f' } }))} />
              </Field>
              <Field label="Opacity">
                <NumberInput value={Math.round(doc.watermark.opacity * 100)} unit="%" min={1} max={100} onChange={(v) => edit('wm.op', (d) => ({ ...d, watermark: { ...d.watermark!, opacity: v / 100 } }))} />
              </Field>
            </>
          )}
        </Group>
        <VarsGroup />
        <LanguageGroup />
        <DataMapGroup />
      </div>
    </>
  )
}

function useEdit() {
  const change = useStore((s) => s.change)
  return (key: string, fn: (d: ReportDocument) => ReportDocument) => change(fn, `doc:${key}`)
}

/** Computed fields: name an expression once, use it everywhere. */
function VarsGroup() {
  const vars = useStore((s) => s.doc.vars) ?? []
  const edit = useEdit()
  const setVars = (key: string, next: Variable[]) => edit(key, (d) => ({ ...d, vars: next.length ? next : undefined }))
  return (
    <Group
      title="Computed fields"
      action={
        <button className="btn small" onClick={() => setVars('vars.add', [...vars, { name: `value${vars.length + 1}`, value: '' }])}>
          <Plus size={12} /> Field
        </button>
      }
    >
      {vars.length === 0 && (
        <div className="hint">
          Name a calculation once and use it in any block, e.g. <code>failures</code> = <code>count_if(measurements, 'status', 'FAIL')</code>, then <code>{'{{ failures }}'}</code>.
        </div>
      )}
      {vars.map((v, i) => (
        <div className="list-item" key={i}>
          <div className="list-item-head">
            <span className="grow">{v.name || `Field ${i + 1}`}</span>
            <button className="btn icon small" title="Remove" onClick={() => setVars('vars.remove', vars.filter((_, j) => j !== i))}>
              <X size={12} />
            </button>
          </div>
          <Field label="Name">
            <TextInput value={v.name} code onChange={(n) => setVars(`vars.${i}.name`, vars.map((x, j) => (j === i ? { ...x, name: n.replace(/[^\w]/g, '') } : x)))} />
          </Field>
          <Field label="Value" stack>
            <ExprInput
              value={v.value}
              onChange={(e) => setVars(`vars.${i}.value`, vars.map((x, j) => (j === i ? { ...x, value: e } : x)))}
              locals={vars.slice(0, i).map((p) => ({ name: p.name, fields: [], doc: 'computed field' }))}
              placeholder="count_if(measurements, 'status', 'FAIL')"
              ariaLabel={`Value of ${v.name}`}
            />
          </Field>
        </div>
      ))}
    </Group>
  )
}

const LANGS = [
  { value: '', label: 'English' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
  { value: 'nl', label: 'Nederlands' },
  { value: 'pl', label: 'Polski' },
  { value: 'sv', label: 'Svenska' },
  { value: 'tr', label: 'Türkçe' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
]

/** Document language and the words the engine prints in tables and verdicts. */
function LanguageGroup() {
  const doc = useStore((s) => s.doc)
  const edit = useEdit()
  const labels = doc.labels ?? {}
  const setLabel = (key: string, v: string) =>
    edit(`labels.${key}`, (d) => {
      const next = { ...(d.labels ?? {}) }
      if (v.trim()) next[key] = v
      else delete next[key]
      return { ...d, labels: Object.keys(next).length ? next : undefined }
    })
  return (
    <Disclosure title="Language and wording" note={Object.keys(labels).length ? `${Object.keys(labels).length} changed` : undefined}>
      <Field label="Language">
        <Select value={doc.meta.lang ?? ''} options={LANGS} onChange={(v) => edit('meta.lang', (d) => ({ ...d, meta: { ...d.meta, lang: v || undefined } }))} />
      </Field>
      <div className="hint" style={{ margin: '4px 0 8px' }}>Words the report prints by itself. Leave a field empty to keep the default.</div>
      {LABEL_KEYS.map(([key, fallback]) => (
        <Field label={fallback} key={key}>
          <TextInput value={labels[key] ?? ''} placeholder={fallback} onChange={(v) => setLabel(key, v)} />
        </Field>
      ))}
    </Disclosure>
  )
}

/** Field mapping: let one template read data whose names differ. */
function DataMapGroup() {
  const map = useStore((s) => s.doc.dataMap) ?? {}
  const edit = useEdit()
  const [draft, setDraft] = useState<[string, string] | null>(null)
  const entries = Object.entries(map)
  const setMap = (key: string, next: [string, string][]) =>
    edit(key, (d) => {
      const m = Object.fromEntries(next.filter(([k]) => k.trim()))
      return { ...d, dataMap: Object.keys(m).length ? m : undefined }
    })
  return (
    <Disclosure title="Field mapping" note={entries.length ? `${entries.length}` : undefined}>
      <div className="hint" style={{ marginBottom: 8 }}>
        When a station names a field differently, map the template's name to the data's: <code>dut.serial</code> ← <code>uut.sn</code>, or
        <code> measurements[].value</code> ← <code>reading</code>. Applied when rendering, only where the data lacks the field.
      </div>
      {entries.map(([need, have], i) => (
        <div className="row" key={i} style={{ marginBottom: 6, gap: 6 }}>
          <TextInput value={need} code placeholder="template field" onChange={(v) => setMap('dataMap.need', entries.map((e, j) => (j === i ? [v, e[1]] : e)))} />
          <span className="hint">←</span>
          <TextInput value={have} code placeholder="data field" onChange={(v) => setMap('dataMap.have', entries.map((e, j) => (j === i ? [e[0], v] : e)))} />
          <button className="btn icon small" title="Remove" onClick={() => setMap('dataMap.remove', entries.filter((_, j) => j !== i))}>
            <X size={12} />
          </button>
        </div>
      ))}
      {draft ? (
        <div className="row" style={{ marginBottom: 6, gap: 6 }}>
          <TextInput value={draft[0]} code placeholder="template field" onChange={(v) => setDraft([v, draft[1]])} />
          <span className="hint">←</span>
          <TextInput value={draft[1]} code placeholder="data field" onChange={(v) => setDraft([draft[0], v])} />
          <button
            className="btn small primary"
            disabled={!draft[0].trim() || !draft[1].trim()}
            onClick={() => {
              setMap('dataMap.add', [...entries, [draft[0].trim(), draft[1].trim()]])
              setDraft(null)
            }}
          >
            Add
          </button>
        </div>
      ) : (
        <button className="btn small bordered" onClick={() => setDraft(['', ''])}>
          <Plus size={12} /> Mapping
        </button>
      )}
    </Disclosure>
  )
}
