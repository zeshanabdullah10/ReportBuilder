# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org).

## [1.0.0] - 2026-09-28

First open-source release of the local-first Report Builder.

### Added

- **Rendering engine** (`reportcore`): flowing document model (`.rbt.json`), expression language
  with formatting, statistics and PASS/FAIL verdicts, validation with a data contract, charts,
  histograms, gauges, QR codes and barcodes, and deterministic PDF, PDF/A-2b and SVG output through
  an embedded Typst typesetter and bundled fonts.
- **Desktop editor** for Windows, macOS and Linux, with a live preview from the same engine,
  starter gallery, data autocomplete, sample, stress-test and empty data sets, command palette
  and undo/redo.
- **`report-cli`**: `render`, `batch`, `validate`, `schema`, `migrate`, `starters` and `serve`,
  with stable exit codes.
- **`reportbuilder` library** with a C ABI for LabVIEW's Call Library Function Node (32- and
  64-bit Windows), plus Python and C# bindings.
- Import of templates from the retired web builder (`report-cli migrate`).

### Removed

- The hosted Next.js + Supabase web builder and its headless-Chrome PDF export.

[1.0.0]: https://github.com/zeshanabdullah10/ReportBuilder/releases/tag/v1.0.0
