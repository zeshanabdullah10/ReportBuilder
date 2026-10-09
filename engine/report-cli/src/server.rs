//! Local JSON API used by the editor when it runs in a browser, and by any
//! tool that prefers HTTP over spawning a process.
//!
//! Binds to 127.0.0.1 only and rejects requests whose Host/Origin are not
//! local (DNS-rebinding protection).

use anyhow::Result;
use reportcore::{api, Severity};
use serde_json::{json, Value};
use std::io::Read;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tiny_http::{Header, Method, Request, Response, Server, StatusCode};

const MAX_BODY: u64 = 64 * 1024 * 1024;

fn header(k: &str, v: &str) -> Header {
    Header::from_bytes(k.as_bytes(), v.as_bytes()).expect("valid header")
}

fn is_local(host: &str) -> bool {
    let h = host.trim();
    let h = h.strip_prefix("http://").or_else(|| h.strip_prefix("https://")).unwrap_or(h);
    let name = if h.starts_with('[') {
        h.split(']').next().unwrap_or("").trim_start_matches('[')
    } else {
        h.split(':').next().unwrap_or("")
    };
    matches!(name, "localhost" | "127.0.0.1" | "::1" | "tauri.localhost")
}

fn get_header<'a>(req: &'a Request, name: &'static str) -> Option<&'a str> {
    req.headers().iter().find(|h| h.field.equiv(name)).map(|h| h.value.as_str())
}

pub fn serve(port: u16, static_dir: Option<PathBuf>) -> Result<()> {
    let server = Arc::new(
        Server::http(("127.0.0.1", port)).map_err(|e| anyhow::anyhow!("cannot listen on 127.0.0.1:{port}: {e}"))?,
    );
    eprintln!("Report Builder API listening on http://127.0.0.1:{port}");
    if let Some(d) = &static_dir {
        eprintln!("Serving editor UI from {}", d.display());
    }
    let workers = std::thread::available_parallelism().map(|n| n.get()).unwrap_or(4).clamp(2, 8);
    let mut handles = Vec::new();
    for _ in 0..workers {
        let server = server.clone();
        let static_dir = static_dir.clone();
        handles.push(std::thread::spawn(move || {
            for req in server.incoming_requests() {
                handle(req, static_dir.as_deref());
            }
        }));
    }
    for h in handles {
        let _ = h.join();
    }
    Ok(())
}

fn respond(req: Request, status: u16, content_type: &str, body: Vec<u8>, origin: Option<String>) {
    let mut resp = Response::from_data(body)
        .with_status_code(StatusCode(status))
        .with_header(header("Content-Type", content_type));
    resp.add_header(header("X-Content-Type-Options", "nosniff"));
    resp.add_header(header("Cache-Control", "no-store"));
    if let Some(o) = origin {
        resp.add_header(header("Access-Control-Allow-Origin", &o));
        resp.add_header(header("Vary", "Origin"));
        resp.add_header(header("Access-Control-Allow-Headers", "content-type"));
        resp.add_header(header("Access-Control-Allow-Methods", "GET, POST, OPTIONS"));
    }
    let _ = req.respond(resp);
}

fn json_resp(req: Request, status: u16, v: &Value, origin: Option<String>) {
    respond(req, status, "application/json", serde_json::to_vec(v).unwrap_or_default(), origin)
}

fn handle(mut req: Request, static_dir: Option<&Path>) {
    let host_ok = get_header(&req, "Host").map(is_local).unwrap_or(false);
    let origin = get_header(&req, "Origin").map(str::to_string);
    let origin_ok = origin.as_deref().map(is_local).unwrap_or(true);
    if !host_ok || !origin_ok {
        return json_resp(req, 403, &json!({"error": "only local requests are allowed"}), None);
    }
    let cors = origin.filter(|o| is_local(o));
    if *req.method() == Method::Options {
        return respond(req, 204, "text/plain", Vec::new(), cors);
    }
    let url = req.url().split('?').next().unwrap_or("/").to_string();
    let method = req.method().clone();

    if url.starts_with("/api/") {
        let mut body = Vec::new();
        if method == Method::Post {
            if req.body_length().unwrap_or(0) as u64 > MAX_BODY {
                return json_resp(req, 413, &json!({"error": "request too large"}), cors);
            }
            if req.as_reader().take(MAX_BODY + 1).read_to_end(&mut body).is_err() || body.len() as u64 > MAX_BODY {
                return json_resp(req, 400, &json!({"error": "cannot read request body"}), cors);
            }
        }
        // Bare NaN/Infinity (as LabVIEW writes them) are accepted, like in data files.
        let parsed: Result<Value, _> = if body.is_empty() {
            Ok(Value::Null)
        } else {
            reportcore::encoding::parse_json_lenient(&reportcore::encoding::decode_text(&body))
        };
        let Ok(input) = parsed else {
            return json_resp(req, 400, &json!({"error": "body is not valid JSON"}), cors);
        };
        return route(req, &method, &url, input, cors);
    }

    match static_dir {
        Some(dir) if method == Method::Get => serve_static(req, dir, &url),
        _ => json_resp(req, 404, &json!({"error": "not found"}), cors),
    }
}

