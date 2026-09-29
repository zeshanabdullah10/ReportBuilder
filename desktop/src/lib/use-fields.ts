import { useMemo } from 'react'
import { buildFieldTree, type FieldNode } from './data-model'
import { activeData, useStore } from './store'

/** The typed field tree of the data currently driving the preview. */
export function useFieldTree(): FieldNode[] {
  const sampleData = useStore((s) => s.doc.sampleData)
  const userSets = useStore((s) => s.doc.editor?.dataSets)
  const id = useStore((s) => s.activeDataSet)
  return useMemo(() => buildFieldTree(activeData(useStore.getState().doc, id)), [sampleData, userSets, id])
}
