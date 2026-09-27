//! JSON request/response API shared by the desktop app, the local HTTP
//! server and the C ABI. Every entry point takes and returns plain data.

use crate::model::Document;
use crate::render::{compile, BlockRegion, PdfStandard, RenderOptions};
use crate::validate::{self, Issue};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::path::PathBuf;
use std::time::Instant;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenderRequest {
    pub template: Value,
    #[serde(default)]
    pub data: Value,
    /// Folder that relative image paths resolve against.
    #[serde(default)]
    pub base_dir: Option<String>,
    #[serde(default)]
    pub now: Option<String>,
    #[serde(default)]
    pub pdf_standard: PdfStandard,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PreviewResponse {
    /// One SVG document per page.
    pub pages: Vec<String>,
    /// Page sizes in points.
    pub page_sizes: Vec<(f64, f64)>,
    pub regions: Vec<BlockRegion>,
    pub issues: Vec<Issue>,
    pub elapsed_ms: u64,
}

#[derive(Debug, thiserror::Error)]
pub enum ApiError {
    #[error("invalid template: {0}")]
    Template(String),
    #[error("{0}")]
    Render(String),
}

pub fn parse_template(v: &Value) -> Result<Document, ApiError> {
    let mut doc: Document = serde_json::from_value(v.clone()).map_err(|e| ApiError::Template(e.to_string()))?;
    doc.normalize();
    Ok(doc)
}

fn options(req: &RenderRequest, preview: bool) -> RenderOptions {
    RenderOptions {
        base_dir: req.base_dir.as_ref().map(PathBuf::from),
        preview,
        now: req.now.clone(),
        pdf_standard: req.pdf_standard,
        font_dirs: Vec::new(),
    }
}

/// Data used when the request carries none: the template's sample data.
fn effective_data(doc: &Document, data: &Value) -> Value {
    if data.is_null() {
        doc.sample_data.clone().unwrap_or(Value::Object(Default::default()))
    } else {
        data.clone()
    }
}

pub fn preview(req: &RenderRequest) -> Result<PreviewResponse, ApiError> {
    let started = Instant::now();
    let doc = parse_template(&req.template)?;
    let data = effective_data(&doc, &req.data);
    let compiled = compile(&doc, &data, &options(req, true)).map_err(|e| ApiError::Render(e.to_string()))?;
    let pages = compiled.to_svg_pages();
    let page_sizes = (0..compiled.page_count()).filter_map(|i| compiled.page_size(i)).collect();
    let mut issues = validate::validate(&doc, None).issues;
    issues.retain(|i| i.severity == validate::Severity::Error);
    for i in compiled.issues.iter() {
        if !issues.contains(i) {
            issues.push(i.clone());
        }
    }
    Ok(PreviewResponse {
        pages,
        page_sizes,
        regions: compiled.block_regions(),
        issues,
        elapsed_ms: started.elapsed().as_millis() as u64,
    })
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PdfResponse {
    #[serde(skip)]
    pub pdf: Vec<u8>,
    pub pages: usize,
    pub issues: Vec<Issue>,
    pub elapsed_ms: u64,
}

pub fn pdf(req: &RenderRequest) -> Result<PdfResponse, ApiError> {
    let started = Instant::now();
    let doc = parse_template(&req.template)?;
    let data = effective_data(&doc, &req.data);
    let compiled = compile(&doc, &data, &options(req, false)).map_err(|e| ApiError::Render(e.to_string()))?;
    let pdf = compiled.to_pdf(req.pdf_standard).map_err(|e| ApiError::Render(e.to_string()))?;
    Ok(PdfResponse {
        pdf,
        pages: compiled.page_count(),
        issues: compiled.issues,
        elapsed_ms: started.elapsed().as_millis() as u64,
    })
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidateRequest {
    pub template: Value,
    #[serde(default)]
    pub data: Option<Value>,
}

pub fn validate(req: &ValidateRequest) -> Result<validate::Report, ApiError> {
    let doc = parse_template(&req.template)?;
    Ok(validate::validate(&doc, req.data.as_ref()))
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DataPath {
    pub path: String,
    /// "string" | "number" | "boolean" | "array" | "object" | "null"
    pub kind: &'static str,
    /// Short preview of the value.
    pub sample: String,
}

/// Flatten data into bindable paths (arrays list their first element's fields as `name[]`).
pub fn data_paths(data: &Value) -> Vec<DataPath> {
    fn kind(v: &Value) -> &'static str {
        match v {
            Value::Null => "null",
            Value::Bool(_) => "boolean",
            Value::Number(_) => "number",
            Value::String(_) => "string",
            Value::Array(_) => "array",
            Value::Object(_) => "object",
        }
    }
    fn go(prefix: &str, v: &Value, out: &mut Vec<DataPath>, depth: usize) {
        if depth > 8 || out.len() > 2000 {
            return;
        }
        if let Value::Object(m) = v {
            for (k, child) in m {
                let path = if prefix.is_empty() { k.clone() } else { format!("{prefix}.{k}") };
                let sample = match child {
                    Value::Array(a) => format!("{} items", a.len()),
                    Value::Object(o) => format!("{} fields", o.len()),
                    other => {
                        let t = crate::expr::to_text(other);
                        if t.chars().count() > 40 {
                            format!("{}…", t.chars().take(40).collect::<String>())
                        } else {
                            t
                        }
                    }
                };
                out.push(DataPath { path: path.clone(), kind: kind(child), sample });
                match child {
                    Value::Object(_) => go(&path, child, out, depth + 1),
                    Value::Array(a) => {
                        if let Some(first @ Value::Object(_)) = a.first() {
                            go(&format!("{path}[]"), first, out, depth + 1);
                        }
                    }
                    _ => {}
                }
            }
        }
    }
    let mut out = Vec::new();
    go("", data, &mut out, 0);
    out
}

pub fn version() -> &'static str {
    env!("CARGO_PKG_VERSION")
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn preview_uses_sample_data() {
        let req = RenderRequest {
            template: json!({"sampleData": {"t": "Hello"}, "body": [{"id": "h", "type": "heading", "text": "{{ t }}"}]}),
            data: Value::Null,
            base_dir: None,
            now: None,
            pdf_standard: PdfStandard::None,
        };
        let r = preview(&req).unwrap();
        assert_eq!(r.pages.len(), 1);
        assert!(r.regions.iter().any(|x| x.id == "h"));
        assert!(r.issues.is_empty(), "{:?}", r.issues);
    }

    #[test]
    fn bad_template_is_reported() {
        let req = RenderRequest {
            template: json!({"body": [{"type": "nope"}]}),
            data: Value::Null,
            base_dir: None,
            now: None,
            pdf_standard: PdfStandard::None,
        };
        assert!(matches!(preview(&req), Err(ApiError::Template(_))));
    }

    #[test]
    fn paths() {
        let p = data_paths(&json!({"dut": {"sn": "A"}, "m": [{"v": 1}]}));
        let names: Vec<_> = p.iter().map(|x| x.path.as_str()).collect();
        assert_eq!(names, vec!["dut", "dut.sn", "m", "m[].v"]);
    }
}
