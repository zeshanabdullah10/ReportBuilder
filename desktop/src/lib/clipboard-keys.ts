import { useEffect } from 'react'
import { copySelected, cutSelected, pasteFromClipboard } from './actions'
import { isDragging } from './dnd'
import { useStore } from './store'

function isTextTarget(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)
}

/** True when the user has text selected on the page; ⌘C should copy that, not the block. */
function hasTextSelection(): boolean {
  try {
    const sel = window.getSelection()
    return !!sel && !sel.isCollapsed && sel.toString().trim().length > 0
  } catch {
    return false
  }
}

/** ⌘/Ctrl + C, X, V on blocks while the editor is showing and focus isn't in a text field. */
export function useClipboardShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return
      const k = e.key.toLowerCase()
      if (k !== 'c' && k !== 'x' && k !== 'v') return
      const s = useStore.getState()
      if (s.welcome || s.paletteOpen || s.addMenu || isTextTarget(e.target) || isDragging()) return
      if (k === 'v') {
        e.preventDefault()
        void pasteFromClipboard()
        return
      }
      if (!s.selectedId || hasTextSelection()) return
      e.preventDefault()
      void (k === 'c' ? copySelected() : cutSelected())
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
