# Phase 1: Critical Fixes - Implementation Tickets

**Sprint:** Critical Fixes
**Goal:** Fix blocking issues and implement essential missing features

---

## Ticket 1: Settings Form Submission

**Priority:** 🔴 Critical
**Type:** Bug Fix
**Files Affected:**
- `app/(app)/settings/page.tsx`
- `app/actions/auth.ts`
- `lib/validations/auth.ts`

### Problem
The profile settings form has no submission handler. Clicking "Save changes" does nothing.

### Acceptance Criteria
- [ ] Create `updateProfileAction` server action in `app/actions/auth.ts`
- [ ] Add Zod validation schema for profile updates
- [ ] Form successfully updates `profiles` table
- [ ] Show success toast on save
- [ ] Show error toast on failure
- [ ] Add loading state during submission

### Implementation Steps

1. **Add validation schema** in `lib/validations/auth.ts`:
```typescript
export const updateProfileSchema = z.object({
  fullName: z.string().min(1, 'Name is required').max(100),
  company: z.string().max(100).optional(),
})
```

2. **Create server action** in `app/actions/auth.ts`:
```typescript
export async function updateProfileAction(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const validated = updateProfileSchema.safeParse({
    fullName: formData.get('fullName'),
    company: formData.get('company'),
  })

  if (!validated.success) {
    return { error: validated.error.errors[0].message }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: validated.data.fullName,
      company: validated.data.company,
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/settings')
  return { success: true }
}
```

3. **Update settings page** to use the action with `useActionState`.

### Testing
- Update name and verify database change
- Try empty name (should show validation error)
- Test with network failure

---

## Ticket 2: Error Boundaries

**Priority:** 🔴 Critical
**Type:** Reliability
**Files Affected:**
- `components/builder/canvas/BuilderCanvas.tsx` (new file)
- `components/ErrorBoundary.tsx` (new file)

### Problem
A crash in any builder component breaks the entire editor. Users lose unsaved work.

### Acceptance Criteria
- [ ] Create reusable `ErrorBoundary` component
- [ ] Wrap builder canvas with error boundary
- [ ] Show user-friendly error message
- [ ] Provide "Try Again" recovery button
- [ ] Log errors to console (future: error reporting service)

### Implementation Steps

1. **Create ErrorBoundary component**:
```typescript
// components/ErrorBoundary.tsx
'use client'

import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <h2 className="text-xl font-bold text-red-400">Something went wrong</h2>
          <p className="text-gray-400">{this.state.error?.message}</p>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 bg-[#00ffc8] text-black rounded"
          >
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

2. **Wrap BuilderCanvas**:
```typescript
// In BuilderCanvas.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Inside return statement
<ErrorBoundary>
  <Editor ...>
    ...
  </Editor>
</ErrorBoundary>
```

3. **Add individual boundaries** for risky components (Chart, Image loader).

### Testing
- Throw test error in Chart component
- Verify error boundary catches it
- Verify "Try Again" resets state

---

## Ticket 3: Undo/Redo Implementation

**Priority:** 🔴 Critical
**Type:** Feature
**Files Affected:**
- `components/builder/topbar/BuilderTopbar.tsx`
- `components/builder/canvas/BuilderCanvas.tsx`

### Problem
Undo/Redo icons exist in the topbar but are not functional. Users cannot revert mistakes.

### Acceptance Criteria
- [ ] Enable Craft.js history state
- [ ] Connect undo button to `actions.history.undo()`
- [ ] Connect redo button to `actions.history.redo()`
- [ ] Disable buttons when history is empty
- [ ] Add keyboard shortcuts (Ctrl+Z, Ctrl+Y / Cmd+Z, Cmd+Shift+Z)

### Implementation Steps

1. **Enable history in Editor**:
```typescript
// In BuilderCanvas.tsx
<Editor
  resolver={{ ... }}
  onNodesChange={handleNodesChange}
>
```

Note: Craft.js Core includes history by default. We just need to connect to it.

2. **Update BuilderTopbar**:
```typescript
// In BuilderTopbar.tsx
const { query, actions } = useEditor((state, query) => ({
  canUndo: query.history.canUndo(),
  canRedo: query.history.canRedo(),
}))

