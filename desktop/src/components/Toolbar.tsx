import { Command, FileDown, LayoutGrid, Redo2, Save, Undo2, ZoomIn, ZoomOut } from 'lucide-react'
import { exportPdf, newDocument, saveTemplate } from '../lib/actions'
import { dataSets } from '../lib/defaults'
import { usePreview } from '../lib/preview'
import { useStore } from '../lib/store'
import { Select } from './fields'

export const MOD = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl+'

export function Toolbar() {
  const doc = useStore((s) => s.doc)
  const dirty = useStore((s) => s.dirty)
  const filePath = useStore((s) => s.filePath)
  const canUndo = useStore((s) => s.past.length > 0)
  const canRedo = useStore((s) => s.future.length > 0)
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const zoom = useStore((s) => s.zoom)
  const setZoom = useStore((s) => s.setZoom)
  const change = useStore((s) => s.change)
  const active = useStore((s) => s.activeDataSet)
  const setActive = useStore((s) => s.setActiveDataSet)
  const setPaletteOpen = useStore((s) => s.setPaletteOpen)
  const errors = usePreview((s) => s.result?.issues.filter((i) => i.severity === 'error').length ?? 0)
  const warnings = usePreview((s) => s.result?.issues.filter((i) => i.severity === 'warning').length ?? 0)
  const setLeftPanel = useStore((s) => s.setLeftPanel)
  const fileName = filePath ? filePath.split(/[\\/]/).pop() : 'Not saved'

  return (
    <header className="toolbar">
      <button className="btn icon" title="New from gallery" onClick={newDocument}>
        <LayoutGrid size={16} />
      </button>
      <div className="doc-title">
        <input
          aria-label="Report name"
          value={doc.meta.name}
          placeholder="Untitled Report"
          onChange={(e) => change((d) => ({ ...d, meta: { ...d.meta, name: e.target.value } }), 'doc:meta.name')}
        />
        <small>
          <span className={`dot${dirty ? ' dirty' : ''}`} /> {fileName}
          {dirty ? ' — Edited' : ''}
        </small>
      </div>
      <div className="spacer" />
      <div style={{ width: 200 }} title="Data used for the preview">
        <Select value={active} options={dataSets(doc).map((s) => ({ value: s.id, label: s.name }))} onChange={setActive} ariaLabel="Preview data" />
      </div>
      {(errors > 0 || warnings > 0) && (
        <button className="btn small" style={{ color: errors ? 'var(--fail)' : 'var(--warn)' }} onClick={() => setLeftPanel('data')} title="Show issues">
          {errors > 0 ? `${errors} error${errors > 1 ? 's' : ''}` : `${warnings} warning${warnings > 1 ? 's' : ''}`}
        </button>
      )}
      <div className="sep" />
      <button className="btn icon" title={`Undo (${MOD}Z)`} disabled={!canUndo} onClick={undo}>
        <Undo2 size={16} />
      </button>
      <button className="btn icon" title={`Redo (${MOD}⇧Z)`} disabled={!canRedo} onClick={redo}>
        <Redo2 size={16} />
      </button>
      <div className="sep" />
      <button className="btn icon" title="Zoom out" onClick={() => setZoom(zoom / 1.15)}>
        <ZoomOut size={16} />
      </button>
      <button className="btn small" title="Actual size" onClick={() => setZoom(1)} style={{ minWidth: 48, justifyContent: 'center' }}>
        {Math.round(zoom * 100)}%
      </button>
      <button className="btn icon" title="Zoom in" onClick={() => setZoom(zoom * 1.15)}>
        <ZoomIn size={16} />
      </button>
      <div className="sep" />
      <button className="btn icon" title={`Commands (${MOD}K)`} onClick={() => setPaletteOpen(true)}>
        <Command size={15} />
      </button>
      <button className="btn icon" title={`Save (${MOD}S)`} onClick={() => saveTemplate()}>
        <Save size={16} />
      </button>
      <button className="btn primary" title={`Export PDF (${MOD}E)`} onClick={() => exportPdf()}>
        <FileDown size={15} /> Export PDF
      </button>
    </header>
  )
}
