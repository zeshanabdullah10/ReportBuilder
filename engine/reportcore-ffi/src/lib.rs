//! C ABI for Report Builder.
//!
//! Designed for LabVIEW's Call Library Function Node: every function takes
//! C strings, writes a JSON result into a caller-allocated buffer and returns
//! an `int32` status. All functions are reentrant and may be called from any
//! thread. Panics never cross the boundary.
//!
//! The function signatures are frozen (see CONTRIBUTING.md): compiled LabVIEW
//! code calls them. Result JSON may gain keys, but existing keys keep their
//! meaning and type.
//!
//! Status codes:
//!   0  success
//!   1  usage / I/O error (bad path, invalid JSON, …)
//!   2  validation failed (template errors, or warnings with `"strict": true`)
//!   3  layout or PDF generation failed
//!  -1  result buffer too small (result was truncated; call again with a bigger buffer)
//!  -2  internal error
//!
//! Every failure result carries `"ok": false`, a `stage` and an `error` message.
//!
//! Strings may be UTF-8 or, as LabVIEW on Windows sends them, Windows-1252.
//! Data may contain bare `NaN`/`Infinity`/`-Infinity` tokens.

use reportcore::{compile, validate, Document, Issue, PdfStandard, RenderOptions, Severity};
use serde_json::{json, Value};
use std::ffi::{c_char, CStr};
use std::panic::{catch_unwind, AssertUnwindSafe};
use std::path::{Path, PathBuf};
use std::time::Instant;

pub const RB_OK: i32 = 0;
pub const RB_ERR_USAGE: i32 = 1;
pub const RB_ERR_VALIDATION: i32 = 2;
pub const RB_ERR_RENDER: i32 = 3;
pub const RB_ERR_BUFFER: i32 = -1;
pub const RB_ERR_INTERNAL: i32 = -2;

/// Decode UTF-8, falling back to Windows-1252 (LabVIEW's default on Windows).
pub fn decode(bytes: &[u8]) -> String {
    reportcore::encoding::decode_text(bytes)
}

unsafe fn arg(p: *const c_char) -> String {
    if p.is_null() {
        return String::new();
    }
    decode(CStr::from_ptr(p).to_bytes())
}

/// Copy `s` into `buf` (NUL-terminated). Returns false if truncated.
unsafe fn write_out(s: &str, buf: *mut c_char, len: i32) -> bool {
    if buf.is_null() || len <= 0 {
        return s.is_empty();
    }
    let cap = (len as usize).saturating_sub(1);
    let bytes = s.as_bytes();
    let mut n = bytes.len().min(cap);
    // Never split a UTF-8 sequence.
    while n > 0 && n < bytes.len() && (bytes[n] & 0xC0) == 0x80 {
        n -= 1;
    }
    std::ptr::copy_nonoverlapping(bytes.as_ptr(), buf as *mut u8, n);
    *buf.add(n) = 0;
    n == bytes.len()
}

fn finish(code: i32, result: Value, buf: *mut c_char, len: i32) -> i32 {
    let text = result.to_string();
    if unsafe { write_out(&text, buf, len) } {
        code
    } else {
        RB_ERR_BUFFER
    }
}

fn guarded(buf: *mut c_char, len: i32, f: impl FnOnce() -> (i32, Value)) -> i32 {
    match catch_unwind(AssertUnwindSafe(f)) {
        Ok((code, v)) => finish(code, v, buf, len),
        Err(_) => {
            finish(RB_ERR_INTERNAL, json!({"ok": false, "stage": "internal", "error": "internal error"}), buf, len)
        }
    }
}

/// A failure result: `(status, {"ok":false,"stage":…,"error":…})`.
type Failure = (i32, Value);

fn fail(code: i32, stage: &str, error: impl Into<String>) -> Failure {
    (code, json!({"ok": false, "stage": stage, "error": error.into()}))
}

#[derive(Default)]
struct Opts {
    pdfa: bool,
    strict: bool,
    now: Option<String>,
    font_dirs: Vec<PathBuf>,
    base_dir: Option<PathBuf>,
}

