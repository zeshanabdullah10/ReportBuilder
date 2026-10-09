# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Report Builder is a **local-first desktop app and Rust rendering engine** for data-driven test reports (LabVIEW is the primary market). Users design templates (`.rbt.json`) in the desktop editor; test stations render PDFs through `reportbuilder.dll` (LabVIEW Call Library Function Node), `report-cli`, or the Python/C# bindings. Rendering uses an embedded Typst typesetter: no browser, no network, deterministic output.

Templates from the retired Next.js + Supabase web builder can be imported with `report-cli migrate` (`engine/reportcore/src/migrate.rs`).

## Layout

| Path | What |
|------|------|
| `engine/reportcore` | Engine library: `model.rs` (document model), `expr.rs` (expression language), `validate.rs` (checks, data contract, `dataMap`, unknown keys), `codegen.rs` (typed structures from the contract), `import.rs` (CSV and lenient data parsing), `typst_gen.rs` (doc+data → Typst source, string literals only), `charts.rs`/`codes.rs` (SVG), `render.rs` (Typst World, PDF/SVG, block regions), `api.rs` (JSON API shared by all front ends), `gallery.rs` + `templates/` (starters), `migrate.rs` (legacy Craft.js import) |
| `engine/report-cli` | CLI (`render`, `batch`, `validate`, `schema`, `import`, `pack`, `migrate`, `starters`, `serve`) + localhost HTTP API (`server.rs`) |
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


 ## Preview Panel
  Panel %2 is the tmux preview shell. To show a document, run:
  tmux send-keys -t %4 'q' C-m 'preview "path/to/file"' C-m
