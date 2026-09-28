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

`rb_render_file` has the same shape, but parameter 2 is the **path** to a JSON file.
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

### Status codes → LabVIEW error cluster

| Status | Meaning | Suggested error code |
|---|---|---|
| `0` | Success. `result_json` = `{"ok":true,"pages":2,"bytes":81234,"warnings":[],"elapsedMs":120}` | — |
| `1` | Usage / I/O: bad path, unreadable file, invalid JSON | 5001 |
| `2` | Validation: template errors, or warnings with `strict` | 5002 |
| `3` | Layout/PDF failure | 5003 |
| `-1` | `result_len` too small; the result was truncated. Rendering **did** happen | warning only |
| `-2` | Internal error. Please report it with the template and data | 5009 |

When `ok` is `false`, `result_json` looks like
`{"ok":false,"stage":"validate","error":"…","issues":["error: [meas.source] …"]}`.
Unflatten it into a cluster `{ok (bool), stage (string), error (string), issues (1D string array)}`
and put `error` into the error cluster's *source*.

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

- Set *wait until completion?* to `TRUE` and read *standard output*. With `--json`, stdout is a single
  JSON line in the same format as `result_json`.
- Exit codes are `0` ok, `1` usage/I/O, `2` validation (or `--strict` warnings), `3` layout/PDF.
- Use `-d -` to pipe the JSON through standard input instead of writing a temp file.
- The old `report-cli -t Report.html -d data.json -o out.pdf` form still parses, but templates are
  now `.rbt.json`. The CLI explains how to migrate if you pass an `.html` file.

To render many reports at once, for example at the end of a lot:

```
report-cli batch -t Final.rbt.json --data-dir C:\Data\Lot42 --out-dir C:\Reports\Lot42 --name "{{ dut.serial }}_{{ date(test.start, 'YYYYMMDD-HHmm') }}"
```

## 5. TestStand

- **Recommended:** call `rb_render` from a *C/C++ DLL* adapter step, in the `PostUUT` or
  `TestReport` callback. Build the data JSON with an expression or a small LabVIEW code module
  from `Locals`/`Parameters.MainSequenceResults`.
- Alternatively, use the Python adapter with `integrations/python/reportbuilder.py`.

## 6. Troubleshooting

| Symptom | Fix |
|---|---|
| Error 13 / "library not found" / error 1097 | DLL bitness does not match LabVIEW, or the path is wrong. Use the x86 build for 32-bit LabVIEW |
| Status `-1` | Increase `result_len` (and the Minimum size) to 16384 |
| Status `2`, `"data field 'x.y' is missing"` | The cluster label differs from the template binding. Rename one of them, or drop `strict` |
| Garbled µ, Ω or ° in the PDF | Make sure the strings are UTF-8, or leave them in the system codepage (Windows-1252 is detected automatically) |
| First report slow (~200 ms), later ones fast | This is expected: fonts load once per process. Keep the DLL loaded (don't unload between UUTs) |
