// Ask the user for a short piece of text (a name). Rendered by components/PromptDialog.tsx;
// works in the desktop webview, where window.prompt does not.

import { create } from 'zustand'

export interface PromptOptions {
  title: string
  label: string
  initial?: string
  hint?: string
  confirm?: string
}

interface PromptState {
  open: (PromptOptions & { resolve: (v: string | null) => void }) | null
}

export const usePrompt = create<PromptState>(() => ({ open: null }))

/** Resolves to the trimmed text, or null when cancelled. */
export function askText(opts: PromptOptions): Promise<string | null> {
  return new Promise((resolve) => {
    usePrompt.getState().open?.resolve(null)
    usePrompt.setState({ open: { ...opts, resolve } })
  })
}
