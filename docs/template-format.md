# Template format (`.rbt.json`)

A template is a JSON document. The desktop app writes it for you, but it is plain JSON, so you can
diff it, review it and generate it. The engine's source of truth is
[`engine/reportcore/src/model.rs`](../engine/reportcore/src/model.rs). Every field is optional and
falls back to a default.

```jsonc
{
  "schemaVersion": 1,
  "meta":  { "name": "Final Test", "revision": "B", "author": "Test Eng", "description": "", "tags": [] },
  "page":  { "size": "a4", "orientation": "portrait", "margins": { "top": 22, "right": 18, "bottom": 20, "left": 18 } },
  "theme": { "font": "sans", "fontSize": 9.5, "accentColor": "#0a5dc2", "passColor": "#1a7f37", "failColor": "#d1242f",
             "company": "Acme", "logo": "data:image/png;base64,…" },
  "header": [ /* blocks repeated at the top of every page */ ],
  "body":   [ /* the flowing report content */ ],
  "footer": [ /* blocks repeated at the bottom of every page */ ],
  "watermark": { "text": "DRAFT", "visibleIf": "status != 'RELEASED'", "opacity": 0.12 },
  "vars": [ { "name": "failures", "value": "count_if(measurements, 'status', 'FAIL')" } ],
  "dataMap": { "dut.serial": "uut.sn", "measurements": "results", "measurements[].value": "reading" },
  "labels": { "measured": "Messwert", "passRate": "Ausbeute" },
  "sampleData": { /* example data for previews and validation */ },
  "editor": { /* editor-only state such as extra data sets; ignored when rendering */ }
}
```

- **Page**: `size` is `a3`, `a4`, `a5`, `letter`, `legal` or `custom` (with `widthMm`/`heightMm`).
  Margins are in millimetres.
- **Computed fields** (`vars`): named expressions evaluated once, in order, before layout. Each is
  available to every expression by name (`{{ failures }}`, `failures > 0`), and later ones can use
  earlier ones. Use them instead of repeating a calculation in several blocks.
- **Field mapping** (`dataMap`): template field → data field (or expression). Applied to the data
  before rendering and validation, and only where the data lacks the template's field, so one
  template can serve stations that name things differently. Item fields map with `list[].field`;
  the right side is relative to the item (`reading`, `limits.lo`). The data contract is reported in
  the data's own names.
- **Wording** (`labels`, `meta.lang`): replace the words the engine prints itself, by key:
  `parameter`, `measured`, `low`, `high`, `nominal`, `unit`, `result`, `index`, `pass`, `fail`,
  `warn`, `skip`, `noResult`, `noFailures`, `total`, `passed`, `failed`, `passRate`, `date`.
  `meta.lang` (e.g. `de`) sets the document language for hyphenation.
- **Theme** (the brand kit): `font` is `sans` (Inter), `serif` (Libertinus Serif) or `mono`
  (DejaVu Sans Mono). These fonts are bundled, so output is identical on every machine. Colours
  are hex values. Blocks can also use the tokens `text`, `muted`, `accent`, `pass`, `fail` and
  `warn`.

## Layout model

Content **flows**. Blocks stack top to bottom, long tables break across pages and repeat their
header, and the header and footer repeat on every page. Nothing is absolutely positioned.
To place blocks side by side, use `columns`; to group or repeat blocks, use `section`.

Every block has an `id` (generated if missing) and an optional `visibleIf` expression.

## Blocks

