import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, CircleAlert, Copy, ImagePlus, Plus, Trash2, TriangleAlert, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { blockInfo } from '../lib/blocks'
import { findBlock } from '../lib/doc-ops'
import { usePreview } from '../lib/preview'
import { useStore } from '../lib/store'
import type { Align, Block, BlockOf, BlockType, Issue } from '../lib/types'

const NO_ISSUES: Issue[] = []
import { DocumentInspector } from './DocumentInspector'
import { BindingInput, TemplateEditor } from './binding'
import { ColorInput, Disclosure, ExprInput, Field, Group, itemFields, type LocalVar, NumberInput, Segmented, Select, TextInput, Toggle } from './fields'
import { BlockIcon } from './Icon'

const ALIGN_OPTIONS: { value: Align; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
]

export function readImageFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/png,image/jpeg,image/svg+xml,image/gif,image/webp'
    input.onchange = () => {
      const f = input.files?.[0]
      if (!f) return resolve(null)
      const r = new FileReader()
      r.onload = () => resolve(typeof r.result === 'string' ? r.result : null)
      r.readAsDataURL(f)
    }
    input.click()
  })
}

export function Inspector() {
  const selectedId = useStore((s) => s.selectedId)
  const doc = useStore((s) => s.doc)
  const found = selectedId ? findBlock(doc, selectedId) : null
  if (!found) return <DocumentInspector />
  return <BlockInspector key={found.block.id} block={found.block} ancestors={found.path} />
}

function BlockInspector({ block, ancestors }: { block: Block; ancestors: Block[] }) {
  const s = useStore()
  const paths = usePreview((p) => p.paths)
  const issues = usePreview((p) => p.issuesByBlock.get(block.id) ?? NO_ISSUES)
  const info = blockInfo(block.type)

  // Computed fields and loop variables from enclosing repeated sections are in scope for every field.
  const scopeLocals: LocalVar[] = (s.doc.vars ?? []).filter((v) => v.name.trim()).map((v) => ({ name: v.name.trim(), fields: [], doc: 'computed field' }))
  for (const a of ancestors) {
    if (a.type === 'section' && a.repeat) {
      const alias = a.as?.trim() || 'item'
      scopeLocals.push({ name: alias, fields: itemFields(paths, a.repeat), doc: `each of ${a.repeat}` })
      scopeLocals.push({ name: 'number', fields: [], doc: '1-based position' })
    }
  }

  const up = <T extends BlockType>(field: string) => (patch: Partial<BlockOf<T>>) => s.updateBlock(block.id, patch as Partial<Block>, field)
  const set = (field: string, value: unknown) => s.updateBlock(block.id, { [field]: value } as Partial<Block>, field)

  return (
    <>
      {ancestors.length > 0 && (
        <div className="crumbs" aria-label="Where this block lives">
          {ancestors.map((a) => (
            <span key={a.id}>
              <button onClick={() => s.select(a.id)}>{blockInfo(a.type).label}</button>
              <span>›</span>
            </span>
          ))}
          <span style={{ color: 'var(--text-2)' }}>{info.label}</span>
        </div>
      )}
      <div className="inspector-head">
        <span className="icon-bubble">
          <BlockIcon type={block.type} size={16} />
        </span>
        <div className="title">
          {info.label}
          <small title={info.description}>{info.description}</small>
        </div>
        <button className="btn icon" title="Move up (⌥↑)" onClick={() => s.nudge(block.id, -1)}>
          <ChevronUp size={15} />
        </button>
        <button className="btn icon" title="Move down (⌥↓)" onClick={() => s.nudge(block.id, 1)}>
          <ChevronDown size={15} />
        </button>
        <button className="btn icon" title="Duplicate (⌘D)" onClick={() => s.duplicate(block.id)}>
          <Copy size={14} />
        </button>
        <button className="btn icon danger" title="Delete (⌫)" onClick={() => s.remove(block.id)}>
          <Trash2 size={14} />
        </button>
      </div>
      <div className="scroll">
        {issues.filter((i) => i.severity !== 'info').length > 0 && (
          <div className="issues-inline">
            {issues
              .filter((i) => i.severity !== 'info')
              .map((i, n) => (
                <div key={n} className={`issue ${i.severity}`}>
                  {i.severity === 'error' ? <CircleAlert size={14} /> : <TriangleAlert size={14} />}
                  <div>
                    {i.message}
                    {i.field && <span className="where">{i.field}</span>}
                  </div>
                </div>
              ))}
          </div>
        )}
        <BlockFields block={block} up={up} set={set} locals={scopeLocals} />
        <Disclosure title="Advanced" defaultOpen={!!block.visibleIf}>
          <Field label="Show if" stack hint="Leave empty to always show. Example: status == 'FAIL' or len(notes) > 0">
            <ExprInput value={block.visibleIf ?? ''} onChange={(v) => set('visibleIf', v.trim() ? v : undefined)} placeholder="always" locals={scopeLocals} ariaLabel="Visibility condition" />
          </Field>
          <div className="hint">
            ID <code>{block.id}</code>
          </div>
        </Disclosure>
      </div>
    </>
  )
}

