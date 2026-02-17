# LabVIEW Report Builder - Design Document

**Date:** 2026-02-17
**Status:** Approved
**Author:** Design Session

---

## Overview

A DIAdem-like report generator for LabVIEW built as a SaaS application. Users design report templates visually in a web-based canvas builder, download self-contained HTML templates, and generate reports offline on test stations using LabVIEW.

### Key Value Proposition

- **Online Builder**: Visual drag-drop template designer (SaaS, subscription-based)
- **Offline Generation**: Downloaded templates work forever without internet
- **Simple Integration**: LabVIEW library writes JSON, reports generate automatically

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        NEXT.JS APPLICATION                       │
├─────────────┬─────────────┬─────────────┬─────────────────────────┤
│  Landing    │   Auth &    │   Template  │    Template            │
│  Page       │   Billing   │   Builder   │    Download            │
└─────────────┴─────────────┴─────────────┴─────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                 │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  Auth           │  PostgreSQL     │  Storage                    │
│  (users,        │  (templates,    │  (template images,          │
│  sessions)      │   subscriptions)│   assets)                   │
└─────────────────┴─────────────────┴─────────────────────────────┘
                              │
                              ▼ Export
┌─────────────────────────────────────────────────────────────────┐
│                    DOWNLOADED TEMPLATE                           │
│  ┌───────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │  report.html  │  │  Embedded    │  │  Chart.js, rendering  │ │
│  │  (template)   │  │  JS/CSS      │  │  logic, PDF trigger   │ │
│  └───────────────┘  └──────────────┘  └───────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ LabVIEW provides
┌─────────────────────────────────────────────────────────────────┐
│                    report_data.json                              │
│  { "testName": "...", "results": [...], "charts": [...] }       │
└─────────────────────────────────────────────────────────────────┘
```

### Key Data Flows

1. **Design Flow**: User logs in → Builds template in browser → Saves to Supabase
2. **Export Flow**: User clicks download → Server compiles template to standalone HTML → User downloads
3. **Report Flow**: LabVIEW writes JSON → Opens HTML in headless Chrome → PDF generated automatically

---

## Data Model (Supabase Schema)

### Users
Managed by Supabase Auth: id, email, password, created_at

### profiles
Extends auth.users with additional user information.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | References auth.users |
| full_name | text | User's full name |
| company | text | Company name |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

### subscriptions
Manages user subscriptions and billing status.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | References profiles |
| stripe_customer_id | text | Stripe customer ID |
| stripe_subscription_id | text | Stripe subscription ID |
| plan_type | enum | 'free', 'pro', 'enterprise' |
| status | enum | 'active', 'canceled', 'past_due' |
| templates_downloaded_this_month | int | Usage tracking |
| current_period_end | timestamp | Billing period end |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

### templates
Stores user-created report templates.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | References profiles |
| name | text | Template name |
| description | text | Template description |
| canvas_state | jsonb | Craft.js state: components, layout, bindings |
| sample_data | jsonb | Sample JSON for testing in builder |
| settings | jsonb | Page size, margins, fonts, colors |
| is_public | boolean | Future: template marketplace |
| version | int | Template version number |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

### template_assets
Stores images and other assets for templates.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| template_id | uuid | References templates |
| file_path | text | Supabase storage path |
| file_name | text | Original filename |
| file_size | int | File size in bytes |
| mime_type | text | MIME type |
| created_at | timestamp | Creation timestamp |

---

## Template Builder Components

### Component Hierarchy

```
Craft.js Canvas
├── Page Container (root)
│   ├── Header Section
│   │   ├── Logo (image component)
│   │   ├── Title (text component with binding)
│   │   └── Report Info (text with bindings: date, test ID, operator)
│   │
│   ├── Content Grid (flexible layout)
│   │   ├── Row
│   │   │   ├── Cell (1/2 width)
│   │   │   │   └── Test Results Table (table component)
│   │   │   └── Cell (1/2 width)
│   │   │       └── Pass/Fail Summary (indicator component)
│   │   │
│   │   └── Row
│   │       ├── Cell (full width)
│   │       │   └── Line Chart (chart component)
│   │
│   └── Footer Section
│       ├── Page Number
│       └── Confidentiality Notice
```

### Available Component Types

| Component | Description | Bindings |
|-----------|-------------|----------|
| Text Block | Rich text with variable interpolation | `{{data.path}}` |
| Image | Static images or data-driven | URL or base64 path |
| Table | Dynamic tables from arrays | `{{data.results}}` |
| Chart | Line, bar, pie, scatter | `{{data.charts.voltage}}` |
| Indicator | Pass/Fail, status badges | `{{data.status}}` |
| Container | Grouping, conditional visibility | Show if `{{data.includeSection}}` |
| Spacer | Layout control | None |
| Page Break | Force new page | None |

### Component Configuration Panel

When a component is selected, a side panel shows:
- **Data Binding**: Path input (e.g., `data.testResults.voltage`)
- **Styling**: Font, color, padding, borders
- **Conditional**: Show/hide based on data value
- **Format**: Number formatting, date formatting

### Hybrid Grid Behavior

- Outer structure: Grid-based rows and cells (responsive)
- Within cells: Free positioning of elements
- Users can override grid with absolute positioning if needed

---

## Template Export Format

When a user downloads a template, they receive a **single self-contained HTML file**:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Test Report Template</title>

  <!-- Embedded CSS -->
  <style>
    /* Template styles + print-specific CSS */
    @media print {
      @page { margin: 1cm; size: A4; }
      .no-print { display: none; }
    }
  </style>

  <!-- Embedded Chart.js -->
  <script>/* Chart.js minified */</script>

  <!-- Embedded Rendering Engine -->
  <script>
    // Configuration from builder
    const TEMPLATE_CONFIG = {
      pageSize: 'A4',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      autoPdf: true,
      dataPath: 'report_data.json'
    };

    // Component definitions with bindings
    const COMPONENTS = [
      { id: 'title', type: 'text', binding: 'data.testName' },
      { id: 'chart1', type: 'line-chart', binding: 'data.charts.voltage' },
    ];

    // Rendering logic
    async function renderReport() {
      const data = await fetchJson(TEMPLATE_CONFIG.dataPath);
      // Bind data to components
      // Render charts
      // Apply conditional visibility
      // Auto-trigger PDF if configured
    }

    window.onload = renderReport;
  </script>
</head>
<body>
  <div id="report">
    <header>...</header>
    <main>...</main>
    <footer>...</footer>
  </div>
</body>
</html>
```