fn parse_opts(s: &str) -> Result<Opts, Failure> {
    if s.trim().is_empty() {
        return Ok(Opts::default());
    }
    let v: Value = serde_json::from_str(s.trim_start_matches('\u{feff}'))
        .map_err(|e| fail(RB_ERR_USAGE, "options", format!("options are not valid JSON: {e}")))?;
    Ok(Opts {
        pdfa: v.get("pdfa").and_then(Value::as_bool).unwrap_or(false),
        strict: v.get("strict").and_then(Value::as_bool).unwrap_or(false),
        now: v.get("now").and_then(Value::as_str).map(String::from),
        font_dirs: v
            .get("fontDirs")
            .and_then(Value::as_array)
            .map(|a| a.iter().filter_map(Value::as_str).map(PathBuf::from).collect())
            .unwrap_or_default(),
        base_dir: v.get("baseDir").and_then(Value::as_str).filter(|s| !s.is_empty()).map(PathBuf::from),
    })
}

fn load_template(path: &str) -> Result<Document, Failure> {
    let text = std::fs::read_to_string(path)
        .map_err(|e| fail(RB_ERR_USAGE, "template", format!("cannot read template '{path}': {e}")))?;
    Document::from_json(text.trim_start_matches('\u{feff}'))
        .map_err(|e| fail(RB_ERR_USAGE, "template", format!("'{path}' is not a valid template: {e}")))
}

/// Parse data text (JSON, or CSV when `name_hint` ends in `.csv`). `None` when empty.
fn parse_data(text: &str, name_hint: &str) -> Result<Option<Value>, Failure> {
    let t = text.trim_start_matches('\u{feff}');
    if t.trim().is_empty() {
        return Ok(None);
    }
    reportcore::import::parse_data_text(t, name_hint)
        .map(Some)
        .map_err(|e| fail(RB_ERR_USAGE, "data", format!("{e:#}")))
}

/// Read a data file (JSON or `.csv`). An empty path means "no data".
fn read_data_file(path: &str) -> Result<Option<Value>, Failure> {
    if path.trim().is_empty() {
        return Ok(None);
    }
    let bytes =
        std::fs::read(path).map_err(|e| fail(RB_ERR_USAGE, "data", format!("cannot read data '{path}': {e}")))?;
    parse_data(&decode(&bytes), path)
}

fn visible(issues: &[Issue]) -> impl Iterator<Item = &Issue> {
    issues.iter().filter(|i| i.severity != Severity::Info)
}

/// Issues as display strings, e.g. `"warning: [meas.value] data field 'x' is missing"`.
fn issues_json(issues: &[Issue]) -> Value {
    json!(visible(issues).map(|i| i.to_string()).collect::<Vec<_>>())
}

/// Issues as objects: `[{"severity","blockId","field","message"}]`.
fn issues_detail(issues: &[Issue]) -> Value {
    json!(visible(issues)
        .map(|i| json!({
            "severity": match i.severity {
                Severity::Error => "error",
                Severity::Warning => "warning",
                Severity::Info => "info",
            },
            "blockId": i.block_id,
            "field": i.field,
            "message": i.message,
        }))
        .collect::<Vec<_>>())
}

struct Rendered {
    pdf: Vec<u8>,
    pages: usize,
    issues: Vec<Issue>,
}

/// Validate, lay out and write the PDF bytes, honouring `strict`.
fn render_pdf(doc: &Document, data: Option<Value>, opts: Opts, base_dir: Option<PathBuf>) -> Result<Rendered, Failure> {
    let data = data.unwrap_or_else(|| doc.sample_data.clone().unwrap_or_else(|| json!({})));
    let report = validate::validate(doc, Some(&data));
    if report.has_errors() {
        return Err((
            RB_ERR_VALIDATION,
            json!({
                "ok": false,
                "stage": "validate",
                "error": "template has errors",
                "issues": issues_json(&report.issues),
                "issuesDetail": issues_detail(&report.issues),
            }),
        ));
    }
    let standard = if opts.pdfa { PdfStandard::A2b } else { PdfStandard::None };
    let ropts = RenderOptions {
        base_dir: opts.base_dir.or(base_dir),
        preview: false,
        now: opts.now,
        pdf_standard: standard,
        font_dirs: opts.font_dirs,
    };
    let compiled = compile(doc, &data, &ropts).map_err(|e| fail(RB_ERR_RENDER, "layout", e.to_string()))?;
    let warnings = compiled.issues.iter().filter(|i| i.severity == Severity::Warning).count();
    if opts.strict && warnings > 0 {
        return Err((
            RB_ERR_VALIDATION,
            json!({
                "ok": false,
                "stage": "strict",
                "error": format!("{warnings} warning(s)"),
                "issues": issues_json(&compiled.issues),
                "issuesDetail": issues_detail(&compiled.issues),
            }),
        ));
    }
    let pdf = compiled.to_pdf(standard).map_err(|e| fail(RB_ERR_RENDER, "pdf", e.to_string()))?;
    Ok(Rendered { pdf, pages: compiled.page_count(), issues: compiled.issues })
}