const handleUndo = () => {
  actions.history.undo()
}

const handleRedo = () => {
  actions.history.redo()
}

// Add keyboard shortcuts
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault()
      if (e.shiftKey) {
        actions.history.redo()
      } else {
        actions.history.undo()
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      e.preventDefault()
      actions.history.redo()
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [actions.history])
```

3. **Update button rendering**:
```tsx
<Button
  variant="ghost"
  size="icon"
  onClick={handleUndo}
  disabled={!canUndo}
  title="Undo (Ctrl+Z)"
>
  <Undo className="h-4 w-4" />
</Button>
<Button
  variant="ghost"
  size="icon"
  onClick={handleRedo}
  disabled={!canRedo}
  title="Redo (Ctrl+Y)"
>
  <Redo className="h-4 w-4" />
</Button>
```

### Testing
- Make changes, click undo, verify reversion
- Click redo, verify restoration
- Test Ctrl+Z / Ctrl+Y shortcuts
- Verify buttons disabled at history limits

---

## Ticket 4: Keyboard Shortcuts

**Priority:** 🔴 Critical
**Type:** Feature
**Files Affected:**
- `components/builder/canvas/BuilderCanvas.tsx`
- `lib/hooks/use-keyboard-shortcuts.ts` (new file)

### Problem
Power users expect keyboard shortcuts for common operations. None are implemented.

### Acceptance Criteria
- [ ] Delete key removes selected component
- [ ] Ctrl+S saves template
- [ ] Ctrl+D duplicates selected component
- [ ] Arrow keys nudge component by grid size
- [ ] Escape deselects component
- [ ] Shortcuts work in preview mode where applicable

### Shortcuts Reference

| Shortcut | Action | Context |
|----------|--------|---------|
| Delete / Backspace | Delete selected | Editor |
| Ctrl+S | Save | Editor |
| Ctrl+D | Duplicate | Editor |
| Ctrl+Z | Undo | Editor |
| Ctrl+Y | Redo | Editor |
| Arrow keys | Nudge 8px | Editor |
| Shift+Arrow | Nudge 1px | Editor |
| Escape | Deselect | Editor |

### Implementation Steps

1. **Create keyboard hook**:
```typescript
// lib/hooks/use-keyboard-shortcuts.ts
import { useEffect } from 'react'
import { useEditor } from '@craftjs/core'
import { useBuilderStore } from '@/lib/stores/builder-store'

export function useKeyboardShortcuts() {
  const { actions, query } = useEditor()
  const { selectedNodeId, snapEnabled, gridSize, setHasUnsavedChanges } = useBuilderStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      const nudgeAmount = e.shiftKey ? 1 : (snapEnabled ? gridSize : 1)

      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          if (selectedNodeId && selectedNodeId !== 'ROOT') {
            e.preventDefault()
            actions.delete(selectedNodeId)
            setHasUnsavedChanges(true)
          }
          break

        case 'Escape':
          actions.selectNode(null)
          break

        case 'ArrowUp':
          if (selectedNodeId) {
            e.preventDefault()
            actions.setProp(selectedNodeId, (props: any) => {
              props.y = (props.y || 0) - nudgeAmount
            })
            setHasUnsavedChanges(true)
          }
          break

        case 'ArrowDown':
          if (selectedNodeId) {
            e.preventDefault()
            actions.setProp(selectedNodeId, (props: any) => {
              props.y = (props.y || 0) + nudgeAmount
            })
            setHasUnsavedChanges(true)
          }
          break

        case 'ArrowLeft':
          if (selectedNodeId) {
            e.preventDefault()
            actions.setProp(selectedNodeId, (props: any) => {
              props.x = (props.x || 0) - nudgeAmount
            })
            setHasUnsavedChanges(true)
          }
          break

        case 'ArrowRight':
          if (selectedNodeId) {
            e.preventDefault()
            actions.setProp(selectedNodeId, (props: any) => {
              props.x = (props.x || 0) + nudgeAmount
            })
            setHasUnsavedChanges(true)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNodeId, snapEnabled, gridSize, actions, query, setHasUnsavedChanges])
}
```

2. **Use hook in BuilderCanvas**:
```typescript
// In BuilderCanvas.tsx
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts'

