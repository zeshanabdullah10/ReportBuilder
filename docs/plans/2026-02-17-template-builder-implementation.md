# Template Builder Phase 3 - Implementation Plan

**Created:** 2026-02-17
**Status:** Ready for Execution
**Based on:** `docs/plans/2026-02-17-template-builder-design.md`

---

## Phase 0: Documentation Discovery (Consolidated)

### Allowed APIs & Sources

#### Craft.js (@craftjs/core)
| API | Import | Purpose | Source |
|-----|--------|---------|--------|
| `Editor` | `@craftjs/core` | Provider wrapper | craft.js.org/docs |
| `Frame` | `@craftjs/core` | Canvas container | craft.js.org/docs |
| `Element` | `@craftjs/core` | Node definition | craft.js.org/docs |
| `useNode` | `@craftjs/core` | Component-level hook | craft.js.org/docs/api/useNode |
| `useEditor` | `@craftjs/core` | Editor-level hook | craft.js.org/docs/api/useEditor |

**Key Patterns:**
- User components MUST use `ref={(ref) => connect(drag(ref))}` for drag/drop
- Canvas nodes use `<Element is={Component} canvas>` for droppable regions
- Settings panels use `Component.craft.related.settings` pattern
- Serialize: `query.serialize()` | Deserialize: `actions.deserialize(data)`

**Anti-Patterns to Avoid:**
- Missing components in `resolver` prop → deserialization fails
- Forgetting `canvas` prop on containers → not droppable
- Not using collector function in useNode → unnecessary re-renders

#### Zustand (v4.4.7 - Already Installed)
| API | Import | Purpose |
|-----|--------|---------|
| `create` | `zustand` | Store creation |
| `persist` | `zustand/middleware` | LocalStorage persistence |
| `devtools` | `zustand/middleware` | Redux DevTools |

**Pattern:** `create<State>()((set) => ({ ...state, ...actions }))`

#### Supabase (Already Configured)
| Client | File | Usage |
|--------|------|-------|
| Browser | `lib/supabase/client.ts` | Client components |
| Server | `lib/supabase/server.ts` | Server components/actions |

**Templates Table Schema** (`types/database.ts:75-116`):
```typescript
{
  id: string
  user_id: string
  name: string
  description: string | null
  canvas_state: Json      // Craft.js serialized state
  sample_data: Json       // Preview data
  settings: Json          // Page size, margins
  is_public: boolean
  version: number
}
```

**CRUD Pattern:** `.insert({...}).select('id').single()` | `.update({...}).eq('id', id)`

#### Chart.js (v4.4.1 + react-chartjs-2 v5.2.0 - Already Installed)
| Component | Import |
|-----------|--------|
| Line | `react-chartjs-2` |
| Bar | `react-chartjs-2` |
| Pie | `react-chartjs-2` |
| ChartJS | `chart.js` (for registration) |

**Pattern:** Register components with `ChartJS.register(...)` before use

---

## Phase 1: Foundation & Dependencies

### 1.1 Install @craftjs/core

```bash
npm install @craftjs/core
```

### 1.2 Create Zustand Builder Store

**File:** `lib/stores/builder-store.ts`

**Copy from:** Zustand documentation pattern (Phase 0 findings)

```typescript
import { create } from 'zustand'

interface BuilderState {
  templateId: string | null
  templateName: string
  sampleData: Record<string, unknown> | null
  selectedNodeId: string | null
  isPreviewMode: boolean
  hasUnsavedChanges: boolean

  setTemplateId: (id: string) => void
  setTemplateName: (name: string) => void
  setSampleData: (data: Record<string, unknown> | null) => void
  setSelectedNodeId: (id: string | null) => void
  togglePreviewMode: () => void
  setHasUnsavedChanges: (value: boolean) => void
  reset: () => void
}

const initialState = {
  templateId: null,
  templateName: 'Untitled Template',
  sampleData: null,
  selectedNodeId: null,
  isPreviewMode: false,
  hasUnsavedChanges: false,
}

export const useBuilderStore = create<BuilderState>()((set) => ({
  ...initialState,
  setTemplateId: (id) => set({ templateId: id }),
  setTemplateName: (name) => set({ templateName: name }),
  setSampleData: (data) => set({ sampleData: data }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  togglePreviewMode: () => set((state) => ({ isPreviewMode: !state.isPreviewMode })),
  setHasUnsavedChanges: (value) => set({ hasUnsavedChanges: value }),
  reset: () => set(initialState),
}))
```

