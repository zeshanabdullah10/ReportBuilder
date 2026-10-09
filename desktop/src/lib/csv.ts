// Data files: JSON as-is, CSV through the engine's importer (`engine.importCsv`).

import * as engine from './engine'

type ImportCsv = (text: string, name: string) => Promise<unknown>

export function isCsvName(name: string): boolean {
  return /\.csv$/i.test(name)
}

/** A data file's name without its extension, for the data set label. */
export function dataSetName(name: string): string {
  return name.replace(/\.(json|csv)$/i, '')
}

/** Turn CSV text into the JSON data object the engine builds from it. */
export async function importCsvText(text: string, name: string): Promise<unknown> {
  // Looked up at call time: the engine transport gains `importCsv` separately.
  const fn = (engine as unknown as { importCsv?: ImportCsv }).importCsv
  if (typeof fn !== 'function') throw new Error('CSV import is not available in this version of the engine')
  return fn(text.replace(/^﻿/, ''), name)
}

/** Parse a data file by its name: CSV via the engine, anything else as JSON (BOM tolerated). */
export async function parseDataFile(name: string, text: string): Promise<unknown> {
  if (isCsvName(name)) return importCsvText(text, name)
  return JSON.parse(text.replace(/^﻿/, ''))
}
