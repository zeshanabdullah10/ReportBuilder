import { describe, expect, it } from 'vitest'
import { buildFieldTree, filterFields, findField, humanize, scalarKind } from './data-model'

const data = {
  dut: { serial: 'PSU-1', partNumber: '900-01' },
  test: { start: '2026-03-01T09:14:05+01:00', durationSeconds: 184.6 },
  measurements: [
    { name: 'VBUS', value: 4.99, low: 4.75, high: 5.25, unit: 'V', status: 'PASS' },
    { name: 'Ripple', value: 31.7, low: null, high: 30, unit: 'mV', status: 'FAIL' },
  ],
  trace: [1, 2, 3],
  channels: [{ name: 'CH1', results: [{ v: 1 }] }],
  ok: true,
}

describe('data model', () => {
  it('humanizes keys', () => {
    expect(humanize('partNumber')).toBe('Part number')
    expect(humanize('dut_serial')).toBe('Dut serial')
    expect(humanize('measurements[]')).toBe('Measurements')
  })

  it('classifies scalars', () => {
    expect(scalarKind('2026-03-01')).toBe('date')
    expect(scalarKind('PASS')).toBe('status')
    expect(scalarKind('hello')).toBe('text')
    expect(scalarKind(3)).toBe('number')
    expect(scalarKind(null)).toBe('empty')
  })

  it('builds a typed tree', () => {
    const tree = buildFieldTree(data)
    expect(findField(tree, 'dut.serial')).toMatchObject({ kind: 'text', sample: 'PSU-1' })
    expect(findField(tree, 'test.start')?.kind).toBe('date')
    const m = findField(tree, 'measurements')!
    expect(m).toMatchObject({ kind: 'list', count: 2, sample: '2 items' })
    expect(m.children.map((c) => c.key)).toEqual(['name', 'value', 'low', 'high', 'unit', 'status'])
    expect(findField(tree, 'measurements[].value')).toMatchObject({ kind: 'number', listPath: 'measurements' })
    // low is null in one item, a number in the other.
    expect(findField(tree, 'measurements[].low')?.kind).toBe('number')
    expect(findField(tree, 'trace')?.kind).toBe('numbers')
    expect(findField(tree, 'channels[].results')).toMatchObject({ kind: 'list', listPath: 'channels' })
  })

  it('filters while keeping parents', () => {
    const tree = buildFieldTree(data)
    const hit = filterFields(tree, 'serial')
    expect(hit.map((n) => n.path)).toEqual(['dut'])
    expect(hit[0].children.map((n) => n.path)).toEqual(['dut.serial'])
  })
})
