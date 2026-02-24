# Phase 2: Quality of Life - Implementation Tickets

**Sprint:** Quality of Life Improvements
**Goal:** Improve user experience with loading states, validation, accessibility, and testing infrastructure

---

## Ticket 6: Loading States Implementation

**Priority:** 🟠 High
**Type:** UX Improvement
**Files Affected:**
- `components/dashboard/TemplateGrid.tsx`
- `components/dashboard/TemplateCard.tsx`
- `components/builder/export/ExportModal.tsx`
- `components/ui/skeleton.tsx` (new file)

### Problem
Many async operations lack proper loading feedback, leading to poor user experience.

### Acceptance Criteria
- [ ] Create reusable Skeleton component
- [ ] Add skeleton loading to TemplateGrid
- [ ] Add loading state to template duplication
- [ ] Improve export modal loading UX
- [ ] Add loading states to dashboard stats

### Implementation Steps

1. **Create Skeleton component**:
```typescript
// components/ui/skeleton.tsx
interface SkeletonProps {
  className?: string
  variant?: 'text' | 'rectangular' | 'circular'
  width?: string | number
  height?: string | number
}

export function Skeleton({ 
  className = '', 
  variant = 'rectangular',
  width,
  height 
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-[rgba(0,255,200,0.1)] rounded',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'h-4 rounded',
        className
      )}
      style={{ width, height }}
    />
  )
}
```

2. **Add Template Grid Skeleton**:
```typescript
// In TemplateGrid.tsx
function TemplateGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-[rgba(0,255,200,0.1)] bg-[#0a0f14] p-4">
          <Skeleton className="h-40 w-full mb-4" />
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  )
}
```

3. **Add duplication loading state** in TemplateCard.

### Testing
- Verify skeletons display during data loading
- Test duplication shows loading spinner
- Verify export modal shows progress

---

## Ticket 7: Template Validation Before Export

**Priority:** 🟠 High
**Type:** Feature
**Files Affected:**
- `lib/export/html-compiler.ts`
- `components/builder/export/ExportModal.tsx`
- `lib/validations/template.ts` (new file)

### Problem
The export function doesn't validate templates, potentially generating invalid HTML.

### Acceptance Criteria
- [ ] Create template validation utility
- [ ] Check for empty templates
- [ ] Validate data bindings exist in sample data
- [ ] Show warnings (not errors) in export modal
- [ ] Allow export with warnings

### Implementation Steps

1. **Create validation utility**:
```typescript
// lib/validations/template.ts
export interface ValidationResult {
  isValid: boolean
  warnings: ValidationWarning[]
}

export interface ValidationWarning {
  type: 'empty_template' | 'missing_binding' | 'invalid_data'
  message: string
  componentId?: string
  componentName?: string
}

export function validateTemplate(
  canvasState: CanvasState,
  sampleData: Record<string, unknown> | null
): ValidationResult {
  const warnings: ValidationWarning[] = []
  
  // Check for empty template
  const nodeCount = Object.keys(canvasState.nodes || canvasState).length
  if (nodeCount <= 1) { // Only ROOT
    warnings.push({
      type: 'empty_template',
      message: 'Template appears to be empty. Add components before exporting.',
    })
  }
  
  // Check for unresolved bindings
  const bindings = extractBindings(canvasState)
  for (const binding of bindings) {
    if (sampleData && !resolveBinding(binding.path, sampleData)) {
      warnings.push({
        type: 'missing_binding',
        message: `Binding "${binding.path}" has no matching data in sample data`,
        componentId: binding.componentId,
        componentName: binding.componentName,
      })
    }
  }
  
  return {
    isValid: warnings.filter(w => w.type === 'empty_template').length === 0,
    warnings,
  }
}
```

2. **Add validation to ExportModal**:
```typescript
// In ExportModal.tsx
const [validation, setValidation] = useState<ValidationResult | null>(null)

useEffect(() => {
  if (isOpen) {
    const result = validateTemplate(canvasState, sampleData)
    setValidation(result)
  }
}, [isOpen, canvasState, sampleData])
```

3. **Display warnings in modal**:
```tsx
{validation?.warnings.map((warning, i) => (
  <div key={i} className="flex items-start gap-2 p-2 rounded bg-[#ffb000]/10 border border-[#ffb000]/20">
    <AlertTriangle className="w-4 h-4 text-[#ffb000] mt-0.5 flex-shrink-0" />
    <span className="text-sm text-[#ffb000]">{warning.message}</span>
  </div>
))}
```

### Testing
- Try exporting empty template - should show warning
- Export with missing bindings - should show warnings
- Verify can still export with warnings

---

## Ticket 8: Accessibility Improvements

**Priority:** 🟠 High
**Type:** Accessibility
**Files Affected:**
- `components/builder/toolbox/Toolbox.tsx`
- `components/builder/layers/LayerPanel.tsx`
- `components/builder/settings/*.tsx`
- `app/globals.css`

### Problem
The application lacks proper accessibility support, making it difficult for users with disabilities.

### Acceptance Criteria
- [ ] Add ARIA labels to all interactive elements
- [ ] Implement focus management in modals
- [ ] Add keyboard navigation to layer panel
- [ ] Improve color contrast ratios
- [ ] Add focus indicators

### Implementation Steps

1. **Add ARIA labels to Toolbox**:
```typescript
// In Toolbox.tsx
<button
  onClick={() => actions.add(component, ...)}
  aria-label={`Add ${componentName} component`}
  className="..."
>
  <Icon aria-hidden="true" />
  <span>{componentName}</span>
</button>
```

