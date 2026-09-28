# Contributing to Report Builder

Thanks for helping! Bug reports, template examples, docs fixes and code are all welcome.

## Reporting bugs and asking for features

Use [GitHub Issues](https://github.com/zeshanabdullah10/ReportBuilder/issues). For rendering bugs,
attach the template (`.rbt.json`) and a small data file that reproduces the problem, with any
private values replaced. Please report security problems privately; see [SECURITY.md](SECURITY.md).

## Development setup

You need [Rust](https://rustup.rs) (stable) and [Node.js](https://nodejs.org) 22 or newer.
On Linux, the desktop app also needs WebKitGTK:

```bash
sudo apt-get install libwebkit2gtk-4.1-dev libsoup-3.0-dev librsvg2-dev libayatana-appindicator3-dev
```

```bash
# Engine, CLI and LabVIEW library
cargo test --workspace
cargo build --release -p report-cli -p reportcore-ffi

# Desktop app
cd desktop
npm ci
npm run tauri dev          # native app with hot reload
```

The repository layout is described in the [README](README.md#development) and the design in
[docs/architecture.md](docs/architecture.md).

## Before you open a pull request

CI runs these checks; please run them locally first:

```bash
cargo fmt --all --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace

cd desktop
npx tsc -b --noEmit
npm test
cargo build --release -p report-cli && npx playwright test   # end-to-end tests
```

Guidelines:

- **Keep output deterministic.** Use only the bundled fonts and `RenderOptions.now` for dates, so
  the same template and data always produce the same PDF.
- **Embed user data safely.** Generated Typst must only include data through `typst_gen::lit()`
  string literals.
- **Adding a block type?** Update `engine/reportcore/src/model.rs`, `typst_gen.rs` and
  `validate.rs`, mirror it in `desktop/src/lib/types.ts` and `desktop/src/lib/blocks.ts`, add it
  to the inspector, and document it in [docs/template-format.md](docs/template-format.md).
- **Changing the C ABI?** Update `engine/reportcore-ffi/include/reportbuilder.h`, the Python and C#
  bindings, and the [LabVIEW guide](integrations/labview/README.md). Existing functions must stay
  compatible, because test stations call them from compiled LabVIEW code.
- Add or update tests with every behavior change.

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).

## Releasing (maintainers)

1. Bump `version` in `Cargo.toml`, `desktop/package.json` and `desktop/src-tauri/tauri.conf.json`,
   and add a section to [CHANGELOG.md](CHANGELOG.md).
2. Merge to `master`, then tag it: `git tag v1.2.3 && git push origin v1.2.3`.
3. The [Release workflow](.github/workflows/release.yml) builds every installer and package, and
   publishes the GitHub Release once all builds succeed.
