import { ChevronDown, ChevronUp, CircleAlert, Copy, CornerLeftUp, GripVertical, Maximize2, Minus, Plus, Trash2 } from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { blockInfo } from '../lib/blocks'
import { useClipboardShortcuts } from '../lib/clipboard-keys'
import { beginDrag, registerZone, type Resolver, useDrag } from '../lib/dnd'
import { findBlock, isWithin, type Location } from '../lib/doc-ops'
import { bindField } from '../lib/drop'
import { usePreview } from '../lib/preview'
import { useStore } from '../lib/store'
import { dataSets } from '../lib/defaults'
import type { BlockRegion, Block } from '../lib/types'
import { openBlockMenu } from './BlockMenu'
import { InlineEditor, isInlineEditable } from './InlineEditor'

const PX_PER_PT = 96 / 72
const MM_TO_PT = 72 / 25.4
/** Width of the band at a block's left/right edge that means "place beside". */
const EDGE_MAX_PT = 44

interface Box { id: string; page: number; x: number; y: number; w: number; h: number }

/** Turn vertical regions into boxes; a block's right edge is the next block starting to its right. */
function toBoxes(regions: BlockRegion[], pageW: (p: number) => number, marginRightPt: number): Box[] {
  return regions.map((r) => {
    const rightLimit = pageW(r.page) - marginRightPt
    let right = rightLimit
    for (const o of regions) {
      if (o.page !== r.page || o.left <= r.left + 1) continue
      const overlaps = o.top < r.bottom - 1 && o.bottom > r.top + 1
      if (overlaps) right = Math.min(right, o.left - 6)
    }
    return { id: r.id, page: r.page, x: r.left, y: r.top, w: Math.max(8, right - r.left), h: Math.max(4, r.bottom - r.top) }
  })
}

function hitTest(boxes: Box[], page: number, x: number, y: number): Box | null {
  let best: Box | null = null
  for (const b of boxes) {
    if (b.page !== page || x < b.x - 2 || x > b.x + b.w + 2 || y < b.y - 2 || y > b.y + b.h + 2) continue
    if (!best || b.w * b.h < best.w * best.h) best = b
  }
  return best
}

const PageSvg = memo(function PageSvg({ svg }: { svg: string }) {
  return <div className="svg" dangerouslySetInnerHTML={{ __html: svg }} />
})

function ontoLabel(block: Block, kind: string): string {
  switch (block.type) {
    case 'table':
      return kind === 'list' ? 'Use this list' : 'Add as column'
    case 'measurementTable':
    case 'summary':
      return 'Use this list'
    case 'chart':
      return 'Plot this'
    case 'keyValue':
      return 'Add to grid'
    case 'section':
      return 'Repeat for each item'
    case 'text':
    case 'heading':
    case 'callout':
      return 'Insert field'
    default:
      return 'Use this field'
  }
}

