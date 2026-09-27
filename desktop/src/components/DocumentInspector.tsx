import { FileText, ImagePlus, X } from 'lucide-react'
import { DEFAULT_THEME } from '../lib/defaults'
import { useStore } from '../lib/store'
import type { PaperSize, ReportDocument, Theme } from '../lib/types'
import { ColorInput, ExprInput, Field, Group, NumberInput, Segmented, Select, TextInput, Toggle } from './fields'
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
      </div>
    </>
  )
}