2. **Add keyboard navigation to LayerPanel**:
```typescript
// In LayerPanel.tsx
const handleKeyDown = (e: React.KeyboardEvent, layerId: string) => {
  switch (e.key) {
    case 'Enter':
    case ' ':
      handleSelectLayer(layerId)
      break
    case 'ArrowUp':
      e.preventDefault()
      // Focus previous layer
      break
    case 'ArrowDown':
      e.preventDefault()
      // Focus next layer
      break
  }
}
```

3. **Add focus indicators in CSS**:
```css
/* In globals.css */
:focus-visible {
  outline: 2px solid #00ffc8;
  outline-offset: 2px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

4. **Add focus trap to modals**:
```typescript
// Use focus-trap package or implement manually
import { FocusTrap } from '@headlessui/react'
```

### Testing
- Test with screen reader
- Navigate using only keyboard
- Verify focus indicators visible
- Check color contrast with accessibility tools

---

## Ticket 9: Test Infrastructure Setup

**Priority:** 🟠 High
**Type:** Infrastructure
**Files Affected:**
- `vitest.config.ts` (new file)
- `src/__tests__/setup.ts` (new file)
- `package.json`
- Various test files

### Problem
No test coverage exists in the codebase, making refactoring risky.

### Acceptance Criteria
- [ ] Install and configure Vitest
- [ ] Add React Testing Library
- [ ] Create test utilities for Craft.js mocking
- [ ] Add tests for export compiler
- [ ] Add tests for API routes
- [ ] Add npm scripts for testing

### Implementation Steps

1. **Install dependencies**:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
```

2. **Create Vitest config**:
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['**/__tests__/**/*.test.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/__tests__/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

3. **Create test setup**:
```typescript
// src/__tests__/setup.ts
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Craft.js
vi.mock('@craftjs/core', () => ({
  useEditor: vi.fn(() => ({
    actions: {},
    query: {},
  })),
  useNode: vi.fn(() => ({
    connectors: { connect: vi.fn(), drag: vi.fn() },
  })),
  Editor: ({ children }: { children: React.ReactNode }) => children,
  Frame: ({ children }: { children: React.ReactNode }) => children,
  Element: ({ children }: { children: React.ReactNode }) => children,
}))
```

4. **Add test for export compiler**:
```typescript
// src/__tests__/lib/export/html-compiler.test.ts
import { describe, it, expect } from 'vitest'
import { compileTemplate } from '@/lib/export/html-compiler'

describe('HTML Compiler', () => {
  it('should generate valid HTML from empty canvas', async () => {
    const canvasState = {
      ROOT: {
        type: { resolvedName: 'Page' },
        props: {},
        nodes: [],
      },
    }
    
    const html = await compileTemplate(canvasState, null, {
      filename: 'Test',
      includeSampleData: false,
      pageSize: 'A4',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      includeWatermark: false,
    })
    
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('<title>Test</title>')
  })
})
```

5. **Add npm scripts**:
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Testing
- Run `npm test` - all tests pass
- Run `npm run test:coverage` - see coverage report

---

## Ticket 10: Template Search/Filter in Dashboard

**Priority:** 🟡 Medium
**Type:** Feature
**Files Affected:**
- `app/(app)/dashboard/page.tsx`
- `components/dashboard/TemplateGrid.tsx`
- `components/dashboard/TemplateSearch.tsx` (new file)

### Problem
Users with many templates have no way to search or filter them.

### Acceptance Criteria
- [ ] Add search input to dashboard
- [ ] Filter templates by name (client-side)
- [ ] Add sort options (name, date, components)
- [ ] Show "no results" message
- [ ] Debounce search input

### Implementation Steps

1. **Create TemplateSearch component**:
```typescript
// components/dashboard/TemplateSearch.tsx
'use client'

import { useState, useMemo } from 'react'
import { Search, SortAsc } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface TemplateSearchProps {
  templates: Template[]
  children: (filteredTemplates: Template[]) => React.ReactNode
}

type SortOption = 'updated' | 'name' | 'components'

export function TemplateSearch({ templates, children }: TemplateSearchProps) {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('updated')

  const filteredTemplates = useMemo(() => {
    let result = templates

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(t => 
        t.name.toLowerCase().includes(searchLower)
      )
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'components':
          return (b.componentCount || 0) - (a.componentCount || 0)
        case 'updated':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      }
    })

    return result
  }, [templates, search, sortBy])

  return (
    <>
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="pl-10"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="px-3 py-2 bg-[#050810] border border-[rgba(0,255,200,0.1)] rounded text-white"
        >
          <option value="updated">Last Updated</option>
          <option value="name">Name</option>
          <option value="components">Components</option>
        </select>
      </div>
      
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No templates found matching "{search}"
        </div>
      ) : (
        children(filteredTemplates)
      )}
    </>
  )
}
```

2. **Update dashboard to use search**:
```typescript
// In dashboard/page.tsx
<TemplateSearch templates={processedTemplates}>
  {(filtered) => <TemplateGrid templates={filtered} />}
</TemplateSearch>
```

### Testing
- Type in search - templates filter
- Change sort - order changes
- Search with no matches - shows empty state

---

## Summary

| Ticket | Priority | Effort | Dependencies |
|--------|----------|--------|--------------|
| 6. Loading States | High | Medium | None |
| 7. Template Validation | High | Medium | None |
| 8. Accessibility | High | Large | None |
| 9. Test Infrastructure | High | Large | None |
| 10. Template Search | Medium | Small | None |

**Recommended Order:** 9 → 6 → 7 → 10 → 8

This order prioritizes:
1. Test infrastructure (enables safer refactoring)
2. Loading states (immediate UX improvement)
3. Validation (prevents bad exports)
4. Search (easy win)
5. Accessibility (larger effort, important for production)
