import { Command, FileDown, LayoutGrid, Palette, Play, Redo2, Undo2 } from 'lucide-react'
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
  const change = useStore((s) => s.change)
  const active = useStore((s) => s.activeDataSet)
  const setActive = useStore((s) => s.setActiveDataSet)
  const setPaletteOpen = useStore((s) => s.setPaletteOpen)
  const setUsePanelOpen = useStore((s) => s.setUsePanelOpen)
  const select = useStore((s) => s.select)
  const selected = useStore((s) => s.selectedId)
  const errors = usePreview((s) => s.result?.issues.filter((i) => i.severity === 'error').length ?? 0)
  const warnings = usePreview((s) => s.result?.issues.filter((i) => i.severity === 'warning').length ?? 0)
  const setLeftPanel = useStore((s) => s.setLeftPanel)
  const fileName = filePath ? filePath.split(/[\\/]/).pop() : null

  // One plain sentence about where the work lives.
  const status = !fileName ? (dirty ? 'Not saved yet' : 'New report') : dirty ? `Saving ${fileName}…` : `Saved · ${fileName}`
  const tone = !fileName ? (dirty ? 'dirty' : '') : dirty ? 'dirty' : 'saved'

  return (
    <header className="toolbar">
      <button className="btn" title="New report from a template or your data" onClick={newDocument}>
        <LayoutGrid size={15} /> New
      </button>
      <div className="doc-title">
        <input
          aria-label="Report name"
          value={doc.meta.name}
          placeholder="Untitled Report"
          onChange={(e) => change((d) => ({ ...d, meta: { ...d.meta, name: e.target.value } }), 'doc:meta.name')}
        />
        <small>
          <span className={`dot ${tone}`} /> {status}
          {!fileName && dirty && (
            <button className="link" onClick={() => saveTemplate()}>
              Save…
            </button>
          )}
        </small>
      </div>
      <div className="spacer" />
      <div className="preview-with" title="The data used for the preview">
        <span>Preview with</span>
        <div style={{ width: 170 }}>
          <Select value={active} options={dataSets(doc).map((s) => ({ value: s.id, label: s.name }))} onChange={setActive} ariaLabel="Preview data" />
        </div>
      </div>
      {(errors > 0 || warnings > 0) && (
        <button className="btn small" style={{ color: errors ? 'var(--fail)' : 'var(--warn)' }} onClick={() => setLeftPanel('data')} title="Show what needs attention">
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
      <button className={`btn${selected ? '' : ' on'}`} title="Page size, margins, colours, logo" onClick={() => select(null)}>
        <Palette size={15} /> Page &amp; style
      </button>
      <button className="btn icon" title={`Commands (${MOD}K)`} onClick={() => setPaletteOpen(true)}>
        <Command size={15} />
      </button>
      <button className="btn bordered" title="Save, test with real data, and call it from your test system" onClick={() => setUsePanelOpen(true)}>
        <Play size={14} /> Use
      </button>
      <button className="btn primary" title={`Export PDF (${MOD}E)`} onClick={() => exportPdf()}>
        <FileDown size={15} /> Export PDF
      </button>
    </header>
  )
}
