// The user's library, kept in prefs: a default brand kit, their own templates and saved blocks.

import { cloneWithNewIds } from './doc-ops'
import { getPref, MY_TEMPLATES, type MyTemplate, prefId, type SavedBlock, setPref, updatePref } from './prefs'
import type { Block, ReportDocument, Starter, Theme } from './types'

// --- brand kit ---------------------------------------------------------------------------------

/** The theme fields a brand kit carries: company, logo, typeface, base size and every colour. */
export function brandKitOf(theme: Theme): Theme {
  return { ...theme }
}

/** Replace a document's brand with the kit (the starters' "Acme Instruments" placeholder included). */
export function applyBrandKit(doc: ReportDocument, kit: Theme | null): ReportDocument {
  if (!kit) return doc
  return { ...doc, theme: { ...doc.theme, ...kit, logo: kit.logo || undefined } }
}

export function saveDefaultBrandKit(theme: Theme): boolean {
  return setPref('brandKit', brandKitOf(theme))
}

export function defaultBrandKit(): Theme | null {
  return getPref('brandKit')
}

// --- my templates ------------------------------------------------------------------------------

/** A document as a stored template: the template JSON without its data, plus the data apart. */
export function toMyTemplate(doc: ReportDocument, data: unknown, name: string, now = Date.now()): MyTemplate {
  const { sampleData: _sample, ...rest } = doc
  void _sample
  const editor = rest.editor ? { ...rest.editor, activeDataSet: undefined } : undefined
  return {
    id: prefId('tpl'),
    name: name.trim() || doc.meta.name || 'My template',
    description: doc.meta.description || 'Saved from your reports',
    category: MY_TEMPLATES,
    template: JSON.stringify({ ...rest, meta: { ...rest.meta, name: name.trim() || rest.meta.name }, editor }),
    data: JSON.stringify(data ?? {}),
    savedAt: now,
  }
}

/** Shape a stored template like a starter so the gallery can show and open it the same way. */
export function asStarter(t: MyTemplate): Starter {
  return { id: t.id, name: t.name, description: t.description, category: MY_TEMPLATES, template: t.template, data: t.data }
}

export function isMyTemplate(s: Starter): boolean {
  return s.category === MY_TEMPLATES
}

export function saveMyTemplate(doc: ReportDocument, data: unknown, name: string): boolean {
  const t = toMyTemplate(doc, data, name)
  // Same name replaces the older copy.
  return updatePref('templates', (l) => [t, ...l.filter((x) => x.name !== t.name)])
}

export function deleteMyTemplate(id: string): boolean {
  return updatePref('templates', (l) => l.filter((t) => t.id !== id))
}

// --- saved blocks ------------------------------------------------------------------------------

export function toSavedBlock(block: Block, name: string, now = Date.now()): SavedBlock {
  return { id: prefId('blk'), name: name.trim() || 'Saved block', block: structuredClone(block), savedAt: now }
}

export function saveBlockToLibrary(block: Block, name: string): boolean {
  const s = toSavedBlock(block, name)
  return updatePref('blocks', (l) => [s, ...l.filter((x) => x.name !== s.name)])
}

export function deleteSavedBlock(id: string): boolean {
  return updatePref('blocks', (l) => l.filter((b) => b.id !== id))
}

/** A copy of a saved block that can go into a document (fresh ids throughout). */
export function instantiate(saved: SavedBlock): Block {
  return cloneWithNewIds(saved.block)
}
