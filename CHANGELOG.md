# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org).

## [Unreleased]

### Added

- **Mistakes are reported instead of rendering blank.** Validation names the block and field for
  every missing data field and suggests the closest one the data has; checks fields read per row
  (`row.x`, `item.x`, section aliases, measurement-table fields, `it.x`) against the list's items;
  and reports unknown functions (`fixd()` → `fixed()`), unknown settings (`sorce`), syntax errors
  inside `each`/`select` bodies, `{{ page }}` inside larger expressions, and bare paths in text
  fields.
- **Typed data contract.** Every field the template reads, with its type and whether it is
  optional, in the data's own names. `report-cli schema -t T --json-schema` and
  `--types csharp|python|typescript|labview`; the editor's *Use this template* panel saves the
  JSON Schema and example data and shows the generated structures.
- **Computed fields** (`vars`), **field mapping** (`dataMap`: let one template read stations'
  differently named data, applied at render time), and **wording** (`labels`, `meta.lang`) for the
  words the engine prints.
- **Verdict columns** (`"status": true` on a table column) colour the verdict and tint the row,
  replacing duplicated `rowTone` expressions. Measurement-table fields accept expressions and
  per-table header labels. Sections get `titleLevel`.
- **Functions**: `limits()`, `with_unit()`, `count_by()`, `group_by()`, `split()`, `lvtime()`,
  and a WARN margin for `status()`.
- **LabVIEW data**: numeric LabVIEW timestamps (1904 epoch) and bare `NaN`/`Infinity` tokens are
  accepted.
- **CSV data** everywhere: `render -d x.csv`, `batch`, `rb_render_file`, `report-cli import`, the
  editor's welcome screen and data panel.
- **CLI**: `batch --watch --done-dir --recursive --now --fonts`, collision-safe output names,
  `__file` in `--name`; `report-cli pack` embeds images so a template is one file; JSON results
  for I/O errors.
- **C ABI and bindings**: structured `issuesDetail` in every result, a `stage` on every error,
  `rb_render_to_memory` validates and honours `strict`; C# `RenderFile`/`RenderToMemory`, Python
  `font_dirs` and `render_file`.
- **Editor**: a default brand kit applied to new reports, recent files, *My templates*, copy/paste
  of blocks between documents, a saved-blocks library, and item-field matching in the mapping
  dialog.

### Changed

- `date()` of a missing value is empty instead of today's date; numeric text compares as numbers
  (`'10' > '9'`).
- Starters use verdict columns, `limits()` and `with_unit()`.
- `batch` no longer overwrites earlier PDFs with the same name (pass `--overwrite`).

## [1.1.0] - 2026-09-29

### Changed

- **Editor flow is data-first.** The welcome screen takes your test data (drop or paste a JSON
  file), recommends the templates that fit it, and offers a draft built from the data. When a
  template reads fields your data names differently, a matching step suggests the closest fields
  and rewrites the template.
- **Data tab shows a typed field tree** (text, number, date, PASS/FAIL, list, group) with live
  values and search; the raw JSON moved into an *Edit JSON* dialog and issues sit at the top.
- **Drag and drop rebuilt** on pointer events, with a drag ghost, autoscroll and drop hints.
  Drag fields from the Data tab onto the page (a list becomes a table or measurement table, a
  group becomes an info grid) or onto a block (add a column, set its source, insert a field).
  Drop a block on the left or right edge of another to place them side by side; the editor creates
  the columns for you and removes them when they empty. Blocks can be dragged from the page.
- Blocks are added from a **⊕ on the page**, the `/` key or the Layers panel; the Insert tab is gone.
  Common blocks come first. *Section* is now *Group / Repeat*.
- The inspector shows the essentials and folds the rest under *More* and *Advanced*, shows a
  breadcrumb for nested blocks, and picks data with a field picker (or a dropped field) instead
  of typed expressions. Text shows `{{ fields }}` as chips with live values; double-click a text
  block to edit it on the page.
- Toolbar reduced to the essentials; zoom moved to the canvas. Templates saved to a file are
  saved automatically in the desktop app.

### Added

- **Twelve new starter templates** and gallery categories: test summary, panel / multi-DUT, lot yield,
  station daily summary, burn-in / environmental soak, process capability (Cpk), raw data log,
  incoming inspection, nonconformance report, failure analysis (RMA), certificate of test and a
  serial / pass label. See `docs/starter-templates.md`. A test renders every starter with its own
  data and fails on any validation or render issue.
- **Use panel**: save the template, check it against another data file, see the data it needs, and
  copy the LabVIEW, command-line, Python or C# call.

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
