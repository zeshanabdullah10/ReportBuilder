// Shared drag payload (dataTransfer contents aren't readable during dragover).

import type { BlockType } from './types'

export type DragPayload = { kind: 'move'; id: string } | { kind: 'new'; type: BlockType }

let current: DragPayload | null = null

export function startDrag(e: React.DragEvent, p: DragPayload) {
  current = p
  e.dataTransfer.effectAllowed = p.kind === 'move' ? 'move' : 'copy'
  e.dataTransfer.setData('text/plain', p.kind === 'move' ? p.id : p.type)
}

export function dragPayload(): DragPayload | null {
  return current
}

export function endDrag() {
  current = null
}
