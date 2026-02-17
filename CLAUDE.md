# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LabVIEW Report Builder is a SaaS application for creating visual report templates that can be exported as standalone HTML files. Users design templates via drag-drop, then LabVIEW writes JSON data and uses headless Chrome to generate PDFs offline.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
npx tsc --noEmit # Type check without emitting files
```

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
- `subscriptions` - Stripe subscription state (plan_type: free/pro/enterprise)
- `templates` - Saved report templates with `canvas_state` JSON for Craft.js
- `template_assets` - Uploaded images/files for templates

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

### State Management

- **Craft.js** (planned) - Canvas state for template builder
- **Zustand** - UI state management for builder
- **React Hook Form + Zod** - Form handling with validation

## Template Builder (In Progress)

The template builder is designed but not yet implemented. See `docs/plans/2026-02-17-template-builder-design.md` for the full specification.

Planned architecture:
- Route: `/builder/[id]`
- 3-panel layout: Toolbox (left), Canvas (center), Properties (right)
- Components: Text, Image, Container, Table, Chart, Indicator, Spacer, PageBreak
- Data binding syntax: `{{data.path}}` for JSON interpolation

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