export function Canvas() {
  const result = usePreview((s) => s.result)
  const error = usePreview((s) => s.error)
  const pending = usePreview((s) => s.pending)
  const zoom = useStore((s) => s.zoom)
  const setZoom = useStore((s) => s.setZoom)
  const selectedId = useStore((s) => s.selectedId)
  const hoveredId = useStore((s) => s.hoveredId)
  const select = useStore((s) => s.select)
  const hover = useStore((s) => s.hover)
  const doc = useStore((s) => s.doc)
  const activeSet = useStore((s) => s.activeDataSet)
  const openAddMenu = useStore((s) => s.openAddMenu)
  const nudge = useStore((s) => s.nudge)
  const duplicate = useStore((s) => s.duplicate)
  const remove = useStore((s) => s.remove)
  const dragging = useDrag((s) => s.drag !== null)
  const indicator = useDrag((s) => (s.drag?.indicator?.zone === 'canvas' ? s.drag.indicator : null))
  const scrollRef = useRef<HTMLDivElement>(null)
  const pageEls = useRef<(HTMLDivElement | null)[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  useClipboardShortcuts()

  const boxes = useMemo(() => {
    if (!result) return []
    return toBoxes(result.regions, (p) => result.pageSizes[p]?.[0] ?? 595, doc.page.margins.right * MM_TO_PT)
  }, [result, doc.page.margins.right])

  const scale = PX_PER_PT * zoom

  const locate = useCallback(
    (e: React.MouseEvent, page: number) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      return hitTest(boxes, page, (e.clientX - rect.left) / scale, (e.clientY - rect.top) / scale)
    },
    [boxes, scale],
  )

  // --- drop zone: turn a pointer position over the page into a target ------------------------------
  const resolveRef = useRef<Resolver>(() => null)
  resolveRef.current = (cx, cy, payload) => {
    if (!result) return null
    const st = useStore.getState()
    const d = st.doc
    const scroller = scrollRef.current?.getBoundingClientRect()
    if (!scroller || cx < scroller.left || cx > scroller.right || cy < scroller.top || cy > scroller.bottom) return null
    let page = -1
    let rect: DOMRect | null = null
    for (let p = 0; p < pageEls.current.length; p++) {
      const r = pageEls.current[p]?.getBoundingClientRect()
      if (r && cx >= r.left - 8 && cx <= r.right + 8 && cy >= r.top && cy <= r.bottom) {
        page = p
        rect = r
        break
      }
    }
    if (page < 0 || !rect) return null
    const x = (cx - rect.left) / scale
    const y = (cy - rect.top) / scale
    const onPage = boxes.filter((b) => b.page === page)
    const invalid = (id: string) => payload.kind === 'move' && isWithin(d, id, payload.id)
    const line = (bx: number, bw: number, ly: number) => ({ zone: 'canvas' as const, kind: 'line' as const, page, x: bx, y: ly, w: bw })

    const b = hitTest(onPage, page, x, y)
    if (b) {
      if (invalid(b.id)) return { target: null, indicator: null }
      const found = findBlock(d, b.id)
      if (!found) return null
      const blk = found.block
      // Bind a dragged field to the block under it.
      if (payload.kind === 'field') {
        const bound = bindField(blk, payload.node, found.path)
        if (bound) {
          const label = ontoLabel(blk, payload.node.kind)
          return {
            target: { kind: 'onto', id: b.id },
            indicator: { zone: 'canvas', kind: 'onto', page, x: b.x, y: b.y, w: b.w, h: b.h, label },
            hint: label,
          }
        }
      }
      // Beside a block: the outer band of its left or right edge.
      const edgeW = Math.min(EDGE_MAX_PT, b.w * 0.2)
      const canSplit = b.w > 90 && blk.type !== 'columns' && blk.type !== 'pageBreak' && !(payload.kind === 'move' && payload.id === b.id)
      if (canSplit && (x < b.x + edgeW || x > b.x + b.w - edgeW)) {
        const side = x < b.x + edgeW ? 'left' : 'right'
        const inColumns = found.path.at(-1)?.type === 'columns'
        return {
          target: { kind: 'edge', id: b.id, side },
          indicator: { zone: 'canvas', kind: 'edge', page, x: side === 'left' ? b.x - 4 : b.x + b.w + 4, y: b.y, h: b.h },
          hint: inColumns ? 'Add a column' : 'Place side by side',
        }
      }
      // Empty group: drop inside it.
      if (blk.type === 'section' && blk.blocks.length === 0) {
        return { target: { kind: 'gap', loc: { region: found.loc.region, parentId: b.id, index: 0 } }, indicator: line(b.x, b.w, b.y + b.h / 2) }
      }
      const before = y < b.y + b.h / 2
      const loc: Location = { ...found.loc, index: found.loc.index + (before ? 0 : 1) }
      return { target: { kind: 'gap', loc }, indicator: line(b.x, b.w, before ? b.y - 4 : b.y + b.h + 4) }
    }

    // Empty space: the nearest gap in the body.
    const top = d.body.map((blk) => onPage.find((bx) => bx.id === blk.id)).filter((bx): bx is Box => !!bx)
    const pageW = (result.pageSizes[page]?.[0] ?? 595) as number
    const mL = d.page.margins.left * MM_TO_PT
    const mW = pageW - mL - d.page.margins.right * MM_TO_PT
    if (top.length === 0) {
      const idx = page === 0 ? 0 : d.body.length
      return { target: { kind: 'gap', loc: { region: 'body', index: idx } }, indicator: line(mL, mW, Math.max(y, d.page.margins.top * MM_TO_PT)) }
    }
    const next = top.find((bx) => bx.y + bx.h / 2 > y)
    if (next) {
      const idx = d.body.findIndex((blk) => blk.id === next.id)
      return { target: { kind: 'gap', loc: { region: 'body', index: idx } }, indicator: line(next.x, next.w, next.y - 4) }
    }
    const last = top[top.length - 1]
    const idx = d.body.findIndex((blk) => blk.id === last.id) + 1
    return { target: { kind: 'gap', loc: { region: 'body', index: idx } }, indicator: line(last.x, last.w, last.y + last.h + 4) }
  }

  useEffect(() => registerZone('canvas', (x, y, p) => resolveRef.current(x, y, p), () => scrollRef.current), [])

  // Ctrl/⌘ + wheel zoom.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      setZoom(useStore.getState().zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [setZoom])

  // Scroll the selection into view when chosen elsewhere (outline, issues).
  useEffect(() => {
    if (!selectedId) return
    const el = scrollRef.current?.querySelector(`[data-hit="${selectedId}"]`)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedId, result])

  useEffect(() => {
    if (editingId && editingId !== selectedId) setEditingId(null)
  }, [selectedId, editingId])

  const fitWidth = () => {
    const el = scrollRef.current
    const w = result?.pageSizes[0]?.[0]
    if (!el || !w) return
    setZoom((el.clientWidth - 96) / (w * PX_PER_PT))
  }

  const setName = dataSets(doc).find((s) => s.id === activeSet)?.name ?? 'Sample data'

  if (!result) {
    return (
      <div className="canvas" ref={scrollRef}>
        {error ? (
          <div className="render-error">
            <strong>The preview could not be rendered</strong>
            <pre>{error}</pre>
          </div>
        ) : (
          <div className="empty" style={{ paddingTop: 120 }}>
            <div className="spinner" style={{ margin: '0 auto 10px' }} /> Rendering…
          </div>
        )}
      </div>
    )
  }

  const firstPageOf = (id: string) => Math.min(...boxes.filter((b) => b.id === id).map((b) => b.page))

  const overlay = (page: number) => {
    const shown = new Set([selectedId, hoveredId].filter(Boolean) as string[])
    return boxes
      .filter((b) => b.page === page && shown.has(b.id))
      .map((b, i) => {
        const sel = b.id === selectedId
        const found = sel ? findBlock(doc, b.id) : null
        const parent = found?.path.at(-1)
        const first = sel && firstPageOf(b.id) === page && !boxes.some((o) => o.id === b.id && o.page === page && o.y < b.y)
        const editing = sel && editingId === b.id
        return (
          <div
            key={`${b.id}-${i}`}
            data-hit={b.id}
            className={`hit${sel ? ' selected' : ' hover'}${editing ? ' editing' : ''}`}
            style={{ left: (b.x - 3) * scale, top: (b.y - 3) * scale, width: (b.w + 6) * scale, height: (b.h + 6) * scale, pointerEvents: 'none' }}
          >
            {sel && found && first && !dragging && !editing && (
              <div className="hit-toolbar" style={{ pointerEvents: 'auto' }} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                <span className="hit-tag">{blockInfo(found.block.type).label}</span>
                <button className="grip" title="Drag to move" onPointerDown={(e) => beginDrag(e, { kind: 'move', id: b.id }, blockInfo(found.block.type).label)}>
                  <GripVertical size={13} />
                </button>
                {parent && (
                  <button title={`Select ${blockInfo(parent.type).label}`} onClick={() => select(parent.id)}>
                    <CornerLeftUp size={13} />
                  </button>
                )}
                <button title="Move up (⌥↑)" onClick={() => nudge(b.id, -1)}>
                  <ChevronUp size={13} />
                </button>
                <button title="Move down (⌥↓)" onClick={() => nudge(b.id, 1)}>
                  <ChevronDown size={13} />
                </button>
                <button title="Duplicate (⌘D)" onClick={() => duplicate(b.id)}>
                  <Copy size={12} />
                </button>
                <button title="Delete (⌫)" className="danger" onClick={() => remove(b.id)}>
                  <Trash2 size={12} />
                </button>
              </div>
            )}
            {editing && found && <InlineEditor block={found.block} scale={scale} onDone={() => setEditingId(null)} />}
          </div>
        )
      })
  }

  /** ⊕ under the hovered or selected block: add a block in that gap. */
  const addDots = (page: number) => {
    if (dragging) return null
    const id = hoveredId ?? selectedId
    if (!id) return null
    const found = findBlock(doc, id)
    if (!found) return null
    const bs = boxes.filter((b) => b.page === page && b.id === id)
    if (bs.length === 0) return null
    const b = bs[bs.length - 1]
    const at: Location = { ...found.loc, index: found.loc.index + 1 }
    return (
      <button
        className="add-dot"
        title="Add a block here"
        style={{ left: (b.x + b.w / 2) * scale - 10, top: (b.y + b.h) * scale + 2 }}
        onMouseEnter={() => hover(id)}
        onClick={(e) => {
          e.stopPropagation()
          openAddMenu(at, e.clientX - 20, e.clientY + 14)
        }}
      >
        <Plus size={12} strokeWidth={2.5} />
      </button>
    )
  }

  const emptyBody = doc.body.length === 0

  return (
    <div className="canvas" ref={scrollRef} onClick={(e) => e.target === e.currentTarget && select(null)}>
      {error && (
        <div className="render-error" style={{ margin: '16px auto 0' }}>
          <strong>Showing the last good render.</strong> The latest change could not be laid out:
          <pre>{error}</pre>
        </div>
      )}
      <div className="pages" onClick={(e) => e.target === e.currentTarget && select(null)}>
        {result.pages.map((svg, p) => {
          const [w, h] = result.pageSizes[p] ?? [595, 842]
          return (
            <div
              key={p}
              ref={(el) => {
                pageEls.current[p] = el
              }}
              className="page"
              style={{ width: w * scale, height: h * scale }}
              onMouseMove={(e) => {
                if (dragging || (e.target as HTMLElement).closest('.add-dot, .hit-toolbar')) return
                const b = locate(e, p)
                if ((b?.id ?? null) !== useStore.getState().hoveredId) hover(b?.id ?? null)
              }}
              onMouseLeave={() => hover(null)}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('.add-dot, .hit-toolbar, .inline-editor')) return
                const b = locate(e, p)
                select(b?.id ?? null)
              }}
              onContextMenu={(e) => {
                const b = locate(e, p)
                if (b) openBlockMenu(e, b.id)
              }}
              onDoubleClick={(e) => {
                const b = locate(e, p)
                const found = b ? findBlock(doc, b.id) : null
                if (b && found && isInlineEditable(found.block)) {
                  select(b.id)
                  setEditingId(b.id)
                }
              }}
            >
              <PageSvg svg={svg} />
              {overlay(p)}
              {addDots(p)}
              {emptyBody && p === 0 && (
                <div className="page-empty">
                  <strong>Start your report</strong>
                  <span>Drag a field from the Data tab onto this page, or</span>
                  <button className="btn bordered" onClick={(e) => openAddMenu({ region: 'body', index: 0 }, e.clientX - 60, e.clientY + 16)}>
                    <Plus size={14} /> Add a block
                  </button>
                </div>
              )}
              {indicator?.page === p && indicator.kind === 'line' && (
                <div className="drop-line" style={{ left: indicator.x * scale, top: indicator.y * scale - 1, width: indicator.w * scale }} />
              )}
              {indicator?.page === p && indicator.kind === 'edge' && (
                <div className="drop-edge" style={{ left: indicator.x * scale - 1.5, top: indicator.y * scale, height: indicator.h * scale }} />
              )}
              {indicator?.page === p && indicator.kind === 'onto' && (
                <div className="drop-onto" style={{ left: (indicator.x - 3) * scale, top: (indicator.y - 3) * scale, width: (indicator.w + 6) * scale, height: (indicator.h + 6) * scale }}>
                  <span>{indicator.label}</span>
                </div>
              )}
              <div className="page-number">{p + 1}</div>
            </div>
          )
        })}
      </div>
      <div className="canvas-status" aria-live="polite">
        {pending ? <span className="spinner" /> : error ? <CircleAlert size={13} color="var(--fail)" /> : null}
        <span>
          {result.pages.length} page{result.pages.length === 1 ? '' : 's'} · {setName}
        </span>
        <span className="sep" />
        <button className="btn icon small" title="Zoom out" onClick={() => setZoom(zoom / 1.15)}>
          <Minus size={13} />
        </button>
        <button className="btn small" title="Actual size" onClick={() => setZoom(1)} style={{ minWidth: 44, justifyContent: 'center' }}>
          {Math.round(zoom * 100)}%
        </button>
        <button className="btn icon small" title="Zoom in" onClick={() => setZoom(zoom * 1.15)}>
          <Plus size={13} />
        </button>
        <button className="btn icon small" title="Fit page width" onClick={fitWidth}>
          <Maximize2 size={12} />
        </button>
      </div>
    </div>
  )
}
