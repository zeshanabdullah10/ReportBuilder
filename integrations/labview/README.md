# LabVIEW integration

Report Builder renders PDFs **inside your LabVIEW process** through a native
library. You don't need a browser or a local server, and it works offline.
A typical report renders in 50–200 ms.

You can integrate in two ways:

| | Call Library Function Node (recommended) | System Exec + `report-cli` |
|---|---|---|
| Speed | Fastest; fonts load once per process | Starts a new process for each report |
| Errors | Status code plus a JSON result | Exit code plus stderr / `--json` on stdout |
| Deploy | `reportbuilder.dll` next to your VIs | `report-cli.exe` anywhere |

Both options use the same engine and give the same output.

---

## 1. Install

1. Download the release archive for your platform. Use `reportbuilder-windows-x64.zip`
   for 64-bit LabVIEW, or `reportbuilder-windows-x86.zip` for 32-bit LabVIEW.
   **The bitness must match LabVIEW, not Windows.**
2. Copy `reportbuilder.dll` next to your top-level VI, or into your project's `support` folder.
3. In the desktop app, design your template and save it as `MyReport.rbt.json`.

## 2. Build the data as JSON

Report Builder reads the JSON that LabVIEW's native **Flatten To JSON** produces:

- Cluster element **labels** become JSON keys. Name them the way you want to reference them in the
  template, e.g. `dut.serial` means a cluster `dut` with an element `serial`.
- An **array of clusters** becomes an array of objects. This is exactly what tables, measurement tables,
  charts and repeated sections consume.
- Leave *Enable LabVIEW extensions* **off**.
- Write timestamps as ISO 8601 strings. Use *Format Date/Time String* with `%Y-%m-%dT%H:%M:%S%z`,
  then use `date(test.start, 'D MMM YYYY HH:mm')` in the template.

A typical data cluster:

```
Report Data (cluster)
├── dut (cluster): serial (string), model (string)
├── station (cluster): id (string), operator (string)
├── test (cluster): name (string), start (string, ISO 8601)
└── measurements (1D array of cluster)
      name (string), value (DBL), low (DBL), high (DBL), unit (string), status (string, optional)
```

A measurement table computes PASS/FAIL from `value`, `low` and `high` when `status` is missing.
To leave a limit open, send `NaN`, `null`, or omit the field. Any non-finite limit means "no limit".
A `NaN` **measured value** always counts as a FAIL, never as a pass.

**NaN and Infinity.** JSON has no NaN, so tools write it in different ways. All of these are accepted
for a DBL: the strings `"NaN"`, `"Infinity"`, `"-Infinity"`, and the bare tokens `NaN`, `Infinity`,
`-Infinity` (also `nan`, `inf`, `-inf`) that LabVIEW and Python's `json` module can emit. You don't
need to replace them before calling the library.

### CSV instead of JSON

If your sequence already logs a CSV file, render it directly: pass the `.csv` path to
`rb_render_file` (or `report-cli render -d run.csv`). The file is converted like this:

```
Serial,SN-0012                         ← key/value rows before the table become fields:
Operator,J. Rivera                       {"serial": "SN-0012", "operator": "J. Rivera", ...}
Parameter,Measured,Min,Max,Units       ← header row
VBUS,4.995,4.75,5.25,V                 ← one object per row
```

