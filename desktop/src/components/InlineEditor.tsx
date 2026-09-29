import { useStore } from '../lib/store'
import type { Block } from '../lib/types'
import { TemplateEditor } from './binding'

type Editable = Extract<Block, { type: 'heading' | 'text' | 'callout' }>

export function isInlineEditable(b: Block): b is Editable {
  return b.type === 'heading' || b.type === 'text' || b.type === 'callout'
}

/** Edit a text block right on the page (double-click). Fields are chips; Esc or clicking away finishes. */
export function InlineEditor({ block, scale, onDone }: { block: Block; scale: number; onDone: () => void }) {
  const updateBlock = useStore((s) => s.updateBlock)
  if (!isInlineEditable(block)) return null
  const size = block.type === 'heading' ? [22, 15, 12][Math.max(0, Math.min(2, block.level - 1))] : 11
  return (
    <div className="inline-editor" style={{ pointerEvents: 'auto', fontSize: size * Math.min(1.4, Math.max(0.8, scale / 1.333)) }} onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
      <TemplateEditor
        autoFocus
        multiline={block.type !== 'heading'}
        rows={2}
        value={block.text}
        ariaLabel="Edit text"
        onChange={(v) => updateBlock(block.id, { text: v }, 'text')}
        onDone={onDone}
      />
      <div className="inline-hint">Type <kbd>{'{'}</kbd> to insert a field · <kbd>Esc</kbd> to finish</div>
    </div>
  )
}