### Key Export Features

| Feature | Implementation |
|---------|----------------|
| Self-contained | All JS/CSS embedded - no external dependencies |
| Auto-load JSON | Fetches `report_data.json` from same directory |
| Auto-generate PDF | On load, triggers print for PDF generation |
| Print-optimized CSS | Page breaks, margins, headers/footers handled |
| Chart rendering | Chart.js renders from JSON data before PDF |

---

## LabVIEW Integration

### JSON Data Format (report_data.json)

```json
{
  "meta": {
    "reportTitle": "Unit Test Report",
    "testDate": "2026-02-17T14:30:00Z",
    "testId": "TEST-2026-001",
    "operator": "John Smith",
    "unitSerial": "SN-12345"
  },
  "results": {
    "overallStatus": "PASS",
    "tests": [
      { "name": "Voltage Test", "measured": 5.02, "unit": "V", "min": 4.9, "max": 5.1, "status": "PASS" },
      { "name": "Current Draw", "measured": 0.152, "unit": "A", "min": 0.1, "max": 0.2, "status": "PASS" }
    ]
  },
  "charts": {
    "voltageOverTime": {
      "type": "line",
      "title": "Voltage vs Time",
      "xAxis": "Time (ms)",
      "yAxis": "Voltage (V)",
      "data": {
        "labels": [0, 10, 20, 30, 40, 50],
        "datasets": [
          { "label": "Channel 1", "data": [4.95, 5.0, 5.02, 4.98, 5.01, 5.0] }
        ]
      }
    }
  },
  "custom": {
    "anyAdditionalFields": "for flexibility"
  }
}
```

### LabVIEW Library (VI) Interface

```
Generate Report.vi
├── Inputs
│   ├── Template Path (Path) - Path to .html template
│   ├── Output Path (Path) - Where to save PDF
│   ├── Report Data (Cluster)
│   │   ├── Meta (Cluster) - Test info
│   │   ├── Results (Array) - Test results
│   │   ├── Charts (Cluster) - Chart data
│   │   └── Custom (Variant) - User-defined fields
│   └── Options (Cluster)
│       ├── Open After Generate (Boolean)
│       └── Chrome Path (Path) - Optional, auto-detect if empty
├── Outputs
│   ├── PDF Path (Path) - Generated PDF location
│   └── Error Out (Error Cluster)
```

