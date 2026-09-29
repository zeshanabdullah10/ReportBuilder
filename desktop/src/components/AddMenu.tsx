import { Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CATALOG, CATEGORIES, type BlockInfo } from '../lib/blocks'
import { beginDrag, useDrag } from '../lib/dnd'
import { useStore } from '../lib/store'
import { BlockIcon } from './Icon'

interface Row { info: BlockInfo; group: string }

/** Pick a block to add. Opened by the ⊕ on the page, "/" or the Layers header. Click inserts; drag places. */
export function AddMenu() {
  const menu = useStore((s) => s.addMenu)
  const close = useStore((s) => s.closeAddMenu)
  const insert = useStore((s) => s.insert)
  const dragging = useDrag((s) => s.drag !== null)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (menu) {
      setQ('')
      setActive(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [menu])

  // The menu gets out of the way once a drag starts.
  useEffect(() => {
    if (dragging && menu) close()
  }, [dragging, menu, close])

  const rows = useMemo<Row[]>(() => {
    const t = q.trim().toLowerCase()
    if (t) {
      return CATALOG.filter((b) => `${b.label} ${b.keywords} ${b.description}`.toLowerCase().includes(t)).map((info) => ({ info, group: 'Results' }))
    }
    return [
      ...CATALOG.filter((b) => b.common).map((info) => ({ info, group: 'Common' })),
      ...CATEGORIES.flatMap((cat) => CATALOG.filter((b) => !b.common && b.category === cat).map((info) => ({ info, group: cat }))),
    ]
  }, [q])

  useEffect(() => setActive(0), [q])
  useEffect(() => {
    listRef.current?.querySelector('.add-item.active')?.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (!menu) return null

  const choose = (info: BlockInfo) => {
    close()
    insert(info.type, menu.loc ?? undefined)
  }

  const W = 320
  const H = 400
  const left = Math.max(8, Math.min(menu.x, window.innerWidth - W - 8))
  const top = Math.max(8, Math.min(menu.y, window.innerHeight - H - 8))
  let last = ''

  return (
    <div className="scrim clear" onMouseDown={close}>
      <div className="add-menu" role="dialog" aria-label="Add a block" style={{ left, top, width: W, maxHeight: H }} onMouseDown={(e) => e.stopPropagation()}>
        <div className="add-search">
          <Search size={14} color="var(--text-3)" />
          <input
            ref={inputRef}
            value={q}
            placeholder="Add a block…"
            aria-label="Search blocks"
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive((a) => Math.min(rows.length - 1, a + 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((a) => Math.max(0, a - 1))
              } else if (e.key === 'Enter') {
                e.preventDefault()
                if (rows[active]) choose(rows[active].info)
              } else if (e.key === 'Escape') {
                close()
              }
            }}
          />
        </div>
        <div className="add-list" ref={listRef}>
          {rows.length === 0 && <div className="empty">No blocks match “{q}”</div>}
          {rows.map((r, n) => {
            const head = r.group !== last ? <div className="palette-group">{r.group}</div> : null
            last = r.group
            return (
              <div key={r.info.type}>
                {head}
                <div
                  className={`add-item${n === active ? ' active' : ''}`}
                  onMouseEnter={() => setActive(n)}
                  onPointerDown={(e) => beginDrag(e, { kind: 'new', type: r.info.type }, r.info.label)}
                  onClick={() => choose(r.info)}
                >
                  <BlockIcon type={r.info.type} size={16} />
                  <span className="grow">
                    <span className="t">{r.info.label}</span>
                    <span className="d">{r.info.description}</span>
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
