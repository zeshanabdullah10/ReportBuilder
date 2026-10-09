import { CircleAlert, Clock, FileJson, FolderOpen, Import, Sparkles, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { importLegacy, openRecent, openTemplate, pickJsonFile } from '../lib/actions'
import { dataSetName, parseDataFile } from '../lib/csv'
import { buildFieldTree, type FieldNode } from '../lib/data-model'
import { newDocument, normalizeDocument } from '../lib/defaults'
import * as engine from '../lib/engine'
import { asStarter, deleteMyTemplate, isMyTemplate } from '../lib/library'
import { applyMapping, type MappingRow, missingPaths, remapItemFields, suggestMapping } from '../lib/mapping'
import { draftBody } from '../lib/drop'
import { MY_TEMPLATES, removeRecent, usePref } from '../lib/prefs'
import { useStore } from '../lib/store'
import type { ReportDocument, Starter } from '../lib/types'
import { MappingDialog } from './MappingDialog'

interface UserData {
  name: string
  data: unknown
}

interface Fit {
  starter: Starter
  /** 0..1: the share of the template's fields the data already has. */
  score: number
  missing: number
}

function Thumb({ template, data }: { template: string; data: unknown }) {
  const [svg, setSvg] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    setSvg(null)
    engine
      .preview({ template: JSON.parse(template) as ReportDocument, data })
      .then((r) => alive && setSvg(r.pages[0] ?? null))
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [template, data])
  return (
    <div className="thumb">
      {svg ? <div style={{ width: '100%', height: '100%' }} dangerouslySetInnerHTML={{ __html: svg }} /> : <div className="thumb-loading"><div className="spinner" /></div>}
    </div>
  )
}

function DropZone({ onData }: { onData: (d: UserData) => void }) {
  const [over, setOver] = useState(false)
  const [paste, setPaste] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  /** `fileName` with its extension: `.csv` goes through the engine's CSV importer. */
  const accept = async (fileName: string, raw: string) => {
    try {
      const data = await parseDataFile(fileName, raw)
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Expected a JSON object at the top level')
      setError(null)
      onData({ name: dataSetName(fileName), data })
    } catch (e) {
      setError(String((e as Error).message ?? e))
    }
  }

  return (
    <div
      className={`dropzone${over ? ' over' : ''}`}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault()
          setOver(true)
        }
      }}
      onDragLeave={() => setOver(false)}
      onDrop={async (e) => {
        e.preventDefault()
        setOver(false)
        const f = e.dataTransfer.files[0]
        if (f) await accept(f.name, await f.text())
      }}
    >
      <FileJson size={26} strokeWidth={1.5} />
      <div className="dz-text">
        <strong>Start from your test data</strong>
        <span>Drop the JSON or CSV file your test system produces. We’ll build the report around it.</span>
      </div>
      <div className="dz-actions">
        <button
          className="btn primary"
          onClick={async () => {
            try {
              const r = await pickJsonFile()
              if (r) onData(r)
            } catch (e) {
              setError(String((e as Error).message ?? e))
            }
          }}
        >
          <FolderOpen size={14} /> Choose file…
        </button>
        <button className="btn bordered" onClick={() => setPaste(!paste)}>
          Paste JSON
        </button>
      </div>
      {paste && (
        <div className="dz-paste">
          <textarea className="textarea code" rows={6} placeholder='{ "dut": { "serial": "…" }, "measurements": [ … ] }' value={text} onChange={(e) => setText(e.target.value)} autoFocus />
          <button className="btn primary" disabled={!text.trim()} onClick={() => accept('Pasted data.json', text)}>
            Use this data
          </button>
        </div>
      )}
      {error && (
        <div className="dz-error">
          <CircleAlert size={13} /> {error}
        </div>
      )}
    </div>
  )
}

