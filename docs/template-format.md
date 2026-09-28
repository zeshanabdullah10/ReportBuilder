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
  "sampleData": { /* example data for previews and validation */ },
  "editor": { /* editor-only state such as extra data sets; ignored when rendering */ }
}
```

- **Page**: `size` is `a3`, `a4`, `a5`, `letter`, `legal` or `custom` (with `widthMm`/`heightMm`).
  Margins are in millimetres.
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
| `table` | `source` (list expression), `columns: [{header, value, width, align}]`, `rowTone`, `zebra`, `repeatHeader`, `emptyText`, `fontSize` |
| `measurementTable` | `source`, `fields: {name, value, low, high, nominal, unit, status}`, `decimals`, `showIndex/Nominal/Limits/Unit/Status`, `highlightFailures`, `failuresOnly` |
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
| `section` | `title`, `blocks`, `repeat` (list expression), `as` (alias), `keepTogether`, `pageBreakBefore`, `boxed` |

Chart series: `source` is a list. `y` is evaluated per item (with `item` and `index` in scope) and
defaults to the item itself. `x` defaults to the position, or to the category for bar and pie
charts.

## Validation

`report-cli validate -t T.rbt.json [-d data.json]`, and the editor's issue list, report the
following:

- **errors**: expressions that do not parse, duplicate ids, a template newer than the engine
- **warnings**: data fields the template reads but the data lacks; empty tables or charts
- **the data contract**: every data path the template reads (`report-cli schema -t`)

## Migrating legacy web-builder templates

`report-cli migrate old.json -o new.rbt.json` (or *Import legacy template…* in the app) converts
Craft.js canvas state from the old web builder. Components are ordered top to bottom; components
side by side become `columns`; `{{data.x}}` bindings are kept. The command prints anything it
could not convert.