| `type` | Key fields |
|---|---|
| `heading` | `text` (template), `level` 1–3, `align`, `color` |
| `text` | `text` (template with `**bold**`, `*italic*`, `` `mono` ``), `style: {size, weight, color, align, italic, mono}` |
| `callout` | `title`, `text`, `tone`: `info`/`pass`/`warn`/`fail` |
| `keyValue` | `title`, `items: [{label, value}]`, `columns` 1–4, `boxed` |
| `table` | `source` (list expression), `columns: [{header, value, width, align, status}]`, `rowTone`, `zebra`, `repeatHeader`, `emptyText`, `fontSize` |
| `measurementTable` | `source`, `fields: {name, value, low, high, nominal, unit, status}` (a field name of the row, or an expression with `row` in scope), `labels` (header overrides), `decimals`, `showIndex/Nominal/Limits/Unit/Status`, `highlightFailures`, `failuresOnly` |
| `summary` | `source`, `statusField`, optional `verdict` expression, `showCounts`, `showRate` |
| `status` | `label`, `value` (expression), `style`: `badge`/`banner` |
| `chart` | `kind`: `line`/`bar`/`scatter`/`histogram`/`pie`, `series: [{label, source, x, y, color}]`, `limits: [{label, value}]`, `xLabel`, `yLabel`, `heightMm`, `bins`, `legend`, `grid` |
| `gauge` | `value`, `min`, `max`, `low`, `high` (expressions), `unit`, `decimals`, `sizeMm` |
| `progress` | `label`, `value`, `max`, `color`, `showValue` |
| `image` | `src` (data URI, path relative to the template, or `{{ field }}`), `width` %, `align`, `caption` |
| `logo` | `heightMm`, `align` (draws `theme.logo`) |
| `qrCode` | `value` (template), `sizeMm`, `caption`, `align` |
| `barcode` | `value`, `format`: `code128`/`code39`/`ean13`, `widthMm`, `heightMm`, `showText` |
| `signatures` | `entries: [{role, name}]`, `showDate` |
| `divider` | `thickness` (pt), `color` |
| `spacer` | `heightMm` |
| `pageBreak` | — |
| `columns` | `columns: [{width (fr), blocks}]`, `gapMm` |
| `section` | `title`, `titleLevel` 1–4, `blocks`, `repeat` (list expression), `as` (alias), `keepTogether`, `pageBreakBefore`, `boxed` |

Chart series: `source` is a list. `y` is evaluated per item (with `item` and `index` in scope) and
defaults to the item itself. `x` defaults to the position, or to the category for bar and pie
charts. A limit line with an empty `label` is labelled with its value.

A table column with `"status": true` is a verdict column: its value is shown as a coloured
PASS/FAIL/WARN, and a failing or warning verdict tints the row. That replaces repeating the same
expression in `rowTone`, which still works and takes precedence.

## Validation

`report-cli validate -t T.rbt.json [-d data.json]`, and the editor's issue list, report the
following:

- **errors**: expressions that do not parse (including per-item bodies such as
  `each(list, 'it.v *')`), duplicate ids, invalid computed-field names, a template newer than the
  engine
- **warnings**, each pointing at the block and field:
  - data fields the template reads but the data lacks, with the closest field the data has
    (`data field 'dut.serail' is missing; did you mean 'dut.serial'?`). Fields read per row
    (`row.value`, `item.x`, a section's alias, measurement-table fields, `it.x`) are checked
    against the list's items. Reads that tolerate absence (`x ?? y`, `default(x, …)`, optional
    measurement columns) are not reported.
  - unknown functions (`fixd()` → did you mean `fixed()`?) and unknown settings (`sorce`)
  - `{{ page }}` inside a larger expression, and text fields holding a bare path such as
    `dut.serial` (which print literally)
  - empty tables or charts
- **the data contract**: every field the template reads, with its type (from sample data) and
  whether it is optional, in the data's own names (`report-cli schema -t`; JSON Schema with
  `--json-schema`, typed structures with `--types csharp|python|typescript|labview`)

## Migrating legacy web-builder templates

`report-cli migrate old.json -o new.rbt.json` (or *Import legacy template…* in the app) converts
Craft.js canvas state from the old web builder. Components are ordered top to bottom; components
side by side become `columns`; `{{data.x}}` bindings are kept. The command prints anything it
could not convert.
