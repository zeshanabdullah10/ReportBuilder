import { Check, Copy, FileJson, Save, X, CircleAlert, FileDown } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { exportPdf, pickJsonFile, saveTemplate } from '../lib/actions'
import * as engine from '../lib/engine'
import { missingPaths } from '../lib/mapping'
import { getPathValue } from '../lib/path'
import { activeData, useStore } from '../lib/store'

type Lang = 'labview' | 'cli' | 'python' | 'csharp'

function snippet(lang: Lang, path: string): string {
  switch (lang) {
    case 'labview':
      return [
        'Call Library Function Node → reportbuilder.dll → rb_render_file',
        '',
        `template_path   C string pointer   ${path}`,
        'data_path       C string pointer   <your data>.json (from Flatten To JSON)',
        'output_pdf      C string pointer   <report>.pdf',
        'options_json    C string pointer   (empty)',
        'result_json     C string pointer   string buffer, 4096 bytes',
        'result_len      Numeric, Int32     4096',
        '',
        'Return value 0 = success. result_json tells you what went wrong otherwise.',
      ].join('\n')
    case 'cli':
      return `report-cli render -t "${path}" -d data.json -o report.pdf`
    case 'python':
      return `from reportbuilder import ReportBuilder\n\nrb = ReportBuilder()\nrb.render(r"${path}", data, "report.pdf")  # data: dict or JSON text`
    case 'csharp':
      return `ReportBuilder.Render(@"${path}", dataJson, "report.pdf");`
  }
}

interface TestCheck { name: string; missing: string[]; total: number }

/** Everything between “I designed a template” and “my test station produces PDFs”. */
export function UsePanel() {
  const open = useStore((s) => s.usePanelOpen)
  const close = () => useStore.getState().setUsePanelOpen(false)
  const doc = useStore((s) => s.doc)
  const filePath = useStore((s) => s.filePath)
  const dirty = useStore((s) => s.dirty)
  const activeId = useStore((s) => s.activeDataSet)
  const toast = useStore((s) => s.toast)
  const [lang, setLang] = useState<Lang>('labview')
  const [contract, setContract] = useState<string[] | null>(null)
  const [tested, setTested] = useState<(TestCheck & { data: unknown }) | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTested(null)
    let alive = true
    engine
      .validate(doc, undefined)
      .then((r) => alive && setContract(r.referencedPaths))
      .catch(() => alive && setContract([]))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && useStore.getState().setUsePanelOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const data = useMemo(() => (open ? activeData(doc, activeId) : null), [open, doc, activeId])
  const rows = useMemo(
    () => (contract ?? []).filter((p) => /^[A-Za-z_]\w*(\.\w+)*$/.test(p)).map((p) => ({ path: p, ok: getPathValue(data, p) !== undefined })),
    [contract, data],
  )

  if (!open) return null

  const path = filePath ?? 'MyReport.rbt.json'
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
      setTested({ name: f.name, data: f.data, missing: missingPaths(rep.referencedPaths, f.data), total: rep.referencedPaths.length })
    } catch (e) {
      toast('error', `Could not read that file: ${String((e as Error).message ?? e)}`)
    }
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
            <div className="hint">Your test system loads this file at run time. Keep it next to your VIs or in a shared folder.</div>
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
                    <Check size={14} /> All {tested.total} fields the template reads were found.
                  </>
                ) : (
                  <>
                    <CircleAlert size={14} /> Missing from “{tested.name}”: {tested.missing.join(', ')}
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
                <span key={r.path} className={`contract-chip${r.ok ? '' : ' miss'}`} title={r.ok ? 'Found in the current preview data' : 'Not in the current preview data'}>
                  {r.ok ? <Check size={11} /> : <CircleAlert size={11} />} {r.path}
                </span>
              ))}
            </div>
            <div className="use-row" style={{ marginTop: 8 }}>
              <button className="btn small bordered" onClick={() => copy('json', JSON.stringify(data, null, 2))}>
                <Copy size={12} /> {copied === 'json' ? 'Copied' : 'Copy the preview data as an example'}
              </button>
            </div>
          </section>

          <section>
            <h3>4 · Call it from your test system</h3>
            <div className="segmented" role="tablist">
              {(['labview', 'cli', 'python', 'csharp'] as Lang[]).map((l) => (
                <button key={l} role="tab" aria-pressed={lang === l} onClick={() => setLang(l)}>
                  {{ labview: 'LabVIEW', cli: 'Command line', python: 'Python', csharp: 'C#' }[l]}
                </button>
              ))}
            </div>
            <pre className="snippet">{snippet(lang, path)}</pre>
            <div className="use-row">
              <button className="btn small bordered" onClick={() => copy('snippet', snippet(lang, path))}>
                <Copy size={12} /> {copied === 'snippet' ? 'Copied' : 'Copy'}
              </button>
              {lang === 'labview' && <span className="hint">Full walkthrough: integrations/labview/README.md</span>}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
