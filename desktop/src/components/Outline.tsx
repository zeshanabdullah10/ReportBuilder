import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { blockInfo, blockSummary } from '../lib/blocks'
import { dragPayload, endDrag, startDrag } from '../lib/dnd'
import { isWithin, type ListRef, type Location } from '../lib/doc-ops'
import { usePreview } from '../lib/preview'
import { useStore } from '../lib/store'
import type { Block, Region } from '../lib/types'
import { BlockIcon } from './Icon'

type DropMode = 'before' | 'after' | 'inside'
interface DropTarget { key: string; mode: DropMode }

function useDrop() {
  const [target, setTarget] = useState<DropTarget | null>(null)
  const doc = useStore((s) => s.doc)
  const move = useStore((s) => s.move)
  const insert = useStore((s) => s.insert)

  const allowed = (loc: Location) => {
    const p = dragPayload()
    if (!p) return false
    if (p.kind === 'move' && loc.parentId && isWithin(doc, loc.parentId, p.id)) return false
    return true
  }

  const drop = (loc: Location) => {
    const p = dragPayload()
    const ok = !!p && allowed(loc)
    setTarget(null)
    endDrag()
    if (!p || !ok) return
    if (p.kind === 'move') move(p.id, loc)
    else insert(p.type, loc)
  }

  return { target, setTarget, allowed, drop }
}

export function Outline() {
  const doc = useStore((s) => s.doc)
  const dnd = useDrop()
  const regions: { region: Region; label: string }[] = [
    { region: 'header', label: 'Header' },
    { region: 'body', label: 'Body' },
    { region: 'footer', label: 'Footer' },
  ]
  return (
    <div className="scroll" onDragEnd={() => dnd.setTarget(null)}>
      {regions.map(({ region, label }) => (
        <div key={region}>
          <div className="section-label">
            <span className="grow">{label}</span>
            <span>{doc[region].length || ''}</span>
          </div>
          <div className="tree">
            <BlockList list={doc[region]} listRef={{ region }} depth={0} dnd={dnd} emptyText={region === 'body' ? 'Add blocks from Insert' : `Drop blocks here for the ${label.toLowerCase()}`} />
          </div>
        </div>
      ))}
    </div>
  )
}

function BlockList({ list, listRef, depth, dnd, emptyText }: { list: Block[]; listRef: ListRef; depth: number; dnd: ReturnType<typeof useDrop>; emptyText: string }) {
  const key = `${listRef.region}/${listRef.parentId ?? ''}/${listRef.column ?? ''}`
  if (list.length === 0) {
    const loc = { ...listRef, index: 0 }
    const active = dnd.target?.key === key
    return (
      <div
        className={`region-empty${active ? ' drop-inside' : ''}`}
        style={{ marginLeft: 6 + depth * 14 }}
        onDragOver={(e) => {
          if (!dnd.allowed(loc)) return
          e.preventDefault()
          dnd.setTarget({ key, mode: 'inside' })
        }}
        onDragLeave={() => dnd.setTarget(null)}
        onDrop={(e) => {
          e.preventDefault()
          dnd.drop(loc)
        }}
      >
        {emptyText}
      </div>
    )
  }
  return (
    <>
      {list.map((b, i) => (
        <Row key={b.id} block={b} loc={{ ...listRef, index: i }} depth={depth} dnd={dnd} />
      ))}
    </>
  )
}

function Row({ block, loc, depth, dnd }: { block: Block; loc: Location; depth: number; dnd: ReturnType<typeof useDrop> }) {
  const selected = useStore((s) => s.selectedId === block.id)
  const select = useStore((s) => s.select)
  const hover = useStore((s) => s.hover)
  const issues = usePreview((s) => s.issuesByBlock.get(block.id))
  const [open, setOpen] = useState(true)
  const container = block.type === 'section' || block.type === 'columns'
  const info = blockInfo(block.type)
  const worst = issues?.some((i) => i.severity === 'error') ? 'error' : issues?.some((i) => i.severity === 'warning') ? 'warning' : null
  const dropMode = dnd.target?.key === block.id ? dnd.target.mode : null

  const modeAt = (e: React.DragEvent): DropMode | null => {
    const p = dragPayload()
    if (!p || (p.kind === 'move' && p.id === block.id)) return null
    const rect = e.currentTarget.getBoundingClientRect()
    const y = (e.clientY - rect.top) / rect.height
    let mode: DropMode = y < 0.5 ? 'before' : 'after'
    if (block.type === 'section' && y > 0.3 && y < 0.7) mode = 'inside'
    return dnd.allowed(targetLoc(mode)) ? mode : null
  }

  const onDragOver = (e: React.DragEvent) => {
    const mode = modeAt(e)
    if (!mode) return
    e.preventDefault()
    if (dropMode !== mode) dnd.setTarget({ key: block.id, mode })
  }

  const targetLoc = (mode: DropMode): Location =>
    mode === 'inside' ? { region: loc.region, parentId: block.id, index: block.type === 'section' ? block.blocks.length : 0 } : { ...loc, index: loc.index + (mode === 'after' ? 1 : 0) }

  return (
    <>
      <div
        className={`tree-row${selected ? ' selected' : ''}${worst === 'warning' ? ' warn' : ''}${dropMode ? ` drop-${dropMode}` : ''}`}
        style={{ paddingLeft: 6 + depth * 14 }}
        draggable
        data-block-id={block.id}
        role="treeitem"
        aria-selected={selected}
        onClick={() => select(block.id)}
        onMouseEnter={() => hover(block.id)}
        onMouseLeave={() => hover(null)}
        onDragStart={(e) => startDrag(e, { kind: 'move', id: block.id })}
        onDragOver={onDragOver}
        onDragLeave={(e) => {
          // Ignore leaves into our own children (label spans).
          if (!e.currentTarget.contains(e.relatedTarget as Node)) dnd.setTarget(null)
        }}
        onDrop={(e) => {
          e.preventDefault()
          const mode = modeAt(e)
          if (mode) dnd.drop(targetLoc(mode))
        }}
      >
        <span
          className="chev"
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
        <BlockList list={block.blocks} listRef={{ region: loc.region, parentId: block.id }} depth={depth + 1} dnd={dnd} emptyText="Empty section — drop blocks here" />
      )}
      {container && open && block.type === 'columns' &&
        block.columns.map((c, ci) => {
          const key = `${loc.region}/${block.id}/${ci}`
          const colLoc = { region: loc.region, parentId: block.id, column: ci, index: c.blocks.length }
          return (
            <div key={ci}>
              <div
                className={`tree-sub${dnd.target?.key === key ? ' drop-inside' : ''}`}
                style={{ marginLeft: 20 + depth * 14 }}
                onDragOver={(e) => {
                  if (!dnd.allowed(colLoc)) return
                  e.preventDefault()
                  dnd.setTarget({ key, mode: 'inside' })
                }}
                onDragLeave={() => dnd.setTarget(null)}
                onDrop={(e) => {
                  e.preventDefault()
                  dnd.drop(colLoc)
                }}
              >
                Column {ci + 1}
              </div>
              {c.blocks.length > 0 && <BlockList list={c.blocks} listRef={{ region: loc.region, parentId: block.id, column: ci }} depth={depth + 2} dnd={dnd} emptyText="" />}
            </div>
          )
        })}
    </>
  )
}

