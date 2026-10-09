//! `report-cli pack`: make a template self-contained by inlining the image
//! files it references (image block `src`, `theme.logo`) as data: URIs, so it
//! can be copied to a test station on its own.

use anyhow::{Context, Result};
use base64::Engine as _;
use serde_json::{json, Value};
use std::path::{Path, PathBuf};

/// Largest image that is inlined (data URIs bloat the template).
const MAX_IMAGE: u64 = 20 * 1024 * 1024;

#[derive(Debug, Default)]
pub struct PackReport {
    /// (where, source path, bytes)
    pub inlined: Vec<(String, String, usize)>,
    /// (where, source, reason)
    pub skipped: Vec<(String, String, String)>,
}

impl PackReport {
    pub fn to_json(&self) -> Value {
        json!({
            "inlined": self.inlined.iter().map(|(w, s, n)| json!({"at": w, "src": s, "bytes": n})).collect::<Vec<_>>(),
            "skipped": self.skipped.iter().map(|(w, s, r)| json!({"at": w, "src": s, "reason": r})).collect::<Vec<_>>(),
        })
    }
}

fn mime_for(path: &Path) -> Option<&'static str> {
    let ext = path.extension()?.to_str()?.to_ascii_lowercase();
    Some(match ext.as_str() {
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "gif" => "image/gif",
        "svg" => "image/svg+xml",
        "webp" => "image/webp",
        _ => return None,
    })
}

/// Inline one image reference. Leaves `slot` untouched (and records why) when it cannot.
fn inline(slot: &mut Value, at: String, base_dir: &Path, report: &mut PackReport) {
    let Some(src) = slot.as_str().map(|s| s.trim().to_string()) else { return };
    if src.is_empty() || src.starts_with("data:") {
        return;
    }
    match data_uri(&src, base_dir) {
        Ok((uri, n)) => {
            *slot = Value::String(uri);
            report.inlined.push((at, src, n));
        }
        Err(reason) => report.skipped.push((at, src, reason)),
    }
}

fn data_uri(src: &str, base_dir: &Path) -> Result<(String, usize), String> {
    if src.contains("{{") {
        return Err("templated source ({{ }}) is resolved at render time; ship the files it can point to".into());
    }
    if src.starts_with("http://") || src.starts_with("https://") {
        return Err("remote images are not supported; download it and reference the file".into());
    }
    let path = PathBuf::from(src);
    let path = if path.is_absolute() { path } else { base_dir.join(path) };
    let mime = mime_for(&path).ok_or("not a .png/.jpg/.gif/.svg/.webp file")?;
    let meta = std::fs::metadata(&path).map_err(|e| format!("cannot read {}: {e}", path.display()))?;
    if !meta.is_file() {
        return Err(format!("{} is not a file", path.display()));
    }
    if meta.len() > MAX_IMAGE {
        return Err("larger than 20 MB".into());
    }
    let bytes = std::fs::read(&path).map_err(|e| format!("cannot read {}: {e}", path.display()))?;
    Ok((format!("data:{mime};base64,{}", base64::engine::general_purpose::STANDARD.encode(&bytes)), bytes.len()))
}

fn walk_blocks(blocks: &mut Value, base_dir: &Path, report: &mut PackReport) {
    let Some(list) = blocks.as_array_mut() else { return };
    for (i, block) in list.iter_mut().enumerate() {
        let Some(obj) = block.as_object_mut() else { continue };
        let id = obj.get("id").and_then(Value::as_str).filter(|s| !s.is_empty()).map(String::from);
        let at = id.unwrap_or_else(|| format!("#{i}"));
        if obj.get("type").and_then(Value::as_str) == Some("image") {
            if let Some(src) = obj.get_mut("src") {
                inline(src, format!("{at}.src"), base_dir, report);
            }
        }
        if let Some(children) = obj.get_mut("blocks") {
            walk_blocks(children, base_dir, report);
        }
        if let Some(cols) = obj.get_mut("columns").and_then(Value::as_array_mut) {
            for col in cols {
                if let Some(children) = col.get_mut("blocks") {
                    walk_blocks(children, base_dir, report);
                }
            }
        }
    }
}

