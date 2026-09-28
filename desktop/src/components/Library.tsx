import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CATALOG, CATEGORIES } from '../lib/blocks'
import { endDrag, startDrag } from '../lib/dnd'
import { useStore } from '../lib/store'
import { BlockIcon } from './Icon'

export function Library() {
  const [q, setQ] = useState('')
  const insert = useStore((s) => s.insert)
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    return t ? CATALOG.filter((b) => `${b.label} ${b.keywords} ${b.description}`.toLowerCase().includes(t)) : CATALOG
  }, [q])

  return (
    <>
      <div className="sidebar-head" style={{ paddingTop: 0 }}>
        <div className="search">
          <Search size={13} color="var(--text-3)" />
          <input placeholder="Search blocks" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search blocks" />
        </div>
      </div>
      <div className="scroll">
        {CATEGORIES.map((cat) => {
          const items = filtered.filter((b) => b.category === cat)
          if (items.length === 0) return null
          return (
            <div key={cat}>
              <div className="section-label">{cat}</div>
              <div className="library-grid">
                {items.map((b) => (
                  <button
                    key={b.type}
                    className="tile"
                    draggable
                    title={`${b.description} — click to insert after the selection, or drag into the outline`}
                    onClick={() => insert(b.type)}
                    onDragStart={(e) => startDrag(e, { kind: 'new', type: b.type })}
                    onDragEnd={endDrag}
                  >
                    <BlockIcon type={b.type} size={16} />
                    <span className="t">{b.label}</span>
                    <span className="d">{b.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && <div className="empty">No blocks match “{q}”</div>}
      </div>
    </>
  )
}
