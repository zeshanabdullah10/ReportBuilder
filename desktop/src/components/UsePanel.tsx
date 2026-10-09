import { Check, Copy, FileJson, Save, X, CircleAlert, FileDown } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { exportPdf, pickJsonFile, saveTemplate } from '../lib/actions'
import * as engine from '../lib/engine'
import { buildFieldTree } from '../lib/data-model'
import { type MappingRow, missingPaths, suggestMapping } from '../lib/mapping'
import { activeData, useStore } from '../lib/store'
import type { ContractResult } from '../lib/types'
import { MappingDialog } from './MappingDialog'

type Lang = 'labview' | 'teststand' | 'cli' | 'python' | 'csharp' | 'http'
type TypeLang = 'labview' | 'csharp' | 'python' | 'typescript'

function snippet(lang: Lang, path: string): string {
  switch (lang) {
    case 'labview':
      return [
        'Call Library Function Node → reportbuilder.dll → rb_render_file',
        '',
        `template_path   C string pointer   ${path}`,
        'data_path       C string pointer   <your data>.json (from Flatten To JSON) or .csv',
        'output_pdf      C string pointer   <report>.pdf',
        'options_json    C string pointer   (empty)',
        'result_json     C string pointer   string buffer, 4096 bytes',
        'result_len      Numeric, Int32     4096',
        '',
        'Return value 0 = success. result_json tells you what went wrong otherwise.',
        'Build the data cluster from “Typed data structures → LabVIEW” below.',
      ].join('\n')
    case 'teststand':
      return [
        'Add an Action step after MainSequence (or in SequenceFilePostUUT):',
        '  Module: LabVIEW or C/C++ DLL adapter → reportbuilder.dll, rb_render_file',
        `  template_path = "${path.replace(/\\/g, '\\\\')}"`,
        '  data_path     = Locals.ReportDataPath   (JSON written by a code module)',
        '  output_pdf    = RunState.Root.Locals.ReportPath',
        '',
        'Write the data JSON from Parameters.MainSequenceResults: one measurement row per',
        'Numeric Limit step → { name: Step.Name, value: Numeric, low: Limits.Low,',
        'high: Limits.High, unit: Units, status: Status }. See integrations/labview/README.md.',
      ].join('\n')
    case 'cli':
      return `report-cli render -t "${path}" -d data.json -o report.pdf --json\nreport-cli batch -t "${path}" -i incoming/ -o reports/ --watch --name "{{ dut.serial ?? __file }}"`
    case 'python':
      return `from reportbuilder import ReportBuilder\n\nrb = ReportBuilder()\nrb.render(r"${path}", data, "report.pdf")  # data: dict or JSON text`
    case 'csharp':
      return `var json = System.Text.Json.JsonSerializer.Serialize(data); // data: the generated class below\nReportBuilder.Render(@"${path}", json, "report.pdf");`
    case 'http':
      return `report-cli serve --port 8787\n\nPOST http://127.0.0.1:8787/api/pdf\n{ "template": <contents of ${path.split(/[\\/]/).pop()}>, "data": { … } }`
  }
}

const LANG_LABEL: Record<Lang, string> = { labview: 'LabVIEW', teststand: 'TestStand', cli: 'Command line', python: 'Python', csharp: 'C#', http: 'HTTP' }
const TYPE_LABEL: Record<TypeLang, string> = { labview: 'LabVIEW cluster', csharp: 'C#', python: 'Python', typescript: 'TypeScript' }
const TYPE_EXT: Record<TypeLang, string> = { labview: 'txt', csharp: 'cs', python: 'py', typescript: 'ts' }

/** Save text to a file: a native dialog on desktop, a download in the browser. */
async function saveText(name: string, text: string, ext: string): Promise<boolean> {
  if (engine.isTauri) {
    const path = await engine.saveDialog(name, [{ name: ext.toUpperCase(), extensions: [ext] }])
    if (!path) return false
    await engine.writeTextFile(path, text)
    return true
  }
  engine.downloadInBrowser(name, new Blob([text], { type: 'text/plain' }))
  return true
}

interface TestCheck { name: string; missing: string[]; total: number; data: unknown }