### 1.3 Create Builder Page Route

**File:** `app/(app)/builder/[id]/page.tsx`

**Copy pattern from:** Existing `app/(app)/dashboard/page.tsx` for Supabase client usage

```typescript
import { createClient } from '@/lib/supabase/server'
import { BuilderCanvas } from '@/components/builder/canvas/BuilderCanvas'
import { notFound } from 'next/navigation'

export default async function BuilderPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: template } = await supabase
    .from('templates')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!template) {
    notFound()
  }

  return <BuilderCanvas template={template} />
}
```

### Verification
- [ ] `npm ls @craftjs/core` shows installed
- [ ] `lib/stores/builder-store.ts` exists and exports `useBuilderStore`
- [ ] `/builder/test-id` route loads without error (will 404 on template fetch, that's OK)

---

## Phase 2: Canvas Setup

### 2.1 Create Page Component (Root Canvas)

**File:** `components/builder/canvas/Page.tsx`

**Copy from:** Craft.js Container pattern (Phase 0 findings - Section 2)

```typescript
'use client'

import { useNode } from '@craftjs/core'

interface PageProps {
  background?: string
  padding?: number
  children?: React.ReactNode
}

export const Page = ({ background = '#ffffff', padding = 20, children }: PageProps) => {
  const {
    connectors: { connect, drag },
  } = useNode()

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref))
      }}
      style={{
        background,
        padding: `${padding}px`,
        minHeight: '800px',
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
      }}
      className="shadow-lg"
    >
      {children}
    </div>
  )
}

Page.craft = {
  displayName: 'Page',
  props: {
    background: '#ffffff',
    padding: 20,
  },
  rules: {
    canMoveIn: () => true,
  },
}
```

### 2.2 Create RenderNode (Selection Indicator)

**File:** `components/builder/canvas/RenderNode.tsx`

**Copy from:** Craft.js selection pattern (Phase 0 findings - Section 6)

```typescript
'use client'

import { useNode, useEditor } from '@craftjs/core'
import { useEffect, useRef } from 'react'

export const RenderNode = ({ render }: { render: React.ReactNode }) => {
  const { id } = useNode()
  const { isActive, isHover, dom, name, moveable, deletable, connectors, parent } = useNode(
    (node) => ({
      isActive: node.events.selected,
      isHover: node.events.hovered,
      dom: node.dom,
      name: node.data.custom.displayName || node.data.displayName,
      moveable: !node.data.props.locked,
      deletable: node.id !== 'ROOT',
      parent: node.data.parent,
      props: node.data.props,
    })
  )

  const {
    actions: { selectNode },
  } = useEditor()

  const currentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (dom) {
      if (isActive || isHover) {
        dom.style.outline = isActive ? '2px solid #00ffc8' : '1px dashed rgba(0,255,200,0.5)'
      } else {
        dom.style.outline = 'none'
      }
    }
  }, [isActive, isHover, dom])

  return <>{render}</>
}
```

### 2.3 Create BuilderCanvas (Main Editor Wrapper)

**File:** `components/builder/canvas/BuilderCanvas.tsx`

**Copy from:** Craft.js Editor pattern (Phase 0 findings - Section 1)

```typescript
'use client'

import { Editor, Frame, Element } from '@craftjs/core'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { Page } from './Page'
import { Text } from '../components/Text'
import { Container } from '../components/Container'
import { Toolbox } from '../toolbox/Toolbox'
import { SettingsPanel } from '../settings/SettingsPanel'
import { BuilderTopbar } from '../topbar/BuilderTopbar'

interface BuilderCanvasProps {
  template: {
    id: string
    name: string
    canvas_state: any
    sample_data: any
  }
}

export function BuilderCanvas({ template }: BuilderCanvasProps) {
  const { setTemplateId, setTemplateName, setSampleData } = useBuilderStore()

  // Initialize store with template data
  useBuilderStore.setState({
    templateId: template.id,
    templateName: template.name,
    sampleData: template.sample_data,
  })

  return (
    <div className="flex flex-col h-screen bg-[#0a0f14]">
      <BuilderTopbar />

      <div className="flex flex-1 overflow-hidden">
        <Editor
          resolver={{ Page, Text, Container }}
          enabled={true}
          indicator={{
            success: '#00ffc8',
            error: '#e34850',
            transition: 'all 0.2s ease',
          }}
        >
          {/* Left Sidebar - Toolbox */}
          <aside className="w-64 border-r border-[rgba(0,255,200,0.1)] bg-[#050810] overflow-y-auto">
            <Toolbox />
          </aside>

          {/* Center - Canvas */}
          <main className="flex-1 overflow-auto p-8 bg-oscilloscope-grid">
            <div className="flex justify-center">
              <Frame data={template.canvas_state ? JSON.stringify(template.canvas_state) : undefined}>
                <Element is={Page} canvas>
                  <Text text="Start building your template" />
                </Element>
              </Frame>
            </div>
          </main>

          {/* Right Sidebar - Settings */}
          <aside className="w-72 border-l border-[rgba(0,255,200,0.1)] bg-[#050810] overflow-y-auto">
            <SettingsPanel />
          </aside>
        </Editor>
      </div>
    </div>
  )
}
```

### Verification
- [ ] Page component renders with cyan selection outline
- [ ] BuilderCanvas shows 3-panel layout
- [ ] No console errors from Craft.js

---

## Phase 3: Core Components

### 3.1 Create Text Component

**File:** `components/builder/components/Text.tsx`

**Copy from:** Craft.js User Component pattern (Phase 0 findings - Section 2)

```typescript
'use client'

import { useNode } from '@craftjs/core'
import { TextSettings } from '../settings/TextSettings'

interface TextProps {
  text: string
  fontSize?: number
  fontWeight?: string
  color?: string
  textAlign?: 'left' | 'center' | 'right'
}

export const Text = ({
  text = 'Edit this text',
  fontSize = 16,
  fontWeight = 'normal',
  color = '#000000',
  textAlign = 'left',
}: TextProps) => {
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }))

  return (
    <p
      ref={(ref) => {
        if (ref) connect(drag(ref))
      }}
      style={{
        fontSize: `${fontSize}px`,
        fontWeight,
        color,
        textAlign,
        margin: '0 0 8px 0',
        cursor: 'pointer',
      }}
    >
      {text}
    </p>
  )
}

Text.craft = {
  displayName: 'Text',
  props: {
    text: 'Edit this text',
    fontSize: 16,
    fontWeight: 'normal',
    color: '#000000',
    textAlign: 'left',
  },
  related: {
    settings: TextSettings,
  },
}
```

### 3.2 Create Container Component

**File:** `components/builder/components/Container.tsx`

```typescript
'use client'

import { useNode } from '@craftjs/core'
import { ContainerSettings } from '../settings/ContainerSettings'

interface ContainerProps {
  background?: string
  padding?: number
  borderRadius?: number
  borderWidth?: number
  borderColor?: string
  children?: React.ReactNode
}

export const Container = ({
  background = 'transparent',
  padding = 16,
  borderRadius = 0,
  borderWidth = 0,
  borderColor = '#e0e0e0',
  children,
}: ContainerProps) => {
  const {
    connectors: { connect, drag },
  } = useNode()

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref))
      }}
      style={{
        background,
        padding: `${padding}px`,
        borderRadius: `${borderRadius}px`,
        border: borderWidth ? `${borderWidth}px solid ${borderColor}` : 'none',
        minHeight: '50px',
      }}
    >
      {children}
    </div>
  )
}

Container.craft = {
  displayName: 'Container',
  props: {
    background: 'transparent',
    padding: 16,
    borderRadius: 0,
    borderWidth: 0,
    borderColor: '#e0e0e0',
  },
  rules: {
    canMoveIn: () => true,
  },
  related: {
    settings: ContainerSettings,
  },
}
```

### 3.3 Create Image Component

**File:** `components/builder/components/Image.tsx`

```typescript
'use client'

import { useNode } from '@craftjs/core'
import { ImageSettings } from '../settings/ImageSettings'

interface ImageProps {
  src?: string
  alt?: string
  width?: string
  height?: string
  objectFit?: 'cover' | 'contain' | 'fill'
}

export const Image = ({
  src = '/placeholder.png',
  alt = 'Image',
  width = '100%',
  height = 'auto',
  objectFit = 'cover',
}: ImageProps) => {
  const {
    connectors: { connect, drag },
  } = useNode()

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref))
      }}
      style={{ width, height, cursor: 'pointer' }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          width: '100%',
          height: '100%',
          objectFit,
          display: 'block',
        }}
      />
    </div>
  )
}

Image.craft = {
  displayName: 'Image',
  props: {
    src: '/placeholder.png',
    alt: 'Image',
    width: '100%',
    height: 'auto',
    objectFit: 'cover',
  },
  related: {
    settings: ImageSettings,
  },
}
```

### Verification
- [ ] Text component renders and is draggable
- [ ] Container accepts child components
- [ ] All components show in resolver (no console warnings)

---

## Phase 4: Toolbox

### 4.1 Create Toolbox Component

**File:** `components/builder/toolbox/Toolbox.tsx`

**Copy from:** Craft.js Toolbox pattern (Phase 0 findings - Section 4)

```typescript
'use client'

import { useEditor, Element } from '@craftjs/core'
import { Text } from '../components/Text'
import { Container } from '../components/Container'
import { Image } from '../components/Image'
import { Type, Square, Image as ImageIcon, Table, BarChart3, Minus, FileText } from 'lucide-react'

const toolboxItems = [
  {
    name: 'Text',
    icon: Type,
    component: <Text />,
  },
  {
    name: 'Container',
    icon: Square,
    component: <Element is={Container} canvas />,
  },
  {
    name: 'Image',
    icon: ImageIcon,
    component: <Image />,
  },
  // Future components (Phase 6)
  { name: 'Table', icon: Table, component: null, disabled: true },
  { name: 'Chart', icon: BarChart3, component: null, disabled: true },
  { name: 'Spacer', icon: Minus, component: null, disabled: true },
  { name: 'Page Break', icon: FileText, component: null, disabled: true },
]

export function Toolbox() {
  const { connectors } = useEditor()

  return (
    <div className="p-4">
      <h3
        className="text-sm font-semibold text-[#00ffc8] mb-4 uppercase tracking-wider"
        style={{ fontFamily: 'JetBrains Mono, monospace' }}
      >
        Components
      </h3>

      <div className="space-y-2">
        {toolboxItems.map((item) => (
          <div
            key={item.name}
            ref={(ref) => {
              if (ref && item.component && !item.disabled) {
                connectors.create(ref, item.component)
              }
            }}
            className={`
              flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
              ${
                item.disabled
                  ? 'opacity-40 cursor-not-allowed'
                  : 'bg-[rgba(0,255,200,0.05)] border border-[rgba(0,255,200,0.15)] hover:bg-[rgba(0,255,200,0.1)] hover:border-[rgba(0,255,200,0.3)]'
              }
            `}
          >
            <item.icon className="w-5 h-5 text-[#00ffc8]" />
            <span className="text-sm text-gray-300">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Verification
- [ ] Drag Text from toolbox creates new text element
- [ ] Drag Container creates droppable container
- [ ] Disabled items show correct styling

---

## Phase 5: Settings Panel

### 5.1 Create SettingsPanel

**File:** `components/builder/settings/SettingsPanel.tsx`

**Copy from:** Craft.js Settings pattern (Phase 0 findings - Section 6)

```typescript
'use client'

import { useEditor } from '@craftjs/core'
import { TextSettings } from './TextSettings'
import { ContainerSettings } from './ContainerSettings'
import { ImageSettings } from './ImageSettings'

export function SettingsPanel() {
  const { selected } = useEditor((state, query) => {
    const [currentNodeId] = state.events.selected
    let selected = null

    if (currentNodeId) {
      const node = state.nodes[currentNodeId]
      selected = {
        id: currentNodeId,
        name: node.data.custom?.displayName || node.data.displayName,
        settings: node.related?.settings,
        isDeletable: query.node(currentNodeId).isDeletable(),
        props: node.data.props,
      }
    }

    return { selected }
  })

  return (
    <div className="p-4">
      <h3
        className="text-sm font-semibold text-[#00ffc8] mb-4 uppercase tracking-wider"
        style={{ fontFamily: 'JetBrains Mono, monospace' }}
      >
        Properties
      </h3>

      {!selected ? (
        <p className="text-gray-500 text-sm">
          Click on a component to edit its properties
        </p>
      ) : (
        <div className="space-y-4">
          <div className="pb-3 border-b border-[rgba(0,255,200,0.1)]">
            <span className="text-white font-medium">{selected.name}</span>
          </div>

          {selected.settings && (
            <div className="space-y-4">
              {React.createElement(selected.settings)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

### 5.2 Create TextSettings

**File:** `components/builder/settings/TextSettings.tsx`

```typescript
'use client'

import { useNode } from '@craftjs/core'
import { Input } from '@/components/ui/input'

export function TextSettings() {
  const {
    actions: { setProp },
    text,
    fontSize,
    fontWeight,
    color,
  } = useNode((node) => ({
    text: node.data.props.text,
    fontSize: node.data.props.fontSize,
    fontWeight: node.data.props.fontWeight,
    color: node.data.props.color,
  }))

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Text Content</label>
        <textarea
          value={text}
          onChange={(e) => setProp((props: any) => (props.text = e.target.value))}
          className="w-full bg-[#050810] border border-[rgba(0,255,200,0.2)] rounded-lg p-2 text-white text-sm"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Font Size</label>
          <Input
            type="number"
            value={fontSize}
            onChange={(e) => setProp((props: any) => (props.fontSize = parseInt(e.target.value) || 16))}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Color</label>
          <Input
            type="color"
            value={color}
            onChange={(e) => setProp((props: any) => (props.color = e.target.value))}
          />
        </div>
      </div>
    </div>
  )
}
```

### 5.3 Create ContainerSettings

**File:** `components/builder/settings/ContainerSettings.tsx`

```typescript
'use client'

import { useNode } from '@craftjs/core'
import { Input } from '@/components/ui/input'

export function ContainerSettings() {
  const {
    actions: { setProp },
    background,
    padding,
    borderRadius,
    borderWidth,
    borderColor,
  } = useNode((node) => ({
    background: node.data.props.background,
    padding: node.data.props.padding,
    borderRadius: node.data.props.borderRadius,
    borderWidth: node.data.props.borderWidth,
    borderColor: node.data.props.borderColor,
  }))

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Background</label>
        <Input
          type="color"
          value={background === 'transparent' ? '#ffffff' : background}
          onChange={(e) => setProp((props: any) => (props.background = e.target.value))}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Padding</label>
          <Input
            type="number"
            value={padding}
            onChange={(e) => setProp((props: any) => (props.padding = parseInt(e.target.value) || 0))}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Border Radius</label>
          <Input
            type="number"
            value={borderRadius}
            onChange={(e) => setProp((props: any) => (props.borderRadius = parseInt(e.target.value) || 0))}
          />
        </div>
      </div>
    </div>
  )
}
```

### 5.4 Create ImageSettings

**File:** `components/builder/settings/ImageSettings.tsx`

```typescript
'use client'

import { useNode } from '@craftjs/core'
import { Input } from '@/components/ui/input'

export function ImageSettings() {
  const {
    actions: { setProp },
    src,
    alt,
    width,
    height,
  } = useNode((node) => ({
    src: node.data.props.src,
    alt: node.data.props.alt,
    width: node.data.props.width,
    height: node.data.props.height,
  }))

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Image URL</label>
        <Input
          value={src}
          onChange={(e) => setProp((props: any) => (props.src = e.target.value))}
          placeholder="https://..."
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Alt Text</label>
        <Input
          value={alt}
          onChange={(e) => setProp((props: any) => (props.alt = e.target.value))}
        />
      </div>
    </div>
  )
}
```

### Verification
- [ ] Clicking component shows its settings panel
- [ ] Changing text updates component in real-time
- [ ] Color picker works for text color

---

## Phase 6: Topbar & Save/Load

### 6.1 Create BuilderTopbar

**File:** `components/builder/topbar/BuilderTopbar.tsx`

```typescript
'use client'

import { useEditor } from '@craftjs/core'
import { useBuilderStore } from '@/lib/stores/builder-store'
import { Button } from '@/components/ui/button'
import { Save, Eye, Download, Undo, Redo } from 'lucide-react'
import { useState } from 'react'

export function BuilderTopbar() {
  const { query, actions } = useEditor()
  const { templateId, templateName, hasUnsavedChanges, togglePreviewMode, setHasUnsavedChanges } = useBuilderStore()
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    const serializedState = query.serialize()

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canvas_state: JSON.parse(serializedState) }),
      })

      if (response.ok) {
        setHasUnsavedChanges(false)
      }
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <header className="h-14 border-b border-[rgba(0,255,200,0.1)] bg-[#050810] flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <h1
          className="text-lg font-semibold text-white"
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
        >
          {templateName}
        </h1>
        {hasUnsavedChanges && (
          <span className="text-xs text-[#ffb000]">Unsaved changes</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => actions.history.undo()} title="Undo">
          <Undo className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => actions.history.redo()} title="Redo">
          <Redo className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-[rgba(0,255,200,0.2)] mx-2" />

        <Button variant="outline" onClick={togglePreviewMode}>
          <Eye className="w-4 h-4 mr-2" />
          Preview
        </Button>

        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </header>
  )
}
```

### 6.2 Create Template Update API

**File:** `app/api/templates/[id]/route.ts`

**Copy pattern from:** `app/api/auth/callback/route.ts` for API structure

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { canvas_state, name, sample_data, settings } = body

  const { error } = await supabase
    .from('templates')
    .update({
      ...(canvas_state && { canvas_state }),
      ...(name && { name }),
      ...(sample_data && { sample_data }),
      ...(settings && { settings }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  return NextResponse.json(data)
}
```

### Verification
- [ ] Save button serializes and saves to Supabase
- [ ] Loading a saved template deserializes correctly
- [ ] Unsaved changes indicator shows when editing

---

## Phase 7: Data Components (Table, Chart, Indicator)

### 7.1 Create Table Component

**File:** `components/builder/components/Table.tsx`

```typescript
'use client'

import { useNode } from '@craftjs/core'
import { TableSettings } from '../settings/TableSettings'

interface TableProps {
  binding?: string
  columns?: string[]
  headerColor?: string
  rowColor?: string
}

export const Table = ({
  binding = '',
  columns = ['Column 1', 'Column 2', 'Column 3'],
  headerColor = '#1a1a2e',
  rowColor = '#ffffff',
}: TableProps) => {
  const {
    connectors: { connect, drag },
  } = useNode()

  // Sample data for preview
  const sampleData = [
    { 'Column 1': 'Data 1', 'Column 2': 'Data 2', 'Column 3': 'Data 3' },
    { 'Column 1': 'Data 4', 'Column 2': 'Data 5', 'Column 3': 'Data 6' },
  ]

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref))
      }}
      className="overflow-x-auto"
    >
      <table className="w-full border-collapse" style={{ fontSize: '14px' }}>
        <thead>
          <tr style={{ background: headerColor }}>
            {columns.map((col, i) => (
              <th key={i} className="border border-gray-300 p-2 text-left text-white">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sampleData.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? rowColor : '#f5f5f5' }}>
              {columns.map((col, j) => (
                <td key={j} className="border border-gray-300 p-2">
                  {row[col as keyof typeof row] || '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

Table.craft = {
  displayName: 'Table',
  props: {
    binding: '',
    columns: ['Column 1', 'Column 2', 'Column 3'],
    headerColor: '#1a1a2e',
    rowColor: '#ffffff',
  },
  related: {
    settings: TableSettings,
  },
}
```

### 7.2 Create Chart Component

**File:** `components/builder/components/Chart.tsx`

**Copy from:** Chart.js pattern (Phase 0 findings)

```typescript
'use client'

import { useNode } from '@craftjs/core'
import { ChartSettings } from '../settings/ChartSettings'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line, Bar, Pie } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend)

interface ChartProps {
  chartType: 'line' | 'bar' | 'pie'
  title?: string
  binding?: string
}

export const Chart = ({
  chartType = 'bar',
  title = 'Chart',
  binding = '',
}: ChartProps) => {
  const {
    connectors: { connect, drag },
  } = useNode()

  // Sample data
  const sampleData = {
    labels: ['Test 1', 'Test 2', 'Test 3', 'Test 4', 'Test 5'],
    datasets: [
      {
        label: 'Sample Data',
        data: [65, 59, 80, 81, 56],
        backgroundColor: 'rgba(0, 255, 200, 0.5)',
        borderColor: 'rgb(0, 255, 200)',
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: title },
    },
  }

  const ChartComponent = chartType === 'line' ? Line : chartType === 'pie' ? Pie : Bar

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref))
      }}
      style={{ width: '100%', minHeight: '200px' }}
    >
      <ChartComponent data={sampleData} options={options} />
    </div>
  )
}

Chart.craft = {
  displayName: 'Chart',
  props: {
    chartType: 'bar',
    title: 'Chart',
    binding: '',
  },
  related: {
    settings: ChartSettings,
  },
}
```

### Verification
- [ ] Table renders with sample data
- [ ] Chart renders with selected type (line/bar/pie)
- [ ] Components are draggable and show settings

---

## Phase 8: Final Verification

### Verification Checklist

1. **Build Check**
   ```bash
   npm run build
   ```
   - [ ] No TypeScript errors
   - [ ] No missing imports

2. **Functional Tests**
   - [ ] `/builder/new` creates new template and redirects to builder
   - [ ] `/builder/[id]` loads existing template
   - [ ] Drag component from toolbox creates element
   - [ ] Click element shows settings panel
   - [ ] Save persists to Supabase
   - [ ] Refresh loads saved state

3. **Anti-Pattern Check**
   ```bash
   # Check for missing resolver entries
   grep -r "resolver=" components/builder/
   ```
   - [ ] All components in toolbox are in resolver
   - [ ] No hardcoded node IDs (use generated IDs)

4. **Database Verification**
   - [ ] `templates.canvas_state` column stores Craft.js JSON
   - [ ] `templates.updated_at` updates on save

---

## File Structure Summary

```
lib/stores/
└── builder-store.ts           # Zustand store

app/api/templates/[id]/
└── route.ts                   # PATCH/GET API

app/(app)/builder/[id]/
└── page.tsx                   # Builder page route

components/builder/
├── canvas/
│   ├── BuilderCanvas.tsx      # Main editor wrapper
│   ├── Page.tsx               # Root canvas component
│   └── RenderNode.tsx         # Selection indicator
│
├── components/
│   ├── Text.tsx
│   ├── Container.tsx
│   ├── Image.tsx
│   ├── Table.tsx
│   ├── Chart.tsx
│   └── Indicator.tsx          # (optional)
│
├── settings/
│   ├── SettingsPanel.tsx
│   ├── TextSettings.tsx
│   ├── ContainerSettings.tsx
│   ├── ImageSettings.tsx
│   ├── TableSettings.tsx
│   └── ChartSettings.tsx
│
├── toolbox/
│   └── Toolbox.tsx
│
└── topbar/
    └── BuilderTopbar.tsx
```

---

## Dependencies to Install

```bash
npm install @craftjs/core
```

Note: `zustand`, `chart.js`, and `react-chartjs-2` are already installed.
