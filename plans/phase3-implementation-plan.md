# Phase3: New Features Implementation Plan

**Date:** 2026-02-19
**Status:** Sprint 1-3 Complete, Sprint 4-5 Pending
**Related:** [codebase-analysis-improvements.md](codebase-analysis-improvements.md)

---

## Implementation Status

### ✅ Sprint 1: Template Versioning (Complete)
- [x] Database migration for `template_versions` table
- [x] TypeScript types in `types/database.ts`
- [x] API routes for version management
  - `GET /api/templates/[id]/versions` - List all versions
  - `GET /api/templates/[id]/versions/[version]` - Get specific version
  - `POST /api/templates/[id]/versions/[version]/restore` - Restore to version
- [x] UI Components
  - `VersionPanel.tsx` - Slide-out panel showing version history
  - `VersionItem.tsx` - Single version entry with restore button
- [x] Integration with `BuilderTopbar.tsx` - History button added

### ✅ Sprint 2: Template Sharing (Complete)
- [x] Database migration for `template_shares` table
- [x] TypeScript types in `types/database.ts`
- [x] API routes for share management
  - `GET /api/templates/[id]/shares` - List all shares
  - `POST /api/templates/[id]/shares` - Create new share
  - `DELETE /api/templates/[id]/shares` - Remove share
  - `GET /api/shared/[token]` - Access shared template
  - `POST /api/shared/[token]` - Verify password for protected shares
- [x] UI Components
  - `ShareDialog.tsx` - Full sharing dialog with link and email options
- [x] Integration with `BuilderTopbar.tsx` - Share button added

### ✅ Sprint 3: Batch Export (Complete)
- [x] API route for batch export
  - `POST /api/templates/batch-export` - Export multiple templates
- [x] JSZip integration for ZIP file generation
- [x] UI Components
  - `BatchExportDialog.tsx` - Template selection and data input
  - `DashboardContent.tsx` - Client component with batch export button
- [x] Integration with dashboard page

### ⏳ Sprint 4: Conditional Rendering (Pending)
Requires updates to:
- All component types to add `visibilityCondition` prop
- Component settings panels
- Runtime template evaluation
- Export compiler renderers

### ⏳ Sprint 5: Custom Components (Pending)
Requires:
- Database migration for `custom_components` table
- API routes for CRUD operations
- Toolbox integration
- Thumbnail generation

---

## Feature1: Template Versioning

### Problem Statement

Users cannot rollback changes to templates. Any accidental save or unwanted modification is permanent.

### Database Schema Changes

```sql
-- New table: template_versions
CREATE TABLE template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  canvas_state JSONB NOT NULL,
  sample_data JSONB,
  settings JSONB,
  change_description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, version_number)
);

-- Index for fast version lookups
CREATE INDEX idx_template_versions_template ON template_versions(template_id);
CREATE INDEX idx_template_versions_created ON template_versions(created_at DESC);

-- Add trigger to auto-create version on template update
CREATE OR REPLACE FUNCTION create_template_version()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO template_versions (template_id, version_number, canvas_state, sample_data, settings)
  VALUES (
    NEW.id,
    COALESCE((SELECT MAX(version_number) FROM template_versions WHERE template_id = NEW.id), 0) + 1,
    NEW.canvas_state,
    NEW.sample_data,
    NEW.settings
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER template_version_trigger
AFTER UPDATE ON templates
FOR EACH ROW
WHEN (OLD.canvas_state IS DISTINCT FROM NEW.canvas_state)
EXECUTE FUNCTION create_template_version();
```

### TypeScript Types

```typescript
// types/database.ts - Add to Tables interface
template_versions: {
  Row: {
    id: string
    template_id: string
    version_number: number
    canvas_state: Json
    sample_data: Json | null
    settings: Json | null
    change_description: string | null
    created_by: string | null
    created_at: string
  }
  Insert: {
    id?: string
    template_id: string
    version_number: number
    canvas_state: Json
    sample_data?: Json | null
    settings?: Json | null
    change_description?: string | null
    created_by?: string | null
    created_at?: string
  }
  Update: { /* ... */ }
  Relationships: [
    { foreignKeyName: 'template_versions_template_id_fkey'; columns: ['template_id']; referencedRelation: 'templates' }
  ]
}
```