fn success(r: &Rendered, started: Instant, output: Option<&str>) -> Value {
    let mut v = json!({
        "ok": true,
        "pages": r.pages,
        "bytes": r.pdf.len(),
        "warnings": issues_json(&r.issues),
        "warningCount": r.issues.iter().filter(|i| i.severity == Severity::Warning).count(),
        "issuesDetail": issues_detail(&r.issues),
        "elapsedMs": started.elapsed().as_millis() as u64,
    });
    if let Some(o) = output {
        v["output"] = json!(o);
    }
    v
}

fn write_pdf(output: &str, pdf: &[u8]) -> Result<(), Failure> {
    let out = PathBuf::from(output);
    if let Some(parent) = out.parent().filter(|p| !p.as_os_str().is_empty()) {
        std::fs::create_dir_all(parent)
            .map_err(|e| fail(RB_ERR_USAGE, "write", format!("cannot create '{}': {e}", parent.display())))?;
    }
    let tmp = out.with_extension("pdf.partial");
    std::fs::write(&tmp, pdf)
        .and_then(|_| {
            let _ = std::fs::remove_file(&out);
            std::fs::rename(&tmp, &out)
        })
        .map_err(|e| {
            let _ = std::fs::remove_file(&tmp);
            fail(RB_ERR_USAGE, "write", format!("cannot write '{output}': {e}"))
        })
}

fn render_impl(
    template_path: &str,
    data: impl FnOnce() -> Result<Option<Value>, Failure>,
    output: &str,
    opts: &str,
) -> Result<Value, Failure> {
    let started = Instant::now();
    let opts = parse_opts(opts)?;
    let doc = load_template(template_path)?;
    let data = data()?;
    let base_dir = Path::new(template_path).parent().map(Path::to_path_buf);
    let rendered = render_pdf(&doc, data, opts, base_dir)?;
    write_pdf(output, &rendered.pdf)?;
    Ok(success(&rendered, started, Some(output)))
}

fn status(r: Result<Value, Failure>) -> (i32, Value) {
    match r {
        Ok(v) => (RB_OK, v),
        Err(f) => f,
    }
}

/// Library version, e.g. "1.0.0".
///
/// # Safety
/// `buf` must point to `len` writable bytes.
#[no_mangle]
pub unsafe extern "C" fn rb_version(buf: *mut c_char, len: i32) -> i32 {
    if write_out(env!("CARGO_PKG_VERSION"), buf, len) {
        RB_OK
    } else {
        RB_ERR_BUFFER
    }
}

/// Render a template to a PDF file using JSON data given as text.
///
/// * `template_path` – path to a `.rbt.json` template
/// * `data_json` – JSON text (e.g. from LabVIEW "Flatten To JSON"); empty = template sample data
/// * `output_pdf` – destination path (folders are created)
/// * `options_json` – optional: `{"pdfa":true,"strict":true,"now":"2026-03-01T10:00:00Z","fontDirs":["C:/fonts"]}`
/// * `result_json`/`result_len` – receives a JSON summary. 4096 bytes is plenty for a success
///   result; a report with many warnings needs more. On `-1`, call again with a bigger buffer.
///
/// # Safety
/// String arguments must be NUL-terminated or null; `result_json` must point to `result_len` bytes.
#[no_mangle]
pub unsafe extern "C" fn rb_render(
    template_path: *const c_char,
    data_json: *const c_char,
    output_pdf: *const c_char,
    options_json: *const c_char,
    result_json: *mut c_char,
    result_len: i32,
) -> i32 {
    let (t, d, o, op) = (arg(template_path), arg(data_json), arg(output_pdf), arg(options_json));
    guarded(result_json, result_len, || status(render_impl(&t, || parse_data(&d, ""), &o, &op)))
}

/// Same as [`rb_render`] but reads the data from a file: JSON, or CSV when the
/// path ends in `.csv` (see `reportcore::import::csv_to_data`).
///
/// # Safety
/// See [`rb_render`].
#[no_mangle]
pub unsafe extern "C" fn rb_render_file(
    template_path: *const c_char,
    data_path: *const c_char,
    output_pdf: *const c_char,
    options_json: *const c_char,
    result_json: *mut c_char,
    result_len: i32,
) -> i32 {
    let (t, dp, o, op) = (arg(template_path), arg(data_path), arg(output_pdf), arg(options_json));
    guarded(result_json, result_len, || status(render_impl(&t, || read_data_file(&dp), &o, &op)))
}

