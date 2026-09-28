# Architecture

```
engine/reportcore      Rust library: model, expressions, validation, layout → Typst → PDF/SVG
engine/report-cli      CLI + local HTTP API                         (report-cli)
engine/reportcore-ffi  C ABI for LabVIEW / C / C# / Python          (reportbuilder.dll / .so / .dylib)
desktop/               Tauri 2 desktop app: React editor (src/) + Rust shell (src-tauri/)
integrations/          LabVIEW guide, Python and C# bindings
```

**One engine, every surface.** The desktop editor, the CLI, the HTTP API and the LabVIEW library
all call the same `reportcore` functions (`reportcore::api`). What the editor previews is exactly
what a test station prints.

## Rendering pipeline

1. **Parse**. `.rbt.json` becomes `model::Document`. Missing fields take defaults and missing
   block ids are generated.
2. **Generate** (`typst_gen.rs`). Walk the blocks, evaluate every expression in Rust against the
   JSON data, and emit Typst source that contains only *string literals*, so user data can never
   inject markup. Charts, gauges, QR codes and barcodes are drawn as SVG in Rust (`charts.rs`,
   `codes.rs`) and passed to Typst as virtual files.
3. **Lay out** (`render.rs`). A self-contained Typst `World` with bundled fonts, no file system,
   no network and no packages. Typst paginates, breaks tables across pages with repeated headers,
   keeps sections together and numbers pages.
4. **Export**: PDF (optionally PDF/A-2b), or one SVG per page for the editor. In preview mode,
   invisible markers around each block let `block_regions()` report where every block landed, which
   powers click-to-select on the canvas.

Performance on a laptop: a 2-page test report renders to PDF in about 35 ms. Editor previews
re-render in about 6 ms thanks to Typst's incremental compilation.

## Why Typst instead of headless Chrome

The previous design exported HTML plus a JavaScript runtime and printed it with headless Chrome.
That had these problems:

- Every component was implemented three times: the React editor view, an HTML string renderer and
  a runtime binder. They drifted apart; for example, histograms, QR codes and measurement tables
  ignored live data in exports.
- It needed Chrome on every test station, waited a fixed 2 s per report, and was hard to make
  deterministic.
- Absolute positioning could not paginate variable-length data.

Typst is a Rust library: one binary, deterministic output, real pagination and PDF/A support.

## Desktop app

- React + TypeScript + Zustand. State is one immutable document with undo/redo snapshots, and
  rapid edits to the same field coalesce into one step.
- The preview is the engine's SVG output, debounced by 120 ms; stale responses are discarded.
- In Tauri, commands run the engine in-process on a blocking thread. In a browser, the same UI
  talks to `report-cli serve` through `src/lib/engine.ts`, which is how the end-to-end tests run.
- File commands only read and write `.json` files, and exports only `.pdf`. The CSP forbids remote
  content.

## Templates from the old web builder

An earlier version of Report Builder was a hosted web app. It has been retired; templates exported
from it can be converted with `report-cli migrate` or *Import legacy template…* in the desktop app.
