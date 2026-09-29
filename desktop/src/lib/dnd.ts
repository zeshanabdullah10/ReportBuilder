// Pointer-based drag and drop shared by the page, the layer tree, the data tree and the add menu.
//
// Native HTML5 drag can't hit-test the rendered page, autoscroll, or show what a
// drop will do, so a small controller owns the gesture. Drop zones register a
// resolver that turns a pointer position into a target plus an indicator to draw.

import { create } from 'zustand'
import type { DropTarget, Payload } from './drop'

export type Indicator =
  | { zone: 'canvas'; kind: 'line'; page: number; x: number; y: number; w: number }
  | { zone: 'canvas'; kind: 'edge'; page: number; x: number; y: number; h: number }
  | { zone: 'canvas'; kind: 'onto'; page: number; x: number; y: number; w: number; h: number; label: string }
  | { zone: 'outline'; key: string; mode: 'before' | 'after' | 'inside' }
  | { zone: 'picker'; key: string }

/** A target outside the document tree, e.g. a field picker in the inspector. */
export interface CustomTarget {
  kind: 'custom'
  run: (payload: Payload) => void
}

export type AnyTarget = DropTarget | CustomTarget

export interface Resolution {
  target: AnyTarget | null
  indicator: Indicator | null
  /** Short text shown next to the pointer, e.g. "Add column". */
  hint?: string
}

export type Resolver = (x: number, y: number, payload: Payload) => Resolution | null

interface Zone {
  resolve: Resolver
  scroller?: () => HTMLElement | null
}

interface DragState {
  payload: Payload
  label: string
  x: number
  y: number
  target: AnyTarget | null
  indicator: Indicator | null
  hint: string | null
}

export const useDrag = create<{ drag: DragState | null }>(() => ({ drag: null }))

const zones = new Map<string, Zone>()
let commit: ((payload: Payload, target: DropTarget) => void) | null = null

/** Register a drop zone; returns its unregister function. Earlier zones win where they overlap. */
export function registerZone(id: string, resolve: Resolver, scroller?: () => HTMLElement | null): () => void {
  zones.set(id, { resolve, scroller })
  return () => {
    zones.delete(id)
  }
}

/** The store registers how a document drop is applied. */
export function setDropHandler(fn: (payload: Payload, target: DropTarget) => void) {
  commit = fn
}

export function isDragging(): boolean {
  return useDrag.getState().drag !== null
}

const THRESHOLD = 5
const SCROLL_EDGE = 48
const SCROLL_SPEED = 16

function resolveAt(x: number, y: number, payload: Payload): { zoneId: string; res: Resolution } | null {
  for (const [zoneId, z] of zones) {
    const res = z.resolve(x, y, payload)
    if (res) return { zoneId, res }
  }
  return null
}

/** Start a drag from a pointerdown. Nothing happens until the pointer moves a few pixels, so clicks still work. */
export function beginDrag(e: { button: number; clientX: number; clientY: number }, payload: Payload, label: string) {
  if (e.button !== 0) return
  const sx = e.clientX
  const sy = e.clientY
  let active = false
  let lastX = sx
  let lastY = sy
  let zoneId: string | null = null
  let raf = 0

  const update = () => {
    const hit = resolveAt(lastX, lastY, payload)
    zoneId = hit?.zoneId ?? null
    useDrag.setState({
      drag: {
        payload,
        label,
        x: lastX,
        y: lastY,
        target: hit?.res.target ?? null,
        indicator: hit?.res.indicator ?? null,
        hint: hit?.res.hint ?? null,
      },
    })
  }

  const autoscroll = () => {
    if (!active) return
    const el = zoneId ? zones.get(zoneId)?.scroller?.() : null
    if (el) {
      const r = el.getBoundingClientRect()
      const d = lastY < r.top + SCROLL_EDGE ? -1 : lastY > r.bottom - SCROLL_EDGE ? 1 : 0
      if (d !== 0 && lastX >= r.left && lastX <= r.right) {
        const before = el.scrollTop
        el.scrollTop += d * SCROLL_SPEED
        if (el.scrollTop !== before) update()
      }
    }
    raf = requestAnimationFrame(autoscroll)
  }

  const finish = (drop: boolean) => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
    window.removeEventListener('keydown', key, true)
    cancelAnimationFrame(raf)
    document.body.classList.remove('dragging')
    const state = useDrag.getState().drag
    useDrag.setState({ drag: null })
    if (!active) return
    // The click that follows a drag must not select whatever is under the pointer.
    const swallow = (ev: Event) => {
      ev.stopPropagation()
      ev.preventDefault()
    }
    window.addEventListener('click', swallow, { capture: true, once: true })
    setTimeout(() => window.removeEventListener('click', swallow, true), 0)
    const t = state?.target
    if (!drop || !t) return
    if (t.kind === 'custom') t.run(payload)
    else commit?.(payload, t)
  }

  const move = (ev: PointerEvent) => {
    lastX = ev.clientX
    lastY = ev.clientY
    if (!active) {
      if (Math.hypot(lastX - sx, lastY - sy) < THRESHOLD) return
      active = true
      document.body.classList.add('dragging')
      raf = requestAnimationFrame(autoscroll)
    }
    update()
  }
  const up = () => finish(true)
  const key = (ev: KeyboardEvent) => {
    if (ev.key !== 'Escape') return
    ev.stopPropagation()
    finish(false)
  }

  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
  window.addEventListener('keydown', key, true)
}