### API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/templates/[id]/versions` | GET | List all versions |
| `/api/templates/[id]/versions/[version]` | GET | Get specific version |
| `/api/templates/[id]/versions/[version]/restore` | POST | Restore to version |

### UI Components

```
components/builder/versioning/
├── VersionPanel.tsx        # Slide-out panel showing version history
├── VersionItem.tsx         # Single version entry with preview
├── VersionDiff.tsx         # Visual diff between versions (optional)
└── VersionRestoreDialog.tsx # Confirmation dialog for restore
```

### Implementation Steps

1. Create database migration for `template_versions` table
2. Add TypeScript types to `types/database.ts`
3. Create API routes for version management
4. Build `VersionPanel` component with version list
5. Add version restore functionality
6. Add "View History" button to [`BuilderTopbar.tsx`](components/builder/topbar/BuilderTopbar.tsx)

---

## Feature2: Template Sharing

### Problem Statement

Users cannot share templates with team members or make them publicly accessible.

### Database Schema Changes

```sql
-- New table: template_shares
CREATE TABLE template_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  share_type TEXT NOT NULL CHECK (share_type IN ('link', 'user', 'org')),
  share_token TEXT UNIQUE, -- For link sharing
  shared_with_email TEXT, -- For user sharing
  organization_id UUID, -- For org sharing (future)
  permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'edit')),
  password_hash TEXT, -- Optional password protection
  expires_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ
);

CREATE INDEX idx_template_shares_template ON template_shares(template_id);
CREATE INDEX idx_template_shares_token ON template_shares(share_token);

-- Update templates table to add is_shared flag
ALTER TABLE templates ADD COLUMN is_shared BOOLEAN DEFAULT FALSE;
```

### API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/templates/[id]/shares` | GET | List all shares for template |
| `/api/templates/[id]/shares` | POST | Create new share |
| `/api/templates/[id]/shares/[shareId]` | DELETE | Remove share |
| `/api/shared/[token]` | GET | Access shared template |
| `/api/shared/[token]/export` | POST | Export shared template |

### UI Components

```
components/builder/sharing/
├── ShareDialog.tsx         # Main sharing dialog
├── ShareLinkInput.tsx      # Copy share link component
├── SharePermissionSelect.tsx # Permission dropdown
├── SharePasswordInput.tsx  # Optional password protection
├── SharedWithList.tsx      # List of people with access
└── ShareInviteInput.tsx    # Email invite input

components/dashboard/
└── SharedTemplatesSection.tsx # Show shared templates on dashboard
```

### Share Dialog Design

```
┌─────────────────────────────────────────┐
│  Share Template: [Template Name]     ✕  │
├─────────────────────────────────────────┤
│                                         │
│  🔗 Share Link                          │
│  ┌───────────────────────────────────┐  │
│  │ https://app.com/shared/abc123...  │  │
│  │                         [Copy]    │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Permission: [View Only ▼]              │
│                                         │
│  ☐ Password protect                     │
│  ┌───────────────────────────────────┐  │
│  │ ••••••••                          │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ☐ Set expiration date                  │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Invite by Email                        │
│  ┌───────────────────────────────────┐  │
│  │ email@example.com        [Invite] │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Shared with:                           │
│  • user1@example.com (can view) [✕]    │
│  • user2@example.com (can edit) [✕]    │
│                                         │
│  [Cancel]                     [Save]    │
└─────────────────────────────────────────┘
```

### Implementation Steps

1. Create database migration for `template_shares` table
2. Add TypeScript types
3. Create share API routes
4. Build `ShareDialog` component
5. Add "Share" button to [`BuilderTopbar.tsx`](components/builder/topbar/BuilderTopbar.tsx)
6. Create shared template access page at `/shared/[token]`
7. Add shared templates section to dashboard