### LabVIEW Library Internal Logic

1. Flatten input cluster to JSON (using JKI JSON or built-in)
2. Write JSON to `report_data.json` in same directory as template
3. Detect Chrome/Edge installation path
4. Execute: `[chrome] --headless --disable-gpu --print-to-pdf="[output]" "[template]"`
5. Wait for PDF generation (poll for file existence)
6. Clean up temporary JSON file
7. Return PDF path or error

### Optional Sub-VIs

- `Build Report Data.vi` - Helper to construct the data cluster
- `Add Chart Data.vi` - Helper to add chart datasets
- `Validate Template.vi` - Check template exists and is valid

---

## Authentication & Billing

### User Journey

1. Sign Up (email)
2. Verify Email
3. Choose Plan
4. Access Dashboard (Builder)

### Pricing Tiers

| Plan | Price | Features |
|------|-------|----------|
| Free | $0 | 1 template, watermarked PDFs, community support |
| Pro | $29/month | Unlimited templates, no watermark, priority support |
| Enterprise | $99/month | Pro + team sharing, custom branding, API access |

### Key API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/api/auth/signup` | Create user account |
| `/api/auth/login` | Authenticate user |
| `/api/billing/create-checkout` | Create Stripe checkout session |
| `/api/billing/portal` | Redirect to Stripe customer portal |
| `/api/billing/webhook` | Handle Stripe events |
| `/api/templates` | CRUD for templates |
| `/api/templates/[id]/download` | Generate and return downloadable HTML |

### Access Control

- Middleware checks subscription status before allowing template downloads
- Free users: limited templates, watermark embedded in exported HTML
- Pro/Enterprise: full access, no watermark

---

## Tech Stack

### Frontend (Next.js App)

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 14 (App Router) | Full-stack React framework |
| Page Builder | Craft.js | Drag-drop canvas framework |
| Charts | Chart.js | Render charts in builder and templates |
| Styling | Tailwind CSS | Utility-first styling |
| State | React Context + Zustand | Global state (template, user) |
| Forms | React Hook Form + Zod | Form handling and validation |

### Backend

| Layer | Technology | Purpose |
|-------|------------|---------|
| API Routes | Next.js API Routes | REST endpoints |
| Database | Supabase (PostgreSQL) | User data, templates, subscriptions |
| Auth | Supabase Auth | Email/password authentication |
| Storage | Supabase Storage | Template images and assets |
| Payments | Stripe | Subscriptions and billing |

### Infrastructure

| Component | Technology | Purpose |
|-----------|------------|---------|
| Hosting | Vercel | Next.js deployment |
| Domain | Custom domain | SSL included |
| CI/CD | Vercel + GitHub | Automatic deployments |

---

## Project Structure

```
labview-report-builder/
├── app/
│   ├── (marketing)/          # Landing page, pricing
│   ├── (auth)/               # Login, signup
│   ├── (app)/                # Authenticated app
│   │   ├── dashboard/        # Template list
│   │   └── builder/[id]/     # Template editor
│   ├── api/
│   │   ├── auth/
│   │   ├── billing/
│   │   └── templates/
│   └── layout.tsx
├── components/
│   ├── builder/              # Craft.js components
│   ├── ui/                   # Shared UI components
│   └── marketing/            # Landing page components
├── lib/
│   ├── supabase/             # Supabase client and helpers
│   ├── stripe/               # Stripe client and helpers
│   └── template/             # Template compilation logic
├── types/                    # TypeScript types
└── public/                   # Static assets
```

---

## Design Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture | Monolithic Next.js + Supabase | Simplest to develop and deploy |
| Template Format | Single HTML file | Truly offline, no dependencies |
| PDF Generation | Headless Chrome/Edge | Best rendering, already installed |
| Canvas Library | Craft.js | Full page builder framework, accelerates development |
| Charts | Chart.js | Covers 90% of test report needs |
| Data Binding | Simple path binding | Straightforward for users |
| Auth/Billing | Custom with Stripe | Full control, no third-party dependencies |
