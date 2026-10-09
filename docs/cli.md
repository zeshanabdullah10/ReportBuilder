# report-cli

`report-cli` renders Report Builder templates (`.rbt.json`) to PDF. It runs offline and needs no
browser. It is one self-contained executable.

```
report-cli render   -t Final.rbt.json -d SN123.json -o out/SN123.pdf [--pdfa] [--strict] [--json]
report-cli batch    -t Final.rbt.json --data-dir runs/ --out-dir pdfs/ [--name "{{ dut.serial ?? __file }}"] [--watch]
report-cli validate -t Final.rbt.json [-d SN123.json] [--strict] [--json]
report-cli import   run.csv [-o run.json]       # CSV → data JSON
report-cli pack     -t Final.rbt.json -o Packed.rbt.json   # inline images for deployment
report-cli schema   -t Final.rbt.json          # data fields the template reads
report-cli schema   --infer SN123.json         # JSON Schema inferred from a data file
report-cli migrate  legacy-template.json -o New.rbt.json
report-cli starters [--create ate-final-test -o Final.rbt.json]
report-cli serve    [--port 7878] [--static desktop/dist]
```

## Data files

Every command that reads data (`render`, `batch`, `validate`) accepts:

- **JSON**, UTF-8 (with or without BOM) or Windows-1252. Bare `NaN`, `Infinity` and `-Infinity`
  tokens, as LabVIEW and Python's `json` module write them, are accepted and read as the strings
  `"NaN"`, `"Infinity"` and `"-Infinity"`, which expressions treat as numbers (a NaN measurement is a
  FAIL; a non-finite limit means "no limit").
