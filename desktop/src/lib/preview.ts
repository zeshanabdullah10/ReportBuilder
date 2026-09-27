import { useEffect, useMemo } from 'react'
import { create } from 'zustand'
import * as engine from './engine'
import { activeData, useStore } from './store'
import type { DataPath, Issue, PreviewResult } from './types'

interface PreviewState {
  result: PreviewResult | null
  error: string | null
  pending: boolean
  paths: DataPath[]
  issuesByBlock: Map<string, Issue[]>
}

export const usePreview = create<PreviewState>(() => ({
  result: null,
  error: null,
  pending: false,
  paths: [],
  issuesByBlock: new Map(),
}))

const DEBOUNCE_MS = 120
let seq = 0

function dirname(p: string | null): string | null {
  if (!p) return null
  const i = Math.max(p.lastIndexOf('/'), p.lastIndexOf('\\'))
  return i >= 0 ? p.slice(0, i) : null
}

/** Keeps the preview in sync with the document and active data set. */
export function usePreviewSync() {
  const doc = useStore((s) => s.doc)
  const dataSetId = useStore((s) => s.activeDataSet)
  const filePath = useStore((s) => s.filePath)
  const welcome = useStore((s) => s.welcome)

  useEffect(() => {
    if (welcome) return
    const mine = ++seq
    usePreview.setState({ pending: true })
    const t = setTimeout(async () => {
      try {
        const result = await engine.preview({
          template: doc,
          data: activeData(doc, dataSetId),
          baseDir: engine.isTauri ? dirname(filePath) : null,
        })
        if (mine !== seq) return // a newer render superseded this one
        const byBlock = new Map<string, Issue[]>()
        for (const i of result.issues) {
          if (!i.blockId) continue
          byBlock.set(i.blockId, [...(byBlock.get(i.blockId) ?? []), i])
        }
        usePreview.setState({ result, error: null, pending: false, issuesByBlock: byBlock })
      } catch (e) {
        if (mine !== seq) return
        usePreview.setState({ error: String(e instanceof Error ? e.message : e), pending: false })
      }
    }, DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [doc, dataSetId, filePath, welcome])

  // Data paths for autocomplete follow the active data only.
  const sampleData = doc.sampleData
  const userSets = doc.editor?.dataSets
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const data = useMemo(() => activeData(doc, dataSetId), [sampleData, userSets, dataSetId])
  useEffect(() => {
    if (welcome) return
    let alive = true
    engine
      .dataPaths(data)
      .then((paths) => alive && usePreview.setState({ paths }))
      .catch(() => alive && usePreview.setState({ paths: [] }))
    return () => {
      alive = false
    }
  }, [data, welcome])
}