With a value column and a limit column (`Min`/`Max`, `Low`/`High`, `LSL`/`USL`, `Lower Limit`, …)
the rows become `measurements` with the standard keys `name`, `value`, `low`, `high`, `unit`,
`status`, so they drop straight into a measurement table. Other tables become `rows`. Commas,
semicolons (with decimal commas such as `4,75`) and tabs are all detected. Run
`report-cli import run.csv` to see the resulting JSON. Details: [docs/cli.md](../../docs/cli.md#import).

## 3. Call Library Function Node settings

Place a **Call Library Function Node** and configure `rb_render` as follows.

**Function tab**

| Setting | Value |
|---|---|
| Library name or path | `reportbuilder.dll` (use the *Specify path on diagram* option for relocatable code) |
| Function name | `rb_render` |
| Thread | **Run in any thread** (the library is thread-safe) |
| Calling convention | **C** |

**Parameters tab**, in this order:

| # | Name | Type | Data type / pass | Notes |
|---|---|---|---|---|
| return | `status` | Numeric | Signed 32-bit Integer | `0` means success; see the codes below |
| 1 | `template_path` | String | C String Pointer | Path to `.rbt.json`. Use *Path To String* |
| 2 | `data_json` | String | C String Pointer | Output of Flatten To JSON. An empty string uses the template's sample data |
| 3 | `output_pdf` | String | C String Pointer | Destination; missing folders are created |
| 4 | `options_json` | String | C String Pointer | e.g. `{"pdfa":true}`, or an empty string |
| 5 | `result_json` | String | C String Pointer, **Minimum size = `result_len`** | Receives the JSON result |
| 6 | `result_len` | Numeric | Signed 32-bit Integer, Value | Wire `4096` |

The generated prototype should read:

```c
int32_t rb_render(const char *template_path, const char *data_json, const char *output_pdf,
                  const char *options_json, char *result_json, int32_t result_len);
```

`rb_render_file` has the same shape, but parameter 2 is the **path** to a JSON file, or to a CSV
file when the path ends in `.csv`.
`rb_validate(template_path, data_json, result_json, result_len)` and
`rb_version(buf, len)` are useful at startup: log the version, and validate templates once
instead of on every UUT.

### Options

| Key | Meaning |
|---|---|
| `pdfa` | `true` writes PDF/A-2b. Use it for long-term test-record archives |
| `strict` | `true` fails with status `2` when the data lacks fields the template uses |
| `now` | Fixed ISO timestamp for `now()`/"generated at", for reproducible output |
| `fontDirs` | Extra folders with `.ttf`/`.otf` fonts, e.g. a corporate typeface |
| `baseDir` | Folder for relative image paths. Default: the template's folder |

### Status codes → LabVIEW error cluster

| Status | Meaning | Suggested error code |
|---|---|---|
| `0` | Success | — |
| `1` | Usage / I/O: bad path, unreadable file, invalid JSON/CSV, unwritable output | 5001 |
| `2` | Validation: template errors, or warnings with `strict` | 5002 |
| `3` | Layout/PDF failure | 5003 |
| `-1` | `result_len` too small; the result was truncated. Rendering **did** happen | warning only |
| `-2` | Internal error. Please report it with the template and data | 5009 |

On success, `result_json` is:

```json
{"ok":true,"output":"C:\\Out\\SN123.pdf","pages":2,"bytes":81234,
 "warnings":["warning: [meas.value] data field 'x' is missing"],"warningCount":1,
 "issuesDetail":[{"severity":"warning","blockId":"meas","field":"value","message":"data field 'x' is missing"}],
 "elapsedMs":120}
```

When `ok` is `false`, it always has a `stage` and an `error`:

```json
{"ok":false,"stage":"validate","error":"template has errors",
 "issues":["error: [meas.source] …"],"issuesDetail":[{"severity":"error","blockId":"meas","field":"source","message":"…"}]}
```

| `stage` | Status | Meaning |
|---|---|---|
| `options` | 1 | `options_json` is not valid JSON |
| `template` | 1 | Template missing, unreadable or invalid |
| `data` | 1 | Data is not valid JSON/CSV, or the data file cannot be read |
| `write` | 1 | The PDF cannot be written (folder permissions, file open in a viewer) |
| `validate` | 2 | The template has errors (`issues` lists them) |
| `strict` | 2 | Warnings with `strict` (`issues` lists them) |
| `layout`, `pdf` | 3 | Rendering failed |
| `internal` | -2 | Unexpected internal error |

Unflatten it into a cluster `{ok (bool), stage (string), error (string), issues (1D string array)}`
and put `error` into the error cluster's *source*. `issues`/`warnings` are ready-to-log strings;
`issuesDetail` has the same entries as clusters `{severity, blockId, field, message}` if you want to
show or filter them. Unflatten ignores keys your cluster doesn't have, so new keys never break an
existing VI.

`rb_validate` returns `{"ok":…,"errors":[…],"warnings":[…],"fields":[…],"issuesDetail":[…]}` with
status `0` or `2`, or `{"ok":false,"stage":"template"|"data","error":"…"}` with status `1`.

**Buffer size.** `4096` bytes is plenty for a success result. A report with many warnings (each
appears in `warnings` and `issuesDetail`) can need more. On status `-1`, increase `result_len`
(and the *Minimum size*), e.g. to `16384`.

### Recommended wrapper VIs

Put these in a `Report Builder.lvlib` so test engineers never touch the Call Library Function Node:

- **RB Render.vi**. Inputs: template path, data (variant → Flatten To JSON inside), output path,
  PDF/A (bool), strict (bool), error in. Outputs: page count, warnings (string array), error out.
- **RB Validate.vi**. Inputs: template path, data. Outputs: errors, warnings, referenced fields.
- **RB Version.vi**. Returns the library version string for your test logs.

## 4. Alternative: System Exec

```
report-cli render -t "C:\Reports\Final.rbt.json" -d "C:\Data\SN123.json" -o "C:\Out\SN123.pdf" --pdfa --json
```

- Set *wait until completion?* to `TRUE` and read *standard output*. With `--json`, stdout is always
  a single JSON line, also when the template or data file cannot be read.
- Exit codes are `0` ok, `1` usage/I/O, `2` validation (or `--strict` warnings), `3` layout/PDF.
- `-d` takes a `.json` or a `.csv` file. Use `-d -` to pipe JSON through standard input instead of
  writing a temp file.
- The old `report-cli -t Report.html -d data.json -o out.pdf` form still parses, but templates are
  now `.rbt.json`. The CLI explains how to migrate if you pass an `.html` file.

**`--json` compared with `result_json`.** Both have `ok`, `stage` and `error` on failure, and `ok`,
`output`, `pages`, `bytes`, `elapsedMs` and `issuesDetail` (`[{severity, blockId, field, message}]`)
on success, so a cluster with those elements unflattens either one. Two keys differ for historical
reasons and keep their meaning:

| Key | DLL `result_json` | `report-cli --json` |
|---|---|---|
| `warnings` | Array of strings | Number of warnings (the DLL's count is `warningCount`) |
| `issues` | Array of strings (failures only) | Array of `{severity, blockId, field, message}` objects |

Prefer `issuesDetail` and `warningCount`/`warnings`-as-count in shared code. The CLI's I/O stage is
`io` where the DLL says `write`.

To render many reports at once, for example at the end of a lot:

```
report-cli batch -t Final.rbt.json --data-dir C:\Data\Lot42 --out-dir C:\Reports\Lot42 --name "{{ dut.serial ?? __file }}_{{ date(test.start, 'YYYYMMDD-HHmm') }}"
```

`batch` reads `.json` and `.csv` files, never overwrites a PDF (a second report with the same name
becomes `…-2.pdf`), and warns when a `--name` field is missing; `__file` is the data file name. To
turn a station's result folder into a PDF drop box, add `--watch --done-dir C:\Data\done`: each new
file is rendered once it has finished writing and then moved out of the way. See
[docs/cli.md](../../docs/cli.md#batch).

Before deploying a template to stations, make it self-contained so it doesn't depend on image files
next to it:

```
report-cli pack -t Final.rbt.json -o "\\server\deploy\Final.rbt.json"
```

## 5. TestStand

- **Recommended:** call `rb_render` from a LabVIEW code module (or a *C/C++ DLL* adapter step) in
  the `TestReport` or `PostUUT` callback, so a PDF is written for every UUT.
- Alternatively, use the Python adapter with `integrations/python/reportbuilder.py`.

### Recipe: Numeric Limit Test results → measurement rows

For every *Numeric Limit Test* step, TestStand's `ResultList` entry holds the measured value and the
limits the step was configured with:

| ResultList element | Meaning |
|---|---|
| `TS.StepName` | Step name |
| `Numeric` | Measured value |
| `Limits.Low`, `Limits.High` | Limits (only the ones the comparison uses are meaningful) |
| `Comp` | Comparison type: `GELE`, `GTLT`, `GELT`, `GTLE`, `GE`, `GT`, `LE`, `LT`, `EQ`, `NE`, `LOG` |
| `Units` | Unit string |
| `Status` | `Passed`, `Failed`, `Skipped`, `Error`, … |

The measurement table wants one row per step: `{name, value, low, high, unit, status}`. Map them as
follows:

| `Comp` | `low` | `high` |
|---|---|---|
| `GELE`, `GTLT`, `GELT`, `GTLE` | `Limits.Low` | `Limits.High` |
| `GE`, `GT` | `Limits.Low` | `NaN` (no limit) |
| `LE`, `LT` | `NaN` (no limit) | `Limits.High` |
| `EQ` | `Limits.Low` | `Limits.Low` |
| `NE`, `LOG` | `NaN` | `NaN` |

Always pass TestStand's `Status` as `status`. The table then shows TestStand's verdict instead of
recomputing it: it would otherwise treat every limit as inclusive (`GE`/`LE`) and cannot express
`NE`. `Passed` and `Failed` are understood as PASS and FAIL; other values are shown as they are.

1. Create a TestStand custom data type `RB_Measurement` (container) with `name` (String),
   `value`, `low`, `high` (Number), `unit`, `status`, `comp` (String). Add a local
   `Locals.Measurements`, an empty array of `RB_Measurement`, and a number `Locals.i`.
2. In the `TestReport` callback, add a **For Each** loop over
   `Parameters.MainSequenceResults.TS.SequenceCall.ResultList` with the loop variable
   `Locals.R` (an object reference). To include subsequences, recurse into
   `R.TS.SequenceCall.ResultList` the same way.
3. Inside the loop, add a **Statement** step with the precondition
   `Locals.R.TS.StepType == "NumericLimitTest"` and this expression:

   ```
   Locals.i = GetNumElements(Locals.Measurements),
   SetNumElements(Locals.Measurements, Locals.i + 1),
   Locals.Measurements[Locals.i].name   = Locals.R.TS.StepName,
   Locals.Measurements[Locals.i].value  = Locals.R.Numeric,
   Locals.Measurements[Locals.i].comp   = Locals.R.Comp,
   Locals.Measurements[Locals.i].low    = (Locals.R.Comp == "NE" || Locals.R.Comp == "LOG" || Locals.R.Comp == "LE" || Locals.R.Comp == "LT") ? NAN : Locals.R.Limits.Low,
   Locals.Measurements[Locals.i].high   = (Locals.R.Comp == "NE" || Locals.R.Comp == "LOG" || Locals.R.Comp == "GE" || Locals.R.Comp == "GT") ? NAN
                                          : (Locals.R.Comp == "EQ" ? Locals.R.Limits.Low : Locals.R.Limits.High),
   Locals.Measurements[Locals.i].unit   = Locals.R.Units,
   Locals.Measurements[Locals.i].status = Locals.R.Status
   ```

   (A *Multiple Numeric Limit Test* step, `TS.StepType == "NI_MultipleNumericLimitTest"`, records
   each measurement under `Measurement[n]` with `Data`, `Limits.Low/High`, `Comp`, `Units` and
   `Status`; add an inner loop over that array and use `Data` as the value.)
4. Call a LabVIEW code module, e.g. **RB Render.vi** from above, that takes a cluster of UUT
   information (`dut.serial` from `Parameters.UUT.SerialNumber`, station, operator, start time)
   plus `Locals.Measurements` as an array of clusters with the same element labels. Inside, bundle
   them as `{dut, station, test, measurements}`, **Flatten To JSON** and call `rb_render`. The
   `NaN` limits flatten as `NaN`, which the engine reads as "no limit".
5. Bind a measurement table in the template to `measurements`. To show the comparison type as well,
   use a regular table on the same list with a column whose value is `row.comp`.

To test the template without TestStand, export a few rows as CSV with the headers
`Name,Value,Low,High,Unit,Status` and render it with `report-cli render -d sample.csv`.

## 6. Troubleshooting

| Symptom | Fix |
|---|---|
| Error 13 / "library not found" / error 1097 | DLL bitness does not match LabVIEW, or the path is wrong. Use the x86 build for 32-bit LabVIEW |
| Status `-1` | Increase `result_len` (and the Minimum size) to 16384 |
| Status `2`, `"data field 'x.y' is missing"` | The cluster label differs from the template binding. Rename one of them, or drop `strict` |
| Garbled µ, Ω or ° in the PDF | Make sure the strings are UTF-8, or leave them in the system codepage (Windows-1252 is detected automatically) |
| First report slow (~200 ms), later ones fast | This is expected: fonts load once per process. Keep the DLL loaded (don't unload between UUTs) |
