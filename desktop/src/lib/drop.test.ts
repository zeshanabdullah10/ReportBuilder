import { describe, expect, it } from 'vitest'
import { buildFieldTree, findField } from './data-model'
import { newDocument } from './defaults'
import { findBlock } from './doc-ops'
import { applyDrop, blockForField, bindField, draftBody, isMeasurementList, mapMeasurementFields, moveBlockTidy, removeBlockTidy, scopedPath } from './drop'
import type { Block, ReportDocument } from './types'

const text = (id: string): Block => ({ id, type: 'text', text: id, style: {} })
const tree = buildFieldTree({
  dut: { serial: 'PSU-1', model: 'X' },
  measurements: [{ name: 'V', value: 5, low: 4, high: 6, unit: 'V' }],
  log: [{ time: '2026-03-01', message: 'hi' }],
  trace: [1, 2],
  channels: [{ name: 'CH1', results: [{ v: 1 }] }],
})
const f = (p: string) => findField(tree, p)!

function doc(body: Block[]): ReportDocument {
  const d = newDocument()
  d.footer = []
  d.body = body
  return d
}

describe('fields to blocks', () => {
  it('recognises measurements and maps the slots', () => {
    expect(isMeasurementList(f('measurements'))).toBe(true)
    expect(isMeasurementList(f('log'))).toBe(false)
    expect(mapMeasurementFields(['test', 'reading', 'lsl', 'usl', 'uom', 'verdict'])).toMatchObject({
      name: 'test', value: 'reading', low: 'lsl', high: 'usl', unit: 'uom', status: 'verdict',
    })
  })

  it('builds the right block per kind', () => {
    expect(blockForField(f('measurements')).type).toBe('measurementTable')
    const table = blockForField(f('log'))
    expect(table).toMatchObject({ type: 'table', source: 'log' })
    expect((table as Extract<Block, { type: 'table' }>).columns.map((c) => c.value)).toEqual(['row.time', 'row.message'])
    expect(blockForField(f('dut'))).toMatchObject({ type: 'keyValue', title: 'Dut' })
    expect(blockForField(f('trace')).type).toBe('chart')
    expect(blockForField(f('dut.serial'))).toMatchObject({ type: 'text', text: '**Serial:** {{ dut.serial }}' })
  })

  it('scopes fields to a repeating section', () => {
    const sec = { id: 's', type: 'section', title: '', blocks: [], repeat: 'channels', as: 'ch', keepTogether: false, pageBreakBefore: false, boxed: false } as Block
    expect(scopedPath('channels[].name', [sec])).toBe('ch.name')
    expect(scopedPath('channels[].results', [sec])).toBe('ch.results')
    expect(scopedPath('dut.serial', [sec])).toBe('dut.serial')
    expect(blockForField(f('channels[].results'), [sec])).toMatchObject({ type: 'table', source: 'ch.results' })
  })

  it('binds fields onto existing blocks', () => {
    const table = blockForField(f('log')) as Extract<Block, { type: 'table' }>
    const withCol = bindField({ ...table, columns: [] }, f('log[].message'))
    expect(withCol).toMatchObject({ columns: [{ value: 'row.message' }] })
    expect(bindField(table, f('measurements[].value'))).toBeNull() // different list
    expect(bindField(text('t'), f('dut.serial'))).toMatchObject({ text: 't {{ dut.serial }}' })
    expect(bindField({ ...text('t'), text: 'Write something, insert fields with {{ }}' } as Block, f('dut.serial'))).toMatchObject({ text: '{{ dut.serial }}' })
    expect(bindField(text('t'), f('measurements'))).toBeNull()
  })

  it('drafts a body from data', () => {
    const body = draftBody(tree, 'Report')
    expect(body.map((b) => b.type)).toEqual(['heading', 'summary', 'keyValue', 'measurementTable', 'table', 'chart', 'table'])
  })
})

describe('applyDrop', () => {
  it('inserts a field block at a gap', () => {
    const r = applyDrop(doc([text('a')]), { kind: 'field', node: f('measurements') }, { kind: 'gap', loc: { region: 'body', index: 0 } })
    expect(r.doc.body.map((b) => b.type)).toEqual(['measurementTable', 'text'])
    expect(r.selectId).toBe(r.doc.body[0].id)
  })

  it('binds onto a block, else inserts after', () => {
    const d = doc([text('a'), text('b')])
    const r = applyDrop(d, { kind: 'field', node: f('dut.serial') }, { kind: 'onto', id: 'a' })
    expect(findBlock(r.doc, 'a')!.block).toMatchObject({ text: 'a {{ dut.serial }}' })
    const r2 = applyDrop(d, { kind: 'field', node: f('measurements') }, { kind: 'onto', id: 'a' })
    expect(r2.doc.body.map((b) => b.type)).toEqual(['text', 'measurementTable', 'text'])
  })

  it('wraps a block and the dropped one in columns on an edge drop', () => {
    const r = applyDrop(doc([text('a'), text('b')]), { kind: 'new', type: 'qrCode' }, { kind: 'edge', id: 'a', side: 'right' })
    const cols = r.doc.body[0]
    expect(cols.type).toBe('columns')
    if (cols.type !== 'columns') return
    expect(cols.columns.map((c) => c.blocks.map((b) => b.type))).toEqual([['text'], ['qrCode']])
    expect(r.doc.body).toHaveLength(2)
  })

  it('moves a block beside another and unwraps the columns it left', () => {
    let d = applyDrop(doc([text('a'), text('b'), text('c')]), { kind: 'move', id: 'b' }, { kind: 'edge', id: 'a', side: 'right' }).doc
    expect(d.body.map((b) => b.type)).toEqual(['columns', 'text'])
    // Drag b out again: the columns block collapses back to plain blocks.
    d = applyDrop(d, { kind: 'move', id: 'b' }, { kind: 'gap', loc: { region: 'body', index: 2 } }).doc
    expect(d.body.map((b) => b.id)).toEqual(['a', 'c', 'b'])
  })

  it('adds a column when dropping beside a block inside columns', () => {
    let d = applyDrop(doc([text('a'), text('b')]), { kind: 'move', id: 'b' }, { kind: 'edge', id: 'a', side: 'right' }).doc
    d = applyDrop(d, { kind: 'new', type: 'divider' }, { kind: 'edge', id: 'a', side: 'right' }).doc
    const cols = d.body[0]
    if (cols.type !== 'columns') throw new Error('expected columns')
    expect(cols.columns.map((c) => c.blocks[0].type)).toEqual(['text', 'divider', 'text'])
  })

  it('ignores dropping a block on itself or into itself', () => {
    const d = doc([text('a')])
    expect(applyDrop(d, { kind: 'move', id: 'a' }, { kind: 'edge', id: 'a', side: 'left' }).doc).toBe(d)
  })

  it('prunes columns on remove and move', () => {
    const cols = { id: 'k', type: 'columns', gapMm: 6, columns: [{ width: 1, blocks: [text('x')] }, { width: 1, blocks: [text('y')] }] } as Block
    expect(removeBlockTidy(doc([cols]), 'x').body.map((b) => b.id)).toEqual(['y'])
    expect(moveBlockTidy(doc([cols, text('z')]), 'y', { region: 'body', index: 2 }).body.map((b) => b.id)).toEqual(['x', 'z', 'y'])
    // A fresh empty columns block is left alone until something leaves it.
    const empty = { ...cols, columns: [{ width: 1, blocks: [] }, { width: 1, blocks: [] }] } as Block
    expect(removeBlockTidy(doc([empty, text('z')]), 'z').body).toHaveLength(1)
  })
})