/// Inline images of a template given as JSON. Relative paths resolve against `base_dir`.
pub fn pack_value(template: &mut Value, base_dir: &Path) -> PackReport {
    let mut report = PackReport::default();
    if let Some(logo) = template.get_mut("theme").and_then(|t| t.get_mut("logo")) {
        inline(logo, "theme.logo".into(), base_dir, &mut report);
    }
    for region in ["header", "body", "footer"] {
        if let Some(blocks) = template.get_mut(region) {
            walk_blocks(blocks, base_dir, &mut report);
        }
    }
    report
}

/// Read `template`, inline its images and write the result to `output`.
pub fn pack_file(template: &Path, output: &Path) -> Result<PackReport> {
    let text =
        std::fs::read_to_string(template).with_context(|| format!("cannot read template {}", template.display()))?;
    let text = text.trim_start_matches('\u{feff}');
    // Make sure it is a template before rewriting it.
    reportcore::Document::from_json(text).with_context(|| format!("{} is not a valid template", template.display()))?;
    let mut v: Value = serde_json::from_str(text)?;
    let base = template.parent().map(Path::to_path_buf).unwrap_or_default();
    let report = pack_value(&mut v, &base);
    if let Some(parent) = output.parent().filter(|p| !p.as_os_str().is_empty()) {
        std::fs::create_dir_all(parent)?;
    }
    let mut out = serde_json::to_string_pretty(&v)?;
    out.push('\n');
    std::fs::write(output, out).with_context(|| format!("cannot write {}", output.display()))?;
    Ok(report)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn inlines_nested_images_and_logo() {
        let dir = tempfile::tempdir().unwrap();
        std::fs::create_dir(dir.path().join("img")).unwrap();
        std::fs::write(dir.path().join("img/logo.png"), b"\x89PNG fake").unwrap();
        std::fs::write(dir.path().join("a.svg"), b"<svg/>").unwrap();
        let mut t = json!({
            "theme": {"logo": "img/logo.png"},
            "header": [{"id": "h", "type": "image", "src": "a.svg"}],
            "body": [
                {"id": "s", "type": "section", "blocks": [
                    {"id": "c", "type": "columns", "columns": [
                        {"blocks": [{"id": "deep", "type": "image", "src": "img/logo.png"}]},
                        {"blocks": [{"id": "tpl", "type": "image", "src": "{{ photo }}"}]}
                    ]}
                ]},
                {"id": "gone", "type": "image", "src": "missing.png"},
                {"id": "web", "type": "image", "src": "https://example.com/x.png"},
                {"id": "done", "type": "image", "src": "data:image/png;base64,AAAA"},
                {"id": "t", "type": "text", "text": "a.svg"}
            ]
        });
        let r = pack_value(&mut t, dir.path());
        assert_eq!(r.inlined.len(), 3, "{r:?}");
        assert!(t["theme"]["logo"].as_str().unwrap().starts_with("data:image/png;base64,"));
        assert!(t["header"][0]["src"].as_str().unwrap().starts_with("data:image/svg+xml;base64,"));
        assert!(t["body"][0]["blocks"][0]["columns"][0]["blocks"][0]["src"].as_str().unwrap().starts_with("data:"));
        assert_eq!(t["body"][0]["blocks"][0]["columns"][1]["blocks"][0]["src"], "{{ photo }}");
        assert_eq!(t["body"][4]["text"], "a.svg");
        let skipped: Vec<&str> = r.skipped.iter().map(|s| s.0.as_str()).collect();
        assert_eq!(skipped, vec!["tpl.src", "gone.src", "web.src"]);
    }
}