/// Validate a template, optionally against JSON data (empty = template only).
/// Result: `{"ok":bool,"errors":[..],"warnings":[..],"fields":[..],"issuesDetail":[..]}`,
/// or `{"ok":false,"stage":"template"|"data","error":".."}` with status 1.
///
/// # Safety
/// See [`rb_render`].
#[no_mangle]
pub unsafe extern "C" fn rb_validate(
    template_path: *const c_char,
    data_json: *const c_char,
    result_json: *mut c_char,
    result_len: i32,
) -> i32 {
    let (t, d) = (arg(template_path), arg(data_json));
    guarded(result_json, result_len, || {
        let doc = match load_template(&t) {
            Ok(d) => d,
            Err(f) => return f,
        };
        let data = match parse_data(&d, "") {
            Ok(v) => v,
            Err(f) => return f,
        };
        let r = validate::validate(&doc, data.as_ref());
        let pick = |s: Severity| r.issues.iter().filter(|i| i.severity == s).map(|i| i.to_string()).collect::<Vec<_>>();
        let ok = !r.has_errors();
        let mut v = json!({
            "ok": ok,
            "errors": pick(Severity::Error),
            "warnings": pick(Severity::Warning),
            "fields": r.referenced_paths,
            "issuesDetail": issues_detail(&r.issues),
        });
        if !ok {
            v["stage"] = json!("validate");
            v["error"] = json!("template has errors");
        }
        (if ok { RB_OK } else { RB_ERR_VALIDATION }, v)
    })
}

/// Render to memory. On success `*out_pdf`/`*out_len` hold a buffer that must be
/// released with [`rb_free`]. Intended for C, C# and Python callers.
///
/// Validates and honours `strict` exactly like [`rb_render`]. Relative image
/// paths resolve against the `"baseDir"` option (there is no template file).
///
/// # Safety
/// Pointers must be valid; see [`rb_render`].
#[no_mangle]
pub unsafe extern "C" fn rb_render_to_memory(
    template_json: *const c_char,
    data_json: *const c_char,
    options_json: *const c_char,
    out_pdf: *mut *mut u8,
    out_len: *mut usize,
    result_json: *mut c_char,
    result_len: i32,
) -> i32 {
    if out_pdf.is_null() || out_len.is_null() {
        return finish(
            RB_ERR_USAGE,
            json!({"ok": false, "stage": "usage", "error": "out_pdf and out_len must not be null"}),
            result_json,
            result_len,
        );
    }
    *out_pdf = std::ptr::null_mut();
    *out_len = 0;
    let (t, d, op) = (arg(template_json), arg(data_json), arg(options_json));
    let mut produced: Option<Vec<u8>> = None;
    let code = guarded(result_json, result_len, || {
        let started = Instant::now();
        let r = (|| {
            let opts = parse_opts(&op)?;
            let doc = Document::from_json(t.trim_start_matches('\u{feff}'))
                .map_err(|e| fail(RB_ERR_USAGE, "template", format!("invalid template: {e}")))?;
            let data = parse_data(&d, "")?;
            let rendered = render_pdf(&doc, data, opts, None)?;
            let v = success(&rendered, started, None);
            produced = Some(rendered.pdf);
            Ok(v)
        })();
        status(r)
    });
    if let Some(pdf) = produced {
        let boxed = pdf.into_boxed_slice();
        *out_len = boxed.len();
        *out_pdf = Box::into_raw(boxed) as *mut u8;
    }
    code
}

