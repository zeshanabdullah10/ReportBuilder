//! Desktop shell: exposes the engine to the editor UI as Tauri commands.
//! Everything runs in-process; nothing leaves the machine.

use reportcore::api;
use serde_json::Value;
use std::path::{Path, PathBuf};

const MAX_READ: u64 = 128 * 1024 * 1024;

fn ext_is(path: &Path, allowed: &[&str]) -> bool {
    path.extension().and_then(|e| e.to_str()).is_some_and(|e| allowed.iter().any(|a| e.eq_ignore_ascii_case(a)))
}

async fn blocking<T: Send + 'static>(f: impl FnOnce() -> Result<T, String> + Send + 'static) -> Result<T, String> {
    tauri::async_runtime::spawn_blocking(f).await.map_err(|e| e.to_string())?
}

#[tauri::command]
async fn preview(req: api::RenderRequest) -> Result<api::PreviewResponse, String> {
    blocking(move || api::preview(&req).map_err(|e| e.to_string())).await
}

#[derive(serde::Serialize)]
struct ExportResult {
    pages: usize,
    bytes: usize,
}

#[tauri::command]
async fn export_pdf(req: api::RenderRequest, path: PathBuf) -> Result<ExportResult, String> {
    if !ext_is(&path, &["pdf"]) {
        return Err("exports must be saved as .pdf".into());
    }
    blocking(move || {
        let r = api::pdf(&req).map_err(|e| e.to_string())?;
        let tmp = path.with_extension("pdf.partial");
        std::fs::write(&tmp, &r.pdf).map_err(|e| format!("cannot write {}: {e}", tmp.display()))?;
        let _ = std::fs::remove_file(&path);
        std::fs::rename(&tmp, &path).map_err(|e| format!("cannot write {}: {e}", path.display()))?;
        Ok(ExportResult { pages: r.pages, bytes: r.pdf.len() })
    })
    .await
}

#[tauri::command]
fn starters() -> Vec<reportcore::gallery::Starter> {
    reportcore::gallery::starters()
}

#[tauri::command]
fn data_paths(data: Value) -> Vec<api::DataPath> {
    api::data_paths(&data)
}

#[tauri::command]
async fn validate(req: api::ValidateRequest) -> Result<reportcore::validate::Report, String> {
    blocking(move || api::validate(&req).map_err(|e| e.to_string())).await
}

#[tauri::command]
async fn contract(req: api::ContractRequest) -> Result<api::ContractResponse, String> {
    blocking(move || api::contract(&req).map_err(|e| e.to_string())).await
}

#[tauri::command]
fn migrate(legacy: Value) -> Result<Value, String> {
    let m = reportcore::migrate::migrate_legacy(&legacy)?;
    Ok(serde_json::json!({ "document": m.document, "notes": m.notes }))
}

/// Convert CSV text into report data (`{..preamble, measurements|rows: [..]}`).
#[tauri::command]
fn import_csv(text: String, name: String) -> Result<Value, String> {
    reportcore::import::csv_to_data(&text, &name).map_err(|e| format!("{e:#}"))
}

#[tauri::command]
fn read_text_file(path: PathBuf) -> Result<String, String> {
    if !ext_is(&path, &["json", "rbt", "csv", "tsv"]) {
        return Err("only .json templates and .json/.csv data files can be opened".into());
    }
    let meta = std::fs::metadata(&path).map_err(|e| format!("cannot open {}: {e}", path.display()))?;
    if meta.len() > MAX_READ {
        return Err(format!("{} is larger than 128 MB", path.display()));
    }
    let bytes = std::fs::read(&path).map_err(|e| format!("cannot read {}: {e}", path.display()))?;
    // UTF-8 (BOM removed) or Windows-1252, as Excel and LabVIEW write it.
    Ok(reportcore::encoding::decode_text(&bytes))
}

#[tauri::command]
fn write_text_file(path: PathBuf, contents: String) -> Result<(), String> {
    if !ext_is(&path, &["json", "rbt"]) {
        return Err("templates must be saved as .json".into());
    }
    let tmp = path.with_extension("json.partial");
    std::fs::write(&tmp, contents.as_bytes()).map_err(|e| format!("cannot write {}: {e}", tmp.display()))?;
    let _ = std::fs::remove_file(&path);
    std::fs::rename(&tmp, &path).map_err(|e| format!("cannot save {}: {e}", path.display()))
}

/// A template passed on the command line / by file association.
#[tauri::command]
fn initial_file() -> Option<String> {
    std::env::args().skip(1).find(|a| !a.starts_with('-') && ext_is(Path::new(a), &["json", "rbt"]))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            preview,
            export_pdf,
            starters,
            data_paths,
            validate,
            contract,
            migrate,
            import_csv,
            read_text_file,
            write_text_file,
            initial_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running Report Builder");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extension_guard() {
        assert!(ext_is(Path::new("a/b.rbt.json"), &["json"]));
        assert!(ext_is(Path::new("x.PDF"), &["pdf"]));
        assert!(!ext_is(Path::new("x.exe"), &["json", "pdf"]));
        assert!(write_text_file(PathBuf::from("/tmp/evil.sh"), String::new()).is_err());
        assert!(read_text_file(PathBuf::from("/etc/passwd")).is_err());
    }
}