const COLUMN_PRESETS = [[1, 1], [1, 2], [2, 1], [1, 1, 1], [1, 1, 1, 1]]

type Up = <T extends BlockType>(field: string) => (patch: Partial<BlockOf<T>>) => void

function ListControls({ onUp, onDown, onRemove }: { onUp?: () => void; onDown?: () => void; onRemove: () => void }) {
  return (
    <>
      {onUp && (
        <button className="btn icon small" title="Move up" onClick={onUp}>
          <ArrowUp size={12} />
        </button>
      )}
      {onDown && (
        <button className="btn icon small" title="Move down" onClick={onDown}>
          <ArrowDown size={12} />
        </button>
      )}
      <button className="btn icon small" title="Remove" onClick={onRemove}>
        <X size={12} />
      </button>
    </>
  )
}

function swap<T>(list: T[], i: number, j: number): T[] {
  if (j < 0 || j >= list.length) return list
  const next = [...list]
  ;[next[i], next[j]] = [next[j], next[i]]
  return next
}

function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button className="btn small bordered" onClick={onClick}>
      <Plus size={12} /> {children}
    </button>
  )
}

function BlockFields({ block, up, set, locals }: { block: Block; up: Up; set: (f: string, v: unknown) => void; locals: LocalVar[] }) {
  const paths = usePreview((p) => p.paths)
  const docLabels = useStore((st) => st.doc.labels)
  switch (block.type) {
    case 'heading':
      return (
        <Group title="Heading">
          <Field label="Text" stack hint="Use {{ field }} to insert data.">
            <TemplateEditor value={block.text} onChange={(v) => set('text', v)} locals={locals} ariaLabel="Heading text" />
          </Field>
          <Field label="Level">
            <Segmented value={String(block.level)} options={[{ value: '1', label: 'Title' }, { value: '2', label: 'Section' }, { value: '3', label: 'Small' }]} onChange={(v) => set('level', Number(v))} />
          </Field>
          <Field label="Align">
            <Segmented value={block.align ?? 'left'} options={ALIGN_OPTIONS} onChange={(v) => set('align', v)} />
          </Field>
          <Field label="Colour">
            <ColorInput value={block.color} onChange={(v) => set('color', v)} />
          </Field>
        </Group>
      )
    case 'text':
      return (
        <>
          <Group title="Text">
            <Field label="Content" stack hint="**bold**, *italic*, `mono`, blank line for a new paragraph, {{ field }} for data.">
              <TemplateEditor multiline rows={5} value={block.text} onChange={(v) => set('text', v)} locals={locals} ariaLabel="Text content" />
            </Field>
          </Group>
          <Disclosure title="Style">
            <Field label="Size">
              <NumberInput value={block.style.size} placeholder="theme" unit="pt" min={4} max={96} step={0.5} onChange={(v) => up<'text'>('style.size')({ style: { ...block.style, size: v } })} />
            </Field>
            <Field label="Weight">
              <Select
                value={block.style.weight ?? 'regular'}
                options={[{ value: 'regular', label: 'Regular' }, { value: 'medium', label: 'Medium' }, { value: 'semibold', label: 'Semibold' }, { value: 'bold', label: 'Bold' }]}
                onChange={(v) => up<'text'>('style')({ style: { ...block.style, weight: v === 'regular' ? undefined : v } })}
              />
            </Field>
            <Field label="Align">
              <Segmented value={block.style.align ?? 'left'} options={ALIGN_OPTIONS} onChange={(v) => up<'text'>('style')({ style: { ...block.style, align: v } })} />
            </Field>
            <Field label="Colour">
              <ColorInput value={block.style.color} onChange={(v) => up<'text'>('style.color')({ style: { ...block.style, color: v } })} />
            </Field>
            <Toggle label="Italic" checked={!!block.style.italic} onChange={(v) => up<'text'>('style')({ style: { ...block.style, italic: v || undefined } })} />
            <Toggle label="Monospace" checked={!!block.style.mono} onChange={(v) => up<'text'>('style')({ style: { ...block.style, mono: v || undefined } })} />
          </Disclosure>
        </>
      )
    case 'callout':
      return (
        <Group title="Callout">
          <Field label="Tone">
            <Segmented value={block.tone} options={[{ value: 'info', label: 'Info' }, { value: 'pass', label: 'Pass' }, { value: 'warn', label: 'Warn' }, { value: 'fail', label: 'Fail' }]} onChange={(v) => set('tone', v)} />
          </Field>
          <Field label="Title" stack>
            <TemplateEditor value={block.title} onChange={(v) => set('title', v)} locals={locals} />
          </Field>
          <Field label="Text" stack>
            <TemplateEditor multiline value={block.text} onChange={(v) => set('text', v)} locals={locals} />
          </Field>
        </Group>
      )
    case 'image':
      return (
        <Group title="Image">
          <Field label="Source" stack hint="Embed a file, or enter a path relative to the template or a {{ field }}.">
            <div className="row">
              <TemplateEditor value={block.src.startsWith('data:') ? '' : block.src} placeholder={block.src.startsWith('data:') ? 'Embedded image' : 'path or {{ field }}'} onChange={(v) => set('src', v)} locals={locals} />
              <button className="btn icon bordered" title="Embed an image file" onClick={async () => { const d = await readImageFile(); if (d) set('src', d) }}>
                <ImagePlus size={14} />
              </button>
            </div>
          </Field>
          <Field label="Width">
            <NumberInput value={block.width} unit="%" min={1} max={100} onChange={(v) => set('width', v)} />
          </Field>
          <Field label="Align">
            <Segmented value={block.align} options={ALIGN_OPTIONS} onChange={(v) => set('align', v)} />
          </Field>
          <Field label="Caption" stack>
            <TemplateEditor value={block.caption} onChange={(v) => set('caption', v)} locals={locals} />
          </Field>
        </Group>
      )
    case 'logo':
      return (
        <Group title="Logo">
          <div className="hint" style={{ marginBottom: 8 }}>Shows the logo from the brand kit (deselect to edit it).</div>
          <Field label="Height">
            <NumberInput value={block.heightMm} unit="mm" min={2} max={100} onChange={(v) => set('heightMm', v)} />
          </Field>
          <Field label="Align">
            <Segmented value={block.align} options={ALIGN_OPTIONS} onChange={(v) => set('align', v)} />
          </Field>
        </Group>
      )
    case 'table': {
      const rowLocals: LocalVar[] = [...locals, { name: 'row', fields: itemFields(paths, block.source), doc: 'current row' }, { name: 'number', fields: [], doc: '1-based row' }]
      return (
        <>
          <Group title="Data">
            <Field label="Rows from" stack hint="Pick a list, or drag one here from the Data tab.">
              <BindingInput accept="list" value={block.source} onChange={(v) => set('source', v)} locals={locals} placeholder="results" ariaLabel="Table source" />
            </Field>
          </Group>
          <Group
            title="Columns"
            action={
              <AddButton
                onClick={() => {
                  const fields = itemFields(paths, block.source)
                  const used = new Set(block.columns.map((c) => c.value))
                  const next = fields.find((f) => !used.has(`row.${f}`))
                  set('columns', [...block.columns, { header: next ?? 'Column', value: next ? `row.${next}` : 'row', width: 'auto', align: 'left' }])
                }}
              >
                Column
              </AddButton>
            }
          >
            {block.columns.length === 0 && <div className="hint" style={{ marginBottom: 8 }}>No columns: every field of the first row is shown.</div>}
            {block.columns.map((c, i) => {
              const setCol = (patch: Partial<typeof c>) => set('columns', block.columns.map((x, j) => (j === i ? { ...x, ...patch } : x)))
              return (
                <div className="list-item" key={i}>
                  <div className="list-item-head">
                    <span className="grow">Column {i + 1}</span>
                    <ListControls onUp={i > 0 ? () => set('columns', swap(block.columns, i, i - 1)) : undefined} onDown={i < block.columns.length - 1 ? () => set('columns', swap(block.columns, i, i + 1)) : undefined} onRemove={() => set('columns', block.columns.filter((_, j) => j !== i))} />
                  </div>
                  <Field label="Header">
                    <TextInput value={c.header} onChange={(v) => setCol({ header: v })} />
                  </Field>
                  <Field label="Value">
                    <BindingInput accept="scalar" onlyLocals value={c.value} onChange={(v) => setCol({ value: v })} locals={rowLocals} placeholder="row.name" />
                  </Field>
                  <Field label="Align">
                    <Segmented value={c.align} options={ALIGN_OPTIONS} onChange={(v) => setCol({ align: v })} />
                  </Field>
                  <Field label="Width" hint="auto, 1fr, 30mm or 20%">
                    <TextInput value={c.width} onChange={(v) => setCol({ width: v })} code />
                  </Field>
                  <Toggle label="Verdict column (colours PASS/FAIL, tints the row)" checked={!!c.status} onChange={(v) => setCol({ status: v || undefined })} />
                </div>
              )
            })}
          </Group>
          <Disclosure title="More">
            <Field label="Row tint" stack hint="Optional: an expression giving PASS/FAIL/WARN or a colour per row. Not needed when a column is marked as the verdict column.">
              <ExprInput value={block.rowTone ?? ''} onChange={(v) => set('rowTone', v.trim() ? v : undefined)} locals={rowLocals} placeholder="row.status" />
            </Field>
            <Toggle label="Zebra stripes" checked={block.zebra} onChange={(v) => set('zebra', v)} />
            <Toggle label="Repeat header on each page" checked={block.repeatHeader} onChange={(v) => set('repeatHeader', v)} />
            <Field label="Font size">
              <NumberInput value={block.fontSize} placeholder="theme" unit="pt" min={4} max={30} step={0.5} onChange={(v) => set('fontSize', v)} />
            </Field>
            <Field label="When empty">
              <TextInput value={block.emptyText} onChange={(v) => set('emptyText', v)} />
            </Field>
          </Disclosure>
        </>
      )
    }
    case 'measurementTable': {
      const fields = itemFields(paths, block.source)
      const isExpr = (v: string) => !!v.trim() && !/^[A-Za-z_]\w*$/.test(v.trim())
      const setField = (key: keyof typeof block.fields, v: string) => up<'measurementTable'>(`fields.${key}`)({ fields: { ...block.fields, [key]: v } })
      const rowLocals: LocalVar[] = [...locals, { name: 'row', fields, doc: 'current measurement' }]
      const fieldSel = (key: keyof typeof block.fields, label: string) => (
        <Field label={label} key={key} stack={isExpr(block.fields[key])}>
          {isExpr(block.fields[key]) ? (
            <div className="row">
              <ExprInput value={block.fields[key]} onChange={(v) => setField(key, v)} locals={rowLocals} placeholder="row.value" ariaLabel={`${label} expression`} />
              <button className="btn icon small" title="Pick a field instead" onClick={() => setField(key, fields.includes(key) ? key : '')}>
                <X size={12} />
              </button>
            </div>
          ) : (
            <Select
              value={block.fields[key]}
              options={[...new Set([block.fields[key], '', ...fields]), '__expr'].map((f) => ({ value: f, label: f === '__expr' ? 'Expression…' : f || '—' }))}
              onChange={(v) => setField(key, v === '__expr' ? `row.${block.fields[key] || key}` : v)}
            />
          )}
        </Field>
      )
      const labelInput = (key: string, fallback: string) => (
        <Field label={fallback} key={key}>
          <TextInput
            value={block.labels?.[key] ?? ''}
            placeholder={docLabels?.[key] || fallback}
            onChange={(v) => {
              const next = { ...(block.labels ?? {}) }
              if (v.trim()) next[key] = v
              else delete next[key]
              set('labels', Object.keys(next).length ? next : undefined)
            }}
          />
        </Field>
      )
      return (
        <>
          <Group title="Data">
            <Field label="Rows from" stack hint="Each row needs a value and optional low/high limits. PASS/FAIL is computed when there is no status field.">
              <BindingInput accept="list" value={block.source} onChange={(v) => set('source', v)} locals={locals} placeholder="measurements" />
            </Field>
          </Group>
          <Group title="Display">
            <Field label="Decimals">
              <NumberInput value={block.decimals} min={0} max={12} onChange={(v) => set('decimals', Math.round(v))} />
            </Field>
            <Toggle label="Highlight failures" checked={block.highlightFailures} onChange={(v) => set('highlightFailures', v)} />
            <Toggle label="Limit columns" checked={block.showLimits} onChange={(v) => set('showLimits', v)} />
            <Toggle label="Result column" checked={block.showStatus} onChange={(v) => set('showStatus', v)} />
          </Group>
          <Disclosure title="More columns and options">
            <Toggle label="Row numbers" checked={block.showIndex} onChange={(v) => set('showIndex', v)} />
            <Toggle label="Nominal column" checked={block.showNominal} onChange={(v) => set('showNominal', v)} />
            <Toggle label="Unit column" checked={block.showUnit} onChange={(v) => set('showUnit', v)} />
            <Toggle label="Only list failures" checked={block.failuresOnly} onChange={(v) => set('failuresOnly', v)} />
            <Toggle label="Repeat header on each page" checked={block.repeatHeader} onChange={(v) => set('repeatHeader', v)} />
          </Disclosure>
          <Disclosure title="Which fields are which" note="matched automatically">
            {fieldSel('name', 'Name')}
            {fieldSel('value', 'Measured')}
            {fieldSel('low', 'Low limit')}
            {fieldSel('high', 'High limit')}
            {fieldSel('nominal', 'Nominal')}
            {fieldSel('unit', 'Unit')}
            {fieldSel('status', 'Status')}
            <div className="hint">Choose “Expression…” to compute a column, e.g. <code>row.limits.lo</code> or <code>row.value * 1000</code>.</div>
          </Disclosure>
          <Disclosure title="Column headers" note="for this table">
            {labelInput('parameter', 'Parameter')}
            {labelInput('measured', 'Measured')}
            {labelInput('low', 'Low limit')}
            {labelInput('high', 'High limit')}
            {labelInput('nominal', 'Nominal')}
            {labelInput('unit', 'Unit')}
            {labelInput('result', 'Result')}
          </Disclosure>
        </>
      )
    }
    case 'keyValue':
      return (
        <>
          <Group title="Info grid">
            <Field label="Title">
              <TemplateEditor value={block.title} onChange={(v) => set('title', v)} locals={locals} />
            </Field>
            <Field label="Per row">
              <Segmented value={String(block.columns)} options={['1', '2', '3', '4'].map((n) => ({ value: n, label: n }))} onChange={(v) => set('columns', Number(v))} />
            </Field>
            <Toggle label="Boxed" checked={block.boxed} onChange={(v) => set('boxed', v)} />
          </Group>
          <Group title="Fields" action={<AddButton onClick={() => set('items', [...block.items, { label: 'Label', value: '' }])}>Field</AddButton>}>
            {block.items.map((it, i) => (
              <div className="list-item" key={i}>
                <div className="list-item-head">
                  <span className="grow">{it.label || `Field ${i + 1}`}</span>
                  <ListControls onUp={i > 0 ? () => set('items', swap(block.items, i, i - 1)) : undefined} onDown={i < block.items.length - 1 ? () => set('items', swap(block.items, i, i + 1)) : undefined} onRemove={() => set('items', block.items.filter((_, j) => j !== i))} />
                </div>
                <Field label="Label">
                  <TextInput value={it.label} onChange={(v) => set('items', block.items.map((x, j) => (j === i ? { ...x, label: v } : x)))} />
                </Field>
                <Field label="Value">
                  <TemplateEditor value={it.value} onChange={(v) => set('items', block.items.map((x, j) => (j === i ? { ...x, value: v } : x)))} locals={locals} placeholder="{{ dut.serial }}" />
                </Field>
              </div>
            ))}
          </Group>
        </>
      )
    case 'summary':
      return (
        <Group title="Verdict">
          <Field label="Title">
            <TemplateEditor value={block.title} onChange={(v) => set('title', v)} locals={locals} />
          </Field>
          <Field label="Results" stack hint="List of results; each row's status (or value vs low/high) is counted.">
            <BindingInput accept="list" value={block.source} onChange={(v) => set('source', v)} locals={locals} placeholder="measurements" />
          </Field>
          <Field label="Status field">
            <TextInput value={block.statusField} onChange={(v) => set('statusField', v)} code />
          </Field>
          <Field label="Override" stack hint="Optional expression for the overall verdict, e.g. result">
            <ExprInput value={block.verdict ?? ''} onChange={(v) => set('verdict', v.trim() ? v : undefined)} locals={locals} placeholder="computed from results" />
          </Field>
          <Toggle label="Show counts" checked={block.showCounts} onChange={(v) => set('showCounts', v)} />
          <Toggle label="Show pass rate" checked={block.showRate} onChange={(v) => set('showRate', v)} />
        </Group>
      )
    case 'status':
      return (
        <Group title="Status">
          <Field label="Label">
            <TemplateEditor value={block.label} onChange={(v) => set('label', v)} locals={locals} />
          </Field>
          <Field label="Value" stack hint="Anything like PASS/FAIL, true/false, OK/NG.">
            <BindingInput accept="scalar" value={block.value} onChange={(v) => set('value', v)} locals={locals} placeholder="result" />
          </Field>
          <Field label="Style">
            <Segmented value={block.style} options={[{ value: 'badge', label: 'Badge' }, { value: 'banner', label: 'Banner' }]} onChange={(v) => set('style', v)} />
          </Field>
        </Group>
      )
    case 'chart':
      return <ChartFields block={block} set={set} locals={locals} />
    case 'gauge':
      return (
        <Group title="Gauge">
          <Field label="Label">
            <TemplateEditor value={block.label} onChange={(v) => set('label', v)} locals={locals} />
          </Field>
          {(['value', 'min', 'max', 'low', 'high'] as const).map((k) => (
            <Field key={k} label={{ value: 'Value', min: 'Minimum', max: 'Maximum', low: 'Low limit', high: 'High limit' }[k]}>
              <BindingInput accept="scalar" value={block[k]} onChange={(v) => set(k, v)} locals={locals} placeholder={k === 'value' ? 'result' : 'a number'} />
            </Field>
          ))}
          <Field label="Unit">
            <TextInput value={block.unit} onChange={(v) => set('unit', v)} />
          </Field>
          <Field label="Decimals">
            <NumberInput value={block.decimals} min={0} max={8} onChange={(v) => set('decimals', Math.round(v))} />
          </Field>
          <Field label="Size">
            <NumberInput value={block.sizeMm} unit="mm" min={15} max={160} onChange={(v) => set('sizeMm', v)} />
          </Field>
        </Group>
      )
    case 'progress':
      return (
        <Group title="Progress">
          <Field label="Label">
            <TemplateEditor value={block.label} onChange={(v) => set('label', v)} locals={locals} />
          </Field>
          <Field label="Value">
            <BindingInput accept="scalar" value={block.value} onChange={(v) => set('value', v)} locals={locals} />
          </Field>
          <Field label="Maximum">
            <BindingInput accept="scalar" value={block.max} onChange={(v) => set('max', v)} locals={locals} />
          </Field>
          <Field label="Colour">
            <ColorInput value={block.color} onChange={(v) => set('color', v)} placeholder="accent" />
          </Field>
          <Toggle label="Show percentage" checked={block.showValue} onChange={(v) => set('showValue', v)} />
        </Group>
      )
    case 'qrCode':
      return (
        <Group title="QR code">
          <Field label="Content" stack hint="Text or URL; use {{ field }} for data.">
            <TemplateEditor value={block.value} onChange={(v) => set('value', v)} locals={locals} />
          </Field>
          <Field label="Size">
            <NumberInput value={block.sizeMm} unit="mm" min={8} max={120} onChange={(v) => set('sizeMm', v)} />
          </Field>
          <Field label="Caption">
            <TemplateEditor value={block.caption} onChange={(v) => set('caption', v)} locals={locals} />
          </Field>
          <Field label="Align">
            <Segmented value={block.align} options={ALIGN_OPTIONS} onChange={(v) => set('align', v)} />
          </Field>
        </Group>
      )
    case 'barcode':
      return (
        <Group title="Barcode">
          <Field label="Content" stack>
            <TemplateEditor value={block.value} onChange={(v) => set('value', v)} locals={locals} />
          </Field>
          <Field label="Format">
            <Select value={block.format} options={[{ value: 'code128', label: 'Code 128' }, { value: 'code39', label: 'Code 39' }, { value: 'ean13', label: 'EAN-13' }]} onChange={(v) => set('format', v)} />
          </Field>
          <Field label="Width">
            <NumberInput value={block.widthMm} unit="mm" min={10} max={200} onChange={(v) => set('widthMm', v)} />
          </Field>
          <Field label="Height">
            <NumberInput value={block.heightMm} unit="mm" min={4} max={80} onChange={(v) => set('heightMm', v)} />
          </Field>
          <Toggle label="Show text" checked={block.showText} onChange={(v) => set('showText', v)} />
          <Field label="Align">
            <Segmented value={block.align} options={ALIGN_OPTIONS} onChange={(v) => set('align', v)} />
          </Field>
        </Group>
      )
    case 'signatures':
      return (
        <Group title="Signatures" action={<AddButton onClick={() => set('entries', [...block.entries, { role: 'Signature', name: '' }])}>Line</AddButton>}>
          <Toggle label="Date line" checked={block.showDate} onChange={(v) => set('showDate', v)} />
          {block.entries.map((e, i) => (
            <div className="list-item" key={i}>
              <div className="list-item-head">
                <span className="grow">{e.role || `Line ${i + 1}`}</span>
                <ListControls onUp={i > 0 ? () => set('entries', swap(block.entries, i, i - 1)) : undefined} onDown={i < block.entries.length - 1 ? () => set('entries', swap(block.entries, i, i + 1)) : undefined} onRemove={() => set('entries', block.entries.filter((_, j) => j !== i))} />
              </div>
              <Field label="Role">
                <TemplateEditor value={e.role} onChange={(v) => set('entries', block.entries.map((x, j) => (j === i ? { ...x, role: v } : x)))} locals={locals} />
              </Field>
              <Field label="Name">
                <TemplateEditor value={e.name} onChange={(v) => set('entries', block.entries.map((x, j) => (j === i ? { ...x, name: v } : x)))} locals={locals} placeholder="{{ station.operator }}" />
              </Field>
            </div>
          ))}
        </Group>
      )
    case 'divider':
      return (
        <Group title="Divider">
          <Field label="Thickness">
            <NumberInput value={block.thickness} unit="pt" min={0.1} max={10} step={0.1} onChange={(v) => set('thickness', v)} />
          </Field>
          <Field label="Colour">
            <ColorInput value={block.color} onChange={(v) => set('color', v)} placeholder="border" />
          </Field>
        </Group>
      )
    case 'spacer':
      return (
        <Group title="Spacer">
          <Field label="Height">
            <NumberInput value={block.heightMm} unit="mm" min={0} max={300} onChange={(v) => set('heightMm', v)} />
          </Field>
        </Group>
      )
    case 'pageBreak':
      return (
        <Group title="Page break">
          <div className="hint">The next block starts on a new page. Long tables break across pages automatically; you only need this to force a break.</div>
        </Group>
      )
    case 'columns':
      return (
        <Group title="Columns" action={block.columns.length < 4 ? <AddButton onClick={() => set('columns', [...block.columns, { width: 1, blocks: [] }])}>Column</AddButton> : undefined}>
          <div className="presets" role="group" aria-label="Column layout">
            {COLUMN_PRESETS.map((w) => {
              const applicable = w.length >= block.columns.length || block.columns.slice(w.length).every((c) => c.blocks.length === 0)
              const on = w.length === block.columns.length && w.every((x, i) => x === block.columns[i].width)
              const total = w.reduce((a, b) => a + b, 0)
              return (
                <button
                  key={w.join(':')}
                  className={`preset${on ? ' on' : ''}`}
                  title={`Widths ${w.join(' : ')}`}
                  disabled={!applicable}
                  style={{ width: 22 + w.length * 14, opacity: applicable ? 1 : 0.35 }}
                  onClick={() => set('columns', w.map((width, i) => ({ width, blocks: block.columns[i]?.blocks ?? [] })))}
                >
                  {w.map((x, i) => (
                    <i key={i} style={{ flex: x / total }} />
                  ))}
                </button>
              )
            })}
          </div>
          <Field label="Gap">
            <NumberInput value={block.gapMm} unit="mm" min={0} max={50} onChange={(v) => set('gapMm', v)} />
          </Field>
          {block.columns.map((c, i) => (
            <Field key={i} label={`Column ${i + 1}`}>
              <div className="row">
                <NumberInput value={c.width} unit="fr" min={0.1} max={12} step={0.5} onChange={(v) => set('columns', block.columns.map((x, j) => (j === i ? { ...x, width: v } : x)))} />
                <button
                  className="btn icon small"
                  title={c.blocks.length ? 'Move its blocks out first' : 'Remove column'}
                  disabled={block.columns.length <= 1 || c.blocks.length > 0}
                  onClick={() => set('columns', block.columns.filter((_, j) => j !== i))}
                >
                  <X size={12} />
                </button>
              </div>
            </Field>
          ))}
          <div className="hint">Tip: drag a block onto the left or right edge of another block to put them side by side. You never need to add columns first.</div>
        </Group>
      )
    case 'section':
      return (
        <Group title="Group / Repeat">
          <Field label="Title" stack>
            <TemplateEditor value={block.title} onChange={(v) => set('title', v)} locals={block.repeat ? [...locals, { name: block.as || 'item', fields: itemFields(paths, block.repeat), doc: 'current item' }] : locals} placeholder="optional" />
          </Field>
          <Field label="Repeat for" stack hint="Pick a list and the group is drawn once per item, e.g. one block per channel. Leave empty to show it once.">
            <BindingInput accept="list" value={block.repeat ?? ''} onChange={(v) => set('repeat', v.trim() ? v : undefined)} locals={locals} placeholder="channels" />
          </Field>
          {block.title.trim() && (
            <Field label="Title size">
              <Segmented
                value={String(block.titleLevel ?? 2)}
                options={[{ value: '1', label: 'H1' }, { value: '2', label: 'H2' }, { value: '3', label: 'H3' }, { value: '4', label: 'H4' }]}
                onChange={(v) => set('titleLevel', Number(v))}
              />
            </Field>
          )}
          {block.repeat && (
            <Field label="Item name" hint={`Use {{ ${block.as || 'item'}.field }} inside the section.`}>
              <TextInput value={block.as} onChange={(v) => set('as', v.replace(/[^\w]/g, ''))} code />
            </Field>
          )}
          <Toggle label="Keep on one page" checked={block.keepTogether} onChange={(v) => set('keepTogether', v)} />
          <Toggle label="Start on a new page" checked={block.pageBreakBefore} onChange={(v) => set('pageBreakBefore', v)} />
          <Toggle label="Boxed" checked={block.boxed} onChange={(v) => set('boxed', v)} />
        </Group>
      )
  }
}

