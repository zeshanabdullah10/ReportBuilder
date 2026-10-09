// File-level actions shared by the toolbar, command palette and shortcuts.

import { blockInfo, blockSummary } from './blocks'
import { pasteLocation, readBlocks, writeBlocks } from './clipboard'
import { dataSetName, parseDataFile } from './csv'
import { isGeneratedSet } from './defaults'
import { findBlock } from './doc-ops'
import * as engine from './engine'
import { saveBlockToLibrary, saveDefaultBrandKit, saveMyTemplate } from './library'
import { addRecent, removeRecent } from './prefs'
import { askText } from './prompt'
import { activeData, serialize, useStore } from './store'
import type { ReportDocument } from './types'

const TEMPLATE_FILTER = [{ name: 'Report template', extensions: ['json'] }]
const DATA_FILTER = [{ name: 'Test data (JSON or CSV)', extensions: ['json', 'csv'] }]
const DATA_ACCEPT = '.json,.csv,application/json,text/csv'

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
      addRecent(path)
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

export async function saveTemplate(saveAs = false, silent = false): Promise<boolean> {
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
      if (!silent || saveAs) addRecent(path)
      if (!silent) s.toast('success', `Saved ${basename(path)}`)
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

export async function exportPdf(pdfa = false, dataOverride?: unknown): Promise<void> {
  const s = useStore.getState()
  const req: engine.RenderRequest = {
    template: s.doc,
    data: dataOverride !== undefined ? dataOverride : activeData(s.doc, s.activeDataSet),
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
      const f = await engine.pickFileInBrowser(DATA_ACCEPT)
      if (!f) return
      name = f.name
      text = f.text
    }
    const data = await parseDataFile(name, text)
    s.addDataSet(dataSetName(name), data)
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

/** Open a template by path (command line / file association / recent files). */
export async function openPath(path: string): Promise<boolean> {
  const s = useStore.getState()
  try {
    s.load(JSON.parse(await engine.readTextFile(path)) as ReportDocument, path)
    addRecent(path)
    return true
  } catch (e) {
    s.toast('error', `Could not open ${basename(path)}: ${String(e)}`)
    return false
  }
}

/** Open a recent file; one that can no longer be opened leaves the list. */
export async function openRecent(path: string): Promise<void> {
  if (!(await confirmDiscard())) return
  if (!engine.isTauri) {
    removeRecent(path)
    useStore.getState().toast('error', 'Recent files can only be reopened in the desktop app')
    return
  }
  if (!(await openPath(path))) removeRecent(path)
}

/** Pick a JSON or CSV data file and parse it (desktop dialog or browser picker). */
export async function pickJsonFile(): Promise<{ name: string; data: unknown } | null> {
  let name: string
  let text: string
  if (engine.isTauri) {
    const path = await engine.openDialog(DATA_FILTER)
    if (!path) return null
    name = basename(path)
    text = await engine.readTextFile(path)
  } else {
    const f = await engine.pickFileInBrowser(DATA_ACCEPT)
    if (!f) return null
    name = f.name
    text = f.text
  }
  return { name: dataSetName(name), data: await parseDataFile(name, text) }
}

/** Parse JSON text, tolerating a BOM (LabVIEW and Windows tools often write one). */
export function parseJson(text: string): unknown {
  return JSON.parse(text.replace(/^\uFEFF/, ''))
}

// --- library -----------------------------------------------------------------------------------

export function saveBrandKitAsDefault(): void {
  const s = useStore.getState()
  if (saveDefaultBrandKit(s.doc.theme)) s.toast('success', 'New reports will use this brand kit')
  else s.toast('error', 'Could not save the brand kit (storage is unavailable or full)')
}

export async function saveAsMyTemplate(): Promise<void> {
  const s = useStore.getState()
  const name = await askText({
    title: 'Save as my template',
    label: 'Name',
    initial: s.doc.meta.name,
    hint: 'It appears under “My templates” when you create a report, with the data you are previewing now.',
  })
  if (!name) return
  const st = useStore.getState()
  // The generated edge-case sets are no good as example data: fall back to the sample.
  const data = isGeneratedSet(st.activeDataSet) ? st.doc.sampleData : activeData(st.doc, st.activeDataSet)
  if (saveMyTemplate(st.doc, data, name)) st.toast('success', `Saved “${name}” to My templates`)
  else st.toast('error', 'Could not save the template (storage is unavailable or full)')
}

export async function saveSelectedBlock(id = useStore.getState().selectedId): Promise<void> {
  const s = useStore.getState()
  const found = id ? findBlock(s.doc, id) : null
  if (!found) {
    s.toast('info', 'Select a block to save it')
    return
  }
  const b = found.block
  const name = await askText({
    title: 'Save block to library',
    label: 'Name',
    initial: (b.type === 'section' && b.title) || blockSummary(b) || blockInfo(b.type).label,
    hint: 'Saved blocks are offered under “Saved blocks” when you add a block, in any report.',
  })
  if (!name) return
  if (saveBlockToLibrary(b, name)) useStore.getState().toast('success', `Saved “${name}” to your blocks`)
  else useStore.getState().toast('error', 'Could not save the block (storage is unavailable or full)')
}

// --- clipboard ---------------------------------------------------------------------------------

export async function copySelected(id = useStore.getState().selectedId): Promise<boolean> {
  const s = useStore.getState()
  const found = id ? findBlock(s.doc, id) : null
  if (!found) return false
  await writeBlocks([found.block])
  s.toast('info', `Copied ${blockInfo(found.block.type).label.toLowerCase()}`)
  return true
}

export async function cutSelected(id = useStore.getState().selectedId): Promise<void> {
  if (!id) return
  if (await copySelected(id)) useStore.getState().remove(id)
}

export async function pasteFromClipboard(): Promise<void> {
  const blocks = await readBlocks()
  const s = useStore.getState()
  if (!blocks) {
    s.toast('info', 'There are no blocks on the clipboard')
    return
  }
  s.insertBlocks(blocks, pasteLocation(s.doc, s.selectedId))
}
