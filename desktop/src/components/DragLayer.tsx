import { useDrag } from '../lib/dnd'

/** The ghost that follows the pointer while dragging, with a hint of what a drop will do. */
export function DragLayer() {
  const drag = useDrag((s) => s.drag)
  if (!drag) return null
  return (
    <div className="drag-ghost" style={{ left: drag.x + 14, top: drag.y + 14 }}>
      <span className="drag-label">{drag.label}</span>
      {drag.hint && <span className="drag-hint">{drag.hint}</span>}
    </div>
  )
}