---

## Feature3: Batch Export

### Problem Statement

Users must export templates one at a time, even when generating similar reports.

### API Design

```typescript
// POST /api/templates/batch-export
interface BatchExportRequest {
  templateIds: string[]
  data: Record<string, unknown>
  options: {
    filename: string
    pageSize: 'A4' | 'Letter'
    margins: { top: number; right: number; bottom: number; left: number }
    includeWatermark: boolean
  }
}

interface BatchExportResponse {
  exportId: string
  status: 'processing' | 'complete' | 'failed'
  downloads?: {
    templateId: string
    templateName: string
    filename: string
    url: string
  }[]
  errors?: {
    templateId: string
    error: string
  }[]
}
```

### API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/templates/batch-export` | POST | Start batch export |
| `/api/templates/batch-export/[id]` | GET | Check batch status |
| `/api/templates/batch-export/[id]/download` | GET | Download ZIP of exports |

### UI Components

```
components/dashboard/
├── BatchExportDialog.tsx   # Select templates and configure export
├── BatchExportProgress.tsx # Show export progress
└── BatchExportResults.tsx  # Show results and download links
```

### Batch Export Dialog Design

```
┌─────────────────────────────────────────┐
│  Batch Export                        ✕  │
├─────────────────────────────────────────┤
│                                         │
│  Select Templates                       │
│  ┌───────────────────────────────────┐  │
│  │ ☑ Test Report Template            │  │
│  │ ☑ Quality Control Report          │  │
│  │ ☐ Calibration Certificate         │  │
│  │ ☐ Measurement Log                 │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Data to Apply                          │
│  ┌───────────────────────────────────┐  │
│  │ {                                  │  │
│  │   "meta": { ... },                │  │
│  │   "results": { ... }              │  │
│  │ }                                  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Export Options                         │
│  Page Size: [A4 ▼]                      │
│  ☐ Include watermark                    │
│                                         │
│  [Cancel]                    [Export]   │
└─────────────────────────────────────────┘
```

### Implementation Steps

1. Create batch export API route
2. Implement ZIP file generation for multiple exports
3. Build `BatchExportDialog` component
4. Add batch selection to [`TemplateGrid.tsx`](components/dashboard/TemplateGrid.tsx)
5. Add batch export button to dashboard toolbar
6. Implement progress tracking

---

## Feature4: Conditional Rendering

### Problem Statement

Templates cannot show/hide components based on data values, limiting dynamic report generation.

### Syntax Design

Use Handlebars-style conditionals in the runtime:

```html
<!-- Simple equality check -->
{{#if data.results.status === "PASS"}}
  <div class="pass-indicator">✓ PASSED</div>
{{else}}
  <div class="fail-indicator">✗ FAILED</div>
{{/if}}

<!-- Numeric comparison -->
{{#if data.values.temperature > 100}}
  <div class="warning">High temperature!</div>
{{/if}}

<!-- Array length check -->
{{#if data.items.length > 0}}
  <ul>
    {{#each data.items}}
      <li>{{this.name}}</li>
    {{/each}}
  </ul>
{{/if}}

<!-- Boolean check -->
{{#if data.flags.isCalibrated}}
  <span>Calibration complete</span>
{{/if}}
```

### Component Props Enhancement

Add visibility condition to all components:

```typescript
interface BaseComponentProps {
  // ... existing props
  visibilityCondition?: string // e.g., "data.results.status === 'PASS'"
}
```

### Settings Panel Addition

Add to [`SettingsPanel.tsx`](components/builder/settings/SettingsPanel.tsx):

```tsx
<div className="space-y-2">
  <Label>Visibility Condition</Label>
  <Input
    placeholder="e.g., data.results.status === 'PASS'"
    value={visibilityCondition}
    onChange={(e) => setProp((props) => props.visibilityCondition = e.target.value)}
  />
  <p className="text-xs text-gray-500">
    Component will only render when this condition is true
  </p>
</div>
```

