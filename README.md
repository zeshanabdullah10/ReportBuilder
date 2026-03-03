# LabVIEW Report Builder

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modern, open-source, drag-and-drop report builder application for creating customizable test reports with LabVIEW integration. Built with Next.js, React, and Craft.js.

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
- **Export Capabilities**: Export reports to standalone HTML files that work offline
- **Authentication**: Secure user authentication with Supabase
- **Video Generation**: Remotion integration for video report generation
- **Version Control**: Report versioning and history tracking
- **Sharing & Collaboration**: Share reports with team members
- **100% Open Source**: MIT licensed - free to use, modify, and distribute

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Drag-and-Drop**: Craft.js
- **Charts**: Chart.js, react-chartjs-2
- **Backend**: Supabase (Auth, Database)
- **Video**: Remotion
- **Testing**: Vitest, Testing Library
- **State Management**: Zustand
- **Form Handling**: React Hook Form, Zod

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (free tier works great)

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
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the following SQL in the SQL Editor to create the required tables:

```sql
-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  company TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates table
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  canvas_state JSONB NOT NULL DEFAULT '{}',
  sample_data JSONB,
  settings JSONB,
  is_public BOOLEAN DEFAULT FALSE,
  is_shared BOOLEAN DEFAULT FALSE,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template versions table
CREATE TABLE template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES templates(id) NOT NULL,
  version_number INTEGER NOT NULL,
  canvas_state JSONB NOT NULL,
  sample_data JSONB,
  settings JSONB,
  change_description TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template shares table
CREATE TABLE template_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES templates(id) NOT NULL,
  share_type TEXT NOT NULL CHECK (share_type IN ('link', 'user', 'org')),
  share_token UUID DEFAULT gen_random_uuid(),
  shared_with_email TEXT,
  organization_id UUID,
  permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'edit')),
  password_hash TEXT,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ
);

-- Custom components table
CREATE TABLE custom_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'custom',
  component_type TEXT NOT NULL,
  config JSONB NOT NULL,
  thumbnail_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template assets table
CREATE TABLE template_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES templates(id) NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_assets ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (customize as needed)
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own templates" ON templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create templates" ON templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates" ON templates FOR DELETE USING (auth.uid() = user_id);
```

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

## Deployment

### Vercel (Recommended)

The easiest way to deploy this application is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import the project in Vercel
3. Add your environment variables
4. Deploy

### Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### Self-Hosted

1. Build the application: `npm run build`
2. Start the server: `npm run start`
3. The application will be available at `http://localhost:3000`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/yourusername/labview-report-builder/issues)
- 💬 [Discussions](https://github.com/yourusername/labview-report-builder/discussions)

## Acknowledgments

- [Craft.js](https://craft.js.org/) - For the amazing drag-and-drop framework
- [Supabase](https://supabase.com/) - For the backend infrastructure
- [Next.js](https://nextjs.org/) - For the React framework
