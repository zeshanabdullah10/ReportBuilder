import { describe, expect, it } from 'vitest'
import { buildFieldTree } from './data-model'
import { newDocument } from './defaults'
import { applyMapping, missingPaths, pathSimilarity, remapItemFields, suggestMapping } from './mapping'
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
    const out = remapItemFields(d, buildFieldTree(data))
    expect(out.body[0]).toMatchObject({ fields: { name: 'test', value: 'reading', low: 'lsl', high: 'usl', status: 'verdict' } })
    expect(out.body[1]).toMatchObject({ statusField: 'verdict' })
  })
})
