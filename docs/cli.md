# report-cli

`report-cli` renders Report Builder templates (`.rbt.json`) to PDF. It runs offline and needs no
browser. It is one self-contained executable.

```
report-cli render   -t Final.rbt.json -d SN123.json -o out/SN123.pdf [--pdfa] [--strict] [--json]
report-cli batch    -t Final.rbt.json --data-dir runs/ --out-dir pdfs/ [--name "{{ dut.serial }}"] [-j 8]
report-cli validate -t Final.rbt.json [-d SN123.json] [--strict] [--json]
report-cli schema   -t Final.rbt.json          # data fields the template reads
report-cli schema   --infer SN123.json         # JSON Schema inferred from a data file
report-cli migrate  legacy-template.json -o New.rbt.json
report-cli starters [--create ate-final-test -o Final.rbt.json]
report-cli serve    [--port 7878] [--static desktop/dist]
```

## render

| Option | Meaning |
|---|---|
| `-t, --template` | Template file (`.rbt.json`) |
| `-d, --data` | JSON data file, or `-` for stdin. If omitted, the template's sample data is used |
| `-o, --output` | Output PDF (missing folders are created). With `--svg`, an output folder |
| `--pdfa` | Write PDF/A-2b for long-term archival |
| `--svg` | Write one SVG per page instead of a PDF |
| `--strict` | Fail with exit code 2 when the data lacks fields the template uses |
| `--now <ISO-8601>` | Fixed "current time" for reproducible output |
| `--fonts <dir>` | Extra font folder (repeatable) |
| `--json` | Print one JSON result line on stdout |

With `--json`, success looks like:

```json
{"ok":true,"output":"out/SN123.pdf","pages":2,"warnings":0,"elapsedMs":37,"issues":[]}
```

PDFs are written atomically: the CLI writes a temporary `.pdf.partial` file and then renames it,
so readers never see a half-written file.

The legacy form `report-cli -t T -d D -o O` (no subcommand) is still accepted. The legacy options
`--wait`, `--format`, `--margin` and `--no-header-footer` are ignored: page setup now lives in the
template.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | Usage or I/O error (missing file, invalid JSON, legacy HTML template) |
| 2 | Validation failed: template errors, or warnings with `--strict` |
| 3 | Layout or PDF generation failed. For `batch`: at least one file failed |

## batch

`batch` renders every `*.json` file in `--data-dir` in parallel. `--name` is a template for output
file names, e.g. `"{{ dut.serial }}_{{ date(test.start, 'YYYYMMDD-HHmm') }}"`; unsafe characters
are replaced. `--json` prints a per-file summary.

## serve

`serve` starts a JSON API on `127.0.0.1` only. Requests with non-local `Host` or `Origin` headers
are rejected. The desktop editor uses this API when it runs in a browser, and any tool can call it:

| Endpoint | Body | Returns |
|---|---|---|
| `GET /api/health` | — | `{ok, version}` |
| `GET /api/starters` | — | Built-in templates with sample data |
| `POST /api/pdf` | `{template, data, pdfStandard?}` | `application/pdf` |
| `POST /api/preview` | `{template, data}` | `{pages: [svg], pageSizes, regions, issues, elapsedMs}` |
| `POST /api/validate` | `{template, data?}` | `{issues, referencedPaths}` |
| `POST /api/data-paths` | data | Bindable fields |
| `POST /api/infer-schema` | data | JSON Schema |
| `POST /api/migrate` | legacy JSON | `{document, notes}` |
