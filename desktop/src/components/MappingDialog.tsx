import { ArrowRight, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { findField, type FieldNode, walkFields } from '../lib/data-model'
import { applyMapping, groupChanges, type MappingRow, remapItemFields } from '../lib/mapping'
import type { ReportDocument } from '../lib/types'

/**
 * "This template reads X, your data has Y" — confirm the matches before the report opens.
 * Top-level fields first, then the fields each list's items need ("results → each row").
 */
export function MappingDialog({
  title,
  template,
  rows,
  tree,
  onApply,
  onCancel,
}: {
  title: string
  /** The (normalized) template being fitted, so item fields follow the list choices live. */
  template: ReportDocument
  rows: MappingRow[]
  tree: FieldNode[]
  onApply: (mapping: Record<string, string>, itemOverrides: Record<string, string>) => void
  onCancel: () => void
}) {
  const [choice, setChoice] = useState<Record<string, string>>(() => Object.fromEntries(rows.map((r) => [r.need, r.suggestion ?? ''])))
  const [itemChoice, setItemChoice] = useState<Record<string, string>>({})
  const all = useMemo(() => {
    const out: FieldNode[] = []
    walkFields(tree, (n) => {
      if (!n.path.includes('[]') && n.kind !== 'empty') out.push(n)
    })
    return out
  }, [tree])

  // Which item fields the lists (as currently chosen) lack, and the automatic match for each.
  const changes = useMemo(() => remapItemFields(applyMapping(template, choice), tree).changes, [template, choice, tree])
  const groups = useMemo(() => groupChanges(changes), [changes])
  /** The item field shown for a change: the user's pick when still valid, else the automatic one. */
  const itemValue = (key: string, chosen: string | null, options: string[]) => {
    const o = itemChoice[key]
    return o !== undefined && (o === '' || options.includes(o)) ? o : (chosen ?? '')
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const total = rows.length + changes.length
  const matched = Object.values(choice).filter(Boolean).length + changes.filter((c) => itemValue(c.key, c.chosen, c.options)).length
  // Matched rows first, so the ones that need a look are at the bottom.
  const sorted = useMemo(() => [...rows].sort((a, b) => Number(!!b.suggestion) - Number(!!a.suggestion)), [rows])

  const apply = () => {
    const overrides: Record<string, string> = {}
    for (const c of changes) overrides[c.key] = itemValue(c.key, c.chosen, c.options)
    onApply(choice, overrides)
  }

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
          {groups.map((g) => (
            <div className="mapping-group" key={g.list} role="group" aria-label={`${g.list} → each row`}>
              <div className="mapping-group-title">
                <code>{g.list}</code> → each row
              </div>
              {g.changes.map((c) => {
                const picked = itemValue(c.key, c.chosen, c.options)
                const node = picked ? findField(tree, `${g.list}[].${picked}`) : null
                return (
                  <div className="mapping-row item" key={c.key}>
                    <span className="need-wrap">
                      <code className="need">{c.need}</code>
                      <span className="where">{c.label}</span>
                    </span>
                    <ArrowRight size={14} color="var(--text-3)" />
                    <select
                      className="select"
                      value={picked}
                      aria-label={`${g.list} item ${c.need} (${c.label})`}
                      onChange={(e) => setItemChoice({ ...itemChoice, [c.key]: e.target.value })}
                    >
                      <option value="">— leave empty —</option>
                      {c.options.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                    <span className="sample">{node?.sample ?? ''}</span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        <div className="dialog-foot">
          <span className="hint">
            {matched} of {total} matched
          </span>
          <span className="grow" />
          <button className="btn bordered" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn primary" onClick={apply}>
            Create report
          </button>
        </div>
      </div>
    </div>
  )
}
