# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Report Builder is a **local-first desktop app and Rust rendering engine** for data-driven test reports (LabVIEW is the primary market). Users design templates (`.rbt.json`) in the desktop editor; test stations render PDFs through `reportbuilder.dll` (LabVIEW Call Library Function Node), `report-cli`, or the Python/C# bindings. Rendering uses an embedded Typst typesetter: no browser, no network, deterministic output.

The Next.js + Supabase web builder described further below is **legacy**; its templates can be imported with `report-cli migrate`.

## Layout

| Path | What |
|------|------|
| `engine/reportcore` | Engine library: `model.rs` (document model), `expr.rs` (expression language), `validate.rs`, `typst_gen.rs` (doc+data → Typst source, string literals only), `charts.rs`/`codes.rs` (SVG), `render.rs` (Typst World, PDF/SVG, block regions), `api.rs` (JSON API shared by all front ends), `gallery.rs` + `templates/` (starters), `migrate.rs` (legacy Craft.js import) |
| `engine/report-cli` | CLI (`render`, `batch`, `validate`, `schema`, `migrate`, `starters`, `serve`) + localhost HTTP API (`server.rs`) |
| `engine/reportcore-ffi` | C ABI (`rb_render`, `rb_render_file`, `rb_validate`, `rb_render_to_memory`, `rb_version`); header in `include/reportbuilder.h` |
| `desktop` | Tauri 2 app. `src/` React+TS editor (Zustand store in `src/lib/store.ts`, pure tree ops in `src/lib/doc-ops.ts`, engine transport in `src/lib/engine.ts`); `src-tauri/` Rust commands |
| `integrations` | LabVIEW guide, Python (`reportbuilder.py`) and C# bindings |
| `docs` | `cli.md`, `expressions.md`, `template-format.md`, `architecture.md` |

## Commands

```bash
cargo test --workspace                 # all Rust tests (Linux needs libwebkit2gtk-4.1-dev for the desktop crate)
cargo clippy --workspace --all-targets -- -D warnings
cargo fmt --all
cargo build --release -p report-cli -p reportcore-ffi
python3 integrations/python/test_reportbuilder.py   # needs the built cdylib

cd desktop
npm test                               # Vitest unit tests
npx tsc -b --noEmit                    # typecheck
npx playwright test                    # e2e: starts ../target/release/report-cli serve + vite
npm run tauri dev                      # run the native app
```

## Key rules for the engine

- The model in `engine/reportcore/src/model.rs` is mirrored in `desktop/src/lib/types.ts` and block defaults in `desktop/src/lib/blocks.ts` — keep all three in sync when adding a block type (also add it to `typst_gen.rs`, `validate::block_fields`, the inspector, and `docs/template-format.md`).
- Generated Typst must only embed user data through `typst_gen::lit()` string literals.
- Text fields are templates (`{{ expr }}`); data fields are bare expressions.
- Keep output deterministic: bundled fonts only; `RenderOptions.now` for reproducible dates.

---

# Legacy web app (Next.js + Supabase)

