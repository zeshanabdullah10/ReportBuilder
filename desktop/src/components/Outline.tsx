import { ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { blockInfo, blockSummary } from '../lib/blocks'
import { beginDrag, registerZone, type Resolver, useDrag } from '../lib/dnd'
import { findBlock, isWithin, type ListRef, type Location } from '../lib/doc-ops'
import { bindField } from '../lib/drop'
import { usePreview } from '../lib/preview'
import { useStore } from '../lib/store'
import type { Block, Region } from '../lib/types'
import { openBlockMenu } from './BlockMenu'
import { BlockIcon } from './Icon'

type DropMode = 'before' | 'after' | 'inside'

const locOf = (el: HTMLElement): Location => JSON.parse(el.dataset.loc!) as Location

/** Which layer row or list is under the pointer, and what dropping there would do. */
function useLayersZone(rootRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const resolve: Resolver = (x, y, payload) => {
      const root = rootRef.current
      if (!root) return null
      const r = root.getBoundingClientRect()
      if (x < r.left || x > r.right || y < r.top || y > r.bottom) return null
      const el = (document.elementFromPoint(x, y) as HTMLElement | null)?.closest<HTMLElement>('[data-drop]')
      if (!el) return null
      const doc = useStore.getState().doc
      const allowed = (loc: Location) => !(payload.kind === 'move' && loc.parentId && isWithin(doc, loc.parentId, payload.id))
      if (el.dataset.drop === 'list') {
        const loc = locOf(el)
        if (!allowed(loc)) return { target: null, indicator: null }
        return { target: { kind: 'gap', loc }, indicator: { zone: 'outline', key: el.dataset.key!, mode: 'inside' }, hint: 'Add here' }
      }
      const id = el.dataset.blockId!
      if (payload.kind === 'move' && payload.id === id) return { target: null, indicator: null }
      const found = findBlock(doc, id)
      if (!found) return null
      if (payload.kind === 'field' && bindField(found.block, payload.node, found.path)) {
        return { target: { kind: 'onto', id }, indicator: { zone: 'outline', key: id, mode: 'inside' }, hint: 'Use this field here' }
      }
      const rect = el.getBoundingClientRect()
      const f = (y - rect.top) / rect.height
      let mode: DropMode = f < 0.5 ? 'before' : 'after'
      if (found.block.type === 'section' && f > 0.3 && f < 0.7) mode = 'inside'
      const at: Location =
        mode === 'inside'
          ? { region: found.loc.region, parentId: id, index: (found.block as Extract<Block, { type: 'section' }>).blocks.length }
          : { ...found.loc, index: found.loc.index + (mode === 'after' ? 1 : 0) }
      if (!allowed(at)) return { target: null, indicator: null }
      return { target: { kind: 'gap', loc: at }, indicator: { zone: 'outline', key: id, mode } }
    }
    return registerZone('outline', resolve, () => rootRef.current)
  }, [rootRef])
}

/** "key|mode" of the drop indicator in this panel, if any. */
function useDropIndicator(): { key: string; mode: DropMode } | null {
  const v = useDrag((s) => (s.drag?.indicator?.zone === 'outline' ? `${s.drag.indicator.mode}|${s.drag.indicator.key}` : null))
  if (!v) return null
  const i = v.indexOf('|')
  return { mode: v.slice(0, i) as DropMode, key: v.slice(i + 1) }
}

