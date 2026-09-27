//! C ABI for Report Builder.
//!
//! Designed for LabVIEW's Call Library Function Node: every function takes
//! C strings, writes a JSON result into a caller-allocated buffer and returns
//! an `int32` status. All functions are reentrant and may be called from any
//! thread. Panics never cross the boundary.
//!
//! Status codes:
//!   0  success
//!   1  usage / I/O error (bad path, invalid JSON, …)
//!   2  validation failed (template errors, or warnings with `"strict": true`)
//!   3  layout or PDF generation failed
//!  -1  result buffer too small (result was truncated; call again with a bigger buffer)
//!  -2  internal error
//!
//! Strings may be UTF-8 or, as LabVIEW on Windows sends them, Windows-1252.

use reportcore::{compile, validate, Document, PdfStandard, RenderOptions, Severity};
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

#[derive(Default)]
struct Opts {
    pdfa: bool,
    strict: bool,
    now: Option<String>,
    font_dirs: Vec<PathBuf>,
}

fn parse_opts(s: &str) -> Result<Opts, String> {
    if s.trim().is_empty() {
        return Ok(Opts::default());
    }
    let v: Value = serde_json::from_str(s).map_err(|e| format!("options are not valid JSON: {e}"))?;
    Ok(Opts {
        pdfa: v.get("pdfa").and_then(Value::as_bool).unwrap_or(false),
        strict: v.get("strict").and_then(Value::as_bool).unwrap_or(false),
        now: v.get("now").and_then(Value::as_str).map(String::from),
        font_dirs: v
            .get("fontDirs")
            .and_then(Value::as_array)
            .map(|a| a.iter().filter_map(Value::as_str).map(PathBuf::from).collect())
            .unwrap_or_default(),
    })
}

fn load_template(path: &str) -> Result<Document, String> {
    let text = std::fs::read_to_string(path).map_err(|e| format!("cannot read template '{path}': {e}"))?;
    Document::from_json(text.trim_start_matches('\u{feff}'))
        .map_err(|e| format!("'{path}' is not a valid template: {e}"))
}

fn parse_data(text: &str, doc: &Document) -> Result<Value, String> {
    let t = text.trim_start_matches('\u{feff}').trim();
    if t.is_empty() {
        return Ok(doc.sample_data.clone().unwrap_or_else(|| json!({})));
    }
    serde_json::from_str(t).map_err(|e| format!("data is not valid JSON: {e}"))
}

fn issues_json(issues: &[reportcore::Issue]) -> Value {
    json!(issues.iter().filter(|i| i.severity != Severity::Info).map(|i| i.to_string()).collect::<Vec<_>>())
}

fn render_impl(template_path: &str, data_text: &str, output: &str, opts: &str) -> (i32, Value) {
    let started = Instant::now();
    let err = |code: i32, stage: &str, e: String| (code, json!({"ok": false, "stage": stage, "error": e}));
    let opts = match parse_opts(opts) {
        Ok(o) => o,
        Err(e) => return err(RB_ERR_USAGE, "options", e),
    };
    let doc = match load_template(template_path) {
        Ok(d) => d,
        Err(e) => return err(RB_ERR_USAGE, "template", e),
    };
    let data = match parse_data(data_text, &doc) {
        Ok(d) => d,
        Err(e) => return err(RB_ERR_USAGE, "data", e),
    };
    let report = validate::validate(&doc, Some(&data));
    if report.has_errors() {
        return (
            RB_ERR_VALIDATION,
            json!({"ok": false, "stage": "validate", "error": "template has errors", "issues": issues_json(&report.issues)}),
        );
    }
    let standard = if opts.pdfa { PdfStandard::A2b } else { PdfStandard::None };
    let ropts = RenderOptions {
        base_dir: Path::new(template_path).parent().map(Path::to_path_buf),
        preview: false,
        now: opts.now,
        pdf_standard: standard,
        font_dirs: opts.font_dirs,
    };
    let compiled = match compile(&doc, &data, &ropts) {
        Ok(c) => c,
        Err(e) => return err(RB_ERR_RENDER, "layout", e.to_string()),
    };
    let warnings = compiled.issues.iter().filter(|i| i.severity == Severity::Warning).count();
    if opts.strict && warnings > 0 {
        return (
            RB_ERR_VALIDATION,
            json!({"ok": false, "stage": "strict", "error": format!("{warnings} warning(s)"), "issues": issues_json(&compiled.issues)}),
        );
    }
    let pdf = match compiled.to_pdf(standard) {
        Ok(p) => p,
        Err(e) => return err(RB_ERR_RENDER, "pdf", e.to_string()),
    };
    let out = PathBuf::from(output);
    if let Some(parent) = out.parent().filter(|p| !p.as_os_str().is_empty()) {
        if let Err(e) = std::fs::create_dir_all(parent) {
            return err(RB_ERR_USAGE, "write", format!("cannot create '{}': {e}", parent.display()));
        }
    }
    let tmp = out.with_extension("pdf.partial");
    if let Err(e) = std::fs::write(&tmp, &pdf).and_then(|_| {
        let _ = std::fs::remove_file(&out);
        std::fs::rename(&tmp, &out)
    }) {
        let _ = std::fs::remove_file(&tmp);
        return err(RB_ERR_USAGE, "write", format!("cannot write '{output}': {e}"));
    }
    (
        RB_OK,
        json!({
            "ok": true,
            "output": output,
            "pages": compiled.page_count(),
            "bytes": pdf.len(),
            "warnings": issues_json(&compiled.issues),
            "elapsedMs": started.elapsed().as_millis() as u64
        }),
    )
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
/// * `result_json`/`result_len` – receives a JSON summary; 1024 bytes is plenty for success
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
    guarded(result_json, result_len, || render_impl(&t, &d, &o, &op))
}

