// Copy and paste blocks, also between documents and windows: the system clipboard carries
// `{"reportBuilderBlocks": [...]}`; an in-memory copy covers webviews that refuse clipboard access.

import { cloneWithNewIds, findBlock, insertBlock, type Location } from './doc-ops'
import type { Block, ReportDocument } from './types'

export const ENVELOPE_KEY = 'reportBuilderBlocks'

export function encodeBlocks(blocks: Block[]): string {
  return JSON.stringify({ [ENVELOPE_KEY]: blocks })
}

function looksLikeBlock(b: unknown): b is Block {
  return !!b && typeof b === 'object' && typeof (b as { type?: unknown }).type === 'string'
}

/** The blocks in clipboard text, or null when it isn't a Report Builder envelope. */
export function decodeBlocks(text: string | null | undefined): Block[] | null {
  if (!text || !text.includes(ENVELOPE_KEY)) return null
  try {
    const v = JSON.parse(text.trim()) as Record<string, unknown>
    const list = v?.[ENVELOPE_KEY]
    if (!Array.isArray(list) || list.length === 0 || !list.every(looksLikeBlock)) return null
    return list
  } catch {
    return null
  }
}

/** Where pasted blocks go: right after the selection, else at the end of the body. */
export function pasteLocation(doc: ReportDocument, selectedId: string | null): Location {
  const found = selectedId ? findBlock(doc, selectedId) : null
  return found ? { ...found.loc, index: found.loc.index + 1 } : { region: 'body', index: doc.body.length }
}

/** Insert fresh-id copies of `blocks`, in order. */
export function pasteBlocks(doc: ReportDocument, blocks: Block[], at: Location): { doc: ReportDocument; ids: string[] } {
  let out = doc
  const ids: string[] = []
  blocks.forEach((b, i) => {
    const copy = cloneWithNewIds(b)
    ids.push(copy.id)
    out = insertBlock(out, copy, { ...at, index: at.index + i })
  })
  return { doc: out, ids }
}

// --- the clipboard itself ----------------------------------------------------------------------

let memory: { text: string; blocks: Block[] } | null = null
/** A clipboard permission prompt that nobody answers must not hang copy/paste. */
const CLIPBOARD_TIMEOUT_MS = 1500

function withTimeout<T>(p: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('clipboard timed out')), CLIPBOARD_TIMEOUT_MS)
    p.then(
      (v) => {
        clearTimeout(t)
        resolve(v)
      },
      (e) => {
        clearTimeout(t)
        reject(e)
      },
    )
  })
}

/** True when the last copy could not reach the system clipboard. */
let systemFailed = false

export async function writeBlocks(blocks: Block[]): Promise<void> {
  const text = encodeBlocks(blocks)
  memory = { text, blocks: structuredClone(blocks) }
  try {
    if (!navigator.clipboard?.writeText) throw new Error('no clipboard')
    await withTimeout(navigator.clipboard.writeText(text))
    systemFailed = false
  } catch {
    systemFailed = true
  }
}

/** Blocks on the clipboard: the system one when readable, else what this window copied last. */
export async function readBlocks(): Promise<Block[] | null> {
  try {
    if (!navigator.clipboard?.readText) throw new Error('no clipboard')
    const text = await withTimeout(navigator.clipboard.readText())
    const blocks = decodeBlocks(text)
    if (blocks) return blocks
    // Something else was copied since: only fall back when our copy never got there.
    return systemFailed && memory ? structuredClone(memory.blocks) : null
  } catch {
    return memory ? structuredClone(memory.blocks) : null
  }
}

/** Test hook. */
export function clearMemoryClipboard() {
  memory = null
  systemFailed = false
}
