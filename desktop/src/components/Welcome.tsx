import { FolderOpen, Import } from 'lucide-react'
import { useEffect, useState } from 'react'
import { importLegacy, openTemplate } from '../lib/actions'
import * as engine from '../lib/engine'
import { useStore } from '../lib/store'
import type { ReportDocument, Starter } from '../lib/types'

function Thumb({ starter }: { starter: Starter }) {
  const [svg, setSvg] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    engine
      .preview({ template: JSON.parse(starter.template) as ReportDocument, data: JSON.parse(starter.data) })
      .then((r) => alive && setSvg(r.pages[0] ?? null))
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [starter])
  return (
    <div className="thumb">
      {svg ? <div style={{ width: '100%', height: '100%' }} dangerouslySetInnerHTML={{ __html: svg }} /> : <div className="thumb-loading"><div className="spinner" /></div>}
    </div>
  )
}

export function Welcome() {
  const [starters, setStarters] = useState<Starter[]>([])
  const [error, setError] = useState<string | null>(null)
  const newFromStarter = useStore((s) => s.newFromStarter)
  const hasDoc = useStore((s) => s.filePath !== null || s.dirty)
  const close = useStore((s) => s.closeWelcome)

  useEffect(() => {
    engine
      .starters()
      .then(setStarters)
      .catch((e) => setError(String(e)))
  }, [])

  return (
    <div className="welcome">
      <div className="welcome-inner">
        <h1>Create a report</h1>
        <p className="lede">Start from a proven layout. Every template reflows with your data: long tables break across pages and verdicts compute themselves.</p>
        <div className="welcome-actions">
          <button className="btn bordered" onClick={openTemplate}>
            <FolderOpen size={15} /> Open…
          </button>
          <button className="btn bordered" onClick={importLegacy}>
            <Import size={15} /> Import legacy template…
          </button>
          {hasDoc && (
            <button className="btn" onClick={close}>
              Back to current document
            </button>
          )}
        </div>
        {error && (
          <div className="render-error" style={{ margin: '0 0 24px' }}>
            <strong>The report engine is not reachable.</strong>
            <pre>{error}</pre>
            <div className="hint" style={{ marginTop: 8 }}>
              In a browser, start it with <code>report-cli serve</code>.
            </div>
          </div>
        )}
        <div className="starter-grid">
          {starters.map((s) => (
            <button key={s.id} className="starter" onClick={() => newFromStarter(s.template, s.data)} aria-label={`New ${s.name}`}>
              <Thumb starter={s} />
              <div className="name">{s.name}</div>
              <div className="desc">{s.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
