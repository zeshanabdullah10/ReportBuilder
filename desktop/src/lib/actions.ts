// File-level actions shared by the toolbar, command palette and shortcuts.

import * as engine from './engine'
import { activeData, serialize, useStore } from './store'
import type { ReportDocument } from './types'

const TEMPLATE_FILTER = [{ name: 'Report template', extensions: ['json'] }]
const DATA_FILTER = [{ name: 'JSON data', extensions: ['json'] }]

function dirname(p: string): string {
  const i = Math.max(p.lastIndexOf('/'), p.lastIndexOf('\\'))
  return i >= 0 ? p.slice(0, i) : ''
}

function basename(p: string): string {
  return p.split(/[\\/]/).pop() ?? p
}

function safeName(s: string): string {
  return (s || 'Report').replace(/[^\w\-. ]+/g, '_').trim() || 'Report'
}

async function confirmDiscard(): Promise<boolean> {
  return !useStore.getState().dirty || engine.confirmAsync('You have unsaved changes. Discard them?')
}

export async function openTemplate(): Promise<void> {
  if (!(await confirmDiscard())) return
  const s = useStore.getState()
  try {
    if (engine.isTauri) {
      const path = await engine.openDialog(TEMPLATE_FILTER)
      if (!path) return
      const text = await engine.readTextFile(path)
      s.load(JSON.parse(text) as ReportDocument, path)
      s.toast('success', `Opened ${basename(path)}`)
    } else {
      const f = await engine.pickFileInBrowser('.json,application/json')
      if (!f) return
      s.load(JSON.parse(f.text) as ReportDocument, f.name)
      s.toast('success', `Opened ${f.name}`)
    }
  } catch (e) {
    s.toast('error', `Could not open template: ${String(e)}`)
  }
}

export async function saveTemplate(saveAs = false): Promise<boolean> {
  const s = useStore.getState()
  const text = serialize(s.doc)
  try {
    if (engine.isTauri) {
      let path = saveAs ? null : s.filePath
      if (!path) {
        path = await engine.saveDialog(`${safeName(s.doc.meta.name)}.rbt.json`, TEMPLATE_FILTER)
        if (!path) return false
      }
      await engine.writeTextFile(path, text)
      s.markSaved(path)
      s.toast('success', `Saved ${basename(path)}`)
    } else {
      const name = s.filePath ?? `${safeName(s.doc.meta.name)}.rbt.json`
      engine.downloadInBrowser(name, new Blob([text], { type: 'application/json' }))
      s.markSaved(name)
    }
    return true
  } catch (e) {
    s.toast('error', `Could not save: ${String(e)}`)
    return false
  }
}

export async function exportPdf(pdfa = false): Promise<void> {
  const s = useStore.getState()
  const req: engine.RenderRequest = {
    template: s.doc,
    data: activeData(s.doc, s.activeDataSet),
    baseDir: s.filePath && engine.isTauri ? dirname(s.filePath) : null,
    pdfStandard: pdfa ? 'a2b' : 'none',
  }
  const name = `${safeName(s.doc.meta.name)}.pdf`
  try {
    if (engine.isTauri) {
      const path = await engine.saveDialog(name, [{ name: 'PDF', extensions: ['pdf'] }])
      if (!path) return
      const r = await engine.exportPdf(req, path)
      s.toast('success', `Exported ${basename(path)} · ${r.pages} page${r.pages === 1 ? '' : 's'}`)
    } else {
      const r = await engine.exportPdf(req)
      if (r.blob) engine.downloadInBrowser(name, r.blob)
      s.toast('success', `Exported ${name}${pdfa ? ' (PDF/A-2b)' : ''}`)
    }
  } catch (e) {
    s.toast('error', `Export failed: ${String(e)}`)
  }
}

export async function loadDataFile(): Promise<void> {
  const s = useStore.getState()
  try {
    let name: string
    let text: string
    if (engine.isTauri) {
      const path = await engine.openDialog(DATA_FILTER)
      if (!path) return
      name = basename(path)
      text = await engine.readTextFile(path)
    } else {
      const f = await engine.pickFileInBrowser('.json,application/json')
      if (!f) return
      name = f.name
      text = f.text
    }
    const data = JSON.parse(text.replace(/^﻿/, ''))
    s.addDataSet(name.replace(/\.json$/i, ''), data)
    s.toast('success', `Loaded data set “${name}”`)
  } catch (e) {
    s.toast('error', `Could not load data: ${String(e)}`)
  }
}

export async function importLegacy(): Promise<void> {
  if (!(await confirmDiscard())) return
  const s = useStore.getState()
  try {
    let text: string | null = null
    if (engine.isTauri) {
      const path = await engine.openDialog([{ name: 'Legacy template JSON', extensions: ['json'] }])
      if (path) text = await engine.readTextFile(path)
    } else {
      text = (await engine.pickFileInBrowser('.json'))?.text ?? null
    }
    if (!text) return
    const r = await engine.migrate(JSON.parse(text))
    s.load(r.document, null)
    useStore.setState({ dirty: true })
    s.toast(r.notes.length ? 'info' : 'success', r.notes.length ? `Imported with ${r.notes.length} note(s): ${r.notes[0]}` : 'Imported legacy template')
  } catch (e) {
    s.toast('error', `Import failed: ${String(e)}`)
  }
}

export async function newDocument(): Promise<void> {
  if (!(await confirmDiscard())) return
  useStore.getState().showWelcome()
}

/** Open a template by path (command line / file association). */
export async function openPath(path: string): Promise<void> {
  const s = useStore.getState()
  try {
    s.load(JSON.parse(await engine.readTextFile(path)) as ReportDocument, path)
  } catch (e) {
    s.toast('error', `Could not open ${basename(path)}: ${String(e)}`)
  }
}
