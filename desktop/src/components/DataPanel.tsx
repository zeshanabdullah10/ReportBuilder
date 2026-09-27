import { CircleAlert, Plus, Trash2, TriangleAlert, Upload } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { loadDataFile } from '../lib/actions'
import { dataSets, isGeneratedSet } from '../lib/defaults'
import { usePreview } from '../lib/preview'
import { useStore } from '../lib/store'
import { Select } from './fields'
import type { Issue } from '../lib/types'

const NO_ISSUES: Issue[] = []

export function DataPanel() {
  const doc = useStore((s) => s.doc)
  const active = useStore((s) => s.activeDataSet)
  const setActive = useStore((s) => s.setActiveDataSet)
  const setData = useStore((s) => s.setDataSetData)
  const addSet = useStore((s) => s.addDataSet)
  const removeSet = useStore((s) => s.removeDataSet)
  const toast = useStore((s) => s.toast)
  const sets = useMemo(() => dataSets(doc), [doc])
  const current = sets.find((s) => s.id === active) ?? sets[0]
  const readOnly = isGeneratedSet(current.id)

  const [text, setText] = useState(() => JSON.stringify(current.data, null, 2))
  const [error, setError] = useState<string | null>(null)
  // Reset the editor when switching sets (not while typing into the same one).
  useEffect(() => {
    setText(JSON.stringify(current.data, null, 2))
    setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.id])

  const onEdit = (t: string) => {
    setText(t)
    try {
      const v = JSON.parse(t)
      setError(null)
      setData(current.id, v)
    } catch (e) {
      setError((e as Error).message.replace(/^JSON\.parse: /, ''))
    }
  }

  return (
    <div className="scroll">
      <div className="section-label">Data set</div>
      <div style={{ padding: '0 10px' }}>
        <div className="row">
          <Select value={current.id} options={sets.map((s) => ({ value: s.id, label: s.name }))} onChange={setActive} ariaLabel="Active data set" />
          <button className="btn icon bordered" title="Load a JSON file as a new data set" onClick={loadDataFile}>
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
        <div className="hint" style={{ marginTop: 6 }}>
          {readOnly
            ? 'Generated from the sample data to check edge cases. Duplicate it to edit.'
            : 'The preview updates as you type. Data sets are saved with the template.'}
        </div>
      </div>

      <div className="section-label">JSON</div>
      <div className="json-editor">
        <textarea
          className="textarea code"
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
      </div>
      <div className={`json-status${error ? ' bad' : ''}`}>{error ? <><CircleAlert size={12} /> {error}</> : 'Valid JSON'}</div>

      <Fields />
      <Issues />
    </div>
  )
}

function Fields() {
  const paths = usePreview((s) => s.paths)
  const toast = useStore((s) => s.toast)
  return (
    <>
      <div className="section-label">Fields <span className="grow" /> <span style={{ fontWeight: 400 }}>click to copy</span></div>
      <div className="data-tree">
        {paths.length === 0 && <div className="hint" style={{ padding: '0 6px' }}>No fields yet.</div>}
        {paths.map((p) => {
          const depth = p.path.split('.').length - 1
          const leaf = p.path.split('.').pop()!
          return (
            <div
              key={p.path}
              className="node"
              style={{ paddingLeft: 6 + depth * 12 }}
              title={p.path}
              onClick={() => {
                const expr = p.path.includes('[]') ? p.path.split('[].').pop()! : p.path
                navigator.clipboard?.writeText(`{{ ${expr} }}`).catch(() => undefined)
                toast('info', `Copied {{ ${expr} }}`)
              }}
            >
              <span className="k">{leaf}</span>
              <span className="v">{p.sample}</span>
            </div>
          )
        })}
      </div>
    </>
  )
}

export function Issues() {
  const issues = usePreview((s) => s.result?.issues ?? NO_ISSUES)
  const select = useStore((s) => s.select)
  const visible = issues.filter((i) => i.severity !== 'info')
  return (
    <>
      <div className="section-label">Issues <span className="grow" /> {visible.length > 0 && <span>{visible.length}</span>}</div>
      <div style={{ padding: '0 10px 16px' }}>
        {visible.length === 0 && <div className="hint">No problems with this data set.</div>}
        {visible.map((i, n) => (
          <div
            key={n}
            className={`issue ${i.severity}${i.blockId ? ' clickable' : ''}`}
            onClick={() => i.blockId && select(i.blockId)}
          >
            {i.severity === 'error' ? <CircleAlert size={14} /> : <TriangleAlert size={14} />}
            <div>
              {i.message}
              {i.blockId && <span className="where">{i.blockId}{i.field ? ` · ${i.field}` : ''}</span>}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
