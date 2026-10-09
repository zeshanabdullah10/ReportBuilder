import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearMemoryClipboard, decodeBlocks, encodeBlocks, pasteBlocks, pasteLocation, readBlocks, writeBlocks } from './clipboard'
import { newDocument } from './defaults'
import { flatIds } from './doc-ops'
import { useStore } from './store'
import type { Block } from './types'

const text: Block = { id: 't1', type: 'text', text: 'Hello', style: {} }
const section: Block = {
  id: 's1', type: 'section', title: 'S', as: 'item', keepTogether: false, pageBreakBefore: false, boxed: false,
  blocks: [{ id: 's1a', type: 'divider', thickness: 1 }],
}

function stubClipboard(impl: Partial<Clipboard> | undefined) {
  Object.defineProperty(navigator, 'clipboard', { value: impl, configurable: true })
}

describe('block clipboard', () => {
  beforeEach(() => clearMemoryClipboard())
  afterEach(() => stubClipboard(undefined))

  it('round-trips the JSON envelope and rejects other text', () => {
    const s = encodeBlocks([text, section])
    expect(JSON.parse(s)).toHaveProperty('reportBuilderBlocks')
    expect(decodeBlocks(s)).toEqual([text, section])
    expect(decodeBlocks('hello')).toBeNull()
    expect(decodeBlocks('{"reportBuilderBlocks": []}')).toBeNull()
    expect(decodeBlocks('{"reportBuilderBlocks": [{"nope": 1}]}')).toBeNull()
    expect(decodeBlocks('{"reportBuilderBlocks": ')).toBeNull()
    expect(decodeBlocks(null)).toBeNull()
  })

  it('pastes fresh-id copies after the selection, or at the end of the body', () => {
    const doc = newDocument()
    const first = doc.body[0].id
    doc.body.push({ id: 'last', type: 'spacer', heightMm: 4 })
    const at = pasteLocation(doc, first)
    expect(at).toEqual({ region: 'body', index: 1 })
    const r = pasteBlocks(doc, [text, section], at)
    expect(r.doc.body.map((b) => b.type)).toEqual(['heading', 'text', 'section', 'spacer'])
    expect(r.ids).toHaveLength(2)
    expect(r.ids).not.toContain('t1')
    // Pasting twice never duplicates ids.
    const again = pasteBlocks(r.doc, [text, section], pasteLocation(r.doc, null))
    const ids = flatIds(again.doc)
    expect(new Set(ids).size).toBe(ids.length)
    expect(again.doc.body.at(-1)!.type).toBe('section')
  })

  it('uses the system clipboard when available', async () => {
    let stored = ''
    stubClipboard({ writeText: async (t: string) => void (stored = t), readText: async () => stored })
    await writeBlocks([text])
    expect(decodeBlocks(stored)).toEqual([text])
    expect(await readBlocks()).toEqual([text])
    // Something else copied since: nothing to paste.
    stored = 'plain text'
    expect(await readBlocks()).toBeNull()
  })

  it('falls back to the in-memory clipboard when access is refused', async () => {
    stubClipboard({
      writeText: vi.fn(async () => {
        throw new Error('denied')
      }),
      readText: vi.fn(async () => {
        throw new Error('denied')
      }),
    })
    expect(await readBlocks()).toBeNull()
    await writeBlocks([section])
    expect(await readBlocks()).toEqual([section])
    stubClipboard(undefined)
    expect(await readBlocks()).toEqual([section])
  })

  it('store.insertBlocks selects the last pasted block and is one undo step', () => {
    const s = useStore.getState()
    s.load(newDocument(), null)
    s.select(useStore.getState().doc.body[0].id)
    useStore.getState().insertBlocks([text, section])
    const st = useStore.getState()
    expect(st.doc.body.map((b) => b.type)).toEqual(['heading', 'text', 'section'])
    expect(st.selectedId).toBe(st.doc.body[2].id)
    st.undo()
    expect(useStore.getState().doc.body).toHaveLength(1)
  })
})
