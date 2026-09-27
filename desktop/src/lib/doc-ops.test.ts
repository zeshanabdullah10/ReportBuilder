import { describe, expect, it } from 'vitest'
import { duplicateBlock, ensureIds, findBlock, flatIds, insertBlock, moveBlock, removeBlock, updateBlock } from './doc-ops'
import { newDocument } from './defaults'
import type { Block, ReportDocument } from './types'

const text = (id: string): Block => ({ id, type: 'text', text: id, style: {} })

function doc(): ReportDocument {
  const d = newDocument()
  d.footer = []
  d.body = [
    text('a'),
    { id: 'cols', type: 'columns', gapMm: 6, columns: [{ width: 1, blocks: [text('c1')] }, { width: 1, blocks: [] }] },
    { id: 'sec', type: 'section', title: '', blocks: [text('s1'), text('s2')], as: 'item', keepTogether: false, pageBreakBefore: false, boxed: false },
    text('z'),
  ]
  return d
}

describe('doc-ops', () => {
  it('finds nested blocks with their location', () => {
    const f = findBlock(doc(), 'c1')!
    expect(f.loc).toEqual({ region: 'body', parentId: 'cols', column: 0, index: 0 })
    expect(f.path.map((p) => p.id)).toEqual(['cols'])
  })

  it('moves within a list accounting for removal', () => {
    const d = moveBlock(doc(), 'a', { region: 'body', index: 3 })
    expect(d.body.map((b) => b.id)).toEqual(['cols', 'sec', 'a', 'z'])
  })

  it('moves into a column and a section', () => {
    let d = moveBlock(doc(), 'z', { region: 'body', parentId: 'cols', column: 1, index: 0 })
    expect(findBlock(d, 'z')!.loc).toMatchObject({ parentId: 'cols', column: 1 })
    d = moveBlock(d, 'a', { region: 'body', parentId: 'sec', index: 1 })
    expect(flatIds(d)).toEqual(['cols', 'c1', 'z', 'sec', 's1', 'a', 's2'])
  })

  it('refuses to move a container into itself', () => {
    const before = doc()
    const after = moveBlock(before, 'sec', { region: 'body', parentId: 'sec', index: 0 })
    expect(after).toBe(before)
  })

  it('moves across regions', () => {
    const d = moveBlock(doc(), 'a', { region: 'footer', index: 0 })
    expect(d.footer.map((b) => b.id)).toContain('a')
    expect(d.body.map((b) => b.id)).not.toContain('a')
  })

  it('duplicates with fresh ids, including children', () => {
    const { doc: d, newId } = duplicateBlock(doc(), 'sec')
    expect(newId).toBeTruthy()
    const ids = flatIds(d)
    expect(new Set(ids).size).toBe(ids.length)
    expect(d.body[3].id).toBe(newId)
  })

  it('updates and removes immutably', () => {
    const d0 = doc()
    const d1 = updateBlock(d0, 's2', (b) => ({ ...b, visibleIf: 'x' }) as Block)
    expect(findBlock(d1, 's2')!.block.visibleIf).toBe('x')
    expect(findBlock(d0, 's2')!.block.visibleIf).toBeUndefined()
    const d2 = removeBlock(d1, 'c1')
    expect(findBlock(d2, 'c1')).toBeNull()
  })

  it('inserts at clamped indexes', () => {
    const d = insertBlock(doc(), text('n'), { region: 'body', index: 99 })
    expect(d.body.at(-1)!.id).toBe('n')
  })

  it('repairs missing and duplicate ids', () => {
    const d = doc()
    d.body.push(text('a'), { ...text(''), id: '' })
    const fixed = ensureIds(d)
    const ids = flatIds(fixed)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