/// Same as [`rb_render`] but reads the data from a JSON file.
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
    guarded(result_json, result_len, || {
        let data = if dp.trim().is_empty() {
            String::new()
        } else {
            match std::fs::read(&dp) {
                Ok(b) => decode(&b),
                Err(e) => {
                    return (
                        RB_ERR_USAGE,
                        json!({"ok": false, "stage": "data", "error": format!("cannot read data '{dp}': {e}")}),
                    )
                }
            }
        };
        render_impl(&t, &data, &o, &op)
    })
}

/// Validate a template, optionally against JSON data (empty = template only).
/// Result: `{"ok":bool,"errors":[..],"warnings":[..],"fields":[..]}`.
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
            Err(e) => return (RB_ERR_USAGE, json!({"ok": false, "error": e})),
        };
        let data = if d.trim().is_empty() {
            None
        } else {
            match serde_json::from_str::<Value>(d.trim_start_matches('\u{feff}')) {
                Ok(v) => Some(v),
                Err(e) => return (RB_ERR_USAGE, json!({"ok": false, "error": format!("data is not valid JSON: {e}")})),
            }
        };
        let r = validate::validate(&doc, data.as_ref());
        let pick = |s: Severity| r.issues.iter().filter(|i| i.severity == s).map(|i| i.to_string()).collect::<Vec<_>>();
        let ok = !r.has_errors();
        (
            if ok { RB_OK } else { RB_ERR_VALIDATION },
            json!({"ok": ok, "errors": pick(Severity::Error), "warnings": pick(Severity::Warning), "fields": r.referenced_paths}),
        )
    })
}

/// Render to memory. On success `*out_pdf`/`*out_len` hold a buffer that must be
/// released with [`rb_free`]. Intended for C, C# and Python callers.
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
        return RB_ERR_USAGE;
    }
    *out_pdf = std::ptr::null_mut();
    *out_len = 0;
    let (t, d, op) = (arg(template_json), arg(data_json), arg(options_json));
    let mut produced: Option<Vec<u8>> = None;
    let code = guarded(result_json, result_len, || {
        let opts = match parse_opts(&op) {
            Ok(o) => o,
            Err(e) => return (RB_ERR_USAGE, json!({"ok": false, "error": e})),
        };
        let doc = match Document::from_json(t.trim_start_matches('\u{feff}')) {
            Ok(d) => d,
            Err(e) => return (RB_ERR_USAGE, json!({"ok": false, "error": format!("invalid template: {e}")})),
        };
        let data = match parse_data(&d, &doc) {
            Ok(v) => v,
            Err(e) => return (RB_ERR_USAGE, json!({"ok": false, "error": e})),
        };
        let standard = if opts.pdfa { PdfStandard::A2b } else { PdfStandard::None };
        let ro =
            RenderOptions { now: opts.now, pdf_standard: standard, font_dirs: opts.font_dirs, ..Default::default() };
        match compile(&doc, &data, &ro).and_then(|c| Ok((c.to_pdf(standard)?, c.page_count(), c.issues))) {
            Ok((pdf, pages, issues)) => {
                let n = pdf.len();
                produced = Some(pdf);
                (RB_OK, json!({"ok": true, "pages": pages, "bytes": n, "warnings": issues_json(&issues)}))
            }
            Err(e) => (RB_ERR_RENDER, json!({"ok": false, "error": e.to_string()})),
        }
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
        let dir = std::env::temp_dir().join(format!("rbffi-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let tpl = dir.join("t.rbt.json");
        std::fs::write(&tpl, r#"{"body":[{"type":"heading","text":"SN {{ sn }}"}]}"#).unwrap();
        let out = dir.join("nested/out.pdf");
        let mut buf = vec![0i8; 2048];
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
        let res: Value = serde_json::from_str(unsafe { CStr::from_ptr(buf.as_ptr()) }.to_str().unwrap()).unwrap();
        assert_eq!(code, RB_OK, "{res}");
        assert_eq!(res["pages"], 1);
        assert!(std::fs::read(&out).unwrap().starts_with(b"%PDF"));

        // strict + missing data → 2
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

        // bad JSON → 1
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
        unsafe { rb_free(ptr, len) };
        let _ = std::fs::remove_dir_all(dir);
    }
}
