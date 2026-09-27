import { CircleAlert } from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { blockInfo } from '../lib/blocks'
import { dataSets } from '../lib/defaults'
import { dragPayload, endDrag } from '../lib/dnd'
import { findBlock } from '../lib/doc-ops'
import { usePreview } from '../lib/preview'
import { useStore } from '../lib/store'
import type { BlockRegion } from '../lib/types'

const PX_PER_PT = 96 / 72
const MM_TO_PT = 72 / 25.4

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
  const insert = useStore((s) => s.insert)
  const move = useStore((s) => s.move)
  const activeSet = useStore((s) => s.activeDataSet)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [dropLine, setDropLine] = useState<{ page: number; y: number } | null>(null)

  const boxes = useMemo(() => {
    if (!result) return []
    return toBoxes(result.regions, (p) => result.pageSizes[p]?.[0] ?? 595, doc.page.margins.right * MM_TO_PT)
  }, [result, doc.page.margins.right])

  const scale = PX_PER_PT * zoom

  const locate = useCallback(
    (e: React.MouseEvent | React.DragEvent, page: number) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      return hitTest(boxes, page, (e.clientX - rect.left) / scale, (e.clientY - rect.top) / scale)
    },
    [boxes, scale],
  )

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

  const overlay = (page: number) => {
    const shown = new Set([selectedId, hoveredId].filter(Boolean) as string[])
    return boxes
      .filter((b) => b.page === page && shown.has(b.id))
      .map((b, i) => {
        const sel = b.id === selectedId
        const found = sel ? findBlock(doc, b.id) : null
        return (
          <div
            key={`${b.id}-${i}`}
            data-hit={b.id}
            className={`hit${sel ? ' selected' : ' hover'}`}
            style={{ left: (b.x - 3) * scale, top: (b.y - 3) * scale, width: (b.w + 6) * scale, height: (b.h + 6) * scale, pointerEvents: 'none' }}
          >
            {sel && found && <span className="hit-tag">{blockInfo(found.block.type).label}</span>}
          </div>
        )
      })
  }

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
              className="page"
              style={{ width: w * scale, height: h * scale }}
              onMouseMove={(e) => {
                const b = locate(e, p)
                if ((b?.id ?? null) !== useStore.getState().hoveredId) hover(b?.id ?? null)
              }}
              onMouseLeave={() => hover(null)}
              onClick={(e) => {
                const b = locate(e, p)
                select(b?.id ?? null)
              }}
              onDragOver={(e) => {
                const payload = dragPayload()
                if (!payload) return
                e.preventDefault()
                const b = locate(e, p)
                setDropLine(b ? { page: p, y: b.y + b.h } : null)
              }}
              onDragLeave={() => setDropLine(null)}
              onDrop={(e) => {
                e.preventDefault()
                setDropLine(null)
                const payload = dragPayload()
                endDrag()
                if (!payload) return
                const b = locate(e, p)
                const found = b ? findBlock(doc, b.id) : null
                const loc = found ? { ...found.loc, index: found.loc.index + 1 } : { region: 'body' as const, index: doc.body.length }
                if (payload.kind === 'new') insert(payload.type, loc)
                else if (payload.id !== b?.id) move(payload.id, loc)
              }}
            >
              <PageSvg svg={svg} />
              {overlay(p)}
              {dropLine?.page === p && (
                <div style={{ position: 'absolute', left: 16 * scale, right: 16 * scale, top: (dropLine.y + 4) * scale, height: 2, background: 'var(--accent)', borderRadius: 1 }} />
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
        <span style={{ color: 'var(--text-3)' }}>{result.elapsedMs} ms</span>
        <span style={{ color: 'var(--text-3)' }}>{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  )
}