export function Welcome() {
  const [builtIn, setBuiltIn] = useState<Starter[]>([])
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<UserData | null>(null)
  const [fits, setFits] = useState<Fit[] | null>(null)
  const [category, setCategory] = useState('All')
  const [mapping, setMapping] = useState<{ starter: Starter; tpl: ReportDocument; rows: MappingRow[] } | null>(null)
  const newFromStarter = useStore((s) => s.newFromStarter)
  const newFromData = useStore((s) => s.newFromData)
  const hasDoc = useStore((s) => s.filePath !== null || s.dirty)
  const close = useStore((s) => s.closeWelcome)
  const tree: FieldNode[] = useMemo(() => (user ? buildFieldTree(user.data) : []), [user])
  const recent = usePref('recent')
  const savedTemplates = usePref('templates')
  const mine = useMemo(() => savedTemplates.map(asStarter), [savedTemplates])
  /** The user's own templates come first. */
  const starters = useMemo(() => [...mine, ...builtIn], [mine, builtIn])

  useEffect(() => {
    engine
      .starters()
      .then(setBuiltIn)
      .catch((e) => setError(String(e)))
  }, [])

  // Rank the starters by how many of the fields they read the data already has.
  useEffect(() => {
    if (!user || starters.length === 0) {
      setFits(null)
      return
    }
    let alive = true
    void Promise.all(
      starters.map(async (starter): Promise<Fit> => {
        try {
          const rep = await engine.validate(JSON.parse(starter.template) as ReportDocument, user.data)
          const total = rep.referencedPaths.length
          const missing = missingPaths(rep.referencedPaths, user.data).length
          return { starter, score: total === 0 ? 0.5 : 1 - missing / total, missing }
        } catch {
          return { starter, score: 0, missing: 0 }
        }
      }),
    ).then((r) => alive && setFits(r.sort((a, b) => b.score - a.score)))
    return () => {
      alive = false
    }
  }, [user, starters])

  const finish = (s: Starter, tpl: ReportDocument, map: Record<string, string>, itemOverrides: Record<string, string> = {}) => {
    if (!user) return
    const doc = remapItemFields(applyMapping(normalizeDocument(tpl), map), tree, itemOverrides).doc
    // The user's own templates keep their own brand; starters take the default brand kit.
    newFromData(doc, user.data, user.name, { brand: !isMyTemplate(s) })
  }

  const choose = async (s: Starter) => {
    if (!user) return newFromStarter(s.template, s.data, { brand: !isMyTemplate(s) })
    const tpl = normalizeDocument(JSON.parse(s.template) as ReportDocument)
    try {
      const rep = await engine.validate(tpl, user.data)
      const miss = missingPaths(rep.referencedPaths, user.data)
      // Lists that match by name may still have items with other field names: confirm those too.
      if (miss.length === 0 && remapItemFields(tpl, tree).changes.length === 0) return finish(s, tpl, {})
      setMapping({ starter: s, tpl, rows: suggestMapping(miss, tree) })
    } catch {
      finish(s, tpl, {})
    }
  }

  const removeMine = async (s: Starter) => {
    if (await engine.confirmAsync(`Delete “${s.name}” from My templates?`, 'Delete')) deleteMyTemplate(s.id)
  }

  const draft = () => {
    if (!user) return
    const doc = newDocument()
    doc.meta.name = user.name
    doc.body = draftBody(tree, user.name)
    newFromData(doc, user.data, user.name)
  }

  const best = fits?.slice(0, 3) ?? []
  const categories = useMemo(() => ['All', ...new Set(starters.map((s) => s.category))], [starters])
  const shownCategory = categories.includes(category) ? category : 'All'
  const shown = shownCategory === 'All' ? starters : starters.filter((s) => s.category === shownCategory)
  const previewData = (s: Starter): unknown => (user ? user.data : JSON.parse(s.data))

  return (
    <div className="welcome">
      <div className="welcome-inner">
        <h1>Create a report</h1>
        <p className="lede">Start from your data, or from a proven layout. Every template reflows with your data: long tables break across pages and verdicts compute themselves.</p>

        {user ? (
          <div className="using-data">
            <FileJson size={16} />
            <span>
              Using <strong>{user.name}</strong> · {tree.length} top-level field{tree.length === 1 ? '' : 's'}
            </span>
            <button className="btn small" onClick={() => setUser(null)}>
              <X size={12} /> Change
            </button>
          </div>
        ) : (
          <DropZone onData={setUser} />
        )}

        <div className="welcome-actions">
          <button className="btn bordered" onClick={openTemplate}>
            <FolderOpen size={15} /> Open template…
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
        {recent.length > 0 && (
          <div className="recent">
            <h2 className="welcome-h2">Recent</h2>
            <ul className="recent-list" aria-label="Recent templates">
              {recent.map((r) => (
                <li key={r.path}>
                  <button className="recent-open" onClick={() => openRecent(r.path)} title={r.path} aria-label={`Open ${r.name}`}>
                    <Clock size={13} />
                    <span className="recent-name">{r.name}</span>
                    <span className="recent-path">{r.path}</span>
                  </button>
                  <button className="btn icon small" title="Remove from recent" aria-label={`Remove ${r.name} from recent`} onClick={() => removeRecent(r.path)}>
                    <X size={12} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {error && (
          <div className="render-error" style={{ margin: '0 0 24px' }}>
            <strong>The report engine is not reachable.</strong>
            <pre>{error}</pre>
            <div className="hint" style={{ marginTop: 8 }}>
              In a browser, start it with <code>report-cli serve</code>.
            </div>
          </div>
        )}

        {user && (
          <>
            <h2 className="welcome-h2">Best fit for your data</h2>
            <div className="starter-grid best">
              <button className="starter draft" onClick={draft} aria-label="Build a report from your data">
                <div className="thumb draft-thumb">
                  <Sparkles size={28} strokeWidth={1.5} />
                  <span>Build it from<br />your data</span>
                </div>
                <div className="name">Draft from your data</div>
                <div className="desc">A title, details, your lists as tables. Then refine.</div>
              </button>
              {best.map((f) => (
                <button key={f.starter.id} className="starter" onClick={() => choose(f.starter)} aria-label={`New ${f.starter.name}`}>
                  <Thumb template={f.starter.template} data={user.data} />
                  <div className="name">
                    {f.starter.name}
                    <span className={`fit ${f.missing === 0 ? 'ok' : ''}`}>{f.missing === 0 ? 'Fits your data' : `${f.missing} field${f.missing === 1 ? '' : 's'} to match`}</span>
                  </div>
                  <div className="desc">{f.starter.description}</div>
                </button>
              ))}
            </div>
          </>
        )}

        <h2 className="welcome-h2">{user ? 'All templates' : 'Start from a template'}</h2>
        <div className="chips" role="tablist" aria-label="Template category">
          {categories.map((c) => (
            <button key={c} role="tab" className={`chip-btn${c === shownCategory ? ' on' : ''}`} aria-pressed={c === shownCategory} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>
        <div className="starter-grid">
          {shown.map((s) => {
            const card = (
              <button key={s.id} className="starter" onClick={() => choose(s)} aria-label={`New ${s.name}`}>
                <Thumb template={s.template} data={previewData(s)} />
                <div className="name">
                  {s.name}
                  {isMyTemplate(s) && shownCategory === 'All' && <span className="fit mine">{MY_TEMPLATES}</span>}
                </div>
                <div className="desc">{s.description}</div>
              </button>
            )
            if (!isMyTemplate(s)) return card
            return (
              <div key={s.id} className="starter-wrap">
                {card}
                <button className="btn icon starter-delete" title={`Delete ${s.name}`} aria-label={`Delete ${s.name}`} onClick={() => removeMine(s)}>
                  <Trash2 size={13} />
                </button>
              </div>
            )
          })}
        </div>
      </div>
      {mapping && user && (
        <MappingDialog
          title={mapping.starter.name}
          template={mapping.tpl}
          rows={mapping.rows}
          tree={tree}
          onCancel={() => setMapping(null)}
          onApply={(m, items) => {
            setMapping(null)
            finish(mapping.starter, mapping.tpl, m, items)
          }}
        />
      )}
    </div>
  )
}