## Legacy commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
npm run test     # Run tests with Vitest
npm run test:run # Run tests once
npx tsc --noEmit # Type check without emitting files
```

## Technology Stack

- **Framework**: Next.js 16 with App Router
- **React**: React 19
- **Canvas Editor**: Craft.js for drag-drop template design
- **State Management**: Zustand for UI state
- **Database**: Supabase (PostgreSQL)
- **Charts**: Chart.js 4.4 with react-chartjs-2
- **Testing**: Vitest with Testing Library
- **Barcode/QR**: jsbarcode, qrcode libraries
- **Export**: JSZip for batch exports
- **Styling**: Tailwind CSS with oscilloscope theme
- **Forms**: React Hook Form + Zod validation

## Architecture

### Route Groups

The app uses Next.js App Router with three route groups:

- `(marketing)/` - Public pages (landing, pricing) - no auth required
- `(auth)/` - Authentication pages (login, signup, password reset)
- `(app)/` - Authenticated application (dashboard, builder, settings)

Each route group has its own `layout.tsx` defining the page wrapper (navbar/footer for marketing, sidebar for app).

### Authentication Flow

- **Middleware** (`middleware.ts` → `lib/supabase/middleware.ts`) protects `/dashboard`, `/builder`, `/settings` routes
- **Supabase SSR** handles sessions with cookie-based auth
- **Server Actions** (`app/actions/auth.ts`) for login/signup form submissions
- **useAuth hook** (`lib/hooks/use-auth.ts`) for client-side auth state

Supabase clients:
- `lib/supabase/client.ts` - Browser client (use in `'use client'` components)
- `lib/supabase/server.ts` - Server client (use in Server Components, Server Actions, API routes)

### Database Schema

Located in `types/database.ts`. Key tables:
- `profiles` - User profile data
- `templates` - Saved report templates with `canvas_state` JSON for Craft.js
- `template_assets` - Uploaded images/files for templates
- `template_versions` - Version history with canvas state snapshots
- `template_shares` - Sharing configuration (link, user, org) with permissions
- `custom_components` - User-created reusable components

### API Routes

Located in `app/api/`:

| Route | Purpose |
|-------|---------|
| `/api/templates` | CRUD operations for templates |
| `/api/templates/[id]/duplicate` | Template duplication |
| `/api/templates/[id]/versions` | Version management |
| `/api/templates/[id]/versions/[version]/restore` | Version restoration |
| `/api/templates/[id]/shares` | Sharing management |
| `/api/templates/[id]/export` | Single template export |
| `/api/templates/batch-export` | Batch export to ZIP |
| `/api/shared/[token]` | Public shared template access |
| `/api/components` | Custom component CRUD |
| `/api/components/[id]/usage` | Usage tracking |

### State Management

- **Craft.js** (`@craftjs/core`) - Canvas state for template builder, handles component tree, drag-drop, selection
- **Zustand** (`lib/stores/builder-store.ts`) - UI state management (panels, modals, settings)
- **React Hook Form + Zod** - Form handling with validation

### Styling

**Oscilloscope Precision Theme** - A dark, technical aesthetic inspired by oscilloscope displays.

**Color Palette:**
- Phosphor Cyan: `#00ffc8` (primary accent)
- Phosphor Green: `#39ff14` (success/highlight)
- Phosphor Amber: `#ffb000` (warning)
- Grid Dark: `#0a0f14` (background)
- Input Dark: `#050810` (input backgrounds)

**Typography:**
- Space Grotesk for headings
- JetBrains Mono for code/labels (via `font-mono`)

**Key Files:**
- `app/globals-marketing.css` - CSS variables, animations, utility classes (grid background, glow effects, etc.)
- `tailwind.config.ts` - Extended with oscilloscope theme colors
- `lib/utils.ts` - `cn()` utility combines clsx + tailwind-merge

**UI Components (`components/ui/`):**
- `Button` - Variants: primary (cyan), secondary, outline, ghost, destructive
- `Card` - Dark gradient background with cyan border, hover glow effect
- `Input` - Dark background with cyan focus ring

**Utility Classes (from globals-marketing.css):**
- `bg-oscilloscope-grid` - Grid background pattern
- `bg-mesh-gradient` - Radial gradient overlay
- `text-phosphor` - Cyan text with glow shadow
- `border-glow` / `border-glow-hover` - Glowing border effects
- `card-technical` - Technical card styling with top glow line

## Template Builder

The template builder is fully implemented at `/builder/[id]` with a 3-panel layout: Toolbox (left), Canvas (center), Properties (right).

### Components (27 total)

**Basic Layout:**
- `Page` - Page container with size/orientation settings
- `Container` - Layout container for grouping components
- `Spacer` - Vertical/horizontal spacing element
- `Divider` - Horizontal/vertical divider line
- `PageBreak` - Page break for multi-page reports

**Content:**
- `Text` - Rich text with font/size/color settings
- `Image` - Image with upload and URL support
- `Table` - Data table with customizable columns
- `BulletList` - Bulleted list component
- `Indicator` - Status indicator with pass/fail/warning states
- `DateTime` - Date/time display with format options
- `PageNumber` - Page numbering for multi-page reports

**Charts & Visualization:**
- `Chart` - Generic chart (bar, line, pie, doughnut)
- `Gauge` - Radial gauge for values
- `ProgressBar` - Horizontal progress indicator
- `Histogram` - Statistical histogram chart
- `ScatterPlot` - X/Y scatter plot
- `PassRateChart` - Pass rate visualization