function ChartFields({ block, set, locals }: { block: BlockOf<'chart'>; set: (f: string, v: unknown) => void; locals: LocalVar[] }) {
  const paths = usePreview((p) => p.paths)
  const kinds = [
    { value: 'line', label: 'Line' },
    { value: 'bar', label: 'Bar' },
    { value: 'scatter', label: 'Scatter' },
    { value: 'histogram', label: 'Histogram' },
    { value: 'pie', label: 'Pie' },
  ] as const
  return (
    <>
      <Group title="Chart">
        <Field label="Type">
          <Select value={block.kind} options={[...kinds]} onChange={(v) => set('kind', v)} />
        </Field>
        <Field label="Title">
          <TemplateEditor value={block.title} onChange={(v) => set('title', v)} locals={locals} />
        </Field>
        <Field label="Height">
          <NumberInput value={block.heightMm} unit="mm" min={20} max={250} onChange={(v) => set('heightMm', v)} />
        </Field>
      </Group>
      <Disclosure title="Axes and appearance">
        {block.kind !== 'pie' && (
          <>
            <Field label="X axis">
              <TextInput value={block.xLabel} onChange={(v) => set('xLabel', v)} placeholder="label" />
            </Field>
            <Field label="Y axis">
              <TextInput value={block.yLabel} onChange={(v) => set('yLabel', v)} placeholder="label" />
            </Field>
          </>
        )}
        {block.kind === 'histogram' && (
          <Field label="Bins">
            <NumberInput value={block.bins} min={2} max={200} onChange={(v) => set('bins', Math.round(v))} />
          </Field>
        )}
        <Toggle label="Legend" checked={block.legend} onChange={(v) => set('legend', v)} />
        <Toggle label="Grid lines" checked={block.grid} onChange={(v) => set('grid', v)} />
      </Disclosure>
      <Group title="Series" action={<AddButton onClick={() => set('series', [...block.series, { label: `Series ${block.series.length + 1}`, source: '', x: '', y: '' }])}>Series</AddButton>}>
        {block.series.map((s, i) => {
          const setS = (patch: Partial<typeof s>) => set('series', block.series.map((x, j) => (j === i ? { ...x, ...patch } : x)))
          const itemLocals: LocalVar[] = [...locals, { name: 'item', fields: itemFields(paths, s.source), doc: 'current item' }, { name: 'index', fields: [], doc: '0-based' }]
          return (
            <div className="list-item" key={i}>
              <div className="list-item-head">
                <span className="grow">{s.label || `Series ${i + 1}`}</span>
                <ListControls onRemove={() => set('series', block.series.filter((_, j) => j !== i))} />
              </div>
              <Field label="Name">
                <TextInput value={s.label} onChange={(v) => setS({ label: v })} />
              </Field>
              <Field label="Data from">
                <BindingInput accept="list" value={s.source} onChange={(v) => setS({ source: v })} locals={locals} placeholder="results" />
              </Field>
              {block.kind !== 'histogram' && (
                <Field label={block.kind === 'bar' || block.kind === 'pie' ? 'Category' : 'X value'} hint="Empty = position">
                  <BindingInput accept="scalar" onlyLocals value={s.x} onChange={(v) => setS({ x: v })} locals={itemLocals} placeholder="item.name" />
                </Field>
              )}
              <Field label="Value" hint="Empty = the item itself">
                <BindingInput accept="scalar" onlyLocals value={s.y} onChange={(v) => setS({ y: v })} locals={itemLocals} placeholder="item.value" />
              </Field>
              <Field label="Colour">
                <ColorInput value={s.color} onChange={(v) => setS({ color: v })} placeholder="palette" />
              </Field>
            </div>
          )
        })}
      </Group>
      {block.kind !== 'pie' && (
        <Group title="Limit lines" action={<AddButton onClick={() => set('limits', [...block.limits, { label: 'Limit', value: '' }])}>Limit</AddButton>}>
          {block.limits.length === 0 && <div className="hint">Dashed reference lines for spec limits.</div>}
          {block.limits.map((l, i) => (
            <div className="list-item" key={i}>
              <div className="list-item-head">
                <span className="grow">{l.label || `Limit ${i + 1}`}</span>
                <ListControls onRemove={() => set('limits', block.limits.filter((_, j) => j !== i))} />
              </div>
              <Field label="Label">
                <TextInput value={l.label} onChange={(v) => set('limits', block.limits.map((x, j) => (j === i ? { ...x, label: v } : x)))} />
              </Field>
              <Field label="Value">
                <ExprInput value={l.value} onChange={(v) => set('limits', block.limits.map((x, j) => (j === i ? { ...x, value: v } : x)))} locals={locals} placeholder="5.25" />
              </Field>
            </div>
          ))}
        </Group>
      )}
    </>
  )
}
