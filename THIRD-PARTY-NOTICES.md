# Third-party notices

Report Builder is released under the [MIT License](LICENSE). It includes or links the following
third-party components.

## Bundled fonts

The engine embeds these fonts in `report-cli`, the `reportbuilder` library and the desktop app,
so reports render identically on every machine. Their license texts are in
[`engine/reportcore/fonts`](engine/reportcore/fonts) and are included in every release package.

| Font | License | License text |
|---|---|---|
| [Inter](https://github.com/rsms/inter) | SIL Open Font License 1.1 | [`Inter-LICENSE.txt`](engine/reportcore/fonts/Inter-LICENSE.txt) |
| [Libertinus Serif](https://github.com/alerque/libertinus) | SIL Open Font License 1.1 | [`Libertinus-LICENSE.txt`](engine/reportcore/fonts/Libertinus-LICENSE.txt) |
| [DejaVu Sans Mono](https://dejavu-fonts.github.io/) | Bitstream Vera / Arev fonts license (permissive) | [`DejaVu-LICENSE.txt`](engine/reportcore/fonts/DejaVu-LICENSE.txt) |

Fonts are embedded (subset) in the PDFs Report Builder produces, as these licenses permit.

## Libraries

- **[Typst](https://github.com/typst/typst)** (Apache-2.0): the typesetting engine behind every
  PDF and preview.
- **Rust crates**: every dependency in [`Cargo.lock`](Cargo.lock) is under a permissive license
  (MIT, Apache-2.0, BSD, ISC, Zlib, Unicode-3.0, Unlicense, CC0/0BSD or BSL-1.0) except a few
  crates under MPL-2.0, a file-level license whose source is available unmodified on
  [crates.io](https://crates.io). No GPL-licensed code is linked.
- **Desktop UI** (npm runtime dependencies in
  [`desktop/package-lock.json`](desktop/package-lock.json)): MIT, ISC and MIT/Apache-2.0,
  including React, Zustand, Lucide icons (ISC) and the Tauri JavaScript API.
- **[Tauri](https://tauri.app)** (MIT/Apache-2.0): the desktop app shell.

To list the exact license of every Rust dependency:

```bash
cargo metadata --format-version 1 | jq -r '.packages[] | "\(.name) \(.version): \(.license)"'
```
