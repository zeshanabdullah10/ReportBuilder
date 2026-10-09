// Transport to the Rust engine: Tauri commands in the desktop app, or the
// local HTTP API (`report-cli serve`) when running in a browser.

import type { ContractResult, DataPath, PreviewResult, ReportDocument, Starter, ValidateResult } from './types'

export const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

async function invoke<T>(cmd: string, args: Record<string, unknown>): Promise<T> {
  const { invoke } = await import('@tauri-apps/api/core')
  return invoke<T>(cmd, args)
}

async function http<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`
    try {
      msg = (await res.json()).error ?? msg
    } catch {
      /* not JSON */
    }
    throw new Error(msg)
  }
  return res.json() as Promise<T>
}

export interface RenderRequest {
  template: ReportDocument
  data: unknown
  baseDir?: string | null
  pdfStandard?: 'none' | 'a2b' | 'a3b'
}

export function preview(req: RenderRequest): Promise<PreviewResult> {
  return isTauri ? invoke('preview', { req }) : http('preview', req)
}

export async function starters(): Promise<Starter[]> {
  return isTauri ? invoke('starters', {}) : http('starters')
}

export function dataPaths(data: unknown): Promise<DataPath[]> {
  return isTauri ? invoke('data_paths', { data }) : http('data-paths', data ?? {})
}

export function validate(template: ReportDocument, data?: unknown): Promise<ValidateResult> {
  return isTauri ? invoke('validate', { req: { template, data } }) : http('validate', { template, data })
}

/** The template's typed data contract, its JSON Schema, and optionally typed structures (`csharp`, `python`, `typescript`, `labview`). */
export function contract(template: ReportDocument, data?: unknown, format?: string): Promise<ContractResult> {
  const req = { template, data, format }
  return isTauri ? invoke('contract', { req }) : http('contract', req)
}

export function migrate(legacy: unknown): Promise<{ document: ReportDocument; notes: string[] }> {
  return isTauri ? invoke('migrate', { legacy }) : http('migrate', legacy)
}

/**
 * Convert CSV text into report data: key/value preamble rows become top-level
 * fields, the table goes under `measurements` (when it has value + limit
 * columns) or `rows`. `name` is the file name (a `.tsv` name prefers tabs).
 */
export function importCsv(text: string, name: string): Promise<Record<string, unknown>> {
  return isTauri ? invoke('import_csv', { text, name }) : http('import-csv', { text, name })
}

/** Render a PDF. Desktop: writes to `path`. Browser: returns the bytes for download. */
export async function exportPdf(req: RenderRequest, path?: string): Promise<{ pages?: number; blob?: Blob }> {
  if (isTauri) {
    const r = await invoke<{ pages: number }>('export_pdf', { req, path })
    return { pages: r.pages }
  }
  const res = await fetch('/api/pdf', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(req) })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.statusText)
  return { blob: await res.blob() }
}

export function readTextFile(path: string): Promise<string> {
  return invoke('read_text_file', { path })
}

export function writeTextFile(path: string, contents: string): Promise<void> {
  return invoke('write_text_file', { path, contents })
}

export async function openDialog(filters: { name: string; extensions: string[] }[]): Promise<string | null> {
  const { open } = await import('@tauri-apps/plugin-dialog')
  const r = await open({ multiple: false, directory: false, filters })
  return typeof r === 'string' ? r : null
}

export async function saveDialog(defaultPath: string, filters: { name: string; extensions: string[] }[]): Promise<string | null> {
  const { save } = await import('@tauri-apps/plugin-dialog')
  return (await save({ defaultPath, filters })) ?? null
}

/** Browser fallback for opening a file. */
export function pickFileInBrowser(accept: string): Promise<{ name: string; text: string } | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.onchange = async () => {
      const f = input.files?.[0]
      resolve(f ? { name: f.name, text: await f.text() } : null)
    }
    input.oncancel = () => resolve(null)
    input.click()
  })
}

export function downloadInBrowser(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

/** Ask the user to confirm. Native dialog on desktop, window.confirm in a browser. */
export async function confirmAsync(message: string, okLabel = 'Discard'): Promise<boolean> {
  if (isTauri) {
    const { ask } = await import('@tauri-apps/plugin-dialog')
    return ask(message, { title: 'Report Builder', kind: 'warning', okLabel, cancelLabel: 'Cancel' })
  }
  return window.confirm(message)
}

/** A template path passed on the command line (desktop only). */
export async function initialFile(): Promise<string | null> {
  return isTauri ? invoke<string | null>('initial_file', {}) : null
}
