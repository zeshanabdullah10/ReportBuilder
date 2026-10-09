import { describe, expect, it } from 'vitest'
import { buildFieldTree } from './data-model'
import { newDocument } from './defaults'
import { applyMapping, groupChanges, missingPaths, pathSimilarity, remapItemFields, suggestMapping } from './mapping'
import type { Block } from './types'

const data = {
  unit: { SN: 'A1', product: 'PSU' },
  operator: 'J',
  results: [{ test: 'V', reading: 5, lsl: 4, usl: 6, verdict: 'PASS' }],
}

describe('mapping', () => {
  it('finds what the data lacks', () => {
    expect(missingPaths(['dut.serial', 'measurements', 'operator', 'page'], data)).toEqual(['dut.serial', 'measurements'])
  })

  it('suggests similar fields', () => {
    const rows = suggestMapping(['dut.serial', 'measurements', 'station.operator', 'zzz'], buildFieldTree(data))
    expect(rows.map((r) => r.suggestion)).toEqual(['unit.SN', 'results', 'operator', null])
    expect(pathSimilarity('dut.serial', 'unit.SN')).toBeGreaterThan(0.5)
  })

  it('does not offer lookalike names or whole lists for a single value', () => {
    const rows = suggestMapping(['dut.lot', 'ripple.samples'], buildFieldTree({ log: [{ a: 1 }], results: [1, 2] }))
    expect(rows.map((r) => r.suggestion)).toEqual([null, null])
  })

  it('rewrites paths without touching lookalikes', () => {
    const d = newDocument()
    d.body = [
      { id: 'a', type: 'text', text: '{{ dut.serial }} / {{ dut.serialX }} / {{ mydut.serial }}', style: {} },
      { id: 'b', type: 'table', source: 'measurements', columns: [], zebra: true, repeatHeader: true, emptyText: '' },
    ] as Block[]
    const out = applyMapping(d, { 'dut.serial': 'unit.SN', measurements: 'results' })
    expect(out.body[0]).toMatchObject({ id: 'a', text: '{{ unit.SN }} / {{ dut.serialX }} / {{ mydut.serial }}' })
    expect(out.body[1]).toMatchObject({ id: 'b', type: 'table', source: 'results' })
  })

  it('brings item fields along', () => {
    const d = newDocument()
    d.body = [
      { id: 'm', type: 'measurementTable', source: 'results', fields: { name: 'name', value: 'value', low: 'low', high: 'high', nominal: 'nominal', unit: 'unit', status: 'status' }, decimals: 3, showIndex: true, showNominal: false, showLimits: true, showUnit: true, showStatus: true, highlightFailures: true, failuresOnly: false, repeatHeader: true, emptyText: '' },
      { id: 's', type: 'summary', title: '', source: 'results', statusField: 'status', showCounts: true, showRate: true },
    ] as Block[]
    const out = remapItemFields(d, buildFieldTree(data)).doc
    expect(out.body[0]).toMatchObject({ fields: { name: 'test', value: 'reading', low: 'lsl', high: 'usl', status: 'verdict' } })
    expect(out.body[1]).toMatchObject({ statusField: 'verdict' })
  })

  it('reports what it rematched and what it could not', () => {
    const d = newDocument()
    d.body = [
      { id: 'm', type: 'measurementTable', source: 'results', fields: { name: 'name', value: 'value', low: 'low', high: 'high', nominal: 'nominal', unit: 'unit', status: 'status' }, decimals: 3, showIndex: true, showNominal: false, showLimits: true, showUnit: true, showStatus: true, highlightFailures: true, failuresOnly: false, repeatHeader: true, emptyText: '' },
      { id: 't', type: 'table', source: 'results', columns: [
        { header: 'Test', value: 'row.test', width: 'auto', align: 'left' },
        { header: 'Low', value: 'row.lowlimit', width: 'auto', align: 'right' },
        { header: 'Odd', value: 'row.zzz', width: 'auto', align: 'right' },
      ], zebra: true, repeatHeader: true, emptyText: '' },
    ] as Block[]
    const { changes } = remapItemFields(d, buildFieldTree(data))
    const m = changes.filter((c) => c.blockId === 'm')
    expect(m.find((c) => c.need === 'low')).toMatchObject({ list: 'results', chosen: 'lsl', key: 'm:fields.low' })
    // `nominal` has no counterpart in the data: reported, left empty.
    expect(m.find((c) => c.need === 'nominal')).toMatchObject({ chosen: null })
    expect(m.find((c) => c.need === 'low')!.options).toEqual(['test', 'reading', 'lsl', 'usl', 'verdict'])
    const t = changes.filter((c) => c.blockId === 't')
    // Present columns aren't reported.
    expect(t.map((c) => c.need)).toEqual(['lowlimit', 'zzz'])
    expect(t[0]).toMatchObject({ chosen: 'lsl', key: 't:columns.1' })
    expect(t[1]).toMatchObject({ chosen: null })
    expect(groupChanges(changes).map((g) => [g.list, g.changes.length])).toEqual([['results', changes.length]])
  })

  it('applies item overrides from the dialog', () => {
    const d = newDocument()
    d.body = [
      { id: 'm', type: 'measurementTable', source: 'results', fields: { name: 'name', value: 'value', low: 'low', high: 'high', nominal: '', unit: 'unit', status: 'status' }, decimals: 3, showIndex: true, showNominal: false, showLimits: true, showUnit: true, showStatus: true, highlightFailures: true, failuresOnly: false, repeatHeader: true, emptyText: '' },
      { id: 's', type: 'section', title: '', as: 'item', keepTogether: false, pageBreakBefore: false, boxed: false, blocks: [
        { id: 't', type: 'table', source: 'results', columns: [{ header: 'X', value: 'row.zzz', width: 'auto', align: 'left' }], zebra: true, repeatHeader: true, emptyText: '' },
        { id: 'v', type: 'summary', title: '', source: 'results', statusField: 'status', showCounts: true, showRate: true },
      ] },
    ] as Block[]
    const tree = buildFieldTree(data)
    const out = remapItemFields(d, tree, { 'm:fields.low': 'usl', 'm:fields.high': '', 't:columns.0': 'reading', 'v:statusField': 'bogus' })
    expect(out.doc.body[0]).toMatchObject({ fields: { low: 'usl', high: '', value: 'reading', unit: '' } })
    const inner = (out.doc.body[1] as Extract<Block, { type: 'section' }>).blocks
    expect(inner[0]).toMatchObject({ columns: [{ value: 'row.reading' }] })
    // An override that isn't an item field leaves it unmatched (original kept).
    expect(inner[1]).toMatchObject({ statusField: 'status' })
    expect(out.changes.find((c) => c.key === 'm:fields.low')).toMatchObject({ chosen: 'usl' })
  })

  it('reports nothing when the items already have every field', () => {
    const d = newDocument()
    d.body = [{ id: 't', type: 'table', source: 'results', columns: [{ header: 'T', value: 'row.test', width: 'auto', align: 'left' }], zebra: true, repeatHeader: true, emptyText: '' }] as Block[]
    const r = remapItemFields(d, buildFieldTree(data))
    expect(r.changes).toEqual([])
    expect(r.doc.body[0]).toEqual(d.body[0])
  })
})
