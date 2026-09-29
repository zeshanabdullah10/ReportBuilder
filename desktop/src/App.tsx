import { CircleAlert, CircleCheck, Database, Info, ListTree } from 'lucide-react'
import { useEffect } from 'react'
import { AddMenu } from './components/AddMenu'
import { Canvas } from './components/Canvas'
import { DragLayer } from './components/DragLayer'
import { CommandPalette } from './components/CommandPalette'
import { DataPanel } from './components/DataPanel'
import { Inspector } from './components/Inspector'
import { Outline } from './components/Outline'
import { Toolbar } from './components/Toolbar'
import { UsePanel } from './components/UsePanel'
import { Welcome } from './components/Welcome'
import { exportPdf, newDocument, openPath, openTemplate, saveTemplate } from './lib/actions'
import { isDragging } from './lib/dnd'
import * as engine from './lib/engine'
import { usePreviewSync } from './lib/preview'
import { useStore } from './lib/store'

function isTyping(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null
  return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)
}

function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useStore.getState()
      const mod = e.metaKey || e.ctrlKey
      const k = e.key.toLowerCase()
      if (mod && k === 'k') {
        e.preventDefault()
        s.setPaletteOpen(!s.paletteOpen)
        return
      }
      if (mod && k === 's') {
        e.preventDefault()
        void saveTemplate(e.shiftKey)
        return
      }
      if (mod && k === 'o') {
        e.preventDefault()
        void openTemplate()
        return
      }
      if (mod && k === 'n') {
        e.preventDefault()
        void newDocument()
        return
      }
      if (s.welcome || s.paletteOpen) return
      if (mod && k === 'e') {
        e.preventDefault()
        void exportPdf()
        return
      }
      if (mod && (k === '=' || k === '+')) {
        e.preventDefault()
        s.setZoom(s.zoom * 1.15)
        return
      }
      if (mod && k === '-') {
        e.preventDefault()
        s.setZoom(s.zoom / 1.15)
        return
      }
      if (mod && k === '0') {
        e.preventDefault()
        s.setZoom(1)
        return
      }
      if (isTyping(e)) return
      if (isDragging()) return
      if (e.key === '/' && !mod) {
        e.preventDefault()
        s.openAddMenu(null, window.innerWidth / 2 - 160, 140)
        return
      }
      if (mod && k === 'z') {
        e.preventDefault()
        if (e.shiftKey) s.redo()
        else s.undo()
      } else if (mod && k === 'y') {
        e.preventDefault()
        s.redo()
      } else if (mod && k === 'd' && s.selectedId) {
        e.preventDefault()
        s.duplicate(s.selectedId)
      } else if ((e.key === 'Backspace' || e.key === 'Delete') && s.selectedId) {
        e.preventDefault()
        s.remove(s.selectedId)
      } else if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown') && s.selectedId) {
        e.preventDefault()
        s.nudge(s.selectedId, e.key === 'ArrowUp' ? -1 : 1)
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        s.selectRelative(e.key === 'ArrowUp' ? -1 : 1)
      } else if (e.key === 'Escape') {
        s.select(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

/** Desktop: once a template has a file, keep it saved as you work. */
function useAutosave() {
  const dirty = useStore((s) => s.dirty)
  const filePath = useStore((s) => s.filePath)
  const doc = useStore((s) => s.doc)
  useEffect(() => {
    if (!engine.isTauri || !dirty || !filePath) return
    const t = setTimeout(() => void saveTemplate(false, true), 1500)
    return () => clearTimeout(t)
  }, [dirty, filePath, doc])
}

function useUnsavedGuard() {
  // Desktop: intercept window close while there are unsaved changes.
  useEffect(() => {
    if (!engine.isTauri) return
    let unlisten: (() => void) | undefined
    void import('@tauri-apps/api/window').then(async ({ getCurrentWindow }) => {
      const win = getCurrentWindow()
      unlisten = await win.onCloseRequested(async (event) => {
        if (!useStore.getState().dirty) return
        const discard = await engine.confirmAsync('You have unsaved changes. Close without saving?', 'Close')
        if (!discard) event.preventDefault()
      })
    })
    return () => unlisten?.()
  }, [])

  // Desktop: open a template passed on the command line.
  useEffect(() => {
    void engine.initialFile().then((p) => {
      if (p) void openPath(p)
    })
  }, [])

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (useStore.getState().dirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])
}

function LeftSidebar() {
  const panel = useStore((s) => s.leftPanel)
  const setPanel = useStore((s) => s.setLeftPanel)
  return (
    <aside className="sidebar" aria-label="Structure">
      <div className="sidebar-head">
        <div className="segmented full" role="tablist">
          <button role="tab" aria-pressed={panel === 'data'} onClick={() => setPanel('data')}>
            <Database size={13} /> Data
          </button>
          <button role="tab" aria-pressed={panel === 'layers'} onClick={() => setPanel('layers')}>
            <ListTree size={13} /> Layers
          </button>
        </div>
      </div>
      {panel === 'layers' && <Outline />}
      {panel === 'data' && <DataPanel />}
    </aside>
  )
}

function Toasts() {
  const toasts = useStore((s) => s.toasts)
  const dismiss = useStore((s) => s.dismissToast)
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`} onClick={() => dismiss(t.id)}>
          {t.kind === 'success' ? <CircleCheck size={15} /> : t.kind === 'error' ? <CircleAlert size={15} /> : <Info size={15} />}
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  )
}

export default function App() {
  const welcome = useStore((s) => s.welcome)
  usePreviewSync()
  useShortcuts()
  useUnsavedGuard()
  useAutosave()

  return (
    <>
      {welcome ? (
        <div className="app" style={{ gridTemplateRows: '1fr' }}>
          <Welcome />
        </div>
      ) : (
        <div className="app">
          <Toolbar />
          <div className="workspace">
            <LeftSidebar />
            <Canvas />
            <aside className="sidebar right" aria-label="Inspector">
              <Inspector />
            </aside>
          </div>
        </div>
      )}
      <CommandPalette />
      <AddMenu />
      <UsePanel />
      <DragLayer />
      <Toasts />
    </>
  )
}
