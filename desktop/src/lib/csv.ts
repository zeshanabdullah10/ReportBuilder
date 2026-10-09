// Data files: JSON as-is, CSV through the engine's importer (`engine.importCsv`).

import * as engine from './engine'

export function isCsvName(name: string): boolean {
  return /\.csv$/i.test(name)
}

/** A data file's name without its extension, for the data set label. */
export function dataSetName(name: string): string {
  return name.replace(/\.(json|csv)$/i, '')
}

/** Turn CSV text into the JSON data object the engine builds from it. */
export async function importCsvText(text: string, name: string): Promise<unknown> {
  return engine.importCsv(text.replace(/^﻿/, ''), name)
}

/** Parse a data file by its name: CSV via the engine, anything else as JSON (BOM tolerated). */
export async function parseDataFile(name: string, text: string): Promise<unknown> {
  if (isCsvName(name)) return importCsvText(text, name)
  return JSON.parse(text.replace(/^﻿/, ''))
}
