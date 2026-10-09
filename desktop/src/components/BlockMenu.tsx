import { BookmarkPlus, ClipboardPaste, Copy, CopyPlus, Scissors, Trash2 } from 'lucide-react'
import { useEffect } from 'react'
import { create } from 'zustand'
import { copySelected, cutSelected, pasteFromClipboard, saveSelectedBlock } from '../lib/actions'
import { findBlock } from '../lib/doc-ops'
import { useStore } from '../lib/store'

const mod = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl+'

const useBlockMenu = create<{ at: { id: string; x: number; y: number } | null }>(() => ({ at: null }))

/** Right-click on a block (page or layers): select it and show its menu. */
export function openBlockMenu(e: React.MouseEvent, id: string) {
  e.preventDefault()
  e.stopPropagation()
  useStore.getState().select(id)
  useBlockMenu.setState({ at: { id, x: e.clientX, y: e.clientY } })
}

export function BlockMenu() {
  const at = useBlockMenu((s) => s.at)
  const close = () => useBlockMenu.setState({ at: null })

  useEffect(() => {
    if (!at) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && useBlockMenu.setState({ at: null })
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [at])

  if (!at) return null
  const s = useStore.getState()
  if (!findBlock(s.doc, at.id)) return null
  const items: { label: string; keys?: string; icon: React.ReactNode; run: () => void; danger?: boolean }[] = [
    { label: 'Copy', keys: `${mod}C`, icon: <Copy size={13} />, run: () => void copySelected(at.id) },
    { label: 'Cut', keys: `${mod}X`, icon: <Scissors size={13} />, run: () => void cutSelected(at.id) },
    { label: 'Paste after', keys: `${mod}V`, icon: <ClipboardPaste size={13} />, run: () => void pasteFromClipboard() },
    { label: 'Duplicate', keys: `${mod}D`, icon: <CopyPlus size={13} />, run: () => s.duplicate(at.id) },
    { label: 'Save block to library…', icon: <BookmarkPlus size={13} />, run: () => void saveSelectedBlock(at.id) },
    { label: 'Delete', keys: '⌫', icon: <Trash2 size={13} />, run: () => s.remove(at.id), danger: true },
  ]
  const W = 230
  const H = items.length * 30 + 12
  const left = Math.max(8, Math.min(at.x, window.innerWidth - W - 8))
  const top = Math.max(8, Math.min(at.y, window.innerHeight - H - 8))

  return (
    <div
      className="scrim clear"
      onMouseDown={close}
      onContextMenu={(e) => {
        e.preventDefault()
        close()
      }}
    >
      <div className="block-menu" role="menu" aria-label="Block actions" style={{ left, top, width: W }} onMouseDown={(e) => e.stopPropagation()}>
        {items.map((i) => (
          <button
            key={i.label}
            role="menuitem"
            className={`block-menu-item${i.danger ? ' danger' : ''}`}
            onClick={() => {
              close()
              i.run()
            }}
          >
            {i.icon}
            <span className="grow">{i.label}</span>
            {i.keys && <kbd>{i.keys}</kbd>}
          </button>
        ))}
      </div>
    </div>
  )
}