fn route(req: Request, method: &Method, url: &str, input: Value, cors: Option<String>) {
    let bad = |req: Request, e: String, cors: Option<String>| json_resp(req, 400, &json!({"error": e}), cors);
    match (method, url) {
        (Method::Get, "/api/health") => json_resp(req, 200, &json!({"ok": true, "version": api::version()}), cors),
        (Method::Get, "/api/starters") => {
            json_resp(req, 200, &serde_json::to_value(reportcore::gallery::starters()).unwrap(), cors)
        }
        (Method::Post, "/api/preview") => match serde_json::from_value::<api::RenderRequest>(input) {
            Ok(r) => match api::preview(&r) {
                Ok(p) => json_resp(req, 200, &serde_json::to_value(p).unwrap(), cors),
                Err(e) => json_resp(req, 422, &json!({"error": e.to_string()}), cors),
            },
            Err(e) => bad(req, e.to_string(), cors),
        },
        (Method::Post, "/api/pdf") => {
            // `strict` (like `report-cli render --strict`): any warning or error fails with 422.
            let strict = input.get("strict").and_then(Value::as_bool).unwrap_or(false);
            match serde_json::from_value::<api::RenderRequest>(input) {
                Ok(r) => match api::pdf(&r) {
                    Ok(p) => {
                        let flagged: Vec<_> = p.issues.iter().filter(|i| i.severity != Severity::Info).collect();
                        if strict && !flagged.is_empty() {
                            let body = json!({
                                "error": format!("{} issue(s) with strict", flagged.len()),
                                "stage": "strict",
                                "issues": flagged,
                            });
                            json_resp(req, 422, &body, cors)
                        } else {
                            respond(req, 200, "application/pdf", p.pdf, cors)
                        }
                    }
                    Err(e) => json_resp(req, 422, &json!({"error": e.to_string()}), cors),
                },
                Err(e) => bad(req, e.to_string(), cors),
            }
        }
        (Method::Post, "/api/validate") => match serde_json::from_value::<api::ValidateRequest>(input) {
            Ok(r) => match api::validate(&r) {
                Ok(rep) => json_resp(req, 200, &serde_json::to_value(rep).unwrap(), cors),
                Err(e) => json_resp(req, 422, &json!({"error": e.to_string()}), cors),
            },
            Err(e) => bad(req, e.to_string(), cors),
        },
        (Method::Post, "/api/data-paths") => {
            json_resp(req, 200, &serde_json::to_value(api::data_paths(&input)).unwrap(), cors)
        }
        (Method::Post, "/api/infer-schema") => json_resp(req, 200, &reportcore::validate::infer_schema(&input), cors),
        (Method::Post, "/api/import-csv") => {
            let name = input.get("name").and_then(Value::as_str).unwrap_or("data.csv");
            match input.get("text").and_then(Value::as_str) {
                Some(text) => match reportcore::import::csv_to_data(text, name) {
                    Ok(v) => json_resp(req, 200, &v, cors),
                    Err(e) => json_resp(req, 422, &json!({"error": format!("{e:#}")}), cors),
                },
                None => bad(req, "expected {\"text\": \"<CSV>\", \"name\": \"file.csv\"}".into(), cors),
            }
        }
        (Method::Post, "/api/migrate") => match reportcore::migrate::migrate_legacy(&input) {
            Ok(m) => json_resp(req, 200, &json!({"document": m.document, "notes": m.notes}), cors),
            Err(e) => json_resp(req, 422, &json!({"error": e}), cors),
        },
        _ => json_resp(req, 404, &json!({"error": "unknown endpoint"}), cors),
    }
}

fn serve_static(req: Request, dir: &Path, url: &str) {
    let rel = url.trim_start_matches('/');
    if rel.split('/').any(|seg| seg == ".." || seg.contains('\\')) {
        return json_resp(req, 400, &json!({"error": "bad path"}), None);
    }
    let mut path = dir.join(if rel.is_empty() { "index.html" } else { rel });
    if !path.is_file() {
        // SPA fallback
        path = dir.join("index.html");
    }
    let ct = match path.extension().and_then(|e| e.to_str()).unwrap_or("") {
        "html" => "text/html; charset=utf-8",
        "js" | "mjs" => "text/javascript",
        "css" => "text/css",
        "svg" => "image/svg+xml",
        "png" => "image/png",
        "json" => "application/json",
        "woff2" => "font/woff2",
        "ico" => "image/x-icon",
        _ => "application/octet-stream",
    };
    match std::fs::read(&path) {
        Ok(bytes) => respond(req, 200, ct, bytes, None),
        Err(_) => json_resp(req, 404, &json!({"error": "not found"}), None),
    }
}

#[cfg(test)]
mod tests {
    use super::is_local;

    #[test]
    fn local_hosts() {
        assert!(is_local("localhost:7878"));
        assert!(is_local("127.0.0.1"));
        assert!(is_local("http://localhost:5173"));
        assert!(is_local("[::1]:7878"));
        assert!(!is_local("evil.com"));
        assert!(!is_local("localhost.evil.com:7878"));
        assert!(!is_local("http://127.0.0.1.nip.io"));
    }
}
