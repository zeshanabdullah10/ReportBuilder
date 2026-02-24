# LabVIEW Report Builder

A modern, drag-and-drop report builder application for creating customizable test reports with LabVIEW integration. Built with Next.js, React, and Craft.js.

## Features

- **Drag-and-Drop Builder**: Intuitive interface for designing report layouts using Craft.js
- **Rich Component Library**: Pre-built components for test reports including:
  - Measurement tables with pass/fail status
  - Charts (line, bar, scatter, histogram)
  - Status indicators and progress bars
  - QR codes and barcodes
  - Specification tables
  - Revision history
- **LabVIEW Integration**: JSON-based data binding for seamless integration with LabVIEW test systems
- **Export Capabilities**: Export reports to various formats
- **Authentication**: Secure user authentication with Supabase
- **Billing Integration**: Stripe-powered subscription management
- **Video Generation**: Remotion integration for video report generation
- **Version Control**: Report versioning and history tracking
- **Sharing & Collaboration**: Share reports with team members

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Drag-and-Drop**: Craft.js
- **Charts**: Chart.js, react-chartjs-2
- **Backend**: Supabase (Auth, Database)
- **Payments**: Stripe
- **Video**: Remotion
- **Testing**: Vitest, Testing Library
- **State Management**: Zustand
- **Form Handling**: React Hook Form, Zod

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Stripe account (for billing features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/labview-report-builder.git
cd labview-report-builder
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Configure the following environment variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
STRIPE_SECRET_KEY=your_stripe_secret_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Run tests with coverage |
| `npm run video` | Start Remotion studio |
| `npm run video:render` | Render video project |

## Project Structure

```
labview-report-builder/
├── app/                    # Next.js App Router pages
│   ├── (app)/             # Authenticated app routes
│   ├── (auth)/            # Authentication pages
│   ├── (marketing)/       # Marketing/public pages
│   ├── api/               # API routes
│   └── actions/           # Server actions
├── components/
│   ├── builder/           # Report builder components
│   │   ├── canvas/        # Canvas/drawing area
│   │   ├── components/    # Draggable report components
│   │   ├── custom/        # Custom components
│   │   ├── export/        # Export functionality
│   │   ├── layers/        # Layer management
│   │   ├── navigation/    # Builder navigation
│   │   ├── settings/      # Component settings
│   │   ├── toolbox/       # Component toolbox
│   │   └── topbar/        # Top toolbar
│   ├── dashboard/         # Dashboard components
│   ├── ui/                # Reusable UI components
│   └── ...
├── docs/                  # Documentation
├── sample-data/           # Sample JSON data for testing
├── plans/                 # Project planning documents
└── _bmad/                 # BMAD workflow configuration
```

## LabVIEW Integration

The Report Builder integrates with LabVIEW through a JSON-based data binding system. LabVIEW generates JSON data files that are automatically loaded into report templates.

### Data Binding Syntax

Components use the `{{data.path}}` syntax to reference values:

```
{{data.meta.reportTitle}}     → "PCB Assembly Test Report"
{{data.testInfo.operator}}    → "John Smith"
{{data.summary.passed}}       → 142
```

### JSON Schema

See [docs/labview-json-schema.md](docs/labview-json-schema.md) for the complete JSON schema specification.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary. All rights reserved.

## Support

For support, please contact the development team or open an issue in the repository.