### Runtime Implementation

Update [`runtime-template.ts`](lib/export/runtime-template.ts):

```javascript
// Add to runtime
function evaluateCondition(condition, data) {
  if (!condition) return true;
  
  try {
    // Create safe evaluation context
    const fn = new Function('data', `return ${condition}`);
    return fn(data);
  } catch (e) {
    console.warn('Condition evaluation failed:', e);
    return true; // Show by default on error
  }
}

// Apply to component rendering
function renderComponent(component) {
  if (!evaluateCondition(component.visibilityCondition, data)) {
    return ''; // Don't render
  }
  // ... existing rendering logic
}
```

### Export Compiler Updates

Update all component renderers to handle visibility:

```typescript
// lib/export/component-renderers/render-text.ts
export function renderText(id: string, props: TextProps): RendererResult {
  const { visibilityCondition, ...rest } = props;
  
  let conditionalWrapper = '';
  if (visibilityCondition) {
    conditionalWrapper = `<% if (${visibilityCondition}) { %>`;
  }
  
  const html = `${conditionalWrapper}<div ...>${rest.text}</div>${conditionalWrapper ? '<% } %>' : ''}`;
  
  return { html, componentConfig: { ... } };
}
```

### Implementation Steps

1. Add `visibilityCondition` prop to all components
2. Update component settings panels
3. Enhance runtime template with condition evaluation
4. Update all export renderers
5. Add condition preview in builder
6. Add validation for condition syntax

---

## Feature5: Custom Components

### Problem Statement

Users cannot save and reuse common component configurations across templates.

### Database Schema Changes

```sql
-- New table: custom_components
CREATE TABLE custom_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'custom',
  base_component TEXT NOT NULL, -- e.g., 'Text', 'Table', 'Container'
  props JSONB NOT NULL, -- Saved component configuration
  thumbnail_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_custom_components_user ON custom_components(user_id);
CREATE INDEX idx_custom_components_public ON custom_components(is_public) WHERE is_public = TRUE;
```

### TypeScript Types

```typescript
interface CustomComponent {
  id: string
  userId: string
  name: string
  description: string | null
  category: string
  baseComponent: string // 'Text' | 'Table' | 'Container' | etc.
  props: Record<string, unknown>
  thumbnailUrl: string | null
  isPublic: boolean
  usageCount: number
  createdAt: string
  updatedAt: string
}
```

### API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/custom-components` | GET | List user's custom components |
| `/api/custom-components` | POST | Save new custom component |
| `/api/custom-components/[id]` | GET | Get specific component |
| `/api/custom-components/[id]` | PATCH | Update component |
| `/api/custom-components/[id]` | DELETE | Delete component |
| `/api/custom-components/public` | GET | List public components |

### UI Components

```
components/builder/custom/
├── SaveComponentDialog.tsx   # Dialog to save component configuration
├── CustomComponentsPanel.tsx # Panel showing saved components
├── CustomComponentCard.tsx   # Card for single component
└── ComponentPreview.tsx      # Thumbnail preview

components/builder/toolbox/
└── Toolbox.tsx               # Add "Custom" category
```

### Save Component Dialog Design

```
┌─────────────────────────────────────────┐
│  Save as Custom Component             ✕  │
├─────────────────────────────────────────┤
│                                         │
│  Component Name *                       │
│  ┌───────────────────────────────────┐  │
│  │ Pass/Fail Indicator               │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Description                            │
│  ┌───────────────────────────────────┐  │
│  │ Green indicator for PASS, red...  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Category                               │
│  [Custom ▼]                             │
│                                         │
│  Base Component: Indicator              │
│                                         │
│  Preview:                               │
│  ┌───────────────────────────────────┐  │
│  │     [● PASS]                      │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ☐ Make public (share with team)        │
│                                         │
│  [Cancel]                          [Save] │
└─────────────────────────────────────────┘
```

### Toolbox Integration

Add "Custom" section to [`Toolbox.tsx`](components/builder/toolbox/Toolbox.tsx):

```tsx
<AccordionItem value="custom">
  <AccordionTrigger>
    <div className="flex items-center gap-2">
      <Package className="h-4 w-4" />
      Custom Components
    </div>
  </AccordionTrigger>
  <AccordionContent>
    <div className="space-y-2">
      {customComponents.map((component) => (
        <CustomComponentCard
          key={component.id}
          component={component}
          onDragStart={handleCustomComponentDrag}
        />
      ))}
      {customComponents.length === 0 && (
        <p className="text-xs text-gray-500 text-center py-4">
          No custom components yet.
          <br />
          Right-click a component to save it.
        </p>
      )}
    </div>
  </AccordionContent>
</AccordionItem>
```

### Implementation Steps

1. Create database migration for `custom_components` table
2. Add TypeScript types
3. Create custom component API routes
4. Build `SaveComponentDialog` component
5. Add right-click context menu to components
6. Update `Toolbox` with Custom section
7. Implement drag-and-drop for custom components
8. Add thumbnail generation for previews

---

## Architecture Diagram

```mermaid
graph TB
    subgraph Database
        T[(templates)]
        TV[(template_versions)]
        TS[(template_shares)]
        CC[(custom_components)]
    end

    subgraph API Routes
        API_V[/api/templates/id/versions]
        API_S[/api/templates/id/shares]
        API_BE[/api/templates/batch-export]
        API_CC[/api/custom-components]
    end

    subgraph Builder Components
        BT[BuilderTopbar]
        VP[VersionPanel]
        SD[ShareDialog]
        BED[BatchExportDialog]
        SCD[SaveComponentDialog]
    end

    subgraph Export System
        EC[Export Compiler]
        RT[Runtime Template]
        CR[Conditional Renderer]
    end

    T --> TV
    T --> TS
    API_V --> TV
    API_S --> TS
    API_BE --> EC
    API_CC --> CC
    BT --> VP
    BT --> SD
    BT --> SCD
    EC --> CR
    RT --> CR
```

---

## Implementation Order

### Sprint 1: Versioning
1. Database migration for `template_versions`
2. API routes for version management
3. Version panel UI
4. Restore functionality

### Sprint 2: Sharing
1. Database migration for `template_shares`
2. Share API routes
3. Share dialog UI
4. Public access page

### Sprint 3: Batch Export
1. Batch export API
2. ZIP generation
3. Batch selection UI
4. Progress tracking

### Sprint 4: Conditional Rendering
1. Component prop updates
2. Settings panel additions
3. Runtime evaluation
4. Export compiler updates

### Sprint 5: Custom Components
1. Database migration for `custom_components`
2. Custom component API
3. Save dialog UI
4. Toolbox integration

---

## Testing Strategy

### Unit Tests
- Version creation and restoration
- Share link generation and validation
- Condition evaluation logic
- Custom component prop serialization

### Integration Tests
- Version history API endpoints
- Share access control
- Batch export with multiple templates
- Custom component drag-and-drop

### E2E Tests
- Create, view, and restore version flow
- Share template and access via link
- Batch export from dashboard
- Save and use custom component

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Version table grows large | Performance | Add cleanup job for old versions, limit versions per template |
| Share links leaked | Security | Add expiration, password protection, access logging |
| Batch export timeout | Reliability | Use background jobs, streaming response |
| Condition injection | Security | Sanitize conditions, use safe evaluation context |
| Custom component complexity | Maintenance | Limit to simple prop saving, no nested structures |

---

## Success Metrics

| Feature | Metric | Target |
|---------|--------|--------|
| Versioning | Versions created per template | 5+ average |
| Sharing | Templates shared | 30% of templates |
| Batch Export | Avg templates per batch | 3+ |
| Conditional Rendering | Components with conditions | 20% |
| Custom Components | Components saved per user | 5+ average |

---

## Next Steps

1. Review this plan with stakeholders
2. Prioritize features based on business needs
3. Create GitHub issues for each feature
4. Set up sprint milestones
5. Begin Sprint1 implementation