**Special Components:**
- `QRCode` - QR code generator
- `Barcode` - Barcode generator (multiple formats)
- `Logo` - Company logo placeholder
- `Watermark` - Background watermark overlay
- `SignatureLine` - Signature capture line

**Test & Measurement:**
- `MeasurementTable` - Measurement data table
- `TestSummaryBox` - Test summary display
- `RevisionBlock` - Document revision tracking
- `SpecBox` - Specification box
- `ToleranceBand` - Tolerance visualization

### Data Binding

Components support data binding with syntax: `{{data.path}}` for JSON interpolation. The builder includes a data binding picker for mapping template fields to JSON data paths.

### Key Builder Files

| File | Purpose |
|------|---------|
| `components/builder/canvas/BuilderCanvas.tsx` | Main canvas component with Craft.js integration |
| `components/builder/toolbox/Toolbox.tsx` | Component palette |
| `components/builder/settings/RightSidebar.tsx` | Properties panel |
| `components/builder/settings/SettingsPanel.tsx` | Dynamic settings renderer |
| `lib/stores/builder-store.ts` | Zustand store for builder state |

## Export System

The export system generates standalone HTML files that can be viewed in any browser or converted to PDF via headless Chrome.

### Export Pipeline

1. **HTML Compiler** (`lib/export/html-compiler.ts`) - Converts Craft.js canvas state to HTML
2. **Runtime Template** (`lib/export/runtime-template.ts`) - Handles data interpolation at runtime
3. **Component Renderers** - Each component has a dedicated renderer

### Export Renderers (28 total)

Located in `lib/export/component-renderers/`:

| Renderer | Component |
|----------|-----------|
| `render-page.ts` | Page |
| `render-container.ts` | Container |
| `render-spacer.ts` | Spacer |
| `render-divider.ts` | Divider |
| `render-pagebreak.ts` | PageBreak |
| `render-text.ts` | Text |
| `render-image.ts` | Image |
| `render-table.ts` | Table |
| `render-bulletlist.ts` | BulletList |
| `render-indicator.ts` | Indicator |
| `render-datetime.ts` | DateTime |
| `render-pagenumber.ts` | PageNumber |
| `render-chart.ts` | Chart |
| `render-gauge.ts` | Gauge |
| `render-progressbar.ts` | ProgressBar |
| `render-histogram.ts` | Histogram |
| `render-scatterplot.ts` | ScatterPlot |
| `render-passratechart.ts` | PassRateChart |
| `render-qrcode.ts` | QRCode |
| `render-barcode.ts` | Barcode |
| `render-logo.ts` | Logo |
| `render-watermark.ts` | Watermark |
| `render-signatureline.ts` | SignatureLine |
| `render-measurementtable.ts` | MeasurementTable |
| `render-testsummarybox.ts` | TestSummaryBox |
| `render-revisionblock.ts` | RevisionBlock |
| `render-specbox.ts` | SpecBox |
| `render-toleranceband.ts` | ToleranceBand |

### Renderer Pattern

All renderers follow the `ComponentRenderer` type signature:
```typescript
type ComponentRenderer = (props: ComponentProps) => string
```

Each renderer:
1. Receives component props and data context
2. Generates position/style CSS via `generatePositionStyles()`
3. Returns HTML string with embedded styles
4. Supports data binding interpolation via `{{data.path}}`

## Environment Variables

Required (see `.env.example`):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRO_PRICE_ID=
STRIPE_ENTERPRISE_PRICE_ID=
NEXT_PUBLIC_APP_URL=
```

## Key Patterns

- Use `@/` path alias for imports (configured in tsconfig.json)
- Server Components by default; add `'use client'` only when needed
- Server Actions for mutations; return `{ error?: string }` for error handling
- Form validation schemas in `lib/validations/`
- Component renderers in `lib/export/component-renderers/` - one file per component
- Settings panels in `components/builder/settings/` - named `{Component}Settings.tsx`
- API routes follow RESTful patterns with proper error handling

 ## Preview Panel
  Panel %2 is the tmux preview shell. To show a document, run:
  tmux send-keys -t %4 'q' C-m 'preview "path/to/file"' C-m
