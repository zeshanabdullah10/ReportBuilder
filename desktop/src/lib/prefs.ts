// App preferences kept in localStorage: the default brand kit, recent files, the user's own
// templates and saved blocks. Every storage access is guarded: private windows, blocked site
// data or a full quota must never break the editor, they only lose the preference.

import { useSyncExternalStore } from 'react'
import type { Block, Theme } from './types'

export interface RecentFile {
  path: string
  name: string
  /** ms since epoch */
  at: number
}

export const MY_TEMPLATES = 'My templates'

export interface MyTemplate {
  id: string
  name: string
  description: string
  category: typeof MY_TEMPLATES
  /** The template as JSON (without its sample data). */
  template: string
  /** The sample data that was active when it was saved, as JSON. */
  data: string
  savedAt: number
}

export interface SavedBlock {
  id: string
  name: string
  block: Block
  savedAt: number
}

export interface Prefs {
  brandKit: Theme | null
  recent: RecentFile[]
  templates: MyTemplate[]
  blocks: SavedBlock[]
}

const DEFAULTS: Prefs = { brandKit: null, recent: [], templates: [], blocks: [] }
const PREFIX = 'reportbuilder.prefs.v1.'
export const RECENT_LIMIT = 10

const listeners = new Set<() => void>()
/** Parsed values, so hooks get a stable reference between writes. */
const cache = new Map<keyof Prefs, unknown>()

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export function getPref<K extends keyof Prefs>(key: K): Prefs[K] {
  if (cache.has(key)) return cache.get(key) as Prefs[K]
  let value: Prefs[K] = DEFAULTS[key]
  try {
    const raw = storage()?.getItem(PREFIX + key)
    if (raw != null) {
      const parsed = JSON.parse(raw) as Prefs[K]
      // Guard against a hand-edited or older value of the wrong shape.
      if (Array.isArray(DEFAULTS[key]) === Array.isArray(parsed)) value = parsed
    }
  } catch {
    /* unreadable: use the default */
  }
  cache.set(key, value)
  return value
}

/** Store a preference. Returns false when it could not be persisted (e.g. the quota is full). */
export function setPref<K extends keyof Prefs>(key: K, value: Prefs[K]): boolean {
  let ok = true
  try {
    const s = storage()
    if (!s) ok = false
    else if (value === null || value === undefined) s.removeItem(PREFIX + key)
    else s.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    ok = false
  }
  if (ok) {
    cache.set(key, value)
    listeners.forEach((l) => l())
  }
  return ok
}

export function updatePref<K extends keyof Prefs>(key: K, fn: (v: Prefs[K]) => Prefs[K]): boolean {
  return setPref(key, fn(getPref(key)))
}

export function subscribePrefs(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Forget cached values (tests, or after storage changed in another window). */
export function resetPrefsCache() {
  cache.clear()
  listeners.forEach((l) => l())
}

if (typeof window !== 'undefined') {
  try {
    window.addEventListener('storage', (e) => {
      if (!e.key || e.key.startsWith(PREFIX)) resetPrefsCache()
    })
  } catch {
    /* no window events */
  }
}

/** React: read a preference and re-render when it changes. */
export function usePref<K extends keyof Prefs>(key: K): Prefs[K] {
  return useSyncExternalStore(subscribePrefs, () => getPref(key), () => DEFAULTS[key])
}

// --- pure list helpers -------------------------------------------------------------------------

export function basename(p: string): string {
  return p.split(/[\\/]/).pop() ?? p
}

/** Put a path at the top of the recent list (deduplicated, capped). */
export function withRecent(list: RecentFile[], path: string, at = Date.now(), limit = RECENT_LIMIT): RecentFile[] {
  return [{ path, name: basename(path), at }, ...list.filter((r) => r.path !== path)].slice(0, limit)
}

export function withoutRecent(list: RecentFile[], path: string): RecentFile[] {
  return list.filter((r) => r.path !== path)
}

export function addRecent(path: string): boolean {
  return updatePref('recent', (l) => withRecent(l, path))
}

export function removeRecent(path: string): boolean {
  return updatePref('recent', (l) => withoutRecent(l, path))
}

export function prefId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