// Inside component
useKeyboardShortcuts()
```

3. **Ctrl+S handled in BuilderTopbar** (add to existing save logic).

### Testing
- Select component, press Delete, verify removal
- Select component, press Arrow keys, verify movement
- Test with Shift for fine movement
- Press Escape, verify deselection
- Test shortcuts don't fire in input fields

---

## Ticket 5: Fix Autosave Race Condition

**Priority:** 🔴 Critical
**Type:** Bug Fix
**Files Affected:**
- `components/builder/topbar/BuilderTopbar.tsx`

### Problem
Autosave timer can conflict with manual save, potentially causing:
- Double saves
- Lost changes between saves
- UI state inconsistency

### Acceptance Criteria
- [ ] Cancel autosave timer when manual save triggered
- [ ] Prevent concurrent saves
- [ ] Debounce rapid changes properly
- [ ] Show clear saving/saved status

### Implementation Steps

1. **Refactor save logic**:
```typescript
// In BuilderTopbar.tsx

// Use a ref to track pending save promise
const savePromiseRef = useRef<Promise<void> | null>(null)

const saveTemplate = useCallback(async (isAutosave = false) => {
  // Don't start new save if one is in progress
  if (savePromiseRef.current) {
    return savePromiseRef.current
  }

  // Don't save in preview mode
  if (isPreviewMode) return

  setIsSaving(true)
  
  savePromiseRef.current = (async () => {
    const serializedState = query.serialize()
    
    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canvas_state: JSON.parse(serializedState),
          sample_data: sampleData,
        }),
      })

      if (response.ok) {
        setHasUnsavedChanges(false)
        if (!isAutosave) {
          setShowSaved(true)
          setTimeout(() => setShowSaved(false), 2000)
        }
      } else {
        const error = await response.json()
        console.error('Save failed:', error)
        // Could add error toast here
      }
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      savePromiseRef.current = null
      setIsSaving(false)
    }
  })()

  return savePromiseRef.current
}, [isPreviewMode, query, templateId, sampleData, setHasUnsavedChanges])

// Manual save - cancel autosave timer first
const handleManualSave = () => {
  if (autosaveTimerRef.current) {
    clearTimeout(autosaveTimerRef.current)
    autosaveTimerRef.current = null
  }
  saveTemplate(false)
}

// Autosave effect with proper debounce
useEffect(() => {
  if (autosaveTimerRef.current) {
    clearTimeout(autosaveTimerRef.current)
  }

  if (hasUnsavedChanges && !isPreviewMode && !isSaving) {
    autosaveTimerRef.current = setTimeout(() => {
      saveTemplate(true)
    }, AUTOSAVE_DELAY)
  }

  return () => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current)
    }
  }
}, [hasUnsavedChanges, isPreviewMode, isSaving, saveTemplate])
```

2. **Update save button**:
```tsx
<Button
  variant="outline"
  size="sm"
  onClick={handleManualSave}
  disabled={isSaving}
>
  {isSaving ? (
    <>
      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      Saving...
    </>
  ) : showSaved ? (
    <>
      <Check className="h-4 w-4 mr-2" />
      Saved
    </>
  ) : (
    <>
      <Save className="h-4 w-4 mr-2" />
      Save
    </>
  )}
</Button>
```

### Testing
- Make rapid changes, verify only one save occurs
- Click save while autosave pending, verify no conflict
- Check network tab for duplicate requests
- Verify UI state updates correctly

---

## Summary

| Ticket | Priority | Effort | Dependencies |
|--------|----------|--------|--------------|
| 1. Settings Form | Critical | Small | None |
| 2. Error Boundaries | Critical | Medium | None |
| 3. Undo/Redo | Critical | Medium | None |
| 4. Keyboard Shortcuts | Critical | Medium | None |
| 5. Autosave Fix | Critical | Small | None |

**Recommended Order:** 1 → 5 → 3 → 4 → 2

This order prioritizes:
1. User-facing bug (settings)
2. Data integrity (autosave)
3. Productivity features (undo/redo, shortcuts)
4. Reliability (error boundaries)