export function Outline() {
  const doc = useStore((s) => s.doc)
  const openAddMenu = useStore((s) => s.openAddMenu)
  const rootRef = useRef<HTMLDivElement>(null)
  useLayersZone(rootRef)
  const regions: { region: Region; label: string }[] = [
    { region: 'header', label: 'Header' },
    { region: 'body', label: 'Body' },
    { region: 'footer', label: 'Footer' },
  ]
  return (
    <>
      <div className="sidebar-head" style={{ paddingTop: 0 }}>
        <button
          className="btn bordered full-width"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect()
            openAddMenu(null, r.left, r.bottom + 4)
          }}
        >
          <Plus size={14} /> Add block
        </button>
      </div>
      <div className="scroll" ref={rootRef}>
        {regions.map(({ region, label }) => (
          <div key={region}>
            <div className="section-label">
              <span className="grow">{label}</span>
              <span>{doc[region].length || ''}</span>
            </div>
            <div className="tree">
              <BlockList list={doc[region]} listRef={{ region }} depth={0} emptyText={region === 'body' ? 'Drag fields here, or add a block' : `Drop blocks here for the ${label.toLowerCase()}`} />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function BlockList({ list, listRef, depth, emptyText }: { list: Block[]; listRef: ListRef; depth: number; emptyText: string }) {
  const key = `${listRef.region}/${listRef.parentId ?? ''}/${listRef.column ?? ''}`
  const ind = useDropIndicator()
  if (list.length === 0) {
    const active = ind?.key === key
    return (
      <div
        className={`region-empty${active ? ' drop-inside' : ''}`}
        style={{ marginLeft: 6 + depth * 14 }}
        data-drop="list"
        data-key={key}
        data-loc={JSON.stringify({ ...listRef, index: 0 })}
      >
        {emptyText}
      </div>
    )
  }
  return (
    <>
      {list.map((b, i) => (
        <Row key={b.id} block={b} loc={{ ...listRef, index: i }} depth={depth} />
      ))}
    </>
  )
}

function Row({ block, loc, depth }: { block: Block; loc: Location; depth: number }) {
  const selected = useStore((s) => s.selectedId === block.id)
  const select = useStore((s) => s.select)
  const hover = useStore((s) => s.hover)
  const issues = usePreview((s) => s.issuesByBlock.get(block.id))
  const ind = useDropIndicator()
  const [open, setOpen] = useState(true)
  const container = block.type === 'section' || block.type === 'columns'
  const info = blockInfo(block.type)
  const worst = issues?.some((i) => i.severity === 'error') ? 'error' : issues?.some((i) => i.severity === 'warning') ? 'warning' : null
  const dropMode = ind?.key === block.id ? ind.mode : null

  return (
    <>
      <div
        className={`tree-row${selected ? ' selected' : ''}${worst === 'warning' ? ' warn' : ''}${dropMode ? ` drop-${dropMode}` : ''}`}
        style={{ paddingLeft: 6 + depth * 14 }}
        data-drop="row"
        data-block-id={block.id}
        data-loc={JSON.stringify(loc)}
        role="treeitem"
        aria-selected={selected}
        onClick={() => select(block.id)}
        onContextMenu={(e) => openBlockMenu(e, block.id)}
        onMouseEnter={() => hover(block.id)}
        onMouseLeave={() => hover(null)}
        onPointerDown={(e) => beginDrag(e, { kind: 'move', id: block.id }, info.label)}
      >
        <span
          className="chev"
          onPointerDown={(e) => container && e.stopPropagation()}
          onClick={(e) => {
            if (!container) return
            e.stopPropagation()
            setOpen(!open)
          }}
        >
          {container ? open ? <ChevronDown size={12} /> : <ChevronRight size={12} /> : null}
        </span>
        <BlockIcon type={block.type} size={14} />
        <span className="label">{info.label}</span>
        <span className="muted">{blockSummary(block)}</span>
        {block.visibleIf && <span className="badge" title={`Shown when ${block.visibleIf}`}>if</span>}
        {block.type === 'section' && block.repeat && <span className="badge" title={`Repeats for each ${block.repeat}`}>↻</span>}
        {worst && <span className="issue-dot" title={issues!.map((i) => i.message).join('\n')} />}
      </div>
      {container && open && block.type === 'section' && (
        <BlockList list={block.blocks} listRef={{ region: loc.region, parentId: block.id }} depth={depth + 1} emptyText="Empty group — drop blocks here" />
      )}
      {container && open && block.type === 'columns' &&
        block.columns.map((c, ci) => {
          const key = `${loc.region}/${block.id}/${ci}`
          const colLoc = { region: loc.region, parentId: block.id, column: ci, index: c.blocks.length }
          return (
            <div key={ci}>
              <div
                className={`tree-sub${ind?.key === key ? ' drop-inside' : ''}`}
                style={{ marginLeft: 20 + depth * 14 }}
                data-drop="list"
                data-key={key}
                data-loc={JSON.stringify(colLoc)}
              >
                Column {ci + 1}
              </div>
              {c.blocks.length > 0 && <BlockList list={c.blocks} listRef={{ region: loc.region, parentId: block.id, column: ci }} depth={depth + 2} emptyText="" />}
            </div>
          )
        })}
    </>
  )
}
