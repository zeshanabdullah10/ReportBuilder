import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_THEME, newDocument } from './defaults'
import { flatIds } from './doc-ops'
import { applyBrandKit, asStarter, deleteMyTemplate, deleteSavedBlock, instantiate, saveBlockToLibrary, saveDefaultBrandKit, saveMyTemplate, toMyTemplate } from './library'
import { getPref, MY_TEMPLATES, resetPrefsCache } from './prefs'
import { useStore } from './store'
import type { Block, Theme } from './types'

const kit: Theme = { ...DEFAULT_THEME, company: 'Contoso Test', logo: 'data:image/png;base64,AAA', font: 'serif', fontSize: 11, accentColor: '#ff0000' }

const starter = JSON.stringify({
  meta: { name: 'Starter' },
  theme: { ...DEFAULT_THEME, company: 'Acme Instruments', logo: 'acme.png', accentColor: '#123456' },
  body: [{ type: 'heading', text: '{{ theme.company }}' }],
})

describe('library', () => {
  beforeEach(() => {
    localStorage.clear()
    resetPrefsCache()
  })

  it('applies a brand kit over the starter brand', () => {
    const d = applyBrandKit(newDocument(), kit)
    expect(d.theme).toMatchObject({ company: 'Contoso Test', font: 'serif', fontSize: 11, accentColor: '#ff0000', logo: kit.logo })
    const noLogo = applyBrandKit({ ...newDocument(), theme: { ...DEFAULT_THEME, logo: 'acme.png' } }, { ...kit, logo: undefined })
    expect(noLogo.theme.logo).toBeUndefined()
    const same = newDocument()
    expect(applyBrandKit(same, null)).toBe(same)
  })

  it('new documents from starters and data wear the default brand kit', () => {
    useStore.getState().newFromStarter(starter, '{}')
    expect(useStore.getState().doc.theme.company).toBe('Acme Instruments')

    saveDefaultBrandKit(kit)
    useStore.getState().newFromStarter(starter, '{}')
    expect(useStore.getState().doc.theme).toMatchObject({ company: 'Contoso Test', logo: kit.logo, accentColor: '#ff0000', font: 'serif' })

    useStore.getState().newFromData(newDocument(), { a: 1 }, 'x')
    expect(useStore.getState().doc.theme.company).toBe('Contoso Test')

    // The user's own templates keep their brand.
    useStore.getState().newFromStarter(starter, '{}', { brand: false })
    expect(useStore.getState().doc.theme.company).toBe('Acme Instruments')
  })

  it('stores my templates with their data, newest first, replacing same names', () => {
    const d = { ...newDocument(), sampleData: { big: true } }
    const t = toMyTemplate(d, { serial: 'A1' }, 'Line 3 final test')
    expect(t.category).toBe(MY_TEMPLATES)
    expect(JSON.parse(t.template).sampleData).toBeUndefined()
    expect(JSON.parse(t.template).meta.name).toBe('Line 3 final test')
    expect(JSON.parse(t.data)).toEqual({ serial: 'A1' })
    expect(asStarter(t)).toMatchObject({ id: t.id, name: t.name, category: MY_TEMPLATES })

    saveMyTemplate(d, {}, 'A')
    saveMyTemplate(d, {}, 'B')
    saveMyTemplate(d, { v: 2 }, 'A')
    const list = getPref('templates')
    expect(list.map((x) => x.name)).toEqual(['A', 'B'])
    expect(JSON.parse(list[0].data)).toEqual({ v: 2 })
    deleteMyTemplate(list[1].id)
    expect(getPref('templates').map((x) => x.name)).toEqual(['A'])
  })

  it('saved blocks come back with fresh ids', () => {
    const section: Block = {
      id: 'hdr', type: 'section', title: 'Header', as: 'item', keepTogether: false, pageBreakBefore: false, boxed: false,
      blocks: [{ id: 'inner', type: 'text', text: 'Hi', style: {} }],
    }
    saveBlockToLibrary(section, 'Standard header')
    const [saved] = getPref('blocks')
    expect(saved.name).toBe('Standard header')
    const a = instantiate(saved)
    const b = instantiate(saved)
    const d = { ...newDocument(), body: [a, b] }
    const ids = flatIds(d)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).not.toContain('hdr')
    expect(ids).not.toContain('inner')
    deleteSavedBlock(saved.id)
    expect(getPref('blocks')).toEqual([])
  })
})
