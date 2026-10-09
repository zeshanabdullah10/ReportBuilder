import { Command, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  copySelected,
  cutSelected,
  exportPdf,
  importLegacy,
  loadDataFile,
  newDocument,
  openRecent,
  openTemplate,
  pasteFromClipboard,
  saveAsMyTemplate,
  saveBrandKitAsDefault,
  saveSelectedBlock,
  saveTemplate,
} from '../lib/actions'
import { CATALOG, blockInfo, blockSummary } from '../lib/blocks'
import { dataSets } from '../lib/defaults'
import { childLists } from '../lib/doc-ops'
import { applyBrandKit } from '../lib/library'
import { getPref } from '../lib/prefs'
import { useStore } from '../lib/store'
import type { Block } from '../lib/types'
import { BlockMenu } from './BlockMenu'
import { BlockIcon } from './Icon'
import { PromptDialog } from './PromptDialog'

interface Item {
  group: string
  label: string
  sub?: string
  keys?: string
  icon?: React.ReactNode
  run: () => void
}

export function CommandPalette() {
  const open = useStore((s) => s.paletteOpen)
  const setOpen = useStore((s) => s.setPaletteOpen)
  const doc = useStore((s) => s.doc)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setQ('')
      setActive(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const items = useMemo<Item[]>(() => {
    const s = useStore.getState()
    const out: Item[] = [
      { group: 'File', label: 'Export PDF…', keys: '⌘E', run: () => exportPdf() },
      { group: 'File', label: 'Export PDF/A-2b (archival)…', run: () => exportPdf(true) },
      { group: 'File', label: 'Save', keys: '⌘S', run: () => saveTemplate() },
      { group: 'File', label: 'Save As…', keys: '⇧⌘S', run: () => saveTemplate(true) },
      { group: 'File', label: 'Open template…', keys: '⌘O', run: () => openTemplate() },
      { group: 'File', label: 'New from gallery…', keys: '⌘N', run: () => newDocument() },
      { group: 'File', label: 'Import legacy web template…', run: () => importLegacy() },
      { group: 'File', label: 'Save as my template…', sub: 'Reuse it from the gallery under My templates', run: () => void saveAsMyTemplate() },
      ...getPref('recent').map((r) => ({ group: 'Recent', label: `Open recent: ${r.name}`, sub: r.path, run: () => void openRecent(r.path) })),
      ...(s.selectedId
        ? [
            { group: 'Edit', label: 'Copy block', keys: '⌘C', run: () => void copySelected() },
            { group: 'Edit', label: 'Cut block', keys: '⌘X', run: () => void cutSelected() },
            { group: 'Edit', label: 'Save block to library…', sub: 'Offered under Saved blocks when adding', run: () => void saveSelectedBlock() },
          ]
        : []),
      { group: 'Edit', label: 'Paste blocks', keys: '⌘V', run: () => void pasteFromClipboard() },
      { group: 'Brand', label: 'Save brand kit as default for new reports', run: () => saveBrandKitAsDefault() },
      ...(getPref('brandKit')
        ? [{ group: 'Brand', label: 'Apply default brand kit', run: () => s.change((d) => applyBrandKit(d, getPref('brandKit'))) }]
        : []),
      { group: 'Data', label: 'Load data file…', run: () => loadDataFile() },
      ...dataSets(doc).map((d) => ({ group: 'Data', label: `Use data set: ${d.name}`, run: () => s.setActiveDataSet(d.id) })),
      { group: 'View', label: 'Zoom to 100%', keys: '⌘0', run: () => s.setZoom(1) },
      { group: 'View', label: 'Zoom in', keys: '⌘+', run: () => s.setZoom(s.zoom * 1.15) },
      { group: 'View', label: 'Zoom out', keys: '⌘−', run: () => s.setZoom(s.zoom / 1.15) },
      { group: 'View', label: 'Show layers', run: () => s.setLeftPanel('layers') },
      { group: 'File', label: 'Use this template: save, test, call from LabVIEW…', run: () => s.setUsePanelOpen(true) },
      { group: 'View', label: 'Show data', run: () => s.setLeftPanel('data') },
      { group: 'View', label: 'Document settings', run: () => s.select(null) },
    ]
    for (const b of CATALOG) {
      out.push({ group: 'Insert', label: `Insert ${b.label}`, sub: b.description, icon: <BlockIcon type={b.type} />, run: () => s.insert(b.type) })
    }
    const walk = (list: Block[]) =>
      list.forEach((b) => {
        out.push({ group: 'Go to block', label: `${blockInfo(b.type).label}`, sub: blockSummary(b), icon: <BlockIcon type={b.type} />, run: () => s.select(b.id) })
        childLists(b).forEach(walk)
      })
    walk(doc.header)
    walk(doc.body)
    walk(doc.footer)
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, open])

  const filtered = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean)
    if (terms.length === 0) return items.filter((i) => i.group !== 'Go to block')
    return items.filter((i) => {
      const hay = `${i.group} ${i.label} ${i.sub ?? ''}`.toLowerCase()
      return terms.every((t) => hay.includes(t))
    })
  }, [q, items])

  useEffect(() => setActive(0), [q])
  useEffect(() => {
    listRef.current?.querySelector('.palette-item.active')?.scrollIntoView({ block: 'nearest' })
  }, [active])

  // Same shape open or closed, so the mounted dialogs keep their state.
  if (!open)
    return (
      <>
        <Mounted />
      </>
    )

  const run = (i: Item) => {
    setOpen(false)
    i.run()
  }

  let lastGroup = ''
  return (
    <>
      <Mounted />
      <div className="scrim" onMouseDown={() => setOpen(false)}>
        <div className="palette" role="dialog" aria-label="Command palette" onMouseDown={(e) => e.stopPropagation()}>
          <div className="palette-input">
            <Search size={17} color="var(--text-3)" />
            <input
              ref={inputRef}
              value={q}
              placeholder="Type a command, block type or search your blocks…"
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setActive((a) => Math.min(filtered.length - 1, a + 1))
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setActive((a) => Math.max(0, a - 1))
                } else if (e.key === 'Enter') {
                  e.preventDefault()
                  if (filtered[active]) run(filtered[active])
                } else if (e.key === 'Escape') {
                  setOpen(false)
                }
              }}
            />
            <kbd>esc</kbd>
          </div>
          <div className="palette-list" ref={listRef}>
            {filtered.length === 0 && <div className="empty">Nothing matches “{q}”</div>}
            {filtered.map((i, n) => {
              const header = i.group !== lastGroup ? <div className="palette-group">{i.group}</div> : null
              lastGroup = i.group
              return (
                <div key={`${i.group}-${i.label}-${n}`}>
                  {header}
                  <div className={`palette-item${n === active ? ' active' : ''}`} onMouseEnter={() => setActive(n)} onClick={() => run(i)}>
                    {i.icon ?? <Command size={14} />}
                    <span className="grow">
                      {i.label} {i.sub && <span className="sub">— {i.sub}</span>}
                    </span>
                    {i.keys && <kbd>{i.keys}</kbd>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}

/** Dialogs and menus the palette's commands open; mounted with it so they are always available. */
function Mounted() {
  return (
    <>
      <PromptDialog />
      <BlockMenu />
    </>
  )
}
