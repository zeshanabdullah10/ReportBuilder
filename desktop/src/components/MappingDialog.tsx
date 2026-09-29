import { ArrowRight, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { findField, type FieldNode, walkFields } from '../lib/data-model'
import type { MappingRow } from '../lib/mapping'

/** "This template reads X, your data has Y" — confirm the matches before the report opens. */
export function MappingDialog({
  title,
  rows,
  tree,
  onApply,
  onCancel,
}: {
  title: string
  rows: MappingRow[]
  tree: FieldNode[]
  onApply: (mapping: Record<string, string>) => void
  onCancel: () => void
}) {
  const [choice, setChoice] = useState<Record<string, string>>(() => Object.fromEntries(rows.map((r) => [r.need, r.suggestion ?? ''])))
  const all = useMemo(() => {
    const out: FieldNode[] = []
    walkFields(tree, (n) => {
      if (!n.path.includes('[]') && n.kind !== 'empty') out.push(n)
    })
    return out
  }, [tree])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const matched = Object.values(choice).filter(Boolean).length
  // Matched rows first, so the ones that need a look are at the bottom.
  const sorted = useMemo(() => [...rows].sort((a, b) => Number(!!b.suggestion) - Number(!!a.suggestion)), [rows])

  return (
    <div className="scrim" onMouseDown={onCancel}>
      <div className="dialog mapping" role="dialog" aria-label="Match fields" onMouseDown={(e) => e.stopPropagation()}>
        <div className="dialog-head">
          <strong>Match your data to “{title}”</strong>
          <span className="grow" />
          <button className="btn icon" onClick={onCancel} title="Cancel">
            <X size={15} />
          </button>
        </div>
        <p className="hint" style={{ margin: '0 16px 10px' }}>
          This template reads fields your data doesn’t have under the same name. We matched the closest ones; change any that are wrong, or leave a row blank to keep it empty.
        </p>
        <div className="mapping-rows">
          {sorted.map((r) => {
            const picked = choice[r.need]
            const node = picked ? findField(tree, picked) : null
            const options = [...new Set([...(r.suggestion ? [r.suggestion] : []), ...r.options, ...all.map((n) => n.path)])]
            return (
              <div className="mapping-row" key={r.need}>
                <code className="need">{r.need}</code>
                <ArrowRight size={14} color="var(--text-3)" />
                <select className="select" value={picked} aria-label={`Field for ${r.need}`} onChange={(e) => setChoice({ ...choice, [r.need]: e.target.value })}>
                  <option value="">— leave empty —</option>
                  {options.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <span className="sample">{node?.sample ?? ''}</span>
              </div>
            )
          })}
        </div>
        <div className="dialog-foot">
          <span className="hint">
            {matched} of {rows.length} matched
          </span>
          <span className="grow" />
          <button className="btn bordered" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn primary" onClick={() => onApply(choice)}>
            Create report
          </button>
        </div>
      </div>
    </div>
  )
}
