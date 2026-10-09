import { describe, expect, it } from 'vitest'
import { dataSetName, isCsvName, parseDataFile } from './csv'

describe('data files', () => {
  it('recognises CSV by extension and strips extensions for names', () => {
    expect(isCsvName('run.CSV')).toBe(true)
    expect(isCsvName('run.json')).toBe(false)
    expect(dataSetName('run.csv')).toBe('run')
    expect(dataSetName('run.json')).toBe('run')
    expect(dataSetName('run.txt')).toBe('run.txt')
  })

  it('parses JSON with a BOM', async () => {
    expect(await parseDataFile('a.json', '﻿{"a":1}')).toEqual({ a: 1 })
  })
})
