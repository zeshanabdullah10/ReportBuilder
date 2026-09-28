import { beforeEach, describe, expect, it } from 'vitest'
import { useStore, activeData, STRESS_ID } from './store'
import { newDocument } from './defaults'
import { flatIds } from './doc-ops'

const s = () => useStore.getState()

describe('store', () => {
  beforeEach(() => s().load(newDocument(), null))

  it('inserts after the selection and selects the new block', () => {
    const first = s().doc.body[0].id
    s().select(first)
    s().insert('text')
    expect(s().doc.body[1].type).toBe('text')
    expect(s().selectedId).toBe(s().doc.body[1].id)
  })

  it('undo/redo restores documents', () => {
    s().insert('divider')
    s().insert('spacer')
    expect(s().doc.body).toHaveLength(3)
    s().undo()
    expect(s().doc.body).toHaveLength(2)
    s().undo()
    expect(s().doc.body).toHaveLength(1)
    s().redo()
    expect(s().doc.body).toHaveLength(2)
  })

  it('coalesces rapid edits of the same field', () => {
    const id = s().doc.body[0].id
    s().updateBlock(id, { text: 'a' } as never, 'text')
    s().updateBlock(id, { text: 'ab' } as never, 'text')
    s().updateBlock(id, { text: 'abc' } as never, 'text')
    expect(s().past).toHaveLength(1)
    s().undo()
    expect((s().doc.body[0] as { text: string }).text).toBe('Untitled Report')
  })

  it('removing selects the previous sibling', () => {
    const first = s().doc.body[0].id
    s().select(first)
    s().insert('divider')
    const id = s().selectedId!
    s().remove(id)
    expect(s().selectedId).toBe(first)
    expect(flatIds(s().doc)).not.toContain(id)
  })

  it('manages data sets and generated stress data', () => {
    s().setDataSetData('sample', { m: [1, 2] })
    s().addDataSet('Failing unit', { m: [9] })
    expect(s().doc.editor?.dataSets).toHaveLength(1)
    expect(activeData(s().doc, s().activeDataSet)).toEqual({ m: [9] })
    const stress = activeData(s().doc, STRESS_ID) as { m: number[] }
    expect(stress.m.length).toBeGreaterThanOrEqual(50)
  })

  it('newFromStarter embeds sample data and marks dirty', () => {
    s().newFromStarter(JSON.stringify({ body: [{ type: 'heading', text: 'x' }] }), '{"a":1}')
    expect(s().doc.sampleData).toEqual({ a: 1 })
    expect(s().dirty).toBe(true)
    expect(s().doc.body[0].id).toBeTruthy()
  })
})
