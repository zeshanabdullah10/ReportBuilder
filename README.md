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
├── report-cli/            # Rust CLI for offline PDF generation
│   ├── src/               # CLI source code
│   ├── Cargo.toml         # Rust dependencies
│   └── README.md          # CLI documentation
└── Report.html            # Standalone HTML report template
```

## Offline PDF Generation (report-cli)

The `report-cli` tool enables fully offline PDF generation from HTML templates and JSON data. This is ideal for test stations that need to generate reports without internet connectivity.

### Features

- **Fully Offline**: No server or internet connection required
- **Pure JSON Input**: External systems only need to write JSON data
- **Headless Browser**: Uses Chrome/Edge for accurate PDF rendering
- **Cross-Platform**: Works on Windows, macOS, and Linux

### Installation

Pre-built binaries are available in the `report-cli/target/release/` directory, or build from source.

### Developer Build Instructions

#### Prerequisites

1. **Rust**: Install from [rustup.rs](https://rustup.rs/)
2. **Visual Studio Build Tools** (Windows only): Required for compiling native dependencies
   - Install from [Visual Studio Downloads](https://visualstudio.microsoft.com/downloads/)
   - Select "C++ build tools" workload

#### Building on Windows

The CLI requires native dependencies that need the Visual Studio development environment. Use one of these methods:

**Method 1: Using VsDevCmd (Recommended)**
```cmd
cmd /c ""C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\Common7\Tools\VsDevCmd.bat" && cd /d "PATH\TO\report-cli" && cargo build --release"
```

**Method 2: Using Developer Command Prompt**
1. Open "Developer Command Prompt for VS 2022" from Start Menu
2. Navigate to the report-cli directory
3. Run `cargo build --release`

**Method 3: Using x64 Native Tools Command Prompt**
1. Open "x64 Native Tools Command Prompt for VS 2022" from Start Menu
2. Navigate to the report-cli directory
3. Run `cargo build --release`

#### Building on macOS/Linux

```bash
cd report-cli
cargo build --release
```

#### Build Output

The compiled binary will be at:
- Windows: `report-cli/target/release/report-cli.exe`
- macOS/Linux: `report-cli/target/release/report-cli`

### Usage

```bash
report-cli.exe --template Report.html --data test_results.json --output Report.pdf
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `-t, --template` | HTML template file | (required) |
| `-d, --data` | JSON data file | (required) |
| `-o, --output` | Output PDF file | (required) |
| `-w, --wait` | JavaScript render wait time (ms) | 2000 |
| `-f, --format` | Page format (A4, Letter, Legal) | A4 |
| `-m, --margin` | Page margin in mm | 20 |
| `--no-header-footer` | Exclude page headers/footers | false |
| `-v, --verbose` | Verbose output | false |

### Integration Examples

**Python:**
```python
import json
import subprocess

data = {"testName": "Production Test", "overallStatus": "PASS"}
with open("results.json", "w") as f:
    json.dump(data, f)

subprocess.run(["report-cli.exe", "-t", "Report.html", "-d", "results.json", "-o", "Report.pdf"])
```

**LabVIEW:**
1. Use "Write to Text File" VI to create JSON file
2. Use "System Exec.vi" to call `report-cli.exe`

See [report-cli/README.md](report-cli/README.md) for detailed documentation.

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