/// Free a buffer returned by [`rb_render_to_memory`].
///
/// # Safety
/// `ptr`/`len` must come from `rb_render_to_memory` and be freed once.
#[no_mangle]
pub unsafe extern "C" fn rb_free(ptr: *mut u8, len: usize) {
    if !ptr.is_null() {
        drop(Box::from_raw(std::ptr::slice_from_raw_parts_mut(ptr, len)));
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::ffi::CString;

    fn c(s: &str) -> CString {
        CString::new(s).unwrap()
    }

    fn result(buf: &[i8]) -> Value {
        serde_json::from_str(unsafe { CStr::from_ptr(buf.as_ptr()) }.to_str().unwrap()).unwrap()
    }

    fn temp_dir(tag: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("rbffi-{tag}-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn decode_cp1252() {
        assert_eq!(decode("µΩ".as_bytes()), "µΩ");
        assert_eq!(decode(&[0x43, 0x3a, 0x5c, 0xe9, 0x80]), "C:\\é€");
    }

    #[test]
    fn truncation_is_reported_and_safe() {
        let mut buf = [0i8; 8];
        let r = unsafe { write_out("héllo world", buf.as_mut_ptr(), 8) };
        assert!(!r);
        let s = unsafe { CStr::from_ptr(buf.as_ptr()) }.to_str().unwrap();
        assert_eq!(s, "héllo ");
    }

    #[test]
    fn render_roundtrip() {
        let dir = temp_dir("rt");
        let tpl = dir.join("t.rbt.json");
        std::fs::write(&tpl, r#"{"body":[{"type":"heading","text":"SN {{ sn }}"}]}"#).unwrap();
        let out = dir.join("nested/out.pdf");
        let mut buf = vec![0i8; 4096];
        let code = unsafe {
            rb_render(
                c(tpl.to_str().unwrap()).as_ptr(),
                c(r#"{"sn":"X1"}"#).as_ptr(),
                c(out.to_str().unwrap()).as_ptr(),
                std::ptr::null(),
                buf.as_mut_ptr(),
                buf.len() as i32,
            )
        };
        let res = result(&buf);
        assert_eq!(code, RB_OK, "{res}");
        assert_eq!(res["pages"], 1);
        assert_eq!(res["issuesDetail"], json!([]));
        assert!(std::fs::read(&out).unwrap().starts_with(b"%PDF"));

        // strict + missing data → 2, with structured issues
        let code = unsafe {
            rb_render(
                c(tpl.to_str().unwrap()).as_ptr(),
                c("{}").as_ptr(),
                c(out.to_str().unwrap()).as_ptr(),
                c(r#"{"strict":true}"#).as_ptr(),
                buf.as_mut_ptr(),
                buf.len() as i32,
            )
        };
        assert_eq!(code, RB_ERR_VALIDATION);
        let res = result(&buf);
        assert_eq!(res["stage"], "strict");
        assert!(res["issues"][0].is_string());
        assert_eq!(res["issuesDetail"][0]["severity"], "warning");
        assert!(res["issuesDetail"][0]["blockId"].is_string());
        assert!(res["issuesDetail"][0]["message"].as_str().unwrap().contains("sn"));

        // bad JSON → 1, stage data
        let code = unsafe {
            rb_render(
                c(tpl.to_str().unwrap()).as_ptr(),
                c("{oops").as_ptr(),
                c(out.to_str().unwrap()).as_ptr(),
                std::ptr::null(),
                buf.as_mut_ptr(),
                buf.len() as i32,
            )
        };
        assert_eq!(code, RB_ERR_USAGE);
        assert_eq!(result(&buf)["stage"], "data");

        // bare NaN in LabVIEW output is accepted
        let code = unsafe {
            rb_render(
                c(tpl.to_str().unwrap()).as_ptr(),
                c(r#"{"sn": NaN}"#).as_ptr(),
                c(out.to_str().unwrap()).as_ptr(),
                std::ptr::null(),
                buf.as_mut_ptr(),
                buf.len() as i32,
            )
        };
        assert_eq!(code, RB_OK, "{}", result(&buf));

        // tiny buffer → -1
        let mut small = [0i8; 4];
        let code = unsafe {
            rb_render(
                c(tpl.to_str().unwrap()).as_ptr(),
                c("{}").as_ptr(),
                c(out.to_str().unwrap()).as_ptr(),
                std::ptr::null(),
                small.as_mut_ptr(),
                4,
            )
        };
        assert_eq!(code, RB_ERR_BUFFER);

        // memory API
        let mut ptr: *mut u8 = std::ptr::null_mut();
        let mut len = 0usize;
        let code = unsafe {
            rb_render_to_memory(
                c(r#"{"body":[{"type":"text","text":"hi"}]}"#).as_ptr(),
                std::ptr::null(),
                std::ptr::null(),
                &mut ptr,
                &mut len,
                buf.as_mut_ptr(),
                buf.len() as i32,
            )
        };
        assert_eq!(code, RB_OK);
        assert!(len > 100);
        assert_eq!(result(&buf)["bytes"], len);
        unsafe { rb_free(ptr, len) };
        let _ = std::fs::remove_dir_all(dir);
    }

    #[test]
    fn render_file_reads_csv() {
        let dir = temp_dir("csv");
        let tpl = dir.join("t.rbt.json");
        std::fs::write(&tpl, r#"{"body":[{"type":"heading","text":"SN {{ serial }} {{ measurements[0].value }}"}]}"#)
            .unwrap();
        let csv = dir.join("run.csv");
        std::fs::write(&csv, "Serial,SN9\nName,Value,Low,High\nV1,1.5,1,2\n").unwrap();
        let out = dir.join("out.pdf");
        let mut buf = vec![0i8; 4096];
        let code = unsafe {
            rb_render_file(
                c(tpl.to_str().unwrap()).as_ptr(),
                c(csv.to_str().unwrap()).as_ptr(),
                c(out.to_str().unwrap()).as_ptr(),
                c(r#"{"strict":true}"#).as_ptr(),
                buf.as_mut_ptr(),
                buf.len() as i32,
            )
        };
        assert_eq!(code, RB_OK, "{}", result(&buf));
        let code = unsafe {
            rb_render_file(
                c(tpl.to_str().unwrap()).as_ptr(),
                c(dir.join("missing.csv").to_str().unwrap()).as_ptr(),
                c(out.to_str().unwrap()).as_ptr(),
                std::ptr::null(),
                buf.as_mut_ptr(),
                buf.len() as i32,
            )
        };
        assert_eq!(code, RB_ERR_USAGE);
        assert_eq!(result(&buf)["stage"], "data");
        let _ = std::fs::remove_dir_all(dir);
    }

    #[test]
    fn memory_api_validates_and_honours_strict() {
        let mut buf = vec![0i8; 4096];
        let mut ptr: *mut u8 = std::ptr::null_mut();
        let mut len = 0usize;
        let call = |tpl: &str, data: &str, opts: &str, buf: &mut [i8], ptr: &mut *mut u8, len: &mut usize| unsafe {
            rb_render_to_memory(
                c(tpl).as_ptr(),
                c(data).as_ptr(),
                c(opts).as_ptr(),
                ptr,
                len,
                buf.as_mut_ptr(),
                buf.len() as i32,
            )
        };
        let tpl = r#"{"body":[{"type":"text","text":"{{ who }}"}]}"#;
        assert_eq!(call(tpl, "{}", r#"{"strict":true}"#, &mut buf, &mut ptr, &mut len), RB_ERR_VALIDATION);
        assert!(ptr.is_null());
        let res = result(&buf);
        assert_eq!(res["stage"], "strict");
        assert_eq!(res["issuesDetail"][0]["severity"], "warning");

        let bad = r#"{"body":[{"type":"text","text":"{{ 1 + }}"}]}"#;
        assert_eq!(call(bad, "{}", "", &mut buf, &mut ptr, &mut len), RB_ERR_VALIDATION);
        assert_eq!(result(&buf)["stage"], "validate");

        assert_eq!(call("{nope", "", "", &mut buf, &mut ptr, &mut len), RB_ERR_USAGE);
        assert_eq!(result(&buf)["stage"], "template");
        assert_eq!(call(tpl, "", "{x", &mut buf, &mut ptr, &mut len), RB_ERR_USAGE);
        assert_eq!(result(&buf)["stage"], "options");
    }

    #[test]
    fn validate_reports_stage_and_detail() {
        let dir = temp_dir("val");
        let tpl = dir.join("t.rbt.json");
        std::fs::write(&tpl, r#"{"body":[{"id":"h","type":"heading","text":"{{ sn }}"}]}"#).unwrap();
        let mut buf = vec![0i8; 4096];
        let code = unsafe {
            rb_validate(c(tpl.to_str().unwrap()).as_ptr(), c("{}").as_ptr(), buf.as_mut_ptr(), buf.len() as i32)
        };
        assert_eq!(code, RB_OK);
        let res = result(&buf);
        assert_eq!(res["fields"], json!(["sn"]));
        assert_eq!(res["issuesDetail"][0]["severity"], "warning");
        assert!(res["issuesDetail"][0]["message"].as_str().unwrap().contains("sn"));
        let code = unsafe {
            rb_validate(c(tpl.to_str().unwrap()).as_ptr(), c("{x").as_ptr(), buf.as_mut_ptr(), buf.len() as i32)
        };
        assert_eq!(code, RB_ERR_USAGE);
        assert_eq!(result(&buf)["stage"], "data");
        let code =
            unsafe { rb_validate(c("/nonexistent.rbt.json").as_ptr(), std::ptr::null(), buf.as_mut_ptr(), 4096) };
        assert_eq!(code, RB_ERR_USAGE);
        assert_eq!(result(&buf)["stage"], "template");
        let _ = std::fs::remove_dir_all(dir);
    }
}
