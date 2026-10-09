import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { addRecent, getPref, RECENT_LIMIT, removeRecent, resetPrefsCache, setPref, subscribePrefs, updatePref, withRecent, withoutRecent } from './prefs'

describe('prefs', () => {
  beforeEach(() => {
    localStorage.clear()
    resetPrefsCache()
  })
  afterEach(() => vi.restoreAllMocks())

  it('returns defaults when nothing is stored', () => {
    expect(getPref('recent')).toEqual([])
    expect(getPref('brandKit')).toBeNull()
  })

  it('persists values and notifies subscribers', () => {
    const seen = vi.fn()
    const off = subscribePrefs(seen)
    expect(setPref('recent', [{ path: '/a.rbt.json', name: 'a.rbt.json', at: 1 }])).toBe(true)
    off()
    expect(seen).toHaveBeenCalledTimes(1)
    resetPrefsCache()
    expect(getPref('recent')).toEqual([{ path: '/a.rbt.json', name: 'a.rbt.json', at: 1 }])
  })

  it('ignores corrupt or wrongly shaped values', () => {
    localStorage.setItem('reportbuilder.prefs.v1.recent', '{not json')
    localStorage.setItem('reportbuilder.prefs.v1.templates', '{"a":1}')
    expect(getPref('recent')).toEqual([])
    expect(getPref('templates')).toEqual([])
  })

  it('survives storage that throws (quota, blocked site data)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    expect(setPref('blocks', [])).toBe(false)
    expect(updatePref('recent', (l) => l)).toBe(false)
    expect(getPref('blocks')).toEqual([])
  })

  it('keeps recent files deduplicated, newest first and capped', () => {
    let l = withRecent([], '/x/a.json', 1)
    l = withRecent(l, 'C:\\y\\b.json', 2)
    l = withRecent(l, '/x/a.json', 3)
    expect(l.map((r) => r.name)).toEqual(['a.json', 'b.json'])
    expect(l[0].at).toBe(3)
    expect(withoutRecent(l, '/x/a.json').map((r) => r.path)).toEqual(['C:\\y\\b.json'])
    for (let i = 0; i < 20; i++) l = withRecent(l, `/f${i}.json`, i)
    expect(l).toHaveLength(RECENT_LIMIT)
  })

  it('addRecent / removeRecent update the stored list', () => {
    addRecent('/a.json')
    addRecent('/b.json')
    expect(getPref('recent').map((r) => r.path)).toEqual(['/b.json', '/a.json'])
    removeRecent('/b.json')
    expect(getPref('recent').map((r) => r.path)).toEqual(['/a.json'])
  })
})