/** Everything between “I designed a template” and “my test station produces PDFs”. */
export function UsePanel() {
  const open = useStore((s) => s.usePanelOpen)
  const close = () => useStore.getState().setUsePanelOpen(false)
  const doc = useStore((s) => s.doc)
  const filePath = useStore((s) => s.filePath)
  const dirty = useStore((s) => s.dirty)
  const activeId = useStore((s) => s.activeDataSet)
  const toast = useStore((s) => s.toast)
  const change = useStore((s) => s.change)
  const [lang, setLang] = useState<Lang>('labview')
  const [typeLang, setTypeLang] = useState<TypeLang>('labview')
  const [contract, setContract] = useState<ContractResult | null>(null)
  const [code, setCode] = useState<string>('')
  const [tested, setTested] = useState<TestCheck | null>(null)
  const [mapping, setMapping] = useState<MappingRow[] | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const data = useMemo(() => (open ? activeData(doc, activeId) : null), [open, doc, activeId])

  useEffect(() => {
    if (!open) return
    let alive = true
    engine
      .contract(doc, data)
      .then((r) => alive && setContract(r))
      .catch(() => alive && setContract({ contract: [], schema: {} }))
    return () => {
      alive = false
    }
  }, [open, doc, data])

  useEffect(() => {
    if (!open) return
    let alive = true
    engine
      .contract(doc, data, typeLang)
      .then((r) => alive && setCode(r.code ?? ''))
      .catch((e) => alive && setCode(`// ${String((e as Error).message ?? e)}`))
    return () => {
      alive = false
    }
  }, [open, doc, data, typeLang])

  useEffect(() => {
    if (!open) return
    setTested(null)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && useStore.getState().setUsePanelOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const rows = useMemo(
    () => (contract?.contract ?? []).map((c) => ({ ...c, ok: c.optional || pathPresent(data, c.path) })),
    [contract, data],
  )

  if (!open) return null

  const path = filePath ?? 'MyReport.rbt.json'
  const base = (filePath?.split(/[\\/]/).pop() ?? doc.meta.name ?? 'report').replace(/\.rbt\.json$/i, '') || 'report'
  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      toast('error', 'Could not copy to the clipboard')
    }
  }

  const test = async () => {
    try {
      const f = await pickJsonFile()
      if (!f) return
      const rep = await engine.validate(doc, f.data)
      const required = rep.contract.filter((c) => !c.optional)
      const missing = rep.issues.filter((i) => i.message.startsWith('data field')).map((i) => /'([^']+)'/.exec(i.message)?.[1] ?? i.message)
      setTested({ name: f.name, data: f.data, missing, total: required.length })
    } catch (e) {
      toast('error', `Could not read that file: ${String((e as Error).message ?? e)}`)
    }
  }

  const mapFields = () => {
    if (!tested) return
    const top = missingPaths(tested.missing, tested.data)
    if (top.length === 0) {
      toast('info', 'Only fields inside lists are missing: map them under Document settings → Field mapping.')
      return
    }
    setMapping(suggestMapping(top, buildFieldTree(tested.data)))
  }

  return (
    <div className="scrim" onMouseDown={close}>
      <div className="dialog use-panel" role="dialog" aria-label="Use this template" onMouseDown={(e) => e.stopPropagation()}>
        <div className="dialog-head">
          <strong>Use this template</strong>
          <span className="grow" />
          <button className="btn icon" onClick={close} title="Close">
            <X size={15} />
          </button>
        </div>
        <div className="use-body">
          <section>
            <h3>1 · Save the template</h3>
            <div className="use-row">
              <code className="use-path">{filePath ?? 'Not saved yet'}</code>
              <button className="btn bordered" onClick={() => saveTemplate(!filePath)}>
                <Save size={14} /> {filePath ? (dirty ? 'Save now' : 'Saved') : 'Save…'}
              </button>
            </div>
            <div className="hint">
              Your test system loads this file at run time. Images given as file paths must travel with it; <code>report-cli pack</code> embeds them so the
              template is a single file.
            </div>
          </section>

          <section>
            <h3>2 · Check it against real data</h3>
            <div className="use-row">
              <button className="btn bordered" onClick={test}>
                <FileJson size={14} /> Choose a data file…
              </button>
              {tested && (
                <button className="btn primary" onClick={() => exportPdf(false, tested.data)}>
                  <FileDown size={14} /> Export PDF from “{tested.name}”
                </button>
              )}
            </div>
            {tested && (
              <div className={`use-check ${tested.missing.length ? 'warn' : 'ok'}`}>
                {tested.missing.length === 0 ? (
                  <>
                    <Check size={14} /> All {tested.total} required fields the template reads were found.
                  </>
                ) : (
                  <>
                    <CircleAlert size={14} /> Missing from “{tested.name}”: {tested.missing.join(', ')}
                    <button className="btn small bordered" style={{ marginLeft: 8 }} onClick={mapFields}>
                      Map to fields this data has…
                    </button>
                  </>
                )}
              </div>
            )}
          </section>

          <section>
            <h3>3 · What your data must contain</h3>
            <div className="contract">
              {rows.length === 0 && <span className="hint">{contract ? 'This template reads no data fields yet.' : 'Reading the template…'}</span>}
              {rows.map((r) => (
                <span
                  key={r.path}
                  className={`contract-chip${r.ok ? '' : ' miss'}${r.optional ? ' optional' : ''}`}
                  title={`${r.kind === 'any' ? 'type unknown' : r.kind}${r.optional ? ', optional' : ''}${r.ok ? '' : ' — not in the current preview data'}`}
                >
                  {r.ok ? <Check size={11} /> : <CircleAlert size={11} />} {r.path}
                  <small>{r.kind !== 'any' ? ` ${r.kind}` : ''}{r.optional ? ' · optional' : ''}</small>
                </span>
              ))}
            </div>
            <div className="use-row" style={{ marginTop: 8 }}>
              <button className="btn small bordered" onClick={() => saveText(`${base}.data.json`, JSON.stringify(data, null, 2) + '\n', 'json')}>
                <FileDown size={12} /> Save example data
              </button>
              <button className="btn small bordered" onClick={() => contract && saveText(`${base}.schema.json`, JSON.stringify(contract.schema, null, 2) + '\n', 'json')}>
                <FileDown size={12} /> Save JSON Schema
              </button>
              <button className="btn small bordered" onClick={() => copy('json', JSON.stringify(data, null, 2))}>
                <Copy size={12} /> {copied === 'json' ? 'Copied' : 'Copy example data'}
              </button>
            </div>
          </section>

          <section>
            <h3>4 · Typed data structures</h3>
            <div className="segmented" role="tablist">
              {(Object.keys(TYPE_LABEL) as TypeLang[]).map((l) => (
                <button key={l} role="tab" aria-pressed={typeLang === l} onClick={() => setTypeLang(l)}>
                  {TYPE_LABEL[l]}
                </button>
              ))}
            </div>
            <pre className="snippet">{code || 'Generating…'}</pre>
            <div className="use-row">
              <button className="btn small bordered" onClick={() => copy('code', code)}>
                <Copy size={12} /> {copied === 'code' ? 'Copied' : 'Copy'}
              </button>
              <button className="btn small bordered" onClick={() => saveText(`${base}-data.${TYPE_EXT[typeLang]}`, code, TYPE_EXT[typeLang])}>
                <FileDown size={12} /> Save…
              </button>
              <span className="hint">Generated from the fields above; types come from the preview data.</span>
            </div>
          </section>

          <section>
            <h3>5 · Call it from your test system</h3>
            <div className="segmented" role="tablist">
              {(Object.keys(LANG_LABEL) as Lang[]).map((l) => (
                <button key={l} role="tab" aria-pressed={lang === l} onClick={() => setLang(l)}>
                  {LANG_LABEL[l]}
                </button>
              ))}
            </div>
            <pre className="snippet">{snippet(lang, path)}</pre>
            <div className="use-row">
              <button className="btn small bordered" onClick={() => copy('snippet', snippet(lang, path))}>
                <Copy size={12} /> {copied === 'snippet' ? 'Copied' : 'Copy'}
              </button>
              {(lang === 'labview' || lang === 'teststand') && <span className="hint">Full walkthrough: integrations/labview/README.md</span>}
            </div>
          </section>
        </div>
      </div>
      {mapping && tested && (
        <MappingDialog
          title={doc.meta.name || 'this template'}
          rows={mapping}
          tree={buildFieldTree(tested.data)}
          onCancel={() => setMapping(null)}
          onApply={(m) => {
            setMapping(null)
            const add = Object.fromEntries(Object.entries(m).filter(([need, have]) => have && need !== have))
            if (Object.keys(add).length === 0) return
            change((d) => ({ ...d, dataMap: { ...(d.dataMap ?? {}), ...add } }), 'doc:dataMap')
            toast('success', `Mapped ${Object.keys(add).length} field${Object.keys(add).length === 1 ? '' : 's'}. The template now reads this data as-is.`)
            void engine.validate({ ...doc, dataMap: { ...(doc.dataMap ?? {}), ...add } }, tested.data).then((rep) => {
              const missing = rep.issues.filter((i) => i.message.startsWith('data field')).map((i) => /'([^']+)'/.exec(i.message)?.[1] ?? i.message)
              setTested({ ...tested, missing })
            })
          }}
        />
      )}
    </div>
  )
}

/** Is a contract path (`list[].field`) present in data? Any list element counts. */
export function pathPresent(data: unknown, path: string): boolean {
  const segs = path.split(/\.|(?=\[\])/).filter(Boolean)
  const go = (v: unknown, i: number): boolean => {
    if (i === segs.length) return true
    const seg = segs[i]
    if (seg === '[]') return Array.isArray(v) && (v.length === 0 || v.some((x) => go(x, i + 1)))
    if (!v || typeof v !== 'object' || Array.isArray(v)) return false
    const o = v as Record<string, unknown>
    return seg in o && (o[seg] === null || go(o[seg], i + 1))
  }
  return go(data, 0)
}