- **CSV** (`.csv`, or `.tsv`), converted exactly like [`import`](#import) does.

## render

| Option | Meaning |
|---|---|
| `-t, --template` | Template file (`.rbt.json`) |
| `-d, --data` | Data file (`.json` or `.csv`), or `-` for JSON on stdin. If omitted, the template's sample data is used |
| `-o, --output` | Output PDF (missing folders are created). With `--svg`, an output folder |
| `--pdfa` | Write PDF/A-2b for long-term archival |
| `--svg` | Write one SVG per page instead of a PDF |
| `--strict` | Fail with exit code 2 when the data lacks fields the template uses |
| `--now <ISO-8601>` | Fixed "current time" for reproducible output |
| `--fonts <dir>` | Extra font folder (repeatable) |
| `--json` | Print one JSON result line on stdout |

With `--json`, stdout always receives exactly one JSON line, also for I/O errors. Success:

```json
{"ok":true,"output":"out/SN123.pdf","pages":2,"bytes":81234,"warnings":0,"elapsedMs":37,"issues":[],"issuesDetail":[]}
```

Failure:

```json
{"ok":false,"stage":"strict","error":"2 warning(s)","issues":[…],"issuesDetail":[…]}
```

| `stage` | Exit code | Meaning |
|---|---|---|
| `template` | 1 | Template missing, unreadable or not a valid template |
| `data` | 1 | Data file missing, unreadable, or not valid JSON/CSV |
| `validate` | 2 | Template (or data) has errors |
| `strict` | 2 | Warnings with `--strict` |
| `layout`, `pdf` | 3 | Layout or PDF generation failed |
| `io` | 1 | The output could not be written |

`issues` and `issuesDetail` are lists of `{severity, blockId, field, message}` objects (`issuesDetail`
leaves out `info` entries). `warnings` is the number of warnings. See the
[LabVIEW guide](../integrations/labview/README.md#4-alternative-system-exec) for how this compares to
the DLL's `result_json`.

PDFs are written atomically: the CLI writes a temporary `.pdf.partial` file and then renames it,
so readers never see a half-written file.

The legacy form `report-cli -t T -d D -o O` (no subcommand) is still accepted. The legacy options
`--wait`, `--format`, `--margin` and `--no-header-footer` are ignored: page setup now lives in the
template.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | Usage or I/O error (missing file, invalid JSON/CSV, unwritable output, legacy HTML template, bad `--name`) |
| 2 | Validation failed: template or data errors, or warnings with `--strict` (`pack --strict`: an image could not be inlined) |
| 3 | Layout or PDF generation failed |

`batch` classifies every file the same way and exits with the most severe code it saw: 3 if any
file failed layout/PDF generation, otherwise 2 if any failed validation or `--strict`, otherwise 1
if any data file could not be read or parsed (or its PDF could not be written), otherwise 0.

## batch

`batch` renders every `*.json`, `*.csv` and `*.tsv` file in `--data-dir` in parallel (`*.rbt.json`
templates are skipped).

| Option | Meaning |
|---|---|
| `-t, --template` | Template file |
| `--data-dir` | Folder with the data files |
| `--out-dir` | Folder for the PDFs (created if missing) |
| `--name <template>` | Output file name (without `.pdf`), e.g. `"{{ dut.serial }}_{{ date(test.start, 'YYYYMMDD-HHmm') }}"`. `__file` is the data file name without extension, so `"{{ dut.serial ?? __file }}"` falls back to it. Unsafe characters are replaced. Default: the data file name |
| `-r, --recursive` | Also process sub-folders (the output and done folders are skipped) |
| `--watch` | Keep running and poll the folder: render each new or changed file once its size and modification time are stable between two polls. Unchanged files are never rendered twice. Stop with Ctrl+C |
| `--interval <ms>` | Polling interval for `--watch` (default 1000) |
| `--done-dir <dir>` | Move each successfully rendered data file here (keeping its sub-folder; `-2`, `-3`, … if the name is taken). Failed files stay where they are |
| `--overwrite` | Replace PDFs that already exist in `--out-dir` |
| `--pdfa`, `--strict`, `--now`, `--fonts` | As for `render` |
| `-j, --jobs` | Parallel workers (default: CPU count) |
| `--json` | Print one JSON summary on stdout; with `--watch`, one JSON line per file as it is rendered |

**Output names never collide.** When two data files produce the same name, or the PDF already
exists from an earlier run, the new file is written as `name-2.pdf`, `name-3.pdf`, … and a warning
says so (`renamedFrom` in `--json`). Suffixes follow the data file order. In `--watch` mode a
changed data file re-renders to the PDF it produced before. Pass `--overwrite` to replace PDFs from
earlier runs instead.

**Missing `--name` fields warn.** If `--name` reads a field the data doesn't have, the file still
renders and a warning names the field; an empty name falls back to the data file name. A `--name`
that doesn't parse is a usage error (exit 1) before anything renders.

With `--json` each result looks like
`{"data":"runs/a.json","ok":true,"output":"pdfs/S1.pdf","pages":2,"warnings":0,"renamedFrom":null,"movedTo":null,"notes":[]}`
or `{"data":…,"ok":false,"code":2,"stage":"strict","error":"…","issues":[…],"notes":[]}`. The summary
adds `count`, `failed`, `exitCode` and `elapsedMs`.

A station-side drop folder:

```
report-cli batch -t Final.rbt.json --data-dir C:\Results\inbox --out-dir C:\Reports ^
  --done-dir C:\Results\done --name "{{ dut.serial ?? __file }}_{{ date(test.start, 'YYYYMMDD-HHmm') }}" --watch
```

## import

`report-cli import run.csv [-o run.json]` converts a CSV file to data JSON (stdout by default). The
same conversion is used when a `.csv` file is passed as data anywhere.

- RFC 4180: quoted fields, `""` escapes, delimiters and line breaks inside quotes, CRLF, UTF-8 BOM,
  Windows-1252. The delimiter is detected among `,`, `;` and tab.
- **Preamble.** Leading rows with exactly two non-empty cells (`Serial,SN123`) become top-level
  fields with camelCase keys (`"serial": "SN123"`), as long as a wider header row follows.
- **Header.** The next row names the columns; keys are camelCase (`Low Limit` → `lowLimit`).
- **Values.** Numbers become numbers (a decimal comma such as `4,75` is accepted when the delimiter
  is `;`), `true`/`false` booleans, empty cells `null`. Numbers with leading zeros (`007`) stay text.
- **Measurements or rows.** If the columns include a value column (`Value`, `Measured`, `Reading`,
  `Result`, …) and a limit column (`Low`/`High`, `Min`/`Max`, `LSL`/`USL`, `Lower Limit`, …), the rows
  go under `measurements` and those columns are renamed to `name`, `value`, `low`, `high`,
  `nominal`, `unit`, `status`. Otherwise they go under `rows` with their header names.

```
Serial,SN-0012
Operator,J. Rivera
Parameter,Measured,Min,Max,Units
VBUS,4.995,4.75,5.25,V
```

becomes

```json
{"serial":"SN-0012","operator":"J. Rivera",
 "measurements":[{"name":"VBUS","value":4.995,"low":4.75,"high":5.25,"unit":"V"}]}
```

## pack

`report-cli pack -t Final.rbt.json -o Packed.rbt.json` writes a self-contained copy of a template:
every image block `src` and `theme.logo` that points to a `.png`, `.jpg`, `.gif`, `.svg` or `.webp`
file (relative to the template's folder, or absolute) is embedded as a `data:` URI. Deploy the packed
file to a station on its own.

It reports what it inlined and what it could not: sources that use `{{ }}` (resolved per report at
render time — ship those files next to the template), remote URLs, and missing files. `--strict`
exits with code 2 if anything could not be inlined; `--json` prints
`{"ok","output","inlined":[{at,src,bytes}],"skipped":[{at,src,reason}]}`.

## serve

`serve` starts a JSON API on `127.0.0.1` only. Requests with non-local `Host` or `Origin` headers
are rejected. The desktop editor uses this API when it runs in a browser, and any tool can call it.
Request bodies may contain bare `NaN`/`Infinity`.

| Endpoint | Body | Returns |
|---|---|---|
| `GET /api/health` | — | `{ok, version}` |
| `GET /api/starters` | — | Built-in templates with sample data |
| `POST /api/pdf` | `{template, data?, pdfStandard?, now?, baseDir?, strict?}` | `application/pdf`; with `strict`, any warning gives 422 `{error, stage: "strict", issues}` |
| `POST /api/preview` | `{template, data?, now?, baseDir?}` | `{pages: [svg], pageSizes, regions, issues, elapsedMs}` |
| `POST /api/validate` | `{template, data?}` | `{issues, referencedPaths}` |
| `POST /api/data-paths` | data | Bindable fields |
| `POST /api/infer-schema` | data | JSON Schema |
| `POST /api/import-csv` | `{text, name?}` | Data JSON, as `report-cli import` |
| `POST /api/migrate` | legacy JSON | `{document, notes}` |

Render request fields:

| Field | Meaning |
|---|---|
| `template` | The template document (JSON object) |
| `data` | Data; omitted or `null` uses the template's `sampleData` |
| `pdfStandard` | `"none"` (default), `"a2b"` or `"a3b"` |
| `now` | Fixed ISO 8601 timestamp for `now()` and "generated at", for reproducible output |
| `baseDir` | Folder that relative image paths resolve against (usually the template's folder) |
| `strict` | `/api/pdf` only: fail with 422 instead of returning a PDF when there are warnings |

Errors are JSON `{error}` with status 400 (malformed request) or 422 (invalid template, render failure).
